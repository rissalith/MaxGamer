# FrameWorker Python 后端

这是 FrameWorker 的 Python 后端实现，使用 Flask 框架。

## 功能特性

- ✅ 健康检查 API
- ✅ API 信息查询
- ✅ AI 图像生成（支持多种模型）
  - DALL-E 3
  - Gemini 2.5 Flash Image
  - Gemini 2.5 Flash Image Preview
  - Gemini 3 Pro Image Preview
- ✅ Prompt 模板系统
- ✅ 静态文件服务
- ✅ 代理支持
- ✅ CORS 支持

## 安装依赖

### 方法 1: 使用 pip

```bash
cd backend
pip install -r requirements.txt
```

### 方法 2: 使用 conda

```bash
cd backend
conda create -n frameworker python=3.10
conda activate frameworker
pip install -r requirements.txt
```

## 配置

1. 复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置必要的环境变量：
```env
# AI 图像生成 API 密钥（必需）
AI_IMAGE_API_KEY=your_api_key_here

# Prompt 模板选择（可选）
PROMPT_TEMPLATE_NAME=default

# 代理设置（可选）
# PROXY_URL=http://127.0.0.1:7890

# 端口设置（可选，默认 3000）
# PORT=3000
```

## 启动服务器

### 方法 1: 使用 Python 直接运行

```bash
cd backend
python app.py
```

### 方法 2: 使用启动脚本

```bash
cd backend
python start.py
```

### 方法 3: 使用 Flask 命令

```bash
cd backend
flask --app app run --host=0.0.0.0 --port=3000
```

## API 端点

### 健康检查
```
GET /api/health
```

### API 信息
```
GET /api/info
```

### 获取 AI 密钥状态
```
GET /api/ai-image-key
```

### 生成精灵图动画
```
POST /api/generate-sprite-animation
Content-Type: application/json

{
  "prompt": "一个可爱的像素风格角色",
  "frameCount": 16,
  "model": "gemini-2.5-image"
}
```

支持的模型：
- `gemini-2.5-image` (默认)
- `gemini-2.5-image-preview`
- `gemini-3-pro-image-preview`
- `dalle`

## 项目结构

```
backend/
├── app.py              # 主应用文件
├── start.py            # 启动脚本
├── requirements.txt    # Python 依赖
├── .env               # 环境变量配置
├── .env.example       # 环境变量示例
└── README_PYTHON.md   # 本文档
```

## 与 Node.js 版本的对比

| 特性 | Node.js | Python |
|------|---------|--------|
| 框架 | Express | Flask |
| 依赖管理 | npm | pip |
| 异步处理 | async/await | requests (同步) |
| 性能 | 高 | 中等 |
| 易用性 | 中等 | 高 |

## 迁移说明

如果你之前使用 Node.js 版本，迁移到 Python 版本：

1. 停止 Node.js 服务器
2. 安装 Python 依赖
3. 使用相同的 `.env` 配置
4. 启动 Python 服务器

所有 API 端点保持兼容，前端无需修改。

## 故障排除

### 问题：端口被占用
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### 问题：依赖安装失败
```bash
# 升级 pip
python -m pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题：API 密钥错误
检查 `.env` 文件中的 `AI_IMAGE_API_KEY` 是否正确配置。

## 开发模式

启用 Flask 调试模式：

```bash
export FLASK_ENV=development  # Linux/Mac
set FLASK_ENV=development     # Windows

python app.py
```

或修改 `app.py` 中的 `debug=True`。

## 生产部署

### 使用 Gunicorn (推荐)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3000 app:app
```

### 使用 uWSGI

```bash
pip install uwsgi
uwsgi --http :3000 --wsgi-file app.py --callable app --processes 4
```

## 许可证

MIT License