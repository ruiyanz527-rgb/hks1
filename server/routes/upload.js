const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, req.userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// 上传简历
router.post('/resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择文件' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 删除旧文件
    if (user.resume?.path && fs.existsSync(user.resume.path)) {
      fs.unlinkSync(user.resume.path);
    }

    // 更新用户简历信息
    user.resume = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadDate: new Date()
    };

    // 尝试解析文件内容
    let extractedText = '';
    try {
      if (req.file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        extractedText = data.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: req.file.path });
        extractedText = result.value;
      } else if (req.file.mimetype === 'text/plain') {
        extractedText = fs.readFileSync(req.file.path, 'utf8');
      }

      // 从简历中提取关键信息
      if (extractedText) {
        const extractedInfo = extractInfoFromResume(extractedText);
        
        // 更新用户信息（如果用户同意）
        if (req.body.autoExtract === 'true') {
          if (extractedInfo.skills.length > 0) {
            user.skills = [...(user.skills || []), ...extractedInfo.skills];
          }
          if (extractedInfo.education.length > 0) {
            user.education = [...(user.education || []), ...extractedInfo.education];
          }
        }
      }
    } catch (parseError) {
      console.warn('文件解析失败:', parseError.message);
      // 继续执行，不影响文件上传
    }

    await user.save();

    res.json({
      message: '简历上传成功',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      },
      extractedInfo: extractedText ? extractInfoFromResume(extractedText) : null
    });
  } catch (error) {
    // 清理上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('上传简历错误:', error);
    res.status(500).json({ message: '上传失败' });
  }
});

// 上传头像
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择图片文件' });
    }

    // 检查是否是图片文件
    if (!req.file.mimetype.startsWith('image/')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: '只能上传图片文件' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: '用户不存在' });
    }

    // 删除旧头像
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // 更新头像路径
    const avatarUrl = `/uploads/${req.userId}/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: '头像上传成功',
      avatar: avatarUrl
    });
  } catch (error) {
    // 清理上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('上传头像错误:', error);
    res.status(500).json({ message: '上传失败' });
  }
});

// 删除文件
router.delete('/file/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['resume', 'avatar'].includes(type)) {
      return res.status(400).json({ message: '无效的文件类型' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (type === 'resume') {
      if (user.resume?.path && fs.existsSync(user.resume.path)) {
        fs.unlinkSync(user.resume.path);
      }
      user.resume = undefined;
    } else if (type === 'avatar') {
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const avatarPath = path.join(__dirname, '../..', user.avatar);
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }
      user.avatar = '';
    }

    await user.save();

    res.json({ message: `${type === 'resume' ? '简历' : '头像'}删除成功` });
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({ message: '删除失败' });
  }
});

// 从简历中提取信息的辅助函数
function extractInfoFromResume(text) {
  const extractedInfo = {
    skills: [],
    education: [],
    keywords: []
  };

  // 常见技能关键词
  const skillKeywords = [
    'python', 'javascript', 'java', 'c++', 'r', 'matlab', 'sql',
    'machine learning', 'deep learning', 'data analysis', 'statistics',
    'research', 'writing', 'presentation', 'project management'
  ];

  // 教育关键词
  const educationKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'university', 'college'
  ];

  const lowerText = text.toLowerCase();

  // 提取技能
  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill)) {
      extractedInfo.skills.push({
        name: skill,
        level: 'intermediate',
        category: 'other'
      });
    }
  });

  // 提取教育信息（简单版本）
  educationKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      // 这里可以添加更复杂的解析逻辑
      extractedInfo.keywords.push(keyword);
    }
  });

  return extractedInfo;
}

module.exports = router;