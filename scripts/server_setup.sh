#!/bin/bash

# MaxGamer 服务器端安全配置脚本
# 用途：在服务器上安全地配置环境变量和 SSH 密钥

set -e  # 遇到错误立即退出

echo "=========================================="
echo "   MaxGamer 服务器端安全配置脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 或有 sudo 权限
if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}警告: 某些操作可能需要 sudo 权限${NC}"
fi

# 获取项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

echo -e "${GREEN}当前项目目录: $PROJECT_DIR${NC}"
echo ""

# ==================== 步骤 1: 配置 SSH 公钥 ====================
echo "=========================================="
echo "步骤 1: 配置 SSH 公钥"
echo "=========================================="
echo ""

echo "请输入 GitHub Actions 的 SSH 公钥（完整的一行）："
echo "格式: ssh-ed25519 AAAA... github-actions-maxgamer"
read -r SSH_PUBLIC_KEY

if [[ -z "$SSH_PUBLIC_KEY" ]]; then
    echo -e "${RED}错误: SSH 公钥不能为空${NC}"
    exit 1
fi

# 创建 .ssh 目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 检查公钥是否已存在
if grep -q "$SSH_PUBLIC_KEY" ~/.ssh/authorized_keys 2>/dev/null; then
    echo -e "${YELLOW}公钥已存在，跳过添加${NC}"
else
    # 添加公钥
    echo "$SSH_PUBLIC_KEY" >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo -e "${GREEN}✅ SSH 公钥已添加到 ~/.ssh/authorized_keys${NC}"
fi

echo ""

# ==================== 步骤 2: 生成环境变量 ====================
echo "=========================================="
echo "步骤 2: 生成安全的环境变量"
echo "=========================================="
echo ""

# 检查 Python 是否可用
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 python3，无法生成随机密钥${NC}"
    exit 1
fi

# 生成随机密钥
echo "正在生成随机密钥..."
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
REDIS_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")

echo -e "${GREEN}✅ 密钥生成完成${NC}"
echo ""

# ==================== 步骤 3: 配置 Twitch OAuth ====================
echo "=========================================="
echo "步骤 3: 配置 Twitch OAuth"
echo "=========================================="
echo ""

echo "请输入 Twitch Client Secret（从 https://dev.twitch.tv/console/apps 获取）："
read -s TWITCH_CLIENT_SECRET
echo ""

if [[ -z "$TWITCH_CLIENT_SECRET" ]]; then
    echo -e "${YELLOW}警告: Twitch Client Secret 为空，Twitch 功能将无法使用${NC}"
fi

echo "请输入您的域名（用于 Twitch 回调 URL）："
echo "示例: maxgamer.example.com 或 123.456.789.0"
read -r DOMAIN

if [[ -z "$DOMAIN" ]]; then
    echo -e "${YELLOW}警告: 域名为空，使用 localhost${NC}"
    DOMAIN="localhost"
fi

echo ""

# ==================== 步骤 4: 创建 .env 文件 ====================
echo "=========================================="
echo "步骤 4: 创建 .env 文件"
echo "=========================================="
echo ""

ENV_FILE="$PROJECT_DIR/.env"

# 备份现有 .env 文件
if [[ -f "$ENV_FILE" ]]; then
    BACKUP_FILE="$ENV_FILE.backup.$(date +%Y%m%d%H%M%S)"
    cp "$ENV_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ 已备份现有 .env 文件到: $BACKUP_FILE${NC}"
fi

# 创建新的 .env 文件
cat > "$ENV_FILE" << EOF
# MaxGamer 环境变量配置文件
# 由安全配置脚本自动生成于 $(date)

# ========== 基础配置 ==========
FLASK_ENV=production
SECRET_KEY=$SECRET_KEY
JWT_SECRET=$JWT_SECRET

# ========== 服务端口配置 ==========
BACKEND_PORT=3000
FRONTEND_PORT=8080

# ========== 数据库配置（PostgreSQL 隔离） ==========
DB_NAME=maxgamer
DB_USER=maxgamer_user
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://maxgamer_user:$DB_PASSWORD@maxgamer-db:5432/maxgamer

# ========== Redis 缓存配置（隔离） ==========
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_HOST=maxgamer-redis
REDIS_PORT=6379

# ========== Twitch OAuth 配置 ==========
TWITCH_CLIENT_ID=3tfkf4ohu90fmn5v6r339cgim5task
TWITCH_CLIENT_SECRET=$TWITCH_CLIENT_SECRET
TWITCH_REDIRECT_URI=https://$DOMAIN/api/auth/platform-callback/twitch

# ========== 游戏隔离配置 ==========
GAME_LIBRARY_PATH=/app/GameLibrary
GAME_DATA_PATH=/app/data/games
GAME_SANDBOX_MODE=true

# ========== 其他配置 ==========
BCRYPT_LOG_ROUNDS=12
EOF

chmod 600 "$ENV_FILE"
echo -e "${GREEN}✅ .env 文件已创建: $ENV_FILE${NC}"
echo ""

# ==================== 步骤 5: 显示配置摘要 ====================
echo "=========================================="
echo "配置完成！"
echo "=========================================="
echo ""

echo -e "${GREEN}✅ 配置摘要:${NC}"
echo "1. SSH 公钥已添加到 ~/.ssh/authorized_keys"
echo "2. .env 文件已创建并配置所有必需的环境变量"
echo "3. 所有密钥已安全生成"
echo ""

echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo "1. .env 文件包含敏感信息，已设置为 600 权限（仅所有者可读写）"
echo "2. 请妥善保管 .env 文件，不要将其提交到 Git 仓库"
echo "3. SSH 公钥已配置，GitHub Actions 可以通过 SSH 连接到本服务器"
echo ""

# ==================== 步骤 6: 保存密钥到安全位置（可选） ====================
echo "是否将生成的密钥保存到安全的位置？(y/n)"
read -r SAVE_KEYS

if [[ "$SAVE_KEYS" == "y" || "$SAVE_KEYS" == "Y" ]]; then
    KEYS_DIR="$HOME/.maxgamer_secrets"
    mkdir -p "$KEYS_DIR"
    chmod 700 "$KEYS_DIR"

    KEYS_FILE="$KEYS_DIR/secrets_$(date +%Y%m%d%H%M%S).txt"
    cat > "$KEYS_FILE" << EOF
# MaxGamer 密钥备份
# 生成时间: $(date)
#
# ⚠️  这些密钥非常重要，请妥善保管！
# ⚠️  不要将此文件上传到任何公开位置！

SECRET_KEY=$SECRET_KEY
JWT_SECRET=$JWT_SECRET
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
TWITCH_CLIENT_SECRET=$TWITCH_CLIENT_SECRET
DOMAIN=$DOMAIN
EOF

    chmod 600 "$KEYS_FILE"
    echo -e "${GREEN}✅ 密钥已保存到: $KEYS_FILE${NC}"
    echo ""
fi

# ==================== 步骤 7: 测试 Docker 环境 ====================
echo "=========================================="
echo "检查 Docker 环境"
echo "=========================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 未安装 Docker${NC}"
    echo "请安装 Docker: https://docs.docker.com/get-docker/"
else
    echo -e "${GREEN}✅ Docker 已安装: $(docker --version)${NC}"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ 未安装 Docker Compose${NC}"
    echo "请安装 Docker Compose: https://docs.docker.com/compose/install/"
else
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose 已安装: $(docker-compose --version)${NC}"
    else
        echo -e "${GREEN}✅ Docker Compose 已安装: $(docker compose version)${NC}"
    fi
fi

echo ""

# ==================== 步骤 8: 下一步操作提示 ====================
echo "=========================================="
echo "下一步操作"
echo "=========================================="
echo ""

echo "1️⃣  配置 GitHub Secrets（在 GitHub 仓库设置中）："
echo "   - SSH_PRIVATE_KEY: 您已生成的 SSH 私钥"
echo "   - SERVER_HOST: $(hostname -I | awk '{print $1}') 或您的域名"
echo "   - SERVER_USER: $(whoami)"
echo "   - DEPLOY_PATH: $PROJECT_DIR"
echo ""

echo "2️⃣  测试 SSH 连接："
echo "   在本地执行: ssh $(whoami)@$(hostname -I | awk '{print $1}')"
echo ""

echo "3️⃣  运行部署脚本："
echo "   cd $PROJECT_DIR"
echo "   ./deploy.sh"
echo ""

echo "4️⃣  触发 GitHub Actions 部署："
echo "   推送代码到 main 分支，或在 GitHub Actions 页面手动触发"
echo ""

echo -e "${GREEN}=========================================="
echo "   配置完成！祝您使用愉快！ 🎉"
echo "==========================================${NC}"
