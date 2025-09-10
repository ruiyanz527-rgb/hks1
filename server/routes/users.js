const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取当前用户完整信息
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const completeness = user.calculateProfileCompleteness();
    
    res.json({
      user,
      profileCompleteness: completeness
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户基本信息
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('profile.bio').optional().isLength({ max: 500 }),
  body('profile.institution').optional().trim(),
  body('profile.department').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 处理Profile组件发送的完整个人资料数据
    if (req.body.name || req.body.age || req.body.department || req.body.academicLevel) {
      // 这是来自Profile组件的更新
      
      console.log('接收到的数据:', req.body); // 调试日志
      
      // 处理研究兴趣和技能数据格式
      let processedResearchInterests = req.body.researchInterests;
      let processedSkills = req.body.skills;
      
      // 处理研究兴趣 - 支持多种格式
      if (processedResearchInterests) {
        if (typeof processedResearchInterests === 'string') {
          // 字符串格式：转换为对象数组
          processedResearchInterests = processedResearchInterests.split(', ').map(interest => ({
            field: interest.trim(),
            keywords: [interest.trim()],
            level: 'intermediate'
          }));
        } else if (Array.isArray(processedResearchInterests)) {
          // 数组格式：确保每个元素都是正确的对象格式
          processedResearchInterests = processedResearchInterests.map(item => {
            if (typeof item === 'string') {
              return {
                field: item,
                keywords: [item],
                level: 'intermediate'
              };
            } else if (typeof item === 'object' && item.field) {
              return {
                field: item.field,
                keywords: item.keywords || [item.field],
                level: item.level || 'intermediate'
              };
            }
            return null;
          }).filter(item => item !== null);
        }
      }
      
      // 处理技能 - 支持多种格式
      if (processedSkills) {
        if (typeof processedSkills === 'string') {
          // 字符串格式：转换为对象数组
          processedSkills = processedSkills.split(', ').map(skill => ({
            name: skill.trim(),
            level: 'intermediate',
            category: 'other'
          }));
        } else if (Array.isArray(processedSkills)) {
          // 数组格式：确保每个元素都是正确的对象格式
          processedSkills = processedSkills.map(item => {
            if (typeof item === 'string') {
              return {
                name: item,
                level: 'intermediate',
                category: 'other'
              };
            } else if (typeof item === 'object' && item.name) {
              return {
                name: item.name,
                level: item.level || 'intermediate',
                category: item.category || 'other'
              };
            }
            return null;
          }).filter(item => item !== null);
        }
      }
      
      console.log('处理后的研究兴趣:', processedResearchInterests); // 调试日志
      console.log('处理后的技能:', processedSkills); // 调试日志
      
      const updates = {
        name: req.body.name,
        age: req.body.age,
        department: req.body.department,
        academicLevel: req.body.academicLevel,
        researchInterests: processedResearchInterests,
        skills: processedSkills,
        bio: req.body.bio,
        contactInfo: req.body.contactInfo,
        profile: {
          ...user.profile,
          bio: req.body.bio,
          department: req.body.department,
          institution: 'City University of Hong Kong'
        }
      };

      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      return res.json({
        success: true,
        message: '个人资料设置成功',
        user: updatedUser
      });
    }

    // 原有的部分更新逻辑
    const allowedUpdates = ['name', 'profile'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'profile') {
          updates.profile = { ...user.profile, ...req.body.profile };
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    const completeness = updatedUser.calculateProfileCompleteness();
    await updatedUser.save();

    res.json({
      message: '档案更新成功',
      user: updatedUser,
      profileCompleteness: completeness
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新研究兴趣
router.put('/research-interests', auth, [
  body('researchInterests').isArray(),
  body('researchInterests.*.field').notEmpty(),
  body('researchInterests.*.keywords').isArray(),
  body('researchInterests.*.level').isIn(['beginner', 'intermediate', 'advanced', 'expert'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { researchInterests: req.body.researchInterests },
      { new: true, runValidators: true }
    ).select('-password');

    const completeness = user.calculateProfileCompleteness();
    await user.save();

    res.json({
      message: '研究兴趣更新成功',
      researchInterests: user.researchInterests,
      profileCompleteness: completeness
    });
  } catch (error) {
    console.error('更新研究兴趣错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新技能
router.put('/skills', auth, [
  body('skills').isArray(),
  body('skills.*.name').notEmpty(),
  body('skills.*.level').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('skills.*.category').isIn(['programming', 'analysis', 'writing', 'presentation', 'research', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { skills: req.body.skills },
      { new: true, runValidators: true }
    ).select('-password');

    const completeness = user.calculateProfileCompleteness();
    await user.save();

    res.json({
      message: '技能更新成功',
      skills: user.skills,
      profileCompleteness: completeness
    });
  } catch (error) {
    console.error('更新技能错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新教育背景
router.put('/education', auth, [
  body('education').isArray(),
  body('education.*.degree').notEmpty(),
  body('education.*.field').notEmpty(),
  body('education.*.institution').notEmpty(),
  body('education.*.year').isInt({ min: 1950, max: new Date().getFullYear() + 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: '输入验证失败', 
        errors: errors.array() 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { education: req.body.education },
      { new: true, runValidators: true }
    ).select('-password');

    const completeness = user.calculateProfileCompleteness();
    await user.save();

    res.json({
      message: '教育背景更新成功',
      education: user.education,
      profileCompleteness: completeness
    });
  } catch (error) {
    console.error('更新教育背景错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新合作偏好
router.put('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferences: req.body.preferences },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: '偏好设置更新成功',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('更新偏好设置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户公开信息
router.get('/:userId/public', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name avatar profile researchInterests skills education publications'
    );
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户公开信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 搜索用户
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      field, 
      keywords, 
      institution, 
      location, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {
      _id: { $ne: req.userId },
      isActive: true,
      profileComplete: true
    };

    // 构建搜索条件
    if (field) {
      query['researchInterests.field'] = new RegExp(field, 'i');
    }

    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      query['researchInterests.keywords'] = { 
        $in: keywordArray.map(k => new RegExp(k, 'i')) 
      };
    }

    if (institution) {
      query['profile.institution'] = new RegExp(institution, 'i');
    }

    if (location) {
      query['profile.location.city'] = new RegExp(location, 'i');
    }

    const users = await User.find(query)
      .select('name avatar profile researchInterests skills')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastActive: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;