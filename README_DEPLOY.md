# FrameWorker 部署说明

## 📌 重要提示

本项目后端使用 **Python Flask**，不是 Node.js。请使用以下新的部署脚本：

### ✅ 正确的部署文件（Python 版本）
- [`deploy-python.sh`](deploy-python.sh) - 服务器端部署脚本
- [`sync-to-server-python.ps1`](sync-to-server-python.ps1) - 本地同步脚本
- [`DEPLOY_PYTHON.md`](DEPLOY_PYTHON.md) - 完整部署文档
- [`快速部署指南.md`](快速部署指南.md) - 快速入门指南

### ❌ 已过时的文件（Node.js 版本，请勿使用）
- `deploy.sh` - 为 Node.js 设计，不适用于当前项目
- `sync-to-server.sh` - 为 Node.js 设计
- `sync-to-server.ps1` - 为 Node.js 设计
- `DEPLOY.md` - Node.js 部署文档
- `部署命令.md` - Node.js 部署命令

---

## 🚀 快速开始

### 方式一：一键部署（推荐）

在项目根目录打开 PowerShell：

```powershell
.\sync-to-server-python.ps1
```

按提示操作即可完成部署。

### 方式二：查看详细指南

阅读 [`快速部署指南.md`](快速部署指南.md) 获取分步说明。

---

## 📚 文档索引

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| [快速部署指南.md](快速部署指南.md) | 简明部署步骤 | 快速上手 |
| [DEPLOY_PYTHON.md](DEPLOY_PYTHON.md) | 完整部署文档 | 详细配置和故障排查 |
| [deploy-python.sh](deploy-python.sh) | 服务器部署脚本 | 服务器端执行 |
| [sync-to-server-python.ps1](sync-to-server-python.ps1) | 代码同步脚本 | 本地 Windows 执行 |

---

## 🔧 技术栈

### 后端
- **语言**: Python 3.8+
- **框架**: Flask 3.0
- **进程管理**: systemd
- **依赖管理**: pip + venv

### 前端
- **技术**: 纯静态 HTML/CSS/JavaScript
- **Web 服务器**: Nginx

### 服务器
- **系统**: Ubuntu 24.04
- **IP**: 149.88.69.87
- **域名**: xmframer.com

---

## 📦 部署架构

```
┌─────────────────────────────────────────┐
│         Nginx (端口 80/443)              │
│  - 静态文件服务 (前端)                    │
│  - 反向代理 (/api → 后端)                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   Python Flask 后端 (端口 3000)          │
│  - systemd 守护进程                      │
│  - 虚拟环境 (venv)                       │
│  - AI 图像生成 API                       │
└─────────────────────────────────────────┘
```

---

## 🔑 环境变量配置

部署后需要在服务器上配置 `/var/www/xmframer/backend/.env`：

```env
# 必需：AI 图像生成 API 密钥
AI_IMAGE_API_KEY=your_api_key_here

# 可选：代理配置（如果在中国大陆访问 Google API）
PROXY_URL=http://127.0.0.1:7897

# 可选：Prompt 模板选择
PROMPT_TEMPLATE_NAME=default
```

---

## 🔄 更新流程

### 更新代码

```powershell
# 1. 本地同步代码
.\sync-to-server-python.ps1

# 2. 登录服务器
ssh root@149.88.69.87

# 3. 重启服务
sudo systemctl restart frameworker
sudo cp -r /var/www/xmframer/frontend/* /var/www/html/xmframer/
```

### 更新依赖

```bash
cd /var/www/xmframer/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
deactivate
sudo systemctl restart frameworker
```

---

## 📊 服务管理

### 查看状态
```bash
sudo systemctl status frameworker
```

### 查看日志
```bash
sudo journalctl -u frameworker -f
```

### 重启服务
```bash
sudo systemctl restart frameworker
```

---

## 🆚 与 Node.js 版本的区别

| 项目 | Node.js 版本（旧） | Python 版本（新） |
|------|-------------------|------------------|
| 后端语言 | Node.js | Python 3 |
| 进程管理 | PM2 | systemd |
| 依赖管理 | npm | pip + venv |
| 启动命令 | `pm2 start` | `systemctl start` |
| 日志查看 | `pm2 logs` | `journalctl -u` |
| 配置文件 | package.json | requirements.txt |

---

## ❓ 常见问题

### Q: 为什么有两套部署脚本？
**A:** 项目后端从 Node.js 迁移到了 Python，旧的 Node.js 部署脚本已不适用。请使用带 `-python` 后缀的新脚本。

### Q: 可以删除旧的部署文件吗？
**A:** 建议保留作为参考，但部署时请使用新的 Python 版本脚本。

### Q: 如何确认使用了正确的脚本？
**A:** 检查脚本内容：
- ✅ 正确：包含 `python3`、`venv`、`systemd`
- ❌ 错误：包含 `node`、`npm`、`pm2`

---

## 📞 技术支持

遇到问题时，请提供：
1. 执行的命令
2. 错误信息或日志
3. 服务器系统信息
4. 后端日志：`sudo journalctl -u frameworker -n 100`

---

**最后更新**: 2025-11-22  
**维护者**: FrameWorker Team