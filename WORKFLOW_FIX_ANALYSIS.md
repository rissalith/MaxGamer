# ❌ GitHub Actions Workflow 失败分析

## 问题确认

从GitHub Actions日志可以看到:
- ✅ Deploy to Server job **执行了**
- ❌ Build and Push Docker Images job **没有执行**
- ❌ Docker镜像不存在导致部署失败

## 错误日志

```
err: Error response from daemon: no matching manifest for linux/amd64 in the manifest list entries: 
failed to resolve reference "ghcr.io/rissalith/xmgamer-platform-api:latest": 
ghcr.io/rissalith/xmgamer-platform-api:latest: not found
```

```
out: 容器运行状态：
out: NAME      IMAGE     COMMAND   SERVICE   CREATED   STATUS    PORTS
```

**所有容器都没有启动!**

## 根本原因

查看 `.github/workflows/deploy.yml`:

### Build Job (第15-64行)
```yaml
build-and-push:
  name: Build and Push Docker Images
  runs-on: ubuntu-latest
  permissions:
    contents: read
    packages: write
  
  strategy:
    fail-fast: false
    matrix:
      service:
        - name: platform-api
          context: ./XMGamer
          dockerfile: ./XMGamer/Dockerfile
```

**没有任何条件限制,应该执行!**

### Deploy Job (第65-309行)
```yaml
deploy:
  name: Deploy to Server
  needs: build-and-push
  runs-on: ubuntu-latest
  if: needs.build-and-push.result == 'success' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
```

**依赖build-and-push,但build job没执行!**

## 可能的原因

### 1. GitHub Actions权限问题
- `GITHUB_TOKEN` 可能没有 `packages: write` 权限
- 需要在仓库设置中启用

### 2. Workflow文件语法问题
- Matrix strategy可能有问题
- 需要简化配置

### 3. 之前的失败导致job被跳过
- GitHub Actions可能缓存了失败状态
- 需要清除缓存或重命名job

## 解决方案

### 方案1: 简化Workflow (推荐)

移除matrix strategy,直接构建:

```yaml
build-and-push:
  name: Build and Push Docker Images
  runs-on: ubuntu-latest
  permissions:
    contents: read
    packages: write
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./XMGamer
        file: ./XMGamer/Dockerfile
        push: true
        tags: |
          ghcr.io/${{ github.repository_owner }}/xmgamer-platform-api:latest
          ghcr.io/${{ github.repository_owner }}/xmgamer-platform-api:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

### 方案2: 检查GitHub仓库设置

1. 访问: https://github.com/rissalith/FrameWorker/settings/actions
2. 确保 "Workflow permissions" 设置为:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 方案3: 手动触发workflow_dispatch

在GitHub Actions页面手动触发workflow,查看详细日志

### 方案4: 本地构建并推送 (临时方案)

```bash
# 本地构建镜像
cd XMGamer
docker build -t ghcr.io/rissalith/xmgamer-platform-api:latest .

# 登录GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u rissalith --password-stdin

# 推送镜像
docker push ghcr.io/rissalith/xmgamer-platform-api:latest
```

### 方案5: 使用中国镜像方案

如果GitHub Container Registry访问有问题,使用服务器本地构建:

参考: `fix-server-china-mirror.bat`

## 立即行动

### 选项A: 修复Workflow文件
1. 简化build-and-push job配置
2. 移除matrix strategy
3. 推送更改并重新触发

### 选项B: 服务器本地构建 (最快)
1. SSH到服务器
2. 执行 `fix-server-china-mirror.bat` 中的命令
3. 本地构建Docker镜像
4. 启动服务

### 选项C: 检查GitHub设置
1. 确认Actions权限
2. 确认GITHUB_TOKEN权限
3. 重新触发workflow

## 推荐方案

**立即使用选项B (服务器本地构建)**,因为:
1. 最快恢复服务 (5分钟内)
2. 不依赖GitHub Actions
3. 避免网络问题

**然后修复选项A (Workflow文件)**,用于长期解决方案

## 验证步骤

修复后验证:
```bash
# 1. 检查镜像是否存在
docker images | grep xmgamer-platform-api

# 2. 检查容器是否运行
docker-compose -f docker-compose.prod.yml ps

# 3. 检查网站是否可访问
curl -I https://www.xmframer.com

# 4. 检查健康端点
curl https://www.xmframer.com/health
```

## 预防措施

1. **添加镜像存在性检查**:
   ```yaml
   - name: Check if image exists
     run: |
       if docker manifest inspect ghcr.io/${{ github.repository_owner }}/xmgamer-platform-api:latest > /dev/null 2>&1; then
         echo "✅ Image exists"
       else
         echo "❌ Image does not exist"
         exit 1
       fi
   ```

2. **添加构建状态通知**:
   ```yaml
   - name: Notify build status
     if: always()
     run: |
       if [ "${{ job.status }}" == "success" ]; then
         echo "✅ Build successful"
       else
         echo "❌ Build failed"
       fi
   ```

3. **添加自动回滚**:
   ```yaml
   - name: Rollback on failure
     if: failure()
     run: |
       echo "Rolling back to previous version..."
       # 回滚逻辑
   ```

---

**当前状态**: ❌ 服务器宕机,需要立即修复
**推荐行动**: 使用服务器本地构建方案 (fix-server-china-mirror.bat)
**预计时间**: 5-10分钟