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

## 部署步骤

### 1. 在服务器上拉取最新代码

```bash
cd /path/to/MaxGamer
git pull origin main
```

### 2. 配置 Twitch 环境变量

在服务器上的 `.env` 文件中添加 Twitch Client Secret：

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

### Q1: Token 刷新失败怎么办？

**A**: 检查 `TWITCH_CLIENT_SECRET` 环境变量是否正确设置。查看后端日志：

```bash
tail -f /path/to/logs/backend.log | grep "Fortune Twitch"
```

### Q2: 游戏界面加载不完整？

**A**: 检查浏览器控制台，可能是资源路径问题。确保前端静态文件正确部署。

### Q3: IRC 连接失败？

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
