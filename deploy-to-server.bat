@echo off
chcp 65001 >nul
echo ==========================================
echo FrameWorker 一键部署到服务器
echo ==========================================
echo.
echo 此脚本将执行以下操作：
echo 1. 上传更新脚本到服务器
echo 2. 在服务器上执行更新
echo 3. 重启所有服务
echo.
echo 目标服务器: 149.88.69.87
echo.
echo ==========================================
echo.

set SERVER=root@149.88.69.87
set SCRIPT_PATH=XMGamer/update-deployment.sh

echo 步骤 1/3: 上传更新脚本到服务器...
scp %SCRIPT_PATH% %SERVER%:/tmp/update-deployment.sh
if errorlevel 1 (
    echo.
    echo ❌ 上传失败！请检查：
    echo    1. SSH连接是否正常
    echo    2. 服务器密码是否正确
    echo    3. 网络连接是否正常
    pause
    exit /b 1
)
echo ✅ 脚本已上传
echo.

echo 步骤 2/3: 设置执行权限...
ssh %SERVER% "chmod +x /tmp/update-deployment.sh"
echo ✅ 权限已设置
echo.

echo 步骤 3/3: 执行更新脚本...
echo ==========================================
echo.
ssh %SERVER% "bash /tmp/update-deployment.sh"
echo.
echo ==========================================
echo.

if errorlevel 1 (
    echo ❌ 更新过程中出现错误
    echo 请查看上面的错误信息
) else (
    echo ✅ 更新完成！
    echo.
    echo 📋 后续操作：
    echo    1. 访问网站验证更新: http://149.88.69.87
    echo    2. 强制刷新浏览器: Ctrl+Shift+R
    echo    3. 查看服务状态: ssh %SERVER% "systemctl status frameworker"
)

echo.
echo ==========================================
pause