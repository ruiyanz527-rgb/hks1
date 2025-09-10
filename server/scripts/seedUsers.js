const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 用户模型
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: String,
  profile: {
    title: String,
    institution: String,
    department: String,
    bio: String,
    location: {
      city: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  researchInterests: [{
    field: String,
    keywords: [String],
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
  education: [{
    degree: String,
    field: String,
    institution: String,
    year: Number,
    current: Boolean
  }],
  preferences: {
    collaborationType: [String],
    experienceLevel: [String],
    locationPreference: String,
    maxDistance: Number
  },
  swipeHistory: [],
  matches: [],
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  profileComplete: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 测试用户数据
const testUsers = [
  {
    email: 'alice.chen@university.edu',
    password: 'password123',
    name: '陈小雅',
    profile: {
      title: '博士研究生',
      institution: '清华大学',
      department: '计算机科学与技术系',
      bio: '专注于机器学习和自然语言处理研究，希望找到志同道合的研究伙伴进行学术合作。',
      location: {
        city: '北京',
        country: '中国',
        coordinates: { lat: 39.9042, lng: 116.4074 }
      }
    },
    researchInterests: [
      {
        field: 'artificial-intelligence',
        keywords: ['机器学习', '深度学习', '自然语言处理', 'NLP'],
        level: 'advanced'
      },
      {
        field: 'computer-science',
        keywords: ['算法', '数据结构', '软件工程'],
        level: 'expert'
      }
    ],
    skills: [
      { name: 'Python', level: 'expert', category: 'programming' },
      { name: 'TensorFlow', level: 'advanced', category: 'programming' },
      { name: '学术写作', level: 'advanced', category: 'writing' },
      { name: '数据分析', level: 'expert', category: 'analysis' }
    ],
    education: [
      {
        degree: '博士',
        field: '计算机科学',
        institution: '清华大学',
        year: 2025,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'writing', 'data-analysis'],
      experienceLevel: ['postdoc', 'faculty', 'student'],
      locationPreference: 'national',
      maxDistance: 1000
    }
  },
  {
    email: 'bob.wang@research.org',
    password: 'password123',
    name: '王博文',
    profile: {
      title: '博士后研究员',
      institution: '北京大学',
      department: '生物信息学研究所',
      bio: '生物信息学专家，擅长基因组数据分析和生物统计学，寻求跨学科合作机会。',
      location: {
        city: '北京',
        country: '中国',
        coordinates: { lat: 39.9042, lng: 116.4074 }
      }
    },
    researchInterests: [
      {
        field: 'biology',
        keywords: ['生物信息学', '基因组学', '蛋白质组学'],
        level: 'expert'
      },
      {
        field: 'data-science',
        keywords: ['统计分析', '机器学习', '大数据'],
        level: 'advanced'
      }
    ],
    skills: [
      { name: 'R语言', level: 'expert', category: 'programming' },
      { name: 'Python', level: 'advanced', category: 'programming' },
      { name: '统计分析', level: 'expert', category: 'analysis' },
      { name: '科研演讲', level: 'advanced', category: 'presentation' }
    ],
    education: [
      {
        degree: '博士',
        field: '生物信息学',
        institution: '中科院',
        year: 2022,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'data-analysis', 'writing'],
      experienceLevel: ['student', 'postdoc', 'faculty'],
      locationPreference: 'national',
      maxDistance: 800
    }
  },
  {
    email: 'carol.li@tech.com',
    password: 'password123',
    name: '李佳音',
    profile: {
      title: '数据科学家',
      institution: '腾讯研究院',
      department: '人工智能实验室',
      bio: '工业界数据科学家，对学术研究保持浓厚兴趣，希望与学术界建立合作关系。',
      location: {
        city: '深圳',
        country: '中国',
        coordinates: { lat: 22.5431, lng: 114.0579 }
      }
    },
    researchInterests: [
      {
        field: 'data-science',
        keywords: ['大数据', '机器学习', '推荐系统', '用户行为分析'],
        level: 'expert'
      },
      {
        field: 'artificial-intelligence',
        keywords: ['深度学习', '计算机视觉', '自然语言处理'],
        level: 'advanced'
      }
    ],
    skills: [
      { name: 'Python', level: 'expert', category: 'programming' },
      { name: 'SQL', level: 'expert', category: 'programming' },
      { name: '数据可视化', level: 'advanced', category: 'analysis' },
      { name: '项目管理', level: 'advanced', category: 'other' }
    ],
    education: [
      {
        degree: '硕士',
        field: '计算机科学',
        institution: '香港科技大学',
        year: 2020,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'data-analysis', 'mentoring'],
      experienceLevel: ['student', 'postdoc', 'industry'],
      locationPreference: 'national',
      maxDistance: 1200
    }
  },
  {
    email: 'david.zhang@university.edu',
    password: 'password123',
    name: '张大伟',
    profile: {
      title: '助理教授',
      institution: '上海交通大学',
      department: '数学科学学院',
      bio: '应用数学教授，专注于优化理论和机器学习的数学基础，欢迎跨学科合作。',
      location: {
        city: '上海',
        country: '中国',
        coordinates: { lat: 31.2304, lng: 121.4737 }
      }
    },
    researchInterests: [
      {
        field: 'mathematics',
        keywords: ['优化理论', '数值分析', '应用数学'],
        level: 'expert'
      },
      {
        field: 'artificial-intelligence',
        keywords: ['机器学习理论', '深度学习', '统计学习'],
        level: 'advanced'
      }
    ],
    skills: [
      { name: 'MATLAB', level: 'expert', category: 'programming' },
      { name: 'Python', level: 'advanced', category: 'programming' },
      { name: '数学建模', level: 'expert', category: 'analysis' },
      { name: '学术写作', level: 'expert', category: 'writing' }
    ],
    education: [
      {
        degree: '博士',
        field: '应用数学',
        institution: 'MIT',
        year: 2018,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'writing', 'mentoring'],
      experienceLevel: ['student', 'postdoc', 'faculty'],
      locationPreference: 'international',
      maxDistance: 2000
    }
  },
  {
    email: 'emma.liu@startup.com',
    password: 'password123',
    name: '刘艾玛',
    profile: {
      title: '创业者 & 研究员',
      institution: '独立研究者',
      department: '人工智能创业',
      bio: 'AI创业者，同时进行独立研究，关注AI在教育和医疗领域的应用。',
      location: {
        city: '杭州',
        country: '中国',
        coordinates: { lat: 30.2741, lng: 120.1551 }
      }
    },
    researchInterests: [
      {
        field: 'artificial-intelligence',
        keywords: ['教育AI', '医疗AI', '人机交互'],
        level: 'advanced'
      },
      {
        field: 'psychology',
        keywords: ['认知科学', '学习理论', '用户体验'],
        level: 'intermediate'
      }
    ],
    skills: [
      { name: 'Python', level: 'advanced', category: 'programming' },
      { name: '产品设计', level: 'expert', category: 'other' },
      { name: '用户研究', level: 'advanced', category: 'research' },
      { name: '商业分析', level: 'advanced', category: 'analysis' }
    ],
    education: [
      {
        degree: '硕士',
        field: '认知科学',
        institution: '斯坦福大学',
        year: 2019,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'networking', 'mentoring'],
      experienceLevel: ['student', 'industry', 'any'],
      locationPreference: 'national',
      maxDistance: 1000
    }
  }
];

async function seedUsers() {
  try {
    console.log('开始创建测试用户...');
    
    // 清除现有测试用户（除了真实用户）
    await User.deleteMany({
      email: { $in: testUsers.map(u => u.email) }
    });
    
    // 创建新的测试用户
    for (const userData of testUsers) {
      // 加密密码
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
      
      const user = new User(userData);
      await user.save();
      console.log(`创建用户: ${userData.name} (${userData.email})`);
    }
    
    console.log('测试用户创建完成！');
    console.log(`总共创建了 ${testUsers.length} 个测试用户`);
    
    process.exit(0);
  } catch (error) {
    console.error('创建测试用户失败:', error);
    process.exit(1);
  }
}

seedUsers();y