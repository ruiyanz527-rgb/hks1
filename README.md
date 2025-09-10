# 🎯 学术匹配系统 - Academic Matcher

基于兴趣/学科的学术研究者匹配平台，采用Tinder式滑动交互。

## 🚀 快速启动

```bash
# 安装依赖
npm install

# 启动应用
npm run dev
```

访问: http://localhost:3000

## 🌐 数据库配置

### MongoDB Atlas (推荐用于比赛)
1. 注册: https://www.mongodb.com/atlas
2. 创建免费集群
3. 获取连接字符串
4. 更新 `server/.env` 中的 `MONGODB_URI`

## 🛠️ 技术栈
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + MongoDB
- **实时通信**: Socket.io
- **算法**: TF-IDF文本相似度匹配

## 🎯 核心功能
- 智能匹配算法
- Tinder式滑动交互
- 实时聊天系统
- 用户资料管理
- 文件上传功能