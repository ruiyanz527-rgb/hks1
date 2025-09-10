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
      country: String
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

// CityU测试用户数据
const cityUUsers = [
  {
    email: 'alice.chan@cityu.edu.hk',
    password: 'password123',
    name: '陈雅丽',
    profile: {
      title: '计算机科学博士生',
      institution: '香港城市大学',
      department: '计算机科学系',
      bio: '专注于机器学习和深度学习研究，特别是在计算机视觉领域的应用。希望与同校师生合作进行跨学科研究。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'computer-science',
        keywords: ['机器学习', '深度学习', '计算机视觉', '神经网络'],
        level: 'advanced'
      }
    ],
    skills: [
      { name: 'Python', level: 'expert', category: 'programming' },
      { name: 'TensorFlow', level: 'advanced', category: 'programming' },
      { name: '学术写作', level: 'intermediate', category: 'writing' }
    ],
    education: [
      {
        degree: '博士',
        field: '计算机科学',
        institution: '香港城市大学',
        year: 2025,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'data-analysis'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 50
    }
  },
  {
    email: 'bob.wong@cityu.edu.hk',
    password: 'password123',
    name: '黄志明',
    profile: {
      title: '电子工程助理教授',
      institution: '香港城市大学',
      department: '电子工程学系',
      bio: '专注于5G通信技术和物联网系统设计，欢迎与学生和其他教师进行技术合作和学术交流。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'engineering',
        keywords: ['5G通信', '物联网', '无线通信', '信号处理'],
        level: 'expert'
      }
    ],
    skills: [
      { name: 'MATLAB', level: 'expert', category: 'programming' },
      { name: 'C++', level: 'advanced', category: 'programming' },
      { name: '项目管理', level: 'expert', category: 'other' },
      { name: '学术演讲', level: 'expert', category: 'presentation' }
    ],
    education: [
      {
        degree: '博士',
        field: '电子工程',
        institution: 'MIT',
        year: 2015,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'mentoring', 'writing'],
      experienceLevel: ['student', 'postdoc', 'faculty'],
      locationPreference: 'local',
      maxDistance: 30
    }
  },
  {
    email: 'carol.lee@cityu.edu.hk',
    password: 'password123',
    name: '李嘉欣',
    profile: {
      title: '商学院硕士生',
      institution: '香港城市大学',
      department: '商学院',
      bio: '研究数字营销和消费者行为，对数据分析和市场研究有浓厚兴趣，希望与技术背景的同学合作。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'economics',
        keywords: ['数字营销', '消费者行为', '市场分析', '电子商务'],
        level: 'intermediate'
      }
    ],
    skills: [
      { name: 'SPSS', level: 'advanced', category: 'analysis' },
      { name: 'Excel', level: 'expert', category: 'analysis' },
      { name: '市场调研', level: 'advanced', category: 'research' },
      { name: '商业演讲', level: 'advanced', category: 'presentation' }
    ],
    education: [
      {
        degree: '硕士',
        field: '工商管理',
        institution: '香港城市大学',
        year: 2024,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'data-analysis', 'networking'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 20
    }
  },
  {
    email: 'david.tam@cityu.edu.hk',
    password: 'password123',
    name: '谭大伟',
    profile: {
      title: '数学系副教授',
      institution: '香港城市大学',
      department: '数学系',
      bio: '应用数学专家，专注于优化理论和统计建模，乐于与其他学科的师生进行跨领域合作研究。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'mathematics',
        keywords: ['优化理论', '统计建模', '数值分析', '运筹学'],
        level: 'expert'
      }
    ],
    skills: [
      { name: 'R语言', level: 'expert', category: 'programming' },
      { name: 'Python', level: 'advanced', category: 'programming' },
      { name: '数学建模', level: 'expert', category: 'analysis' },
      { name: '学术写作', level: 'expert', category: 'writing' }
    ],
    education: [
      {
        degree: '博士',
        field: '应用数学',
        institution: '牛津大学',
        year: 2012,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'writing', 'mentoring'],
      experienceLevel: ['student', 'postdoc', 'faculty'],
      locationPreference: 'local',
      maxDistance: 40
    }
  },
  {
    email: 'emma.liu@cityu.edu.hk',
    password: 'password123',
    name: '刘艾玛',
    profile: {
      title: '生物医学工程博士生',
      institution: '香港城市大学',
      department: '生物医学工程学系',
      bio: '研究生物传感器和医疗设备设计，对跨学科合作特别感兴趣，希望结合工程和医学知识。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'engineering',
        keywords: ['生物传感器', '医疗设备', '生物材料', '微流控'],
        level: 'advanced'
      }
    ],
    skills: [
      { name: 'MATLAB', level: 'advanced', category: 'programming' },
      { name: 'CAD设计', level: 'advanced', category: 'other' },
      { name: '实验设计', level: 'advanced', category: 'research' },
      { name: '技术写作', level: 'intermediate', category: 'writing' }
    ],
    education: [
      {
        degree: '博士',
        field: '生物医学工程',
        institution: '香港城市大学',
        year: 2026,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'data-analysis'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 25
    }
  },
  {
    email: 'frank.ng@cityu.edu.hk',
    password: 'password123',
    name: '吴志华',
    profile: {
      title: '媒体与传播学系讲师',
      institution: '香港城市大学',
      department: '媒体与传播学系',
      bio: '数字媒体和社交网络研究专家，关注新媒体对社会的影响，欢迎跨学科合作研究。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'sociology',
        keywords: ['数字媒体', '社交网络', '传播学', '媒体心理学'],
        level: 'expert'
      }
    ],
    skills: [
      { name: '内容分析', level: 'expert', category: 'analysis' },
      { name: '质性研究', level: 'expert', category: 'research' },
      { name: '学术写作', level: 'expert', category: 'writing' },
      { name: '公众演讲', level: 'expert', category: 'presentation' }
    ],
    education: [
      {
        degree: '博士',
        field: '传播学',
        institution: '斯坦福大学',
        year: 2018,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'writing', 'networking'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 35
    }
  },
  {
    email: 'grace.ho@cityu.edu.hk',
    password: 'password123',
    name: '何嘉慧',
    profile: {
      title: '心理学系硕士生',
      institution: '香港城市大学',
      department: '社会及行为科学系',
      bio: '专注于认知心理学和用户体验研究，对人机交互和技术心理学有浓厚兴趣。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'psychology',
        keywords: ['认知心理学', '用户体验', '人机交互', '行为分析'],
        level: 'intermediate'
      }
    ],
    skills: [
      { name: 'SPSS', level: 'advanced', category: 'analysis' },
      { name: '实验设计', level: 'advanced', category: 'research' },
      { name: '用户研究', level: 'intermediate', category: 'research' },
      { name: '数据可视化', level: 'intermediate', category: 'analysis' }
    ],
    education: [
      {
        degree: '硕士',
        field: '心理学',
        institution: '香港城市大学',
        year: 2024,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'data-analysis'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 30
    }
  },
  {
    email: 'henry.chen@cityu.edu.hk',
    password: 'password123',
    name: '陈浩然',
    profile: {
      title: '建筑学与土木工程学系博士生',
      institution: '香港城市大学',
      department: '建筑学与土木工程学系',
      bio: '研究智能建筑和可持续建筑设计，对绿色建筑技术和BIM建模有深入了解。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'engineering',
        keywords: ['智能建筑', '可持续设计', 'BIM建模', '绿色建筑'],
        level: 'advanced'
      }
    ],
    skills: [
      { name: 'AutoCAD', level: 'expert', category: 'other' },
      { name: 'Revit', level: 'advanced', category: 'other' },
      { name: '项目管理', level: 'intermediate', category: 'other' },
      { name: '技术绘图', level: 'expert', category: 'other' }
    ],
    education: [
      {
        degree: '博士',
        field: '建筑工程',
        institution: '香港城市大学',
        year: 2025,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'networking'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 40
    }
  },
  {
    email: 'iris.wang@cityu.edu.hk',
    password: 'password123',
    name: '王艾瑞丝',
    profile: {
      title: '化学系助理教授',
      institution: '香港城市大学',
      department: '化学系',
      bio: '材料化学专家，专注于纳米材料合成和应用，欢迎与工程和物理背景的研究者合作。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'chemistry',
        keywords: ['纳米材料', '材料合成', '催化剂', '表面化学'],
        level: 'expert'
      }
    ],
    skills: [
      { name: '光谱分析', level: 'expert', category: 'analysis' },
      { name: '材料表征', level: 'expert', category: 'research' },
      { name: '实验设计', level: 'expert', category: 'research' },
      { name: '学术写作', level: 'advanced', category: 'writing' }
    ],
    education: [
      {
        degree: '博士',
        field: '材料化学',
        institution: '加州理工学院',
        year: 2019,
        current: false
      }
    ],
    preferences: {
      collaborationType: ['research', 'mentoring'],
      experienceLevel: ['student', 'postdoc', 'faculty'],
      locationPreference: 'local',
      maxDistance: 45
    }
  },
  {
    email: 'jack.lam@cityu.edu.hk',
    password: 'password123',
    name: '林志杰',
    profile: {
      title: '创意媒体学院本科生',
      institution: '香港城市大学',
      department: '创意媒体学院',
      bio: '对数字艺术和交互设计充满热情，希望将技术与艺术结合，寻找跨学科合作机会。',
      location: {
        city: '香港',
        country: '中国'
      }
    },
    researchInterests: [
      {
        field: 'other',
        keywords: ['数字艺术', '交互设计', '虚拟现实', '用户界面设计'],
        level: 'intermediate'
      }
    ],
    skills: [
      { name: 'Adobe Creative Suite', level: 'advanced', category: 'other' },
      { name: 'Unity', level: 'intermediate', category: 'programming' },
      { name: '3D建模', level: 'intermediate', category: 'other' },
      { name: '创意思维', level: 'advanced', category: 'other' }
    ],
    education: [
      {
        degree: '学士',
        field: '创意媒体',
        institution: '香港城市大学',
        year: 2024,
        current: true
      }
    ],
    preferences: {
      collaborationType: ['research', 'networking'],
      experienceLevel: ['student', 'faculty'],
      locationPreference: 'local',
      maxDistance: 20
    }
  }
];

async function seedCityUUsers() {
  try {
    console.log('开始创建CityU测试用户...');
    
    // 清除现有测试用户
    await User.deleteMany({
      email: { $regex: '@cityu.edu.hk$' }
    });
    
    // 创建新的测试用户
    for (const userData of cityUUsers) {
      // 加密密码
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
      
      const user = new User(userData);
      await user.save();
      console.log(`创建用户: ${userData.name} (${userData.profile.title}) - ${userData.profile.department}`);
    }
    
    console.log('CityU测试用户创建完成！');
    console.log(`总共创建了 ${cityUUsers.length} 个CityU用户`);
    
    process.exit(0);
  } catch (error) {
    console.error('创建CityU测试用户失败:', error);
    process.exit(1);
  }
}

seedCityUUsers();