const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基本信息
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 16,
    max: 100
  },
  department: {
    type: String,
    trim: true
  },
  academicLevel: {
    type: String,
    enum: ['本科生', '硕士研究生', '博士研究生', '博士后', '助理教授', '副教授', '教授', '研究员', '访问学者']
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  contactInfo: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // 学术信息
  profile: {
    title: String, // 职位/学位
    institution: String, // 机构
    department: String, // 院系
    bio: String, // 个人简介
    location: {
      city: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  
  // 研究兴趣和技能
  researchInterests: [{
    field: String, // 研究领域
    keywords: [String], // 关键词
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  }],
  
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    category: {
      type: String,
      enum: ['programming', 'analysis', 'writing', 'presentation', 'research', 'other'],
      default: 'other'
    }
  }],
  
  // 学术背景
  education: [{
    degree: String,
    field: String,
    institution: String,
    year: Number,
    current: {
      type: Boolean,
      default: false
    }
  }],
  
  publications: [{
    title: String,
    authors: [String],
    journal: String,
    year: Number,
    doi: String,
    url: String
  }],
  
  // 合作偏好
  preferences: {
    collaborationType: [{
      type: String,
      enum: ['research', 'writing', 'data-analysis', 'mentoring', 'networking']
    }],
    experienceLevel: [{
      type: String,
      enum: ['student', 'postdoc', 'faculty', 'industry', 'any']
    }],
    locationPreference: {
      type: String,
      enum: ['local', 'national', 'international', 'remote', 'any'],
      default: 'any'
    },
    maxDistance: {
      type: Number,
      default: 1000 // km
    }
  },
  
  // 文件上传
  resume: {
    filename: String,
    originalName: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // 匹配相关
  swipeHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['like', 'pass'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  matches: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchScore: Number,
    matchedAt: {
      type: Date,
      default: Date.now
    },
    chatRoomId: String
  }],
  
  // 系统字段
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  profileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ 'researchInterests.field': 1 });
userSchema.index({ 'profile.location.coordinates': '2dsphere' });
userSchema.index({ lastActive: -1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 计算档案完整度
userSchema.methods.calculateProfileCompleteness = function() {
  let score = 0;
  const fields = [
    this.name,
    this.age,
    this.department,
    this.academicLevel,
    this.researchInterests,
    this.skills,
    this.bio
  ];
  
  fields.forEach(field => {
    if (field) score += 1;
  });
  
  this.profileComplete = score >= 6;
  return (score / fields.length) * 100;
};

// 获取推荐候选人
userSchema.methods.getRecommendations = function(limit = 10) {
  const swipedUserIds = this.swipeHistory.map(h => h.userId);
  const matchedUserIds = this.matches.map(m => m.userId);
  const excludeIds = [...swipedUserIds, ...matchedUserIds, this._id];
  
  return mongoose.model('User').find({
    _id: { $nin: excludeIds },
    isActive: true,
    profileComplete: true
  }).limit(limit);
};

module.exports = mongoose.model('User', userSchema);