const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 用户模型
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  avatar: String,
  profile: Object,
  researchInterests: Array,
  skills: Array,
  education: Array,
  preferences: Object,
  swipeHistory: Array,
  matches: Array,
  isActive: Boolean,
  lastActive: Date,
  profileComplete: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 为CityU用户添加头像
const avatarUpdates = [
  {
    email: 'alice.chan@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'bob.wong@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'carol.lee@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'david.tam@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'emma.liu@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'frank.ng@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'grace.ho@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'henry.chen@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'iris.wang@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
  },
  {
    email: 'jack.lam@cityu.edu.hk',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face'
  }
];

async function updateAvatars() {
  try {
    console.log('开始为CityU用户添加头像...');
    
    for (const update of avatarUpdates) {
      await User.updateOne(
        { email: update.email },
        { $set: { avatar: update.avatar } }
      );
      console.log(`更新头像: ${update.email}`);
    }
    
    console.log('头像更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('更新头像失败:', error);
    process.exit(1);
  }
}

updateAvatars();