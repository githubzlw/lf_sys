@echo off
echo ============================
echo   会员管理系统 启动
echo ============================

echo.
echo [1/2] 启动后端 (端口3002)...
start "会员系统-后端" cmd /c "cd /d %~dp0backend && node server.js"

echo [2/2] 启动前端 (端口5173)...
start "会员系统-前端" cmd /c "cd /d %~dp0frontend && npx vite --host"

echo.
echo ============================
echo   启动完成!!!
echo   请访问 http://localhost:5173
echo   账号: admin  密码: admin123
echo ============================
pause
