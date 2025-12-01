@echo off
chcp 65001 >nul
echo ==========================================
echo FrameWorker 远程服务器更新脚本
echo ==========================================
echo.
echo 正在连接到服务器 149.88.69.87...
echo 请在提示时输入密码
echo.
echo 将执行以下操作:
echo 1. 进入项目目录 /var/www/FrameWorker
echo 2. 拉取最新代码 (git pull origin main)
echo 3. 设置脚本执行权限
echo 4. 运行更新脚本
echo.
echo ==========================================
echo.

ssh root@149.88.69.87 "cd /var/www/FrameWorker && git pull origin main && chmod +x XMGamer/update-server.sh && sudo ./XMGamer/update-server.sh"

echo.
echo ==========================================
echo 操作完成！
echo ==========================================
pause