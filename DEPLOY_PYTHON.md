# FrameWorker Python 后端服务器部署指南

## 📋 部署概览

**目标服务器**: Ubuntu 24.04 (149.88.69.87)  
**项目目录**: /var/www/xmframer  
**域名**: xmframer.com  
**后端技术**: Python 3 + Flask  
**前端技术**: 纯静态 HTML/CSS/JavaScript  

## 🚀 快速部署（Windows PowerShell）

### 方法 1：一键部署（推荐）

在项目根目录打开 PowerShell，执行：

```powershell
.\sync-to-server-python.ps1
```

脚本会自动：
1. ✅ 测试 SSH 连接
2. ✅ 同步前端、后端和 Prompt 模板到服务器
3. ✅ 上传部署脚本
4. ✅ 询问是否立即远程部署

### 方法 2：分步部署

#### 步骤 1：修改 SSH 用户名

编辑 [`sync-to-server-python.ps1`](sync-to-server-python.ps1:6)，修改第 6 行：

```powershell
$SERVER_USER = "root"  # 改成你的 SSH 用户名，如 ubuntu、admin 等
```

#### 步骤 2：同步代码

```powershell
.\sync-to-server-python.ps1
```

#### 步骤 3：登录服务器并部署

```bash
ssh root@149.88.69.87
cd /var/www/xmframer
chmod +x deploy-python.sh
./deploy-python.sh
```

## 🔧 部署内容

### 自动安装的软件
- ✅ Python 3 + pip + venv
- ✅ Nginx (Web 服务器)
- ✅ Certbot (SSL 证书)
- ✅ systemd 服务（后端守护进程）

### 自动配置
- ✅ Python 虚拟环境（/var/www/xmframer/backend/venv）
- ✅ 后端运行在 http://localhost:3000
- ✅ systemd 守护进程（支持自动重启、开机自启）
- ✅ Nginx 反向代理（/api 请求转发到后端）
- ✅ 前端静态文件托管在 /var/www/html/xmframer
- ✅ 上传文件大小限制 100MB
- ✅ Gzip 压缩启用
- ✅ 静态资源缓存 7 天
- ✅ API 超时设置 120 秒（适配 AI 生成）

## 📊 服务管理命令

### systemd 服务管理

```bash
# 查看服务状态
sudo systemctl status frameworker

# 查看实时日志
sudo journalctl -u frameworker -f

# 查看最近 50 条日志
sudo journalctl -u frameworker -n 50

# 重启服务
sudo systemctl restart frameworker

# 停止服务
sudo systemctl stop frameworker

# 启动服务
sudo systemctl start frameworker

# 禁用开机自启
sudo systemctl disable frameworker

# 启用开机自启
sudo systemctl enable frameworker
```

### Nginx 管理

```bash
# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 测试配置文件
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

### Python 环境管理

```bash
# 进入项目目录
cd /var/www/xmframer/backend

# 激活虚拟环境
source venv/bin/activate

# 查看已安装的包
pip list

# 更新依赖
pip install -r requirements.txt --upgrade

# 退出虚拟环境
deactivate
```

## 🔐 环境变量配置

部署后，需要配置 API 密钥：

```bash
# 编辑 .env 文件
sudo nano /var/www/xmframer/backend/.env
```

必需配置：
```env
# AI 图像生成 API 密钥
AI_IMAGE_API_KEY=your_api_key_here

# 可选：代理配置（如果需要）
# PROXY_URL=http://127.0.0.1:7897
```

配置完成后重启服务：
```bash
sudo systemctl restart frameworker
```

## 🔐 HTTPS 配置

### 自动配置（推荐）

部署脚本会提示是否安装 SSL 证书，选择 `y` 即可自动配置。

**前提条件**：
- 域名 xmframer.com 已解析到 149.88.69.87
- 端口 80 和 443 已开放

### 手动配置

如果自动配置失败，可手动执行：

```bash
sudo certbot --nginx -d xmframer.com -d www.xmframer.com
```

### 证书自动续期

Certbot 会自动设置定时任务，证书到期前自动续期。

查看续期状态：
```bash
sudo certbot renew --dry-run
```

## 🌐 访问地址

部署完成后，可通过以下地址访问：

- **HTTP**: http://149.88.69.87
- **HTTPS**: https://xmframer.com（需配置 SSL）
- **API 健康检查**: http://149.88.69.87/api/health
- **API 信息**: http://149.88.69.87/api/info

## 🔍 故障排查

### 1. 后端无法启动

```bash
# 查看服务状态
sudo systemctl status frameworker

# 查看详细日志
sudo journalctl -u frameworker -n 100

# 检查端口占用
sudo lsof -i :3000
sudo netstat -tlnp | grep 3000

# 手动测试后端
cd /var/www/xmframer/backend
source venv/bin/activate
python app.py
```

### 2. Python 依赖问题

```bash
# 重新安装依赖
cd /var/www/xmframer/backend
source venv/bin/activate
pip install -r requirements.txt --force-reinstall

# 检查 Python 版本
python --version

# 检查已安装的包
pip list
```

### 3. API 密钥未配置

```bash
# 检查 .env 文件
cat /var/www/xmframer/backend/.env

# 如果不存在，从示例创建
cp /var/www/xmframer/backend/.env.example /var/www/xmframer/backend/.env

# 编辑并添加 API 密钥
sudo nano /var/www/xmframer/backend/.env

# 重启服务
sudo systemctl restart frameworker
```

### 4. Nginx 502 错误

```bash
# 检查后端是否运行
sudo systemctl status frameworker
curl http://localhost:3000/api/health

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 测试 Nginx 配置
sudo nginx -t

# 检查防火墙
sudo ufw status
```

### 5. SSL 证书安装失败

**常见原因**：
- 域名未解析或解析未生效（执行 `ping xmframer.com` 检查）
- 防火墙未开放 80/443 端口
- 已有其他服务占用 80 端口

**解决方法**：
```bash
# 检查域名解析
nslookup xmframer.com
ping xmframer.com

# 检查防火墙
sudo ufw status

# 检查端口占用
sudo lsof -i :80
sudo lsof -i :443
```

### 6. 前端页面 404

```bash
# 检查文件是否存在
ls -la /var/www/html/xmframer

# 检查权限
sudo chown -R www-data:www-data /var/www/html/xmframer
sudo chmod -R 755 /var/www/html/xmframer

# 查看 Nginx 配置
cat /etc/nginx/sites-available/xmframer
```

### 7. AI 图像生成失败

```bash
# 查看后端日志
sudo journalctl -u frameworker -f

# 测试 API 连接
curl -X GET http://localhost:3000/api/ai-image-key

# 检查代理设置（如果配置了代理）
cat /var/www/xmframer/backend/.env | grep PROXY
```

## 🔄 代码更新流程

当本地代码修改后，重新部署：

### 1. 同步新代码

```powershell
# 在本地 Windows 执行
.\sync-to-server-python.ps1
```

### 2. 重启服务

```bash
# 登录服务器
ssh root@149.88.69.87

# 重启后端
sudo systemctl restart frameworker

# 更新前端静态文件
sudo cp -r /var/www/xmframer/frontend/* /var/www/html/xmframer/

# 如果修改了依赖
cd /var/www/xmframer/backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart frameworker

# 如果修改了 Nginx 配置
sudo nginx -t
sudo systemctl restart nginx
```

### 3. 快速更新脚本

创建一个快速更新脚本 `/var/www/xmframer/update.sh`：

```bash
#!/bin/bash
echo "🔄 更新 FrameWorker..."

# 更新前端
sudo cp -r /var/www/xmframer/frontend/* /var/www/html/xmframer/
echo "✅ 前端已更新"

# 重启后端
sudo systemctl restart frameworker
echo "✅ 后端已重启"

echo "🎉 更新完成！"
```

使用方法：
```bash
chmod +x /var/www/xmframer/update.sh
./var/www/xmframer/update.sh
```

## 📦 服务器性能优化（可选）

### 1. 启用 Gunicorn（生产环境推荐）

安装 Gunicorn：
```bash
cd /var/www/xmframer/backend
source venv/bin/activate
pip install gunicorn
deactivate
```

修改 systemd 服务文件：
```bash
sudo nano /etc/systemd/system/frameworker.service
```

将 ExecStart 改为：
```ini
ExecStart=/var/www/xmframer/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:3000 app:app
```

重启服务：
```bash
sudo systemctl daemon-reload
sudo systemctl restart frameworker
```

### 2. 启用 Nginx 缓存

编辑 `/etc/nginx/sites-available/xmframer`，添加缓存配置：

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

# 在 location /api/ 块中添加
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_bypass $http_cache_control;
add_header X-Cache-Status $upstream_cache_status;
```

### 3. 日志轮转

创建日志轮转配置：
```bash
sudo nano /etc/logrotate.d/frameworker
```

添加内容：
```
/var/log/frameworker/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## 📞 需要帮助？

如果遇到问题，请提供以下信息：

1. 错误截图或日志输出
2. 执行 `sudo journalctl -u frameworker -n 100`
3. 执行 `sudo nginx -t`
4. 执行 `curl -v http://localhost:3000/api/health`
5. 执行 `cat /var/www/xmframer/backend/.env`（隐藏敏感信息）

## 📝 与旧版本的区别

如果你之前使用的是 Node.js 版本的部署脚本，主要区别：

| 项目 | Node.js 版本 | Python 版本 |
|------|-------------|-------------|
| 后端语言 | Node.js | Python 3 |
| 进程管理 | PM2 | systemd |
| 依赖管理 | npm | pip + venv |
| 配置文件 | package.json | requirements.txt |
| 启动命令 | `pm2 start server.js` | `systemctl start frameworker` |
| 日志查看 | `pm2 logs` | `journalctl -u frameworker` |

---

**部署完成时间**: 约 5-10 分钟  
**建议服务器配置**: 1核2G以上  
**支持的操作系统**: Ubuntu 20.04+, Debian 10+  
**Python 版本要求**: Python 3.8+