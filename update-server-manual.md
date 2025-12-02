# 手动更新服务器指南

## 当前配置

根据你的GitHub Secrets和workflow配置：
- **服务器IP**: `8.138.115.47`（来自 SERVER_HOST）
- **SSH用户**: 存储在 SERVER_USER secret中
- **部署路径**: `/var/www/FrameWorker`（默认值，因为没有设置DEPLOY_PATH）

## 问题诊断

远端服务器显示版本号：`20251130190333`（旧版本）
这说明虽然GitHub Actions显示部署成功，但服务器上的文件可能没有正确更新。

## 解决步骤

### 步骤1：清除浏览器缓存（最重要！）

**这是最可能的原因**，因为浏览器缓存了旧的JS文件。

1. 在浏览器中按 **Ctrl + Shift + Delete**
2. 选择"缓存的图片和文件"
3. 时间范围选择"全部时间"
4. 点击"清除数据"
5. 关闭浏览器，重新打开
6. 访问 `https://www.xmframer.com/login.html`
7. 按 **Ctrl + F5** 强制刷新

### 步骤2：检查服务器文件（如果步骤1无效）

使用SSH登录到服务器：

```bash
# 使用你的SSH用户名登录
ssh your_username@8.138.115.47

# 进入部署目录
cd /var/www/FrameWorker

# 检查前端文件的修改时间
ls -lh XMGamer/frontend/oauth-callback.html
ls -lh XMGamer/frontend/js/modules/authManager.js

# 查看文件内容，确认是否包含新的代码
grep "apiBaseUrl" XMGamer/frontend/oauth-callback.html
```

### 步骤3：检查Docker容器状态

```bash
# 查看容器运行状态
docker-compose -f docker-compose.prod.yml ps

# 查看API容器日志
docker-compose -f docker-compose.prod.yml logs platform-api --tail=100

# 查看nginx容器日志
docker-compose -f docker-compose.prod.yml logs nginx --tail=50
```

### 步骤4：手动重启服务（如果需要）

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 或者完全重新部署
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 步骤5：验证更新

访问以下URL检查版本：

```
https://www.xmframer.com/oauth-callback.html
```

在浏览器中查看源代码，搜索 `apiBaseUrl`，应该能看到新的代码：

```javascript
// 获取API基础URL
const hostname = window.location.hostname;
let apiBaseUrl;
if (hostname === 'localhost' || hostname === '127.0.0.1') {
    apiBaseUrl = 'http://localhost:5000/api';
} else {
    apiBaseUrl = `https://api.${hostname.replace('www.', '')}/api`;
}
```

## 快速测试命令

如果你想快速测试，可以直接在浏览器中打开开发者工具Console，运行：

```javascript
// 检查当前加载的authManager.js版本
fetch('/js/modules/authManager.js')
  .then(r => r.text())
  .then(t => console.log(t.includes('apiBaseUrl') ? '✅ 新版本' : '❌ 旧版本'))
```

## 如果问题仍然存在

如果清除缓存后问题仍然存在，可能的原因：

1. **CDN缓存**：如果使用了Cloudflare等CDN，需要清除CDN缓存
2. **Nginx缓存**：检查nginx配置是否启用了缓存
3. **文件权限**：确保nginx有权限读取更新后的文件

### 清除Cloudflare缓存（如果使用）

1. 登录Cloudflare
2. 选择你的域名
3. 进入"缓存"页面
4. 点击"清除所有内容"

## 验证Google OAuth配置

确认Google Cloud Console中已添加：
- ✅ `http://localhost:5000/oauth-callback.html`
- ✅ `https://www.xmframer.com/oauth-callback.html`

等待5分钟后测试。