#!/bin/bash

echo "========================================"
echo "  FrameWorker Python 后端启动脚本"
echo "========================================"
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到Python3，请先安装Python"
    exit 1
fi

# 检查依赖是否安装
echo "[1/3] 检查依赖..."
python3 -c "import flask" &> /dev/null
if [ $? -ne 0 ]; then
    echo "[提示] 正在安装依赖..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        exit 1
    fi
fi

# 检查.env文件
echo "[2/3] 检查配置..."
if [ ! -f .env ]; then
    echo "[警告] 未找到.env文件，将使用.env.example"
    cp .env.example .env
fi

# 启动服务器
echo "[3/3] 启动服务器..."
echo ""
python3 app.py