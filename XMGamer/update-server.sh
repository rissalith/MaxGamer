#!/bin/bash

# FrameWorker 服务器代码更新脚本
# 用于强制拉取最新代码并重启服务

set -e

echo "=========================================="
echo "FrameWorker 代码更新脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/FrameWorker"

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}错误: 项目目录不存在: $PROJECT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}步骤 1/5: 进入项目目录...${NC}"
cd $PROJECT_DIR

echo -e "${GREEN}步骤 2/5: 显示当前版本...${NC}"
echo "当前提交:"
git log --oneline -1

echo -e "${GREEN}步骤 3/5: 强制拉取最新代码...${NC}"
git fetch origin
echo "最新提交:"
git log origin/main --oneline -1
git reset --hard origin/main

echo -e "${GREEN}步骤 4/5: 清理浏览器缓存文件...${NC}"
# 清理可能的缓存
find $PROJECT_DIR/XMGamer/frontend -name "*.css" -o -name "*.js" | xargs touch

echo -e "${GREEN}步骤 5/5: 重启服务...${NC}"
# 重启Docker容器（如果使用Docker）
if command -v docker &> /dev/null; then
    echo "重启Docker容器..."
    docker restart xmgamer-gateway 2>/dev/null || echo "xmgamer-gateway 容器未运行"
    docker restart xmgamer-api 2>/dev/null || echo "xmgamer-api 容器未运行"
fi

# 重启Systemd服务（如果使用Systemd）
if systemctl is-active --quiet frameworker; then
    echo "重启Systemd服务..."
    sudo systemctl restart frameworker
fi

# 重启Nginx
if systemctl is-active --quiet nginx; then
    echo "重启Nginx..."
    sudo systemctl restart nginx
fi

echo ""
echo -e "${GREEN}=========================================="
echo "更新完成！"
echo "==========================================${NC}"
echo ""
echo "当前版本:"
git log --oneline -1
echo ""
echo -e "${YELLOW}提示: 请在浏览器中强制刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)${NC}"
echo ""