# GitHub Actions 配置步骤

## ✅ 步骤 1: SSH 密钥已生成

SSH 密钥对已成功生成：
- 私钥: `~/.ssh/maxgamer_deploy`
- 公钥: `~/.ssh/maxgamer_deploy.pub`

---

## 📋 步骤 2: 将公钥添加到服务器

### 公钥内容（复制下面的内容）：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEv/Wg7SALa88H8tVFRtCvXjzAEtLCpvG13f0jKQgaUU github-actions-maxgamer
```

### 在服务器上执行：

```bash
# 1. SSH 登录到您的远端服务器
ssh your-username@your-server-ip

# 2. 添加公钥到 authorized_keys
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEv/Wg7SALa88H8tVFRtCvXjzAEtLCpvG13f0jKQgaUU github-actions-maxgamer" >> ~/.ssh/authorized_keys

# 3. 设置正确的权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 4. 退出服务器
exit
```

---

## 🔐 步骤 3: 配置 GitHub Secrets

### 访问 GitHub Secrets 页面：

https://github.com/WistonPeng/Max-Gamer-Platform/settings/secrets/actions

### 添加以下 4 个 Secrets：

#### 1. SSH_PRIVATE_KEY

点击 "New repository secret"，填写：
- Name: `SSH_PRIVATE_KEY`
- Secret: 复制下面的私钥内容（**包括** BEGIN 和 END 行）

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBL/1oO0gC2vPB/LVRUbQr148wBLSwqbxtd39IykIGlFAAAAKBtRjjUbUY4
1AAAAAtzc2gtZWQyNTUxOQAAACBL/1oO0gC2vPB/LVRUbQr148wBLSwqbxtd39IykIGlFA
AAAEBj23eD+eBYLudEGWJdQpTlTVeFoMbMfHm+tz7CPHwJ80v/Wg7SALa88H8tVFRtCvXj
zAEtLCpvG13f0jKQgaUUAAAAF2dpdGh1Yi1hY3Rpb25zLW1heGdhbWVyAQIDBAUG
-----END OPENSSH PRIVATE KEY-----
```

#### 2. SERVER_HOST

- Name: `SERVER_HOST`
- Secret: 您的服务器 IP 地址或域名
- 示例: `123.456.789.0` 或 `server.example.com`

#### 3. SERVER_USER

- Name: `SERVER_USER`
- Secret: SSH 登录用户名
- 示例: `root` 或 `ubuntu`

#### 4. DEPLOY_PATH

- Name: `DEPLOY_PATH`
- Secret: 项目在服务器上的完整路径
- 示例: `/root/MaxGamer` 或 `/home/ubuntu/Max-Gamer-Platform`

---

## 🚀 步骤 4: 启用 GitHub Actions

### 方法一：推送代码触发（推荐）

由于我们刚刚推送了 workflow 文件，GitHub Actions 应该已经自动启用。

访问查看：https://github.com/WistonPeng/Max-Gamer-Platform/actions

### 方法二：手动启用

1. 访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions
2. 如果看到提示，点击 **"I understand my workflows, go ahead and enable them"**
3. 点击 **"Enable workflows"**

---

## ✅ 步骤 5: 测试部署

### 方法一：自动触发（推荐）

配置完 Secrets 后，推送任何代码到 main 分支即可自动触发部署：

```bash
git commit --allow-empty -m "test: 触发自动部署测试"
git push origin main
```

### 方法二：手动触发

1. 访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions
2. 在左侧选择 **"Deploy to Production"**
3. 点击右侧的 **"Run workflow"** 按钮
4. 选择 branch: `main`
5. 点击绿色的 **"Run workflow"** 按钮

---

## 📊 查看部署状态

### 实时查看日志

1. 访问：https://github.com/WistonPeng/Max-Gamer-Platform/actions
2. 点击最新的 workflow 运行
3. 点击 "Deploy to Server" job
4. 展开步骤查看详细日志

### 徽章显示状态

访问仓库主页，README 中的徽章会显示：
- ✅ 绿色 = 部署成功
- ❌ 红色 = 部署失败
- 🟡 黄色 = 正在部署

---

## 🔍 故障排查

### 如果部署失败，检查以下内容：

#### 1. SSH 连接失败

**错误信息**: `Permission denied (publickey)`

**解决方案**:
- 确认公钥已正确添加到服务器 `~/.ssh/authorized_keys`
- 检查服务器上的权限: `chmod 600 ~/.ssh/authorized_keys`
- 确认私钥完整复制到 GitHub Secret（包括 BEGIN 和 END 行）

#### 2. 服务器地址错误

**错误信息**: `Connection refused` 或 `Could not resolve hostname`

**解决方案**:
- 检查 `SERVER_HOST` 是否正确
- 确认服务器 SSH 端口是 22（如果不是，需要修改 workflow）

#### 3. 项目路径不存在

**错误信息**: `No such file or directory`

**解决方案**:
- 确认 `DEPLOY_PATH` 路径正确
- 在服务器上先 clone 项目到该路径

#### 4. Git 权限问题

**错误信息**: `detected dubious ownership`

**解决方案**:
在服务器上执行：
```bash
cd /path/to/MaxGamer
git config --global --add safe.directory $(pwd)
```

---

## 📝 配置检查清单

完成配置后，请确认以下所有项：

- [ ] SSH 公钥已添加到服务器 `~/.ssh/authorized_keys`
- [ ] 服务器上的 SSH 权限正确（600 for authorized_keys, 700 for .ssh）
- [ ] GitHub Secret `SSH_PRIVATE_KEY` 已添加（包含完整私钥）
- [ ] GitHub Secret `SERVER_HOST` 已添加（服务器 IP 或域名）
- [ ] GitHub Secret `SERVER_USER` 已添加（SSH 用户名）
- [ ] GitHub Secret `DEPLOY_PATH` 已添加（项目完整路径）
- [ ] 服务器上已安装 Docker 和 Docker Compose
- [ ] 服务器上项目目录已存在且可访问
- [ ] GitHub Actions 已启用
- [ ] 测试部署已执行并成功

---

## 🎉 完成！

配置完成后，每次推送代码到 `main` 分支，GitHub Actions 会自动：
1. 连接到您的服务器
2. 拉取最新代码
3. 执行 `./deploy.sh` 部署脚本
4. 验证部署结果

**自动化部署已完成配置！** 🚀
