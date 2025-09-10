const express = require('express');
const User = require('../models/User');
const ChatRoom = require('../models/Chat'); // 现有项目使用的聊天模型文件名
const matchingAlgorithm = require('../algorithms/matching');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取推荐用户（支持 count 参数与回退逻辑）
router.get('/recommendations', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const count = Math.min(Math.max(parseInt(String(req.query.count || 20), 10) || 20, 5), 50);

    let candidates = [];
    try {
      if (typeof currentUser.getRecommendations === 'function') {
        candidates = await currentUser.getRecommendations(count * 2);
      }
    } catch (_) {
      candidates = [];
    }

    if (candidates.length < count) {
      const excludeIds = new Set([
        String(currentUser._id),
        ...((currentUser.swipeHistory || []).map(s => String(s.userId))),
      ]);

      const need = count * 2;
      const queryBase = { _id: { $nin: Array.from(excludeIds) } };

      let fallback = [];
      if (currentUser.profile?.institution) {
        fallback = await User.find({
          ...queryBase,
          'profile.institution': currentUser.profile.institution,
        }).limit(need);
      }

      if (fallback.length < count) {
        const more = await User.find(queryBase).limit(need);
        const seen = new Set(fallback.map(u => String(u._id)));
        for (const u of more) {
          const id = String(u._id);
          if (!seen.has(id)) {
            fallback.push(u);
            seen.add(id);
          }
          if (fallback.length >= need) break;
        }
      }

      const byId = new Map();
      for (const u of [...candidates, ...fallback]) {
        byId.set(String(u._id), u);
      }
      candidates = Array.from(byId.values());
    }

    const recommendations = candidates
      .map(candidate => {
        const matchScore = matchingAlgorithm.calculateMatchScore
          ? matchingAlgorithm.calculateMatchScore(currentUser, candidate)
          : 0;
        return {
          user: {
            id: candidate._id,
            name: candidate.name,
            avatar: candidate.avatar,
            profile: candidate.profile,
            researchInterests: candidate.researchInterests,
            skills: candidate.skills,
            education: candidate.education,
          },
          matchScore,
          reasons: generateMatchReasons(currentUser, candidate, matchScore),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ recommendations: recommendations.slice(0, count) });
  } catch (error) {
    console.error('获取推荐错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 滑动（喜欢/跳过）
router.post('/swipe', auth, async (req, res) => {
  try {
    const { targetUserId, action } = req.body;

    if (!['like', 'pass'].includes(action)) {
      return res.status(400).json({ message: '无效的操作' });
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 防重复操作
    const existingSwipe = (currentUser.swipeHistory || []).find(
      (swipe) => swipe.userId.toString() === targetUserId
    );
    if (existingSwipe) {
      return res.status(400).json({ message: '已对该用户进行过操作' });
    }

    // 记录滑动历史
    currentUser.swipeHistory = currentUser.swipeHistory || [];
    currentUser.swipeHistory.push({
      userId: targetUserId,
      action,
      timestamp: new Date(),
    });

    let isMatch = false;
    let chatRoomId = null;
    let matchScore = null;

    if (action === 'like') {
      const targetUserLikedBack = (targetUser.swipeHistory || []).find(
        (swipe) => swipe.userId.toString() === req.userId && swipe.action === 'like'
      );

      if (targetUserLikedBack) {
        isMatch = true;
        matchScore = matchingAlgorithm.calculateMatchScore
          ? matchingAlgorithm.calculateMatchScore(currentUser, targetUser)
          : 0;

        // 复用或创建聊天房间
        let chatRoom = await ChatRoom.findOne({
          participants: { $all: [req.userId, targetUserId] },
          isActive: { $ne: false },
        });
        if (!chatRoom) {
          chatRoom = new ChatRoom({
            participants: [req.userId, targetUserId],
            isActive: true,
          });
          await chatRoom.save();
        }
        chatRoomId = chatRoom._id;

        // 更新双方匹配列表
        currentUser.matches = currentUser.matches || [];
        targetUser.matches = targetUser.matches || [];

        if (!currentUser.matches.find(m => String(m.userId) === String(targetUserId))) {
          currentUser.matches.push({
            userId: targetUserId,
            matchScore,
            chatRoomId,
            matchedAt: new Date(),
          });
        }

        if (!targetUser.matches.find(m => String(m.userId) === String(req.userId))) {
          targetUser.matches.push({
            userId: req.userId,
            matchScore,
            chatRoomId,
            matchedAt: new Date(),
          });
        }

        await targetUser.save();
      }
    }

    await currentUser.save();

    res.json({
      message: action === 'like' ? '已喜欢' : '已跳过',
      isMatch,
      chatRoomId,
      matchScore,
    });
  } catch (error) {
    console.error('滑动操作错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取匹配列表
router.get('/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('matches.userId', 'name avatar profile researchInterests')
      .select('matches');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const matches = (user.matches || [])
      .sort((a, b) => new Date(b.matchedAt) - new Date(a.matchedAt))
      .map(match => ({
        id: match._id,
        user: match.userId,
        matchScore: match.matchScore,
        matchedAt: match.matchedAt,
        chatRoomId: match.chatRoomId,
      }));

    res.json({ matches });
  } catch (error) {
    console.error('获取匹配列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消匹配
router.delete('/unmatch/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const matchIndex = (user.matches || []).findIndex(
      match => match._id.toString() === matchId
    );

    if (matchIndex === -1) {
      return res.status(404).json({ message: '匹配不存在' });
    }

    const match = user.matches[matchIndex];
    const otherUserId = match.userId;

    // 从当前用户移除匹配
    user.matches.splice(matchIndex, 1);
    await user.save();

    // 从对方移除匹配
    const otherUser = await User.findById(otherUserId);
    if (otherUser) {
      const otherMatchIndex = (otherUser.matches || []).findIndex(
        m => m.userId.toString() === req.userId
      );
      if (otherMatchIndex !== -1) {
        otherUser.matches.splice(otherMatchIndex, 1);
        await otherUser.save();
      }
    }

    // 关闭聊天房间
    if (match.chatRoomId) {
      await ChatRoom.findByIdAndUpdate(match.chatRoomId, { isActive: false });
    }

    res.json({ message: '已取消匹配' });
  } catch (error) {
    console.error('取消匹配错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 生成匹配原因
function generateMatchReasons(user1, user2, matchScore) {
  const reasons = [];

  // 共同研究领域
  const commonInterests = user1.researchInterests?.filter(interest1 =>
    user2.researchInterests?.some(interest2 =>
      interest1.field === interest2.field
    )
  ) || [];
  if (commonInterests.length > 0) {
    reasons.push(`共同研究领域: ${commonInterests.map(i => i.field).join('、')}`);
  }

  // 互补技能
  const complementarySkills = user1.skills?.filter(skill1 =>
    user2.skills?.some(skill2 =>
      skill1.name === skill2.name &&
      Math.abs(getLevelValue(skill1.level) - getLevelValue(skill2.level)) <= 1
    )
  ) || [];
  if (complementarySkills.length > 0) {
    reasons.push(`互补技能: ${complementarySkills.map(s => s.name).join('、')}`);
  }

  // 同一机构
  if (user1.profile?.institution &&
      user1.profile.institution === user2.profile?.institution) {
    reasons.push(`同一机构: ${user1.profile.institution}`);
  }

  if (matchScore >= 80) {
    reasons.push('高度匹配的研究方向与背景');
  } else if (matchScore >= 60) {
    reasons.push('具备较好的合作潜力');
  }

  return reasons.slice(0, 3);
}

function getLevelValue(level) {
  const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
  return levels[level] || 2;
}

module.exports = router;