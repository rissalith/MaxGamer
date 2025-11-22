#!/usr/bin/env python3
"""
FrameWorker Python 后端启动脚本
"""
import sys
import os

# 确保可以导入 app 模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, PORT

if __name__ == '__main__':
    print(f'✓ FrameWorker Python 后端启动在端口 {PORT}')
    print(f'✓ 访问 http://localhost:{PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)