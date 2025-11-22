# FrameWorker 后端迁移指南

## 从 Node.js 迁移到 Python

本指南帮助你从 Node.js 后端迁移到 Python 后端。

## 🎯 迁移概述

### 主要改进

1. **专业的图像处理**
   - 使用 OpenCV 和 PIL 进行高质量绿幕抠图
   - HSV 色彩空间分析，更精确的颜色识别
   - 形态学操作去除噪点
   - 边缘羽化，使抠图更自然

2. **后端处理**
   - 图像处理逻辑从前端移到后端
   - 减轻浏览器负担
   - 更好的性能和稳定性

3. **完全兼容**
   - 所有 API 端点保持兼容
   - 前端无需大改动
   - 环境变量配置相同

## 📋 迁移步骤

### 1. 停止 Node.js 服务器

```bash
# 如果正在运行，按 Ctrl+C 停止
```

### 2. 安装 Python 依赖

```bash
cd backend
pip install -r requirements.txt
```

依赖包括：
- Flask - Web 框架
- Flask-CORS - 跨域支持
- python-dotenv - 环境变量
- requests - HTTP 客户端
- Pillow - 图像处理
- numpy - 数值计算
- opencv-python - 计算机视觉

### 3. 使用相同的配置

`.env` 文件无需修改，Python 后端使用相同的环境变量：

```env
AI_IMAGE_API_KEY=your_api_key_here
PROMPT_TEMPLATE_NAME=default
PROXY_URL=http://127.0.0.1:7897
PORT=3000
```

### 4. 启动 Python 后端

**Windows:**
```bash
cd backend
start.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**或直接运行:**
```bash
python app.py
```

### 5. 验证功能

访问 `http://localhost:3000` 测试以下功能：

- ✅ 健康检查: `GET /api/health`
- ✅ AI 图像生成: `POST /api/generate-sprite-animation`
- ✅ 图像处理: `POST /api/process-image` (新增)
- ✅ 静态文件服务

## 🆕 新增功能

### 图像处理 API

**端点:** `POST /api/process-image`

**请求体:**
```json
{
  "image": "data:image/png;base64,...",
  "rows": 4,
  "cols": 4,
  "tolerance": 50,
  "mode": "green"
}
```

**响应:**
```json
{
  "success": true,
  "frames": ["data:image/png;base64,..."],
  "count": 16,
  "rows": 4,
  "cols": 4,
  "message": "成功处理 16 帧图像"
}
```

**处理模式:**
- `green` - 绿幕抠图（推荐）
- `auto` - 自动检测背景色

## 🔧 技术对比

| 特性 | Node.js | Python |
|------|---------|--------|
| **Web 框架** | Express | Flask |
| **图像处理** | Canvas API (前端) | OpenCV + PIL (后端) |
| **抠图质量** | 基础 | 专业 |
| **性能** | 依赖浏览器 | 服务器端处理 |
| **依赖管理** | npm | pip |
| **代码行数** | ~350 | ~400 |

## 📊 性能提升

### 绿幕抠图算法改进

**Node.js 版本（前端）:**
- 简单的 RGB 阈值判断
- 容易误判相似颜色
- 边缘锯齿明显

**Python 版本（后端）:**
- HSV 色彩空间分析
- 形态学操作去噪
- 高斯模糊边缘羽化
- 更精确的颜色识别

### 处理流程对比

**之前（Node.js）:**
```
浏览器 → 上传图片 → 前端切割 → 前端抠图 → 显示结果
```

**现在（Python）:**
```
浏览器 → 上传图片 → 后端切割 → 后端抠图（OpenCV） → 返回结果 → 显示
```

## 🐛 故障排除

### 问题 1: 依赖安装失败

**解决方案:**
```bash
# 升级 pip
python -m pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题 2: OpenCV 导入错误

**解决方案:**
```bash
# 重新安装 opencv-python
pip uninstall opencv-python
pip install opencv-python
```

### 问题 3: 端口被占用

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :3000
kill -9 <PID>
```

### 问题 4: 图像处理失败

检查后端日志，确保：
- 图像格式正确（PNG, JPG, WebP）
- base64 编码完整
- 行列数参数有效

## 🔄 回滚到 Node.js

如果需要回滚：

1. 停止 Python 服务器
2. 启动 Node.js 服务器：
   ```bash
   cd backend
   npm start
   ```
3. 前端会自动回退到本地图像处理

## 📚 相关文档

- [Python 后端文档](backend/README_PYTHON.md)
- [图像处理 API 文档](backend/image_processor.py)
- [主 README](README.md)

## 💡 最佳实践

1. **开发环境**
   - 使用虚拟环境隔离依赖
   - 定期更新依赖包

2. **生产部署**
   - 使用 Gunicorn 或 uWSGI
   - 配置反向代理（Nginx）
   - 启用 HTTPS

3. **性能优化**
   - 调整图像处理参数
   - 使用缓存机制
   - 限制并发请求

## ✅ 迁移检查清单

- [ ] 安装 Python 3.8+
- [ ] 安装所有依赖
- [ ] 配置 .env 文件
- [ ] 启动 Python 后端
- [ ] 测试健康检查 API
- [ ] 测试 AI 图像生成
- [ ] 测试图像处理功能
- [ ] 测试 GIF 生成
- [ ] 测试 WebP 导出
- [ ] 验证所有功能正常

## 🎉 完成！

恭喜！你已成功迁移到 Python 后端。现在可以享受更专业的图像处理能力了！

如有问题，请查看日志或创建 Issue。