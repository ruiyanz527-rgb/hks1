# 🎯 MatchLab: Find Your Vibe Mate 找到你的同频伙伴

一个队友匹配工具，旨在解决各类项目协作中组队困难、耗时费力的痛点，助力用户高效对接同频伙伴、精准匹配合拍协作队友，进而提升组队效率与协作质量，为项目顺利启动提供支持。


功能特点
1.	个人资料充实：充分照顾到个人性格特点及优势
2.	匹配度推荐：根据匹配程度优先级进行推荐
3.	一键沟通：向感兴趣的对象发起聊天
4.	资源配置：连接数据库，提供需要的教学资源


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

未来计划
1.	项目进度共享与分工模块
2.	提供线上研讨室
3.	构建信用体系，生成 “协作信用分”
