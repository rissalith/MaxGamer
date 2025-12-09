# GitHub Actions 自动部署配置指南

> ⚠️ **安全提示**: 本文档不包含任何真实密钥。所有密钥将通过安全渠道单独提供。

## 📋 配置步骤总览

### 步骤 1: 配置 GitHub Secrets

访问：https://github.com/WistonPeng/Max-Gamer-Platform/settings/secrets/actions

点击 **"New repository secret"** 添加以下 4 个 Secrets：

#### 必需的 4 个 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SSH_PRIVATE_KEY` | SSH 私钥（完整内容，包含 BEGIN/END 行） | 单独提供 |
| `SERVER_HOST` | 服务器 IP 地址或域名 | `123.456.789.0` 或 `server.example.com` |
| `SERVER_USER` | SSH 登录用户名 | `root` 或 `ubuntu` |
| `DEPLOY_PATH` | 项目在服务器上的完整路径 | `/root/MaxGamer` |

#### SSH_PRIVATE_KEY 格式要求

```
-----BEGIN OPENSSH PRIVATE KEY-----
[私钥内容 - 将单独提供]
-----END OPENSSH PRIVATE KEY-----
```

**重要**: 必须包含完整的 BEGIN 和 END 行！

---

### 步骤 2: 在服务器上添加 SSH 公钥

SSH 登录到您的服务器，执行以下命令：

```bash
# 创建 .ssh 目录（如果不存在）
mkdir -p ~/.ssh

# 添加公钥（公钥内容将单独提供）
echo "公钥内容" >> ~/.ssh/authorized_keys

# 设置正确的权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 步骤 3: 配置服务器环境变量

在服务器上创建并配置 `.env` 文件：

```bash
cd /path/to/MaxGamer
cp .env.example .env
nano .env  # 或使用 vim 编辑
```

#### 必须配置的环境变量

```bash
# 基础配置
FLASK_ENV=production
SECRET_KEY=使用下面的命令生成
JWT_SECRET=使用下面的命令生成

# 数据库配置
DB_PASSWORD=使用下面的命令生成
DATABASE_URL=postgresql://maxgamer_user:密码@maxgamer-db:5432/maxgamer

# Redis 配置
REDIS_PASSWORD=使用下面的命令生成
REDIS_HOST=maxgamer-redis
REDIS_PORT=6379

# Twitch OAuth 配置
TWITCH_CLIENT_ID=3tfkf4ohu90fmn5v6r339cgim5task
TWITCH_CLIENT_SECRET=从 Twitch 开发者控制台获取
TWITCH_REDIRECT_URI=https://your-domain.com/api/auth/platform-callback/twitch
```

#### 生成随机密钥

在服务器上执行以下命令生成安全的随机密钥：

```bash
# 生成 SECRET_KEY
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# 生成 JWT_SECRET
python3 -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(32))"

# 生成 DB_PASSWORD
python3 -c "import secrets; print('DB_PASSWORD=' + secrets.token_urlsafe(24))"

# 生成 REDIS_PASSWORD
python3 -c "import secrets; print('REDIS_PASSWORD=' + secrets.token_urlsafe(24))"
```

将生成的值复制到 `.env` 文件中。

---

### 步骤 4: 测试 SSH 连接

在配置 GitHub Actions 之前，先手动测试 SSH 连接：

```bash
# 在本地测试（如果您有私钥文件）
ssh -i ~/.ssh/maxgamer_deploy user@server-ip

# 或者直接测试
ssh user@server-ip
```

确保能够成功连接到服务器。

---

### 步骤 5: 触发部署

配置完成后，可以通过以下方式触发部署：

#### 方法一：自动触发（推荐）

推送任何代码到 main 分支：

```bash
git commit --allow-empty -m "test: 触发自动部署"
git push origin main
```

#### 方法二：手动触发

1. 访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions
2. 点击左侧的 **"Deploy to Production"**
3. 点击右侧的 **"Run workflow"** 按钮
4. 选择 branch: `main`
5. 点击绿色的 **"Run workflow"** 按钮

---

## 📊 查看部署状态

### 实时日志

1. 访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions
2. 点击最新的 workflow 运行
3. 点击 "Deploy to Server" job
4. 展开步骤查看详细日志

### 部署成功标志

- ✅ 所有步骤显示绿色对勾
- ✅ "Verify deployment" 步骤成功
- ✅ API 健康检查通过

---

## 🔍 故障排查

### 问题 1: SSH 连接失败

**错误信息**: `Permission denied (publickey)`

**解决方案**:
1. 确认公钥已正确添加到服务器 `~/.ssh/authorized_keys`
2. 检查服务器上的权限:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```
3. 确认私钥完整复制到 GitHub Secret（包括 BEGIN 和 END 行）
4. 检查 `SERVER_HOST` 和 `SERVER_USER` 是否正确

### 问题 2: 部署脚本执行失败

**错误信息**: `./deploy.sh: Permission denied`

**解决方案**:
```bash
# 在服务器上手动赋予执行权限
cd /path/to/MaxGamer
chmod +x deploy.sh
```

### 问题 3: Docker 容器无法启动

**解决方案**:
```bash
# 在服务器上查看日志
docker-compose logs -f

# 检查环境变量
cat .env

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

### 问题 4: 健康检查失败

**错误信息**: `curl: (7) Failed to connect to localhost:3000`

**解决方案**:
```bash
# 检查容器是否运行
docker-compose ps

# 检查后端日志
docker-compose logs maxgamer-backend

# 等待服务完全启动（通常需要 10-30 秒）
```

---

## ✅ 配置检查清单

完成配置后，请确认以下所有项：

### GitHub 配置
- [ ] `SSH_PRIVATE_KEY` 已添加到 GitHub Secrets
- [ ] `SERVER_HOST` 已添加到 GitHub Secrets
- [ ] `SERVER_USER` 已添加到 GitHub Secrets
- [ ] `DEPLOY_PATH` 已添加到 GitHub Secrets

### 服务器配置
- [ ] SSH 公钥已添加到 `~/.ssh/authorized_keys`
- [ ] SSH 目录权限正确（700 for .ssh, 600 for authorized_keys）
- [ ] `.env` 文件已创建并配置所有必需变量
- [ ] Docker 和 Docker Compose 已安装
- [ ] 项目目录已存在且可访问
- [ ] 部署脚本有执行权限（`chmod +x deploy.sh`）

### 测试验证
- [ ] 手动 SSH 连接测试成功
- [ ] GitHub Actions 工作流已启用
- [ ] 测试部署已执行并成功
- [ ] API 健康检查通过（`curl http://localhost:3000/api/health`）

---

## 🔐 安全最佳实践

1. **永远不要** 将私钥、密码等敏感信息提交到 Git 仓库
2. **定期更换** SSH 密钥和应用密钥
3. **使用强密码** 生成所有密钥（建议使用 32 字符以上的随机字符串）
4. **限制访问** 只在必要的地方配置 Secrets
5. **监控日志** 定期检查部署日志，及时发现异常

---

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 查看服务器上的 Docker 日志：`docker-compose logs -f`
3. 检查服务器上的 `.env` 配置
4. 参考 [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md) 获取更多部署细节

---

## 🎉 配置完成

配置完成后，每次推送代码到 `main` 分支，GitHub Actions 将自动：

1. 🔐 通过 SSH 连接到服务器
2. 📥 拉取最新代码
3. 🔨 执行部署脚本（构建镜像、启动容器等）
4. ✅ 验证部署结果

**自动化部署已配置完成！** 🚀
