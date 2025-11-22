# AI 图像生成 API 密钥部署指南

## 📋 概述

本文档说明如何将 AI 图像生成 API 密钥安全地部署到服务器。

## 🔑 密钥信息

- **密钥**: `your_actual_api_key_here`（请替换为你的真实密钥）
- **存储位置**: `backend/.env`
- **环境变量名**: `AI_IMAGE_API_KEY`

## 🚀 部署方法

### 方法 1：自动同步（推荐）

使用同步脚本会自动将 `.env` 文件上传到服务器：

#### Windows (PowerShell)
```powershell
.\sync-to-server.ps1
```

#### Linux/Mac (Bash)
```bash
./sync-to-server.sh
```

脚本会自动：
1. ✅ 检测 `backend/.env` 文件
2. ✅ 将文件安全上传到服务器
3. ✅ 显示上传状态

### 方法 2：手动上传

如果自动同步失败，可以手动上传：

```bash
# 使用 SCP 上传
scp backend/.env root@149.88.69.87:/var/www/xmframer/backend/.env
```

### 方法 3：直接在服务器创建

登录服务器后手动创建：

```bash
# 1. 登录服务器
ssh root@149.88.69.87

# 2. 进入项目目录
cd /var/www/xmframer/backend

# 3. 创建 .env 文件
cat > .env << 'EOF'
# AI 图像生成 API 密钥
AI_IMAGE_API_KEY=your_actual_api_key_here
EOF

# 4. 设置文件权限（仅所有者可读写）
chmod 600 .env

# 5. 验证文件内容
cat .env
```

## ✅ 验证部署

### 1. 检查文件是否存在

```bash
ssh root@149.88.69.87 "ls -la /var/www/xmframer/backend/.env"
```

应该看到类似输出：
```
-rw------- 1 root root 123 Nov 22 16:00 .env
```

### 2. 重启后端服务

```bash
ssh root@149.88.69.87 "cd /var/www/xmframer && pm2 restart frameworker-backend"
```

### 3. 查看服务器日志

```bash
ssh root@149.88.69.87 "pm2 logs frameworker-backend --lines 20"
```

应该看到：
```
🔑 AI 图像密钥: 已配置 ✓
```

### 4. 测试 API 端点

```bash
# 测试健康检查
curl http://149.88.69.87/api/health

# 测试 API 密钥端点
curl http://149.88.69.87/api/ai-image-key
```

应该返回：
```json
{
  "apiKey": "your_actual_api_key_here",
  "configured": true
}
```

## 🔒 安全注意事项

### 1. 文件权限

确保 `.env` 文件权限正确：

```bash
# 在服务器上执行
chmod 600 /var/www/xmframer/backend/.env
chown root:root /var/www/xmframer/backend/.env
```

### 2. Git 忽略

`.env` 文件已在 `.gitignore` 中配置，不会被提交到版本控制：

```gitignore
# 环境变量
.env
.env.local
```

### 3. 备份密钥

建议将密钥保存在安全的地方：
- 密码管理器（如 1Password、LastPass）
- 加密的文档
- 团队共享的安全存储

### 4. 定期轮换

建议定期更换 API 密钥以提高安全性。

## 🔍 故障排查

### 问题 1：服务器显示"未配置"

**症状**：
```
🔑 AI 图像密钥: 未配置 ✗
```

**解决方法**：
```bash
# 1. 检查文件是否存在
ssh root@149.88.69.87 "cat /var/www/xmframer/backend/.env"

# 2. 如果不存在，重新上传
scp backend/.env root@149.88.69.87:/var/www/xmframer/backend/.env

# 3. 重启服务
ssh root@149.88.69.87 "pm2 restart frameworker-backend"
```

### 问题 2：API 返回 500 错误

**症状**：
```json
{
  "error": "API 密钥未配置",
  "message": "请在 .env 文件中配置 AI_IMAGE_API_KEY"
}
```

**解决方法**：
```bash
# 1. 检查环境变量格式
ssh root@149.88.69.87 "cat /var/www/xmframer/backend/.env"

# 确保格式正确（无空格、无引号）：
# AI_IMAGE_API_KEY=your_actual_api_key_here

# 2. 检查 dotenv 包是否安装
ssh root@149.88.69.87 "cd /var/www/xmframer/backend && npm list dotenv"

# 3. 如果未安装，安装它
ssh root@149.88.69.87 "cd /var/www/xmframer/backend && npm install dotenv"

# 4. 重启服务
ssh root@149.88.69.87 "pm2 restart frameworker-backend"
```

### 问题 3：权限错误

**症状**：
```
Error: EACCES: permission denied, open '/var/www/xmframer/backend/.env'
```

**解决方法**：
```bash
# 修复文件权限
ssh root@149.88.69.87 "chmod 600 /var/www/xmframer/backend/.env"
ssh root@149.88.69.87 "chown root:root /var/www/xmframer/backend/.env"
```

## 📊 API 使用示例

### 在后端代码中使用

```javascript
// server.js 中已配置
const AI_IMAGE_API_KEY = process.env.AI_IMAGE_API_KEY;

// 在 API 路由中使用
app.post('/api/generate-image', async (req, res) => {
    try {
        const response = await fetch('https://api.example.com/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_IMAGE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 在前端获取密钥（通过后端代理）

```javascript
// 前端不应直接暴露 API 密钥
// 应该通过后端 API 代理请求

async function generateImage(prompt) {
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    });
    
    return await response.json();
}
```

## 📞 需要帮助？

如果遇到问题，请提供：

1. 执行 `ssh root@149.88.69.87 "cat /var/www/xmframer/backend/.env"` 的输出
2. 执行 `ssh root@149.88.69.87 "pm2 logs frameworker-backend --lines 50"` 的输出
3. 执行 `curl http://149.88.69.87/api/ai-image-key` 的输出

---

**最后更新**: 2025-11-22  
**服务器**: 149.88.69.87  
**项目目录**: /var/www/xmframer
**项目目录**: /var/www/xmframer
