# 🔒 安全指南

## ⚠️ 重要安全提醒

### 已修复的安全问题

在初始提交中，以下敏感文件被错误地上传到GitHub：
- ❌ 服务器IP地址和密码（已删除）
- ❌ SSH工具和配置（已删除）
- ❌ 部署脚本（包含密码）（已删除）
- ❌ Nginx配置文件（已删除）

**这些文件已从Git历史中完全删除。**

---

## 🛡️ 当前安全状态

### ✅ 已保护的信息

以下敏感信息**不会**被上传到GitHub：

1. **环境变量文件**
   - `backend/.env` - 包含API密钥
   - `.env.local`

2. **部署脚本**
   - `deploy*.bat` - 包含服务器密码
   - `fix-server.bat`
   - `diagnose-and-fix.bat`
   - `*.ps1` - PowerShell脚本

3. **SSH工具**
   - `plink.exe`
   - `pscp.exe`

4. **服务器配置**
   - `nginx-*.conf` - 包含服务器信息

5. **Python缓存**
   - `__pycache__/`
   - `*.pyc`

---

## 📋 安全检查清单

### 发布前必须检查

在每次推送到GitHub前，确保：

- [ ] `.env`文件不在Git中
- [ ] 没有硬编码的密码或API密钥
- [ ] 没有服务器IP地址或敏感配置
- [ ] `.gitignore`正确配置

### 检查命令

```bash
# 查看将要提交的文件
git status

# 查看文件内容（确保没有敏感信息）
git diff

# 检查是否有敏感文件
git ls-files | findstr /i "\.env password key secret"
```

---

## 🔐 敏感信息管理

### API密钥管理

#### 本地开发
```bash
# 1. 复制示例文件
cd backend
copy .env.example .env

# 2. 编辑.env文件，添加你的密钥
notepad .env

# 3. 确保.env在.gitignore中
```

#### 服务器部署
```bash
# 在服务器上创建.env文件
ssh root@YOUR_SERVER "cd /var/www/xmframer/backend && nano .env"

# 添加内容：
GEMINI_API_KEY=your_actual_api_key_here
```

### 服务器密码管理

**永远不要**在代码中硬编码服务器密码！

#### 推荐方案：

1. **使用SSH密钥认证**（最安全）
   ```bash
   # 生成SSH密钥
   ssh-keygen -t rsa -b 4096
   
   # 复制公钥到服务器
   ssh-copy-id root@YOUR_SERVER
   ```

2. **使用环境变量**
   ```bash
   # 在本地设置环境变量
   set SERVER_PASSWORD=your_password
   
   # 在脚本中使用
   plink -batch -pw %SERVER_PASSWORD% root@server
   ```

3. **使用密码管理器**
   - 1Password
   - LastPass
   - Bitwarden

---

## 🚨 如果密钥泄露了怎么办？

### 立即行动步骤

#### 1. 撤销泄露的密钥

**Google Gemini API密钥**：
1. 访问：https://makersuite.google.com/app/apikey
2. 删除泄露的密钥
3. 生成新密钥
4. 更新本地和服务器的`.env`文件

**服务器密码**：
```bash
# SSH登录服务器
ssh root@YOUR_SERVER

# 修改root密码
passwd

# 更新本地部署脚本中的密码
```

#### 2. 从Git历史中删除

```bash
# 安装BFG Repo-Cleaner
# 下载：https://rtyley.github.io/bfg-repo-cleaner/

# 删除包含密钥的文件
java -jar bfg.jar --delete-files .env

# 清理历史
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin --force --all
```

#### 3. 通知GitHub

如果密钥已经公开，考虑：
- 联系GitHub Support
- 使用GitHub的密钥扫描功能
- 考虑删除仓库重新创建

---

## 📝 .gitignore 最佳实践

### 当前配置

```gitignore
# 环境变量和密钥
.env
.env.local
backend/.env

# SSH工具和配置
plink.exe
pscp.exe
*.ps1

# 部署脚本
deploy*.bat
fix-server.bat
diagnose-and-fix.bat

# 服务器配置
nginx-*.conf

# Python缓存
__pycache__/
*.pyc
```

### 添加新的敏感文件

```bash
# 1. 添加到.gitignore
echo "sensitive-file.txt" >> .gitignore

# 2. 如果文件已被跟踪，从Git中删除
git rm --cached sensitive-file.txt

# 3. 提交更改
git add .gitignore
git commit -m "chore: 添加敏感文件到.gitignore"
```

---

## 🔍 定期安全审计

### 每月检查

```bash
# 1. 检查是否有新的敏感文件
git ls-files | findstr /i "password key secret token"

# 2. 检查.env文件是否被忽略
git check-ignore backend/.env

# 3. 检查最近的提交
git log --oneline -10

# 4. 扫描代码中的硬编码密钥
findstr /s /i "password.*=" *.py *.js *.bat
```

---

## 📚 安全资源

### 工具推荐

1. **git-secrets** - 防止提交密钥
   - https://github.com/awslabs/git-secrets

2. **truffleHog** - 扫描Git历史中的密钥
   - https://github.com/trufflesecurity/trufflehog

3. **GitHub Secret Scanning** - 自动检测密钥
   - 在仓库设置中启用

### 学习资源

- [GitHub安全最佳实践](https://docs.github.com/en/code-security)
- [OWASP安全指南](https://owasp.org/)
- [密钥管理最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

---

## 🤝 报告安全问题

如果你发现安全漏洞，请：

1. **不要**公开发布Issue
2. 发送邮件到：[你的邮箱]
3. 包含详细的漏洞描述
4. 等待回复后再公开

---

## ✅ 安全承诺

我们承诺：
- ✅ 不在代码中硬编码密钥
- ✅ 使用`.gitignore`保护敏感文件
- ✅ 定期审计代码安全性
- ✅ 及时响应安全问题
- ✅ 保持依赖项更新

---

**记住：安全是持续的过程，不是一次性的任务！** 🔒