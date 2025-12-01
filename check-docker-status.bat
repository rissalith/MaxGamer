@echo off
chcp 65001 >nul
echo ==========================================
echo 检查 Docker 容器状态
echo ==========================================
echo.

set SERVER=root@149.88.69.87

echo 正在连接服务器检查 Docker 状态...
echo.

ssh %SERVER% "bash -s" << 'ENDSSH'
#!/bin/bash

echo "=========================================="
echo "Docker 容器详细状态"
echo "=========================================="
echo ""

echo "1. 所有运行中的容器:"
echo "-------------------------------------------"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "2. 检查 xmgamer 相关容器:"
echo "-------------------------------------------"
docker ps -a | grep xmgamer || echo "未找到 xmgamer 容器"
echo ""

echo "3. 容器详细信息:"
echo "-------------------------------------------"
if docker ps | grep -q xmgamer-gateway; then
    echo "✅ xmgamer-gateway 正在运行"
    docker inspect xmgamer-gateway --format='挂载: {{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
else
    echo "❌ xmgamer-gateway 未运行"
fi
echo ""

if docker ps | grep -q xmgamer-api; then
    echo "✅ xmgamer-api 正在运行"
    docker inspect xmgamer-api --format='挂载: {{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
else
    echo "❌ xmgamer-api 未运行"
fi
echo ""

echo "4. 检查挂载的文件:"
echo "-------------------------------------------"
echo "前端文件 (应该被 xmgamer-gateway 挂载):"
ls -lh /var/www/FrameWorker/XMGamer/frontend/login.html 2>/dev/null || echo "文件不存在"
echo ""

echo "5. 测试容器重启命令:"
echo "-------------------------------------------"
echo "尝试重启 xmgamer-gateway..."
if docker restart xmgamer-gateway 2>&1; then
    echo "✅ 重启成功"
else
    echo "❌ 重启失败"
fi
echo ""

echo "等待容器启动..."
sleep 3
echo ""

echo "6. 重启后的容器状态:"
echo "-------------------------------------------"
docker ps | grep xmgamer
echo ""

echo "=========================================="
echo "检查完成"
echo "=========================================="
ENDSSH

echo.
echo ==========================================
echo 分析结果
echo ==========================================
echo.
echo 请查看上面的输出，特别注意:
echo.
echo [关键点1] 容器是否正在运行?
echo   - 如果显示 "未运行"，说明容器没有启动
echo.
echo [关键点2] 文件挂载路径是否正确?
echo   - 应该挂载 /var/www/FrameWorker/XMGamer/frontend
echo.
echo [关键点3] 重启命令是否成功?
echo   - 如果显示 "重启失败"，说明有权限或配置问题
echo.
echo [关键点4] 容器重启后状态如何?
echo   - 应该显示容器正在运行
echo.
echo ==========================================
echo.
pause