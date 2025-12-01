@echo off
chcp 65001 >nul
echo ==========================================
echo 修复部署问题 - 快速诊断和解决
echo ==========================================
echo.

set SERVER=root@149.88.69.87

echo 当前本地提交: b99eac1
echo.
echo 正在检查服务器状态...
echo.

ssh %SERVER% "bash -s" << 'ENDSSH'
#!/bin/bash
echo "=========================================="
echo "服务器状态检查"
echo "=========================================="
echo ""

echo "1. 检查文件修改时间:"
echo "-------------------------------------------"
ls -lh --time-style=long-iso /var/www/FrameWorker/XMGamer/frontend/login.html 2>/dev/null || echo "文件不存在"
ls -lh --time-style=long-iso /var/www/FrameWorker/XMGamer/frontend/css/auth.css 2>/dev/null || echo "文件不存在"
echo ""

echo "2. Docker 容器状态:"
echo "-------------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep xmgamer
echo ""

echo "3. 检查 login.html 内容 (前20行):"
echo "-------------------------------------------"
head -20 /var/www/FrameWorker/XMGamer/frontend/login.html 2>/dev/null | grep -n "品牌"
echo ""

echo "=========================================="
echo "诊断完成"
echo "=========================================="
ENDSSH

echo.
echo ==========================================
echo 诊断结果分析
echo ==========================================
echo.
echo 请查看上面的输出:
echo.
echo [问题1] 如果文件修改时间是今天之前的日期
echo   说明: GitHub Actions 没有成功部署
echo   解决: 需要手动触发 GitHub Actions
echo.
echo [问题2] 如果文件是今天的，但网站显示旧版本
echo   说明: Docker 容器没有重启或浏览器缓存
echo   解决: 重启容器 + 强制刷新浏览器
echo.
echo ==========================================
echo.
echo 选择操作:
echo   1 - 重启 Docker 容器 (推荐)
echo   2 - 手动触发 GitHub Actions 部署
echo   3 - 查看 GitHub Actions 日志
echo   4 - 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" (
    echo.
    echo 正在重启 Docker 容器...
    ssh %SERVER% "docker restart xmgamer-gateway && docker restart xmgamer-api && echo '容器已重启' && docker ps | grep xmgamer"
    echo.
    echo ==========================================
    echo ✅ 容器重启完成
    echo ==========================================
    echo.
    echo 请执行以下操作:
    echo   1. 等待 10 秒让容器完全启动
    echo   2. 打开浏览器访问网站
    echo   3. 按 Ctrl+Shift+R 强制刷新
    echo.
    timeout /t 10 /nobreak
    
) else if "%choice%"=="2" (
    echo.
    echo 打开 GitHub Actions 页面...
    start https://github.com/rissalith/FrameWorker/actions
    echo.
    echo 请在打开的页面中:
    echo   1. 点击 "Deploy to Server" workflow
    echo   2. 点击右侧的 "Run workflow" 按钮
    echo   3. 选择 "main" 分支
    echo   4. 点击绿色的 "Run workflow" 按钮
    echo   5. 等待 2-3 分钟完成部署
    echo.
    
) else if "%choice%"=="3" (
    echo.
    echo 打开 GitHub Actions 日志页面...
    start https://github.com/rissalith/FrameWorker/actions
    echo.
    echo 请查看最近一次部署的详细日志
    echo.
    
) else (
    echo.
    echo 已退出
    echo.
)

echo ==========================================
pause