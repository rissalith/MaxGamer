@echo off
chcp 65001 >nul
echo ==========================================
echo 触发 GitHub Actions 部署
echo ==========================================
echo.
echo 此脚本将：
echo 1. 检查本地git状态
echo 2. 推送到GitHub（如果有更改）
echo 3. 提供GitHub Actions链接供查看部署状态
echo.
echo ==========================================
echo.

echo 检查git状态...
git status

echo.
echo ==========================================
echo.
echo 如果有未提交的更改，请先提交：
echo   git add .
echo   git commit -m "你的提交信息"
echo.
echo 然后推送到GitHub触发自动部署：
echo   git push origin main
echo.
echo 查看部署状态：
echo   https://github.com/rissalith/FrameWorker/actions
echo.
echo ==========================================
echo.
echo 是否现在推送到GitHub? (Y/N)
set /p choice=请选择: 

if /i "%choice%"=="Y" (
    echo.
    echo 正在推送到GitHub...
    git push origin main
    echo.
    echo ==========================================
    echo 推送完成！
    echo ==========================================
    echo.
    echo 请访问以下链接查看部署进度：
    echo https://github.com/rissalith/FrameWorker/actions
    echo.
    echo 部署通常需要2-3分钟完成
    echo.
) else (
    echo.
    echo 已取消推送
    echo.
)

pause