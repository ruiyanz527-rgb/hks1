const express = require('express');
const ChatRoom = require('../models/Chat');
const { Message } = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 发起或复用房间（允许单向开聊）
// POST /api/chat/start  body: { targetUserId }
router.post('/start', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body || {};
    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId 必填' });
    }
    if (String(targetUserId) === String(req.userId)) {
      return res.status(400).json({ message: '不能与自己创建会话' });
    }

    const me = await User.findById(req.userId).select('_id');
    const target = await User.findById(targetUserId).select('_id');
    if (!me || !target) {
      return res.status(404).json({ message: '用户不存在' });
    }

    let room = await ChatRoom.findOne({
      participants: { $all: [req.userId, targetUserId] },
      isActive: { $ne: false },
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [req.userId, targetUserId],
        isActive: true,
      });
    }

    return res.json({ roomId: room._id });
  } catch (error) {
    console.error('启动会话错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
});

// 获取房间消息列表
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);

    const room = await ChatRoom.findById(roomId);
    if (!room || room.isActive === false) {
      return res.status(404).json({ message: '房间不存在' });
    }
    const isMember = room.participants.some((id) => String(id) === String(req.userId));
    if (!isMember) {
      return res.status(403).json({ message: '无权访问该房间' });
    }

    const total = await Message.countDocuments({ roomId });
    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ messages, page, limit, total });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送消息
router.post('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room || room.isActive === false) {
      return res.status(404).json({ message: '房间不存在' });
    }
    const isMember = room.participants.some((id) => String(id) === String(req.userId));
    if (!isMember) {
      return res.status(403).json({ message: '无权发送到该房间' });
    }

    const msg = await Message.create({
      roomId,
      senderId: req.userId,
      content: String(content),
    });

    res.json({ message: msg });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;