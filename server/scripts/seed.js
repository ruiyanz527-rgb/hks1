/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// 复用项目的 User 模型
const User = require('../models/User');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/academic-matcher';

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// 预设数据池
const departments = [
  '计算机科学系',
  '电子工程系',
  '数学系',
  '物理系',
  '化学系',
  '生物医学工程系',
  '机械工程系',
  '土木工程系',
  '商学院',
  '法学院',
  '文学院',
  '社会科学院',
  '建筑学院',
  '创意媒体学院'
];

const academicLevels = [
  '本科生',
  '硕士研究生',
  '博士研究生',
  '博士后',
  '助理教授',
  '副教授',
  '教授',
  '研究员',
  '访问学者'
];

const interestFields = [
  '机器学习',
  '深度学习',
  '自然语言处理',
  '计算机视觉',
  '数据挖掘',
  '推荐系统',
  '图神经网络',
  '强化学习',
  '算法设计',
  '分布式系统',
  '网络安全',
  '人机交互',
  '机器人',
  '信号处理',
  '量子计算'
];

const skillsPool = [
  'Python',
  'JavaScript',
  'TypeScript',
  'PyTorch',
  'TensorFlow',
  'Keras',
  'Scikit-learn',
  'Pandas',
  'NumPy',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'SQL',
  'Docker',
  'Kubernetes',
  'Git',
  'LaTeX',
  'C++',
  'Java'
];

function makeInterests(n = 2) {
  const count = randInt(2, Math.max(2, n));
  const picks = [];
  const used = new Set();
  while (picks.length < count) {
    const f = randPick(interestFields);
    if (used.has(f)) continue;
    used.add(f);
    picks.push({
      field: f,
      keywords: [f],
      level: randPick(['beginner', 'intermediate', 'advanced'])
    });
  }
  return picks;
}

function makeSkills(n = 3) {
  const count = randInt(2, Math.max(3, n));
  const picks = [];
  const used = new Set();
  while (picks.length < count) {
    const s = randPick(skillsPool);
    if (used.has(s)) continue;
    used.add(s);
    picks.push({
      name: s,
      level: randPick(['beginner', 'intermediate', 'advanced']),
      category: 'other'
    });
  }
  return picks;
}

function dicebearAvatar(seed) {
  // 使用 thumbs 风格，稳定可用的 SVG 头像
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function makeUserData(index) {
  const isFaculty = Math.random() < 0.45; // 约45% 教师
  const level = isFaculty ? randPick(['助理教授', '副教授', '教授', '研究员']) : randPick(['本科生', '硕士研究生', '博士研究生', '博士后', '访问学者']);
  const name = isFaculty ? `CityU Faculty ${index}` : `CityU Student ${index}`;
  const email = `cityu_${isFaculty ? 'faculty' : 'student'}_${index}@example.com`;
  const department = randPick(departments);

  return {
    name,
    email,
    // 初始密码统一为 'password123'（若你的模型/注册逻辑需要 hash，这里直接保存明文字段，登录不依赖即可）
    password: 'password123',
    avatar: dicebearAvatar(`${name}-${index}`),
    profile: {
      title: isFaculty ? level : level,
      institution: 'CityU',
      location: { city: 'Hong Kong' },
      bio: `我是来自 ${department} 的${isFaculty ? '老师' : '学生'}，研究方向涉及 ${randPick(interestFields)} 等。`
    },
    department,
    academicLevel: level,
    // 兼容你的模型定义：researchInterests、skills 为对象数组
    researchInterests: makeInterests(),
    skills: makeSkills(),
    // 其他可选字段
    education: isFaculty
      ? [
          {
            school: 'CityU',
            degree: 'PhD',
            field: randPick(interestFields),
            startYear: 2010,
            endYear: 2014
          }
        ]
      : [
          {
            school: 'CityU',
            degree: level,
            field: randPick(interestFields),
            startYear: 2020,
            endYear: 2024
          }
        ]
  };
}

async function main() {
  const arg = process.argv.find(a => a.startsWith('--count='));
  const count = arg ? Math.max(1, Math.min(100, parseInt(arg.split('=')[1], 10) || 40)) : 40;

  console.log('Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI, {
    // useNewUrlParser/useUnifiedTopology 在新版本已默认
  });
  console.log('Mongo connected');

  let created = 0;
  let updated = 0;

  for (let i = 1; i <= count; i++) {
    const data = makeUserData(i);

    // 按 email 去重
    const exist = await User.findOne({ email: data.email });
    if (exist) {
      // 可选择更新其资料以更贴近当前结构
      exist.name = data.name;
      exist.avatar = data.avatar;
      exist.profile = data.profile;
      exist.department = data.department;
      exist.academicLevel = data.academicLevel;
      exist.researchInterests = data.researchInterests;
      exist.skills = data.skills;
      if (!exist.education || exist.education.length === 0) {
        exist.education = data.education;
      }
      await exist.save();
      updated++;
    } else {
      // 如果模型里有密码散列中间件，这里直接保存将被自动 hash；若无登录需求也不影响
      const user = new User(data);
      await user.save();
      created++;
    }
  }

  console.log(`Seed finished. created=${created}, updated=${updated}, total=${created + updated}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});