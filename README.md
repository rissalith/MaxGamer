# FrameWorker 🎬

一个前后端分离的图片切割和动画生成工具，支持将精灵图（Sprite Sheet）切割成多个帧，并生成 GIF 动画或导出 WebP 帧。

## ✨ 功能特性

- 📁 **图片上传**: 支持选择和加载任意图片
- ✂️ **智能切割**: 按行列数自动切割图片为多个帧
- 🎨 **背景去除**: 基于左上角像素颜色自动去除背景（可调节容差）
- 👁️ **实时预览**: 预览每一帧的处理效果
- 🎞️ **GIF 生成**: 一键生成并下载 GIF 动画（可调节帧延迟）
- 🖼️ **WebP 导出**: 批量导出单帧 WebP 图片
- 🤖 **AI 生成**: 支持通过 AI 生成精灵图动画
- 📚 **Prompt 知识库**: 通过 `.md` 文件管理 AI 生成的 prompt 模板
- 🎯 **前后端分离**: 清晰的架构设计

## 🚀 快速开始

### 前提条件

- Python 3.8 或更高版本
- pip

### 安装步骤

1. **克隆或下载项目**

2. **安装后端依赖**

```bash
cd backend
pip install -r requirements.txt
```

3. **配置环境变量**

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置 AI_IMAGE_API_KEY
```

4. **启动服务器**

Windows:
```powershell
cd backend
start.bat
```

Linux/Mac:
```bash
cd backend
chmod +x start.sh
./start.sh
```

或直接运行:
```bash
python app.py
```

5. **访问应用**

打开浏览器访问：`http://localhost:3000`

## 📁 项目结构

```
FrameWorker/
├── frontend/              # 前端文件
│   ├── index.html        # 主页面
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript 模块
│   └── lib/              # 第三方库
├── backend/              # 后端服务（纯 Python）
│   ├── app.py            # Python Flask 服务器
│   ├── image_processor.py # 图像处理模块
│   ├── requirements.txt  # Python 依赖
│   ├── start.bat         # Windows 启动脚本
│   ├── start.sh          # Linux/Mac 启动脚本
│   ├── .env              # 环境变量配置
│   └── README_PYTHON.md  # Python 后端文档
├── prompts/              # Prompt 知识库
│   ├── README.md         # 知识库说明
│   ├── default.md        # 默认模板
│   ├── pixel-art.md      # 像素艺术模板
│   ├── 3d-render.md      # 3D渲染模板
│   └── cartoon.md        # 卡通风格模板
└── README.md            # 项目文档
```

## 🎯 使用方法

### 1. 选择图片
点击"选择图片"按钮，上传一张精灵图（Sprite Sheet）

### 2. 设置参数
- **行数**: 图片垂直方向的帧数（如果是横向一排，设为 1）
- **列数**: 图片水平方向的帧数
- **容差阈值**: 背景去除的灵敏度（0-255），值越大去除范围越广
- **帧延迟**: GIF 动画中每帧的显示时间（毫秒）

### 3. 处理图片
点击"处理图片"按钮，系统将自动：
- 按设置的行列数切割图片
- 以第一帧左上角像素为背景色进行去除
- 在预览区域显示所有处理后的帧

### 4. 导出动画
- **生成 GIF**: 点击"生成并下载 GIF"按钮，将所有帧合成为一个 GIF 动画
- **导出 WebP**: 点击"导出 WebP 帧"按钮，将每一帧分别导出为 WebP 格式

## 🛠️ 技术栈

### 前端
- HTML5 Canvas API（图片处理）
- JavaScript（原生 ES6+）
- CSS3（响应式设计）
- [gif.js](https://github.com/jnordberg/gif.js) - GIF 生成库

### 后端（纯 Python）
- Python 3.8+
- Flask - Web 框架
- Flask-CORS - 跨域支持
- Requests - HTTP 客户端
- python-dotenv - 环境变量管理
- Pillow - 图像处理
- OpenCV - 计算机视觉
- NumPy - 数值计算

## 🎨 示例场景

### 场景 1: 游戏角色动画
如果你有一个 4×4 的精灵图（16 帧角色走路动画）：
- 设置行数: `4`
- 设置列数: `4`
- 容差阈值: `30`（根据背景颜色调整）
- 帧延迟: `100` ms

### 场景 2: 横向一排动画
如果你有一个 1×8 的精灵图（8 帧横向排列）：
- 设置行数: `1`
- 设置列数: `8`
- 容差阈值: `20`
- 帧延迟: `150` ms

## 📝 API 接口

### 健康检查
```
GET /api/health
```
返回服务器运行状态

### API 信息
```
GET /api/info
```
返回 API 功能和端点信息

## 🔧 配置说明

### AI 图像生成配置

1. **配置 API 密钥**

在 `backend/.env` 文件中配置：
```env
AI_IMAGE_API_KEY=your_api_key_here
```

2. **选择 Prompt 模板**

在 `backend/.env` 文件中指定使用哪个模板：
```env
PROMPT_TEMPLATE_NAME=default  # 可选: default, pixel-art, 3d-render, cartoon
```

3. **自定义 Prompt 模板**

在 `prompts/` 目录下创建新的 `.md` 文件，格式如下：
```markdown
---
name: 你的模板名称
description: 模板描述
enabled: true
---

你的 prompt 内容，可使用 {rows}, {cols}, {frameCount}, {prompt} 占位符
```

详细说明请查看 [`prompts/README.md`](prompts/README.md)

### 修改端口
在 `backend/.env` 文件中配置：
```env
PORT=3000
```

或编辑 `backend/app.py`，修改：
```python
PORT = int(os.getenv('PORT', 3000))
```

## 🌐 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 13+
- Edge 79+

**注意**: WebP 导出功能需要浏览器支持 WebP 格式。动态 WebP（动画）可能需要第三方编码器。

## 📊 性能建议

- 推荐图片尺寸不超过 2000×2000 像素
- 帧数建议在 100 帧以内以获得最佳性能
- 生成 GIF 时，帧数越多处理时间越长

## 🐛 故障排除

### 问题: 无法加载图片
- 确保图片格式正确（JPG, PNG, WebP 等）
- 检查文件大小是否超过限制

### 问题: 背景去除不完整
- 增大容差阈值参数
- 确保背景颜色相对统一

### 问题: GIF 生成失败
- 检查浏览器控制台错误信息
- 尝试减少帧数或降低图片分辨率

## 📚 相关文档

- [Prompt 知识库说明](prompts/README.md) - 如何管理和自定义 AI 生成模板
- [Prompt 自定义指南](PROMPT_CUSTOMIZATION.md) - 详细的配置教程

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请创建 Issue。

---

**享受创作的乐趣！** 🎉
