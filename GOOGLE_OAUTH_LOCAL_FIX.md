# Google OAuth 本地开发环境修复总结

## 修复时间
2025-12-02 13:30

## 问题描述
本地开发环境下Google OAuth登录失败，报错：
```
sqlite3.OperationalError: unable to open database file
```

## 根本原因
1. **数据库路径配置错误**：`database.py`中硬编码了Docker容器路径`/app/data/frameworker.db`
2. **缺少自动初始化**：本地开发时数据库文件不存在，且没有自动创建机制

## 修复方案

### 1. 修改数据库路径配置 (database.py)
```python
# 根据环境使用不同的数据库路径
if os.getenv('FLASK_ENV') == 'production':
    # 生产环境：使用Docker容器路径
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:////app/data/frameworker.db')
else:
    # 开发环境：使用相对路径
    db_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'frameworker.db')
    DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
```

### 2. 添加自动初始化逻辑 (database.py)
```python
# 自动初始化数据库（如果不存在）
try:
    if 'sqlite' in DATABASE_URL:
        db_path = DATABASE_URL.replace('sqlite:///', '')
        if not os.path.exists(db_path):
            print(f'[INFO] 数据库文件不存在，正在创建: {db_path}')
            init_db()
    else:
        Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f'[WARNING] 自动初始化数据库失败: {e}')
```

## 修复结果

### ✅ 成功创建数据库
```
目录: XMGamer/backend/data/
文件: frameworker.db (221KB)
创建时间: 2025-12-02 13:29
```

### ✅ 服务器正常启动
```
[OK] XMGamer Python 后端启动在端口 5000
[OK] 直播互动游戏平台 - 游戏市场和占卜游戏
```

### ✅ 登录页面加载成功
- URL: http://localhost:5000/login.html
- 所有资源加载正常
- Google登录按钮可点击
- OAuth窗口可以打开

## 待测试项目

### 本地环境
- [ ] 完整的Google OAuth登录流程
- [ ] 用户信息保存到数据库
- [ ] 登录后跳转到主页

### 生产环境
- [ ] 等待GitHub Actions部署完成
- [ ] 测试 https://www.xmframer.com 的Google登录
- [ ] 验证新服务器配置

## Google Cloud Console 配置

### 已授权的重定向URI
```
http://localhost:5000/oauth-callback.html
https://www.xmframer.com/oauth-callback.html
https://api.xmframer.com/oauth-callback.html
```

### Client ID
```
905113829240-it9vejm24bgnqfqqm167g8qeu1661jl9.apps.googleusercontent.com
```

## 技术要点

### 环境检测
- 生产环境：`FLASK_ENV=production`
- 开发环境：未设置或其他值

### 数据库路径
- 生产：`/app/data/frameworker.db` (Docker容器内)
- 开发：`XMGamer/backend/data/frameworker.db` (相对路径)

### 自动初始化
- 检查数据库文件是否存在
- 不存在则自动调用 `init_db()` 创建所有表
- 支持SQLite和其他数据库类型

## 相关文件
- `XMGamer/backend/database.py` - 数据库配置和初始化
- `XMGamer/backend/routes/auth.py` - OAuth认证路由
- `XMGamer/frontend/oauth-callback.html` - OAuth回调页面
- `XMGamer/frontend/js/modules/authManager.js` - 前端认证管理

## 下一步
1. 等待生产环境部署完成（约5-8分钟）
2. 测试生产环境的Google登录
3. 如有问题，查看服务器日志进行调试