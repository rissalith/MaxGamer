@echo off
chcp 65001 >nul
echo ==========================================
echo GitHub Actions 部署状态检查
echo ==========================================
echo.

set SERVER=root@149.88.69.87

echo 📋 步骤 1/4: 检查本地 Git 状态
echo ==========================================
echo.
echo 本地最新提交:
git log --oneline -1
echo.
echo 远程最新提交:
git fetch origin >nul 2>&1
git log origin/main --oneline -1
echo.

echo 📋 步骤 2/4: 检查 GitHub Actions 状态
echo ==========================================
echo.
echo 请访问以下链接查看最近的部署:
echo https://github.com/rissalith/FrameWorker/actions
echo.
echo 查看要点:
echo   - 最近一次 workflow 的运行时间
echo   - 是否显示绿色勾号 (成功)
echo   - 是否有红色叉号 (失败)
echo.
pause
echo.

echo 📋 步骤 3/4: 检查服务器文件状态
echo ==========================================
echo.
echo 正在连接服务器检查文件...
echo.

ssh %SERVER% "bash -s" << 'ENDSSH'
#!/bin/bash
echo "服务器文件信息:"
echo "----------------------------------------"

# 检查关键文件的修改时间
echo "1. login.html 修改时间:"
stat -c "%%y" /var/www/FrameWorker/XMGamer/frontend/login.html 2>/dev/null || echo "文件不存在"

echo ""
echo "2. auth.css 修改时间:"
stat -c "%%y" /var/www/FrameWorker/XMGamer/frontend/css/auth.css 2>/dev/null || echo "文件不存在"

echo ""
echo "3. 检查 login.html 内容片段:"
head -30 /var/www/FrameWorker/XMGamer/frontend/login.html 2>/dev/null | grep -E "(version|v=|品牌)" || echo "无法读取文件"

echo ""
echo "4. Docker 容器状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}" | grep xmgamer || echo "容器未运行"

echo ""
echo "5. 最近的文件更新:"
find /var/www/FrameWorker/XMGamer/frontend -type f -name "*.html" -o -name "*.css" -o -name "*.js" | head -5 | xargs ls -lh --time-style=long-iso 2>/dev/null || echo "无法列出文件"
ENDSSH

echo.
echo ==========================================
echo.

echo 📋 步骤 4/4: 诊断建议
echo ==========================================
echo.
echo 根据上面的信息判断:
echo.
echo 情况 A: 如果服务器文件修改时间很旧
echo   → GitHub Actions 可能没有成功部署
echo   → 解决: 手动触发 GitHub Actions workflow
echo   → 或者: 推送一个新的提交触发自动部署
echo.
echo 情况 B: 如果服务器文件是最新的，但浏览器显示旧版本
echo   → 这是浏览器缓存问题
echo   → 解决: 强制刷新浏览器 (Ctrl+Shift+R)
echo   → 或者: 清除浏览器缓存
echo.
echo 情况 C: 如果 Docker 容器创建时间很旧
echo   → 容器可能没有重启，还在使用旧文件
echo   → 解决: 重启容器
echo.
echo ==========================================
echo.
echo 是否需要重启服务器上的 Docker 容器? (Y/N)
set /p choice=请选择: 

if /i "%choice%"=="Y" (
    echo.
    echo 正在重启 Docker 容器...
    ssh %SERVER% "docker restart xmgamer-gateway xmgamer-api"
    echo.
    echo ✅ 容器已重启
    echo 请等待10秒后刷新浏览器测试
    timeout /t 10 /nobreak
) else (
    echo.
    echo 已跳过重启
)

echo.
echo ==========================================
echo 检查完成
echo ==========================================
echo.
echo 💡 提示:
echo   1. 如果文件是最新的，请强制刷新浏览器: Ctrl+Shift+R
echo   2. 如果文件是旧的，请检查 GitHub Actions 日志
echo   3. 可以手动触发部署: https://github.com/rissalith/FrameWorker/actions
echo.
pause