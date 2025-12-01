# 部署问题诊断报告

## 问题描述

服务器上部署的版本与本地版本不一致。

## 根本原因

根据分析，发现以下关键信息：

### 1. 部署方式
- **GitHub Actions** 使用 **rsync** 而不是 git 来同步文件
- 服务器路径：`/var/www/FrameWorker`
- 这个目录**不是**一个git仓库，而是通过rsync同步的文件副本

### 2. 部署流程（来自 `.github/workflows/deploy.yml`）

```yaml
# 步骤1: 在GitHub Actions中检出代码
- uses: actions/checkout@v3

# 步骤2: 使用rsync同步到服务器临时目录
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.github' \
  ./ $SERVER_USER@$SERVER_IP:/tmp/frameworker-deploy/

# 步骤3: 在服务器上从临时目录同步到正式目录
rsync -av --delete \
  --exclude='nginx/' \
  --exclude='venv/' \
  /tmp/frameworker-deploy/ /var/www/FrameWorker/
```

### 3. 为什么服务器版本可能不是最新的

可能的原因：

#### A. GitHub Actions 没有被触发
- 检查：https://github.com/rissalith/FrameWorker/actions
- 确认最近的workflow运行时间
- 确认是否有失败的部署

#### B. 部署失败但没有注意到
- 查看GitHub Actions日志
- 检查是否有错误信息

#### C. 浏览器缓存问题
- 即使服务器已更新，浏览器可能显示旧版本
- 需要强制刷新：Ctrl+Shift+R

#### D. Docker容器没有重启
- 文件已更新但容器还在使用旧文件
- 需要重启容器：`docker restart xmgamer-gateway`

## 诊断步骤

### 步骤1: 检查GitHub Actions状态

访问：https://github.com/rissalith/FrameWorker/actions

查看：
- 最近一次部署的时间
- 部署是否成功
- 是否有错误日志

### 步骤2: 检查本地git状态

```bash
# 查看当前分支和状态
git status

# 查看最近的提交
git log --oneline -5

# 查看远程分支状态
git fetch origin
git log origin/main --oneline -5
```

### 步骤3: 检查服务器文件

```bash
# SSH登录服务器
ssh root@149.88.69.87

# 检查文件修改时间
ls -la /var/www/FrameWorker/XMGamer/frontend/login.html
ls -la /var/www/FrameWorker/XMGamer/frontend/css/auth.css

# 查看文件内容（检查是否是最新版本）
head -20 /var/www/FrameWorker/XMGamer/frontend/login.html
```

### 步骤4: 检查Docker容器

```bash
# 检查容器状态
docker ps | grep xmgamer

# 查看容器日志
docker logs xmgamer-gateway --tail 50

# 检查容器内的文件
docker exec xmgamer-gateway ls -la /usr/share/nginx/html/platform/
```

## 解决方案

### 方案1: 手动触发GitHub Actions部署（推荐）

1. 访问：https://github.com/rissalith/FrameWorker/actions
2. 点击 "Deploy to Server" workflow
3. 点击 "Run workflow" 按钮
4. 选择 "main" 分支
5. 点击 "Run workflow" 确认
6. 等待2-3分钟完成部署

### 方案2: 推送代码触发自动部署

```bash
# 如果有未提交的更改
git add .
git commit -m "触发部署"
git push origin main
```

### 方案3: 手动同步文件（快速但不推荐）

```bash
# 使用SCP直接上传文件
scp -r XMGamer/frontend/* root@149.88.69.87:/var/www/FrameWorker/XMGamer/frontend/

# 重启Docker容器
ssh root@149.88.69.87 "docker restart xmgamer-gateway"
```

### 方案4: 使用部署脚本（如果服务器是git仓库）

**注意：当前服务器不是git仓库，此方案不适用！**

如果要改为git方式部署，需要：
```bash
# 在服务器上
cd /var/www
rm -rf FrameWorker
git clone https://github.com/rissalith/FrameWorker.git
```

## 预防措施

### 1. 确保GitHub Actions正常运行

- 定期检查Actions页面
- 设置部署失败通知
- 查看部署日志

### 2. 使用版本号管理缓存

在HTML中添加版本号：
```html
<link rel="stylesheet" href="css/auth.css?v=20251128">
<script src="js/login.js?v=20251128"></script>
```

每次更新时修改版本号。

### 3. 部署后验证

```bash
# 检查文件时间戳
ssh root@149.88.69.87 "stat /var/www/FrameWorker/XMGamer/frontend/login.html"

# 检查容器状态
ssh root@149.88.69.87 "docker ps"

# 测试网站访问
curl -I https://your-domain.com/platform/login.html
```

## 快速检查清单

- [ ] GitHub Actions最近一次运行成功了吗？
- [ ] 本地代码已经推送到GitHub了吗？
- [ ] 服务器文件的修改时间是最近的吗？
- [ ] Docker容器已经重启了吗？
- [ ] 浏览器缓存已经清除了吗？（Ctrl+Shift+R）
- [ ] CSS/JS文件的版本号更新了吗？

## 相关文件

- 部署配置：`.github/workflows/deploy.yml`
- 部署文档：`DEPLOYMENT.md`
- 改进说明：`DEPLOYMENT_IMPROVEMENTS.md`
- 更新脚本：`XMGamer/update-server.sh`

## 联系方式

如果问题仍未解决，请：
1. 查看GitHub Actions日志
2. 检查服务器日志：`docker logs xmgamer-gateway`
3. 提交Issue到GitHub仓库