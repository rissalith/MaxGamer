# 环境变量管理指南

## 文件说明

- **`.env`** - 本地环境变量配置（包含真实的密钥和密码）
  - ⚠️ **绝对不要提交到 Git 仓库**
  - 已在 `.gitignore` 中排除
  - 需要与服务器保持同步

- **`.env.example`** - 环境变量模板文件（不包含真实密钥）
  - ✅ 可以提交到 Git 仓库
  - 用于文档和参考
  - 包含所有配置项的说明

## 同步工作流程

### 1. 更新服务器环境变量

当需要在服务器上修改环境变量时：

```bash
# SSH 登录服务器
ssh root@149.88.69.87

# 编辑服务器的 .env 文件
cd /root/MaxGamer
nano MaxGamer/backend/.env

# 重启相关服务使配置生效
docker restart maxgamer-api
```

### 2. 同步到本地

服务器配置更新后，立即同步到本地：

```bash
# 从服务器获取当前 .env 内容
ssh root@149.88.69.87 "cat /root/MaxGamer/MaxGamer/backend/.env"

# 将内容复制到本地的 .env 文件
# c:\MaxGamer\.env
```

### 3. 更新模板文件（如有新配置项）

如果添加了新的配置项：

```bash
# 编辑 .env.example，添加新配置项的说明和占位符
# 例如：
# NEW_CONFIG_KEY=your-value-here  # 配置说明
```

然后提交 `.env.example` 到 Git：

```bash
git add .env.example
git commit -m "docs: 更新环境变量模板"
git push
```

## 安全注意事项

### ✅ 可以提交到 Git
- `.env.example` （模板文件，不含真实密钥）
- 配置说明文档

### ❌ 绝对不能提交到 Git
- `.env` （包含真实密钥和密码）
- 任何包含真实 API 密钥、数据库密码的文件

### 验证 .gitignore

定期检查确保 `.env` 文件被忽略：

```bash
# 查看 Git 状态，确保 .env 不在列表中
git status

# 查看 .gitignore 配置
grep "\.env" .gitignore
```

应该看到类似：
```
*.env
.env.*
.env
.env.local
```

## 当前环境变量列表

### 数据库配置
- `DB_NAME` - 数据库名称
- `DB_USER` - 数据库用户
- `DB_PASSWORD` - 数据库密码
- `DATABASE_URL` - 完整数据库连接字符串

### Redis 配置
- `REDIS_PASSWORD` - Redis 密码
- `REDIS_HOST` - Redis 主机
- `REDIS_PORT` - Redis 端口

### Flask 应用配置
- `FLASK_ENV` - Flask 环境（development/production）
- `SECRET_KEY` - Flask 密钥
- `JWT_SECRET_KEY` - JWT 密钥

### DeepSeek AI 配置
- `VECTORAPI_KEY` - DeepSeek API 密钥
- `VECTORAPI_BASE_URL` - API 基础 URL
- `VECTORAPI_MODEL` - 使用的模型名称

### Google OAuth 配置
- `GOOGLE_CLIENT_ID` - Google OAuth 客户端 ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 客户端密钥

### Twitter/X OAuth 配置
- `TWITTER_CLIENT_ID` - Twitter OAuth 客户端 ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth 客户端密钥

### Twitch OAuth 配置
- `TWITCH_CLIENT_ID` - Twitch OAuth 客户端 ID
- `TWITCH_CLIENT_SECRET` - Twitch OAuth 客户端密钥
- `TWITCH_REDIRECT_URI` - Twitch OAuth 回调 URL

### 其他配置
- `FRONTEND_DOMAIN` - 前端域名
- `BCRYPT_LOG_ROUNDS` - 密码加密轮数
- `BACKEND_PORT` - 后端端口
- `FRONTEND_PORT` - 前端端口
- `GAME_LIBRARY_PATH` - 游戏库路径
- `GAME_DATA_PATH` - 游戏数据路径
- `GAME_SANDBOX_MODE` - 游戏沙箱模式

## 常见问题

### Q: 本地 .env 和服务器不同步怎么办？
A: 始终以服务器的 `.env` 为准，从服务器获取最新配置同步到本地。

### Q: 我不小心把 .env 提交到 Git 了怎么办？
A: 立即执行以下操作：
1. 删除 Git 历史中的 .env 文件
2. 更换所有泄露的密钥和密码
3. 在服务器和本地更新新的密钥

```bash
# 从 Git 历史中删除文件
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（谨慎操作）
git push origin --force --all
```

### Q: 如何添加新的环境变量？
A:
1. 在服务器的 `.env` 文件中添加
2. 在 `docker-compose.isolated.yml` 中添加对应的环境变量映射
3. 重启容器
4. 同步到本地 `.env`
5. 更新 `.env.example` 并提交

## GitHub Actions 中的密钥管理

GitHub Actions 中的敏感信息通过 Secrets 管理，不要在 workflow 文件中硬编码：

### 当前使用的 Secrets
- `SSH_PRIVATE_KEY` - SSH 私钥
- `SERVER_HOST` - 服务器地址
- `SERVER_USER` - 服务器用户
- `DEPLOY_PATH` - 部署路径
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥

### 查看/更新 GitHub Secrets
访问：https://github.com/rissalith/MaxGamer/settings/secrets/actions
