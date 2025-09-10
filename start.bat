@echo off
echo 正在启动学术匹配系统...

REM 设置Node.js和npm路径
set NODE_PATH=D:\cityU黑客松
ode.exe
set NPM_PATH=D:\cityU黑客松
pm.cmd

echo.
echo 1. 检查Node.js环境...
if not exist "%NODE_PATH%" (
    echo 错误: 未找到Node.js
    pause
    exit /b 1
)
echo Node.js已就绪

echo.
echo 2. 启动开发服务器...
start "后端服务器" cmd /k "cd server && "%NPM_PATH%" run dev"
timeout /t 3 /nobreak > nul
start "前端应用" cmd /k "cd client && "%NPM_PATH%" start"

echo.
echo 系统启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo.
echo 请等待浏览器自动打开...
pause