# redirect_uri_mismatch 错误修复

## 问题原因

错误信息：`Error 400: redirect_uri_mismatch`

这是因为前端代码生成的 `redirect_uri` 与 Google Cloud Console 中配置的不匹配。

## 当前情况

### 前端生成的 redirect_uri
当你访问 `http://localhost:5000/login.html` 时：
- `window.location.origin` = `http://localhost:5000`
- `redirect_uri` = `http://localhost:5000/oauth-callback.html`

### Google Cloud Console 配置
根据你提供的配置，已授权的重定向 URI 包括：
- ✅ `http://localhost:3000/oauth-callback.html`
- ✅ `https://www.xmframer.com/oauth-callback.html`
- ❌ **缺少** `http://localhost:5000/oauth-callback.html`

## 解决方案

### 方案1：在 Google Cloud Console 添加 URI（推荐）

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 选择你的 OAuth 2.0 客户端 ID："XMGamer Login"
3. 在"已获授权的重定向 URI"部分，点击"添加 URI"
4. 添加以下 URI：
   ```
   http://localhost:5000/oauth-callback.html
   ```
5. 点击"保存"
6. **等待 5 分钟**让配置生效

### 方案2：使用端口 3000 访问（临时方案）

如果你想立即测试，可以：
1. 访问 `http://localhost:3000/login.html` 而不是 `http://localhost:5000/login.html`
2. 这样 redirect_uri 会是 `http://localhost:3000/oauth-callback.html`，与配置匹配

但这需要前端服务器运行在 3000 端口。

### 方案3：修改前端代码使用固定端口（不推荐）

修改 `authManager.js` 强制使用 3000 端口，但这会影响灵活性。

## 推荐操作步骤

1. **立即添加 URI 到 Google Cloud Console**
   - 添加 `http://localhost:5000/oauth-callback.html`
   - 添加 `http://127.0.0.1:5000/oauth-callback.html`（以防万一）

2. **等待 5 分钟**
   - Google 的配置更新需要时间生效

3. **清除浏览器缓存**
   - 按 Ctrl+Shift+Delete
   - 清除缓存和 Cookie

4. **重新测试**
   - 访问 `http://localhost:5000/login.html`
   - 点击 Google 登录

## 完整的 redirect_uri 列表

建议在 Google Cloud Console 中配置以下所有 URI：

### 本地开发
```
http://localhost:3000/oauth-callback.html
http://localhost:5000/oauth-callback.html
http://127.0.0.1:3000/oauth-callback.html
http://127.0.0.1:5000/oauth-callback.html
```

### 生产环境
```
https://www.xmframer.com/oauth-callback.html
https://xmframer.com/oauth-callback.html
http://www.xmframer.com/oauth-callback.html
http://xmframer.com/oauth-callback.html
```

## 验证配置

配置完成后，你可以在 Google OAuth 授权页面的 URL 中看到 redirect_uri 参数：
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=...
  &redirect_uri=http://localhost:5000/oauth-callback.html  <-- 这个必须在配置中
  &response_type=code
  ...
```

确保这个 redirect_uri 值在你的 Google Cloud Console 配置列表中。