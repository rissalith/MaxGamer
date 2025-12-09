# MaxGamer 远端服务器部署指南

## 更新内容

本次更新包含：
- ✅ 新增 Twitch 平台游戏支持
- ✅ 实现 Twitch OAuth 绑定和自动 Token 刷新
- ✅ 集成 Twitch IRC 实时连接
- ✅ 禁用未开放的平台绑定（抖音、TikTok、YouTube）
- ✅ 修复游戏 API 注册逻辑
- ✅ 新增管理员账号创建脚本
- ✅ 新增游戏注册脚本（修复"0个游戏"问题）
- ✅ **修复数据库持久化问题（防止数据丢失）**

## ⚠️ 重要提示：数据持久化

**问题**: 之前的部署方式中，数据库文件存储在 Docker 容器内部，每次重新部署容器时数据会丢失！

**解决方案**: 本次更新添加了 `docker-compose.yml` 配置，将数据库目录挂载到宿主机，确保数据持久化。

## 部署步骤

### 方法一：使用 Docker Compose（推荐）

#### 1. 在服务器上拉取最新代码

```bash
cd /path/to/MaxGamer
git pull origin main
```

#### 2. 配置环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
nano .env  # 或使用 vim 编辑
```

必须配置的环境变量：
```bash
FLASK_ENV=production
SECRET_KEY=生成一个随机字符串
JWT_SECRET=生成另一个随机字符串
TWITCH_CLIENT_SECRET=你的Twitch Client Secret
TWITCH_REDIRECT_URI=https://your-domain.com/api/auth/platform-callback/twitch
```

生成随机密钥（可选）：
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3. 使用 Docker Compose 启动服务

```bash
# 首次启动（会自动构建镜像）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建并启动（代码更新后）
docker-compose up -d --build
```

#### 4. 进入容器执行初始化脚本

```bash
# 进入容器
docker-compose exec maxgamer-backend bash

# 创建管理员账号
python create_admin.py

# 注册游戏到数据库
python register_games.py

# 退出容器
exit
```

#### 5. 验证部署

访问 `http://your-domain:3000/api/games` 应该能看到游戏列表。

---

### 方法二：直接部署（不使用 Docker）

#### 1. 在服务器上拉取最新代码

```bash
cd /path/to/MaxGamer
git pull origin main
```

#### 2. 配置环境变量

在服务器上的 `.env` 文件中配置环境变量（如果没有则创建）：

```bash
# Twitch OAuth 配置
TWITCH_CLIENT_ID=3tfkf4ohu90fmn5v6r339cgim5task
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
TWITCH_REDIRECT_URI=https://your-domain.com/api/auth/platform-callback/twitch
```

**重要**: 请将 `TWITCH_CLIENT_SECRET` 替换为你的实际 Twitch Client Secret。

### 3. 安装依赖（如有新增）

```bash
# 后端依赖
cd MaxGamer/backend
pip install -r requirements.txt

# 前端依赖（如果有 package.json 更新）
cd ../frontend
npm install
```

### 4. 创建管理员账号

**重要**: 必须先创建管理员账号才能登录后台管理系统。

```bash
cd MaxGamer/backend
python create_admin.py
```

脚本会创建以下账号：
- 邮箱: `admin@maxgamer.local`
- 密码: `pXw1995`
- 角色: `admin`

### 5. 注册游戏到数据库

**重要**: 这个步骤修复"0个游戏"问题。必须执行才能在游戏市场看到游戏。

```bash
cd MaxGamer/backend
python register_games.py
```

脚本会自动扫描 `GameLibrary` 目录并将所有游戏注册到数据库。

### 6. 数据库迁移（如需要）

如果数据库模型有更新：

```bash
cd MaxGamer/backend
# 根据你使用的数据库工具执行迁移
# 例如使用 Alembic:
# alembic upgrade head
```

### 7. 重启服务

```bash
# 重启 Python 后端
sudo systemctl restart maxgamer-backend

# 或使用 PM2（如果使用）
pm2 restart maxgamer-backend

# 重启前端（如果独立部署）
pm2 restart maxgamer-frontend
```

## 验证部署

### 1. 检查后端服务

```bash
curl http://localhost:3000/api/game-library/list
```

应该能看到包含 `fortune-game-twitch` 的游戏列表。

### 2. 检查 Twitch 绑定功能

1. 访问设置页面: `https://your-domain.com/settings.html`
2. 确认抖音、TikTok、YouTube 显示为"即将开放"（灰色）
3. 点击 Twitch 绑定按钮，应该能跳转到 Twitch OAuth 页面

### 3. 检查游戏启动

1. 访问游戏市场: `https://your-domain.com/game-market.html`
2. 购买 Twitch 版 Miko Fortune 游戏
3. 启动游戏，应该能看到完整的游戏界面

## 新增文件清单

### 游戏库文件
```
GameLibrary/twitch/fortune-game-twitch/
├── backend/
│   ├── __init__.py
│   ├── api.py                    # API 路由（含 Token 刷新逻辑）
│   └── services/
│       ├── __init__.py
│       ├── live_service.py       # 直播服务
│       └── twitch/
│           ├── __init__.py
│           ├── connection_manager.py  # IRC 连接管理
│           └── live_monitor.py        # 事件监听
├── frontend/
│   ├── index.html
│   ├── css/                      # 样式文件
│   ├── js/
│   │   ├── app-init-twitch.js   # Twitch 初始化
│   │   ├── live/
│   │   │   └── twitch-connection.js  # 前端连接管理
│   │   └── ...                   # 其他游戏模块
│   └── ...
└── game.json                     # 游戏元数据
```

### 修改的核心文件
- `GameLibrary/game_manager.py` - 修复游戏 API 注册逻辑
- `MaxGamer/backend/database.py` - 数据库模型（如有更新）
- `MaxGamer/backend/routes/auth.py` - Twitch OAuth 支持
- `MaxGamer/frontend/pages/settings.html` - 平台绑定 UI
- `MaxGamer/frontend/js/modules/gameMarket.js` - Twitch 游戏配置

## 常见问题

### Q1: 部署后数据（账号、游戏）丢失怎么办？

**问题**: 每次重新部署容器后，用户账号、游戏授权等数据都消失了。

**原因**: 数据库文件存储在Docker容器内部，容器重建时数据会丢失。

**解决方案**:
1. **使用 Docker Compose（推荐）**: 参考上面的"方法一"，`docker-compose.yml` 已经配置了数据持久化
2. **检查数据目录**: 确保宿主机的 `./data` 目录存在且有正确权限
   ```bash
   ls -la ./data
   # 应该能看到 frameworker.db 文件
   ```
3. **备份数据库**: 定期备份数据库文件
   ```bash
   cp ./data/frameworker.db ./data/frameworker.db.backup.$(date +%Y%m%d)
   ```

**数据存储位置**:
- Docker Compose: `./data/frameworker.db`（挂载到宿主机）
- 直接部署: `MaxGamer/backend/data/frameworker.db`

### Q2: Token 刷新失败怎么办？

**A**: 检查 `TWITCH_CLIENT_SECRET` 环境变量是否正确设置。查看后端日志：

```bash
tail -f /path/to/logs/backend.log | grep "Fortune Twitch"
```

### Q3: 游戏界面加载不完整？

**A**: 检查浏览器控制台，可能是资源路径问题。确保前端静态文件正确部署。

### Q4: IRC 连接失败？

**A**: 目前 IRC 连接功能需要额外的依赖。如果不需要实时直播功能，可以暂时跳过。

## 回滚方案

如果部署出现问题，可以回滚到上一个版本：

```bash
git checkout 34ea012
# 重启服务
```

## 监控建议

部署后请监控以下内容：
1. 后端日志中的 `[Fortune Twitch]` 相关日志
2. Token 刷新是否正常工作
3. 游戏启动和运行是否正常
4. 用户绑定 Twitch 账号是否成功

## 联系支持

如果遇到问题，请查看：
- GitHub Issues: https://github.com/rissalith/FrameWorker/issues
- 后端日志: `/path/to/logs/backend.log`
- 前端控制台错误信息
