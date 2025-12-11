# 🚨 安全事件响应报告

**日期**: 2025-12-11
**严重程度**: 🔴 HIGH
**状态**: ⚠️ 需要立即处理

---

## 📋 事件摘要

GitGuardian 检测到 OpenSSH 私钥在公开 GitHub 仓库中暴露。

### 受影响信息

- **密钥类型**: OpenSSH Private Key (ED25519)
- **仓库**: rissalith/FrameWorker
- **暴露提交**: 791cc8bf379dc0fe64d8d069f310757739c1b0ad
- **推送时间**: 2025-12-11 02:38:53 UTC
- **当前状态**: 文件已删除，但仍存在于Git历史中

---

## ✅ 已完成的补救措施

1. ✅ **文件已删除** - 提交 `cb1655f` 已从工作目录删除敏感文件
2. ✅ **.gitignore 已更新** - 添加了密钥文件的忽略规则
3. ✅ **测试套件已添加** - 确保后续CI/CD正常运行

---

## 🔥 立即需要执行的措施

### 1. 废除暴露的SSH密钥 ⚡ **最高优先级**

**在服务器上执行：**

```bash
# 1. 备份当前的 authorized_keys
cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup

# 2. 删除暴露的公钥
# 找到并删除以 "github-actions-maxgamer" 结尾的行
nano ~/.ssh/authorized_keys  # 或使用 vim

# 3. 验证删除
cat ~/.ssh/authorized_keys | grep "github-actions"
# 应该没有输出
```

### 2. 生成新的SSH密钥对

**在本地安全环境执行：**

```bash
# 生成新的 ED25519 密钥对
ssh-keygen -t ed25519 -C "github-actions-maxgamer-new" -f ~/.ssh/maxgamer_deploy_new

# 这将生成两个文件：
# - maxgamer_deploy_new (私钥 - 保密！)
# - maxgamer_deploy_new.pub (公钥 - 可以分享)
```

### 3. 更新GitHub Secrets

**访问**: https://github.com/rissalith/FrameWorker/settings/secrets/actions

1. 删除旧的 `SSH_PRIVATE_KEY`
2. 添加新的 `SSH_PRIVATE_KEY`:
   ```bash
   # 复制新私钥内容
   cat ~/.ssh/maxgamer_deploy_new
   ```
3. 完整复制私钥内容（包括 BEGIN 和 END 行）

### 4. 在服务器上添加新公钥

```bash
# 在服务器上执行
echo "ssh-ed25519 AAAA... github-actions-maxgamer-new" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 5. 测试新密钥

```bash
# 在本地测试（使用新密钥）
ssh -i ~/.ssh/maxgamer_deploy_new your-user@your-server

# 如果连接成功，说明新密钥配置正确
```

---

## 🧹 清理Git历史（可选但推荐）

⚠️ **警告**: 这会重写Git历史，需要force push

### 方案A: 使用 BFG Repo-Cleaner（推荐）

```bash
# 1. 下载 BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. 创建仓库镜像
git clone --mirror https://github.com/rissalith/FrameWorker.git

# 3. 使用 BFG 删除敏感文件
java -jar bfg.jar --delete-files "GITHUB_ACTIONS_CONFIG.md" FrameWorker.git
java -jar bfg.jar --delete-files "GITHUB_SECRETS_COMPLETE.md" FrameWorker.git

# 4. 清理和推送
cd FrameWorker.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 方案B: 使用 git filter-branch

```bash
# 从Git历史中移除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch GITHUB_ACTIONS_CONFIG.md" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送
git push origin --force --all
git push origin --force --tags
```

### 方案C: 简单方案 - 创建新分支

如果数据不多，可以考虑：

1. 创建新的干净分支
2. 只包含最新的干净代码
3. 删除旧的main分支
4. 重命名新分支为main

---

## 📊 验证清理结果

### 1. 检查本地仓库

```bash
# 确认敏感文件已从历史中移除
git log --all --full-history -- GITHUB_ACTIONS_CONFIG.md
# 应该没有输出

# 搜索私钥字符串
git grep -i "BEGIN OPENSSH PRIVATE KEY" $(git rev-list --all)
# 应该没有输出
```

### 2. 使用 GitGuardian 重新扫描

访问: https://www.gitguardian.com/

上传仓库重新扫描，确认已修复。

---

## 📝 事后分析

### 根本原因

1. 在文档中直接包含了真实的SSH私钥
2. 未使用 .gitignore 阻止敏感文件提交
3. 未在提交前进行密钥扫描

### 预防措施

1. ✅ **已添加** .gitignore 规则防止密钥文件
2. ✅ **建议安装** pre-commit hook 进行密钥检测：

```bash
# 安装 git-secrets
# macOS: brew install git-secrets
# Ubuntu: git clone https://github.com/awslabs/git-secrets.git && cd git-secrets && sudo make install

# 初始化
cd /path/to/MaxGamer
git secrets --install
git secrets --register-aws
git secrets --add 'BEGIN.*PRIVATE KEY'
```

3. ✅ **使用GitHub Secret扫描**：
   - GitHub Secret scanning 已自动启用
   - 收到邮件时立即响应

---

## 🎯 行动清单

完成以下所有步骤后，此事件即可关闭：

- [ ] 在服务器上删除暴露的公钥
- [ ] 生成新的SSH密钥对
- [ ] 更新GitHub Secrets中的SSH_PRIVATE_KEY
- [ ] 在服务器上添加新公钥
- [ ] 测试新密钥连接
- [ ] （可选）清理Git历史
- [ ] 验证清理结果
- [ ] 安装 git-secrets 或类似工具
- [ ] 在GitGuardian标记为已解决
- [ ] 删除本地的旧私钥文件

---

## 📞 相关链接

- **GitGuardian Alert**: 查看您的邮件
- **GitHub Secrets**: https://github.com/rissalith/FrameWorker/settings/secrets/actions
- **BFG Repo-Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/
- **git-secrets**: https://github.com/awslabs/git-secrets

---

## 🔒 安全最佳实践

1. **永远不要提交密钥到Git** - 使用环境变量或secrets管理
2. **定期轮换密钥** - 建议每3-6个月更换一次
3. **使用专用密钥** - 每个服务使用不同的密钥
4. **启用2FA** - GitHub、服务器等所有关键服务
5. **监控异常活动** - 定期检查服务器访问日志

---

**报告生成时间**: 2025-12-11
**状态更新**: 将在完成所有补救措施后更新
