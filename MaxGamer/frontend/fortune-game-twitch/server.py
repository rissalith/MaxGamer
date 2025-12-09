#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP Server with correct MIME types for ES Modules
"""
import http.server
import socketserver
import mimetypes
import os
import sys

# 设置标准输出编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 确保 .js 文件的 MIME 类型正确
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')

PORT = 8888

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加 CORS 头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def guess_type(self, path):
        """覆盖 guess_type 方法以确保正确的 MIME 类型"""
        base, ext = os.path.splitext(path)
        if ext in ('.js', '.mjs'):
            return 'application/javascript'
        return super().guess_type(path)

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"[OK] Server running at: http://127.0.0.1:{PORT}")
    print(f"[DIR] Serving directory: {os.getcwd()}")
    print(f"[GAME] Open browser: http://localhost:{PORT}")
    print("Press Ctrl+C to stop server\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped")
