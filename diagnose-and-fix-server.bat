@echo off
chcp 65001 >nul
echo ==========================================
echo FrameWorker 服务器诊断和修复脚本
echo ==========================================
echo.
echo 正在连接到服务器 149.88.69.87...
echo 请在提示时输入密码
echo.

ssh root@149.88.69.87 "bash -s" << 'ENDSSH'
#!/bin/bash
set -e

echo "=========================================="
echo "步骤 1: 检查目录结构"
echo "=========================================="
ls -la /var/www/ || echo "目录不存在"

echo ""
echo "=========================================="
echo "步骤 2: 检查 FrameWorker 目录"
echo "=========================================="
if [ -d "/var/www/FrameWorker" ]; then
    echo "目录存在，检查内容..."
    ls -la /var/www/FrameWorker/
    
    echo ""
    echo "检查是否为git仓库..."
    cd /var/www/FrameWorker
    if [ -d ".git" ]; then
        echo "这是一个git仓库"
        git status
    else
        echo "这不是一个git仓库！"
        echo "需要初始化或克隆仓库"
    fi
else
    echo "目录不存在！需要创建并克隆仓库"
fi

echo ""
echo "=========================================="
echo "步骤 3: 检查可能的其他位置"
echo "=========================================="
find /var/www -name "FrameWorker" -type d 2>/dev/null || echo "未找到其他FrameWorker目录"

echo ""
echo "=========================================="
echo "诊断完成"
echo "=========================================="
ENDSSH

echo.
echo ==========================================
echo 诊断完成！请查看上面的输出
echo ==========================================
echo.
echo 根据诊断结果，可能需要：
echo 1. 如果目录不存在，需要克隆仓库
echo 2. 如果目录存在但不是git仓库，需要重新初始化
echo 3. 如果路径不对，需要找到正确的路径
echo.
pause