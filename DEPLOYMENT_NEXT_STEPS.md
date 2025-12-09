# 🔐 MaxGamer GitHub Actions 部署完整指南

> ✅ **步骤 1 已完成**: GitHub Secrets 已配置完成

## 📋 接下来的步骤

### 步骤 2: 在服务器上配置环境

您有两种方式来配置服务器：

#### 方式一：使用自动化脚本（推荐）⭐

1. SSH 登录到您的服务器：
   ```bash
   ssh root@您的服务器IP
   ```

2. 进入项目目录并拉取最新代码：
   ```bash
   cd /root/MaxGamer
   git pull origin main
   ```

3. 运行自动化配置脚本：
   ```bash
   chmod +x scripts/server_setup.sh
   ./scripts/server_setup.sh
   ```

4. 按照脚本提示操作：
   - 输入 SSH 公钥（见下方）
   - 输入 Twitch Client Secret
   - 输入您的域名

脚本会自动完成以下操作：
- ✅ 配置 SSH 公钥到 ~/.ssh/authorized_keys
- ✅ 生成所有必需的随机密钥
- ✅ 创建 .env 配置文件
- ✅ 备份旧配置
- ✅ 设置正确的文件权限

#### 方式二：手动配置

参考 [.github/DEPLOYMENT_SETUP.md](.github/DEPLOYMENT_SETUP.md) 进行手动配置。

---

## 🔑 SSH 公钥信息

您需要的 SSH 公钥已保存在本地文件中：

查看 `GITHUB_SECRETS_PRIVATE.md` 文件（此文件不会被提交到 Git）

或者直接复制以下命令在服务器上执行：

**⚠️ 注意**: SSH 公钥会在您执行服务器配置脚本时提供，或者查看本地的 `GITHUB_SECRETS_PRIVATE.md` 文件。

---

## 🧪 步骤 3: 测试部署

配置完成后，测试自动部署：

### 方法一：推送代码触发（自动）

```bash
git commit --allow-empty -m "test: 触发自动部署测试"
git push origin main
```

### 方法二：手动触发

1. 访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions
2. 点击左侧 "Deploy to Production"
3. 点击右侧 "Run workflow"
4. 选择 branch: `main`
5. 点击绿色 "Run workflow" 按钮

---

## 📊 查看部署状态

访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions

部署成功的标志：
- ✅ 所有步骤显示绿色对勾
- ✅ "Verify deployment" 步骤成功
- ✅ API 健康检查通过

---

## 🔒 安全措施说明

为了确保您的密钥安全，我们采取了以下措施：

### ✅ 已完成的安全措施

1. **移除了所有包含敏感信息的文件**
   - 从 Git 历史中删除了包含 SSH 私钥的文件
   - 从 Git 历史中删除了包含实际密钥值的文件

2. **更新了 .gitignore**
   - 添加了对 SSH 密钥文件的忽略
   - 添加了对包含敏感信息文档的忽略
   - 防止未来误提交敏感文件

3. **重新生成了所有密钥**
   - 生成了新的 SSH 密钥对
   - 旧密钥已失效，无法使用

4. **创建了安全的配置流程**
   - 所有敏感信息仅存储在：
     - GitHub Secrets（加密存储）
     - 服务器本地 .env 文件（不会上传）
     - 您本地的 `GITHUB_SECRETS_PRIVATE.md` 文件（不会提交到 Git）

### 📝 密钥存储位置

| 密钥类型 | 存储位置 | 是否安全 |
|---------|---------|---------|
| SSH 私钥 | GitHub Secrets | ✅ 加密存储 |
| SSH 公钥 | 服务器 ~/.ssh/authorized_keys | ✅ 公钥可公开 |
| 应用密钥 | 服务器 .env 文件 | ✅ 本地文件，不上传 |
| 配置备份 | 本地 GITHUB_SECRETS_PRIVATE.md | ✅ 被 .gitignore 忽略 |

### ⚠️ 重要提示

1. **永远不要**将 `.env` 文件提交到 Git
2. **永远不要**将 `GITHUB_SECRETS_PRIVATE.md` 分享给他人
3. **定期更换**所有密钥（建议每 3-6 个月）
4. **如果怀疑密钥泄露**，立即重新生成并更新所有配置

---

## 📚 相关文档

- [部署配置指南](.github/DEPLOYMENT_SETUP.md) - 详细的配置步骤
- [部署指南](DEPLOY_GUIDE.md) - 自动化部署架构说明
- [GitHub Actions 设置](.github/ACTIONS_SETUP.md) - CI/CD 工作流说明

---

## 🆘 遇到问题？

### 常见问题

1. **SSH 连接失败**：检查公钥是否正确添加，权限是否正确（600）
2. **环境变量错误**：运行服务器配置脚本重新生成
3. **部署失败**：查看 GitHub Actions 日志和服务器 Docker 日志

### 获取帮助

- GitHub Actions 日志：https://github.com/WistonPeng/Max-Gamer-Platform/actions
- 服务器日志：`docker-compose logs -f`
- 问题反馈：https://github.com/WistonPeng/Max-Gamer-Platform/issues

---

## 🎉 完成！

完成上述步骤后，您的 GitHub Actions 自动部署就配置完成了！

每次推送代码到 `main` 分支，系统会自动：
1. 连接到服务器
2. 拉取最新代码
3. 执行部署脚本
4. 验证部署结果

**祝您使用愉快！** 🚀
