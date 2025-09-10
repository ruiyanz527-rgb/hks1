#!/bin/bash

echo "正在启动学术匹配系统..."

echo ""
echo "1. 安装依赖包..."
npm run install-all

echo ""
echo "2. 启动开发服务器..."

# 启动后端服务器
cd server
npm run dev &
SERVER_PID=$!

# 等待后端启动
sleep 3

# 启动前端应用
cd ../client
npm start &
CLIENT_PID=$!

echo ""
echo "系统启动完成！"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5000"
echo ""
echo "按 Ctrl+C 停止服务器"

# 等待用户中断
wait $CLIENT_PID $SERVER_PID