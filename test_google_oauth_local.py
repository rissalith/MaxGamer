"""
测试本地Google OAuth配置
"""
import os
import sys

# 添加backend目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'XMGamer', 'backend'))

from dotenv import load_dotenv

# 加载环境变量
env_path = os.path.join(os.path.dirname(__file__), 'XMGamer', 'backend', '.env')
load_dotenv(env_path)

print("=" * 60)
print("Google OAuth 配置检查")
print("=" * 60)

# 检查环境变量
client_id = os.getenv('GOOGLE_CLIENT_ID')
client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

print(f"\n✓ GOOGLE_CLIENT_ID: {client_id[:20]}..." if client_id else "✗ GOOGLE_CLIENT_ID: 未设置")
print(f"✓ GOOGLE_CLIENT_SECRET: {client_secret[:10]}..." if client_secret else "✗ GOOGLE_CLIENT_SECRET: 未设置")

# 检查数据库连接
try:
    from database import get_db_session, User
    db = get_db_session()
    user_count = db.query(User).count()
    print(f"\n✓ 数据库连接成功")
    print(f"  当前用户数: {user_count}")
    db.close()
except Exception as e:
    print(f"\n✗ 数据库连接失败: {e}")

# 检查必要的模块
print("\n模块检查:")
try:
    import requests
    print("✓ requests 模块已安装")
except:
    print("✗ requests 模块未安装")

try:
    from flask import Flask
    print("✓ flask 模块已安装")
except:
    print("✗ flask 模块未安装")

print("\n" + "=" * 60)
print("配置检查完成")
print("=" * 60)