"""
MaxGamer V1.0 数据库迁移脚本
为现有数据库添加新字段
"""

import sqlite3
import os
import sys

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'frameworker.db')

# 如果 data 目录下没有，尝试当前目录
if not os.path.exists(DB_PATH):
    DB_PATH = os.path.join(os.path.dirname(__file__), 'frameworker.db')


def get_existing_columns(cursor, table_name):
    """获取表的现有列"""
    cursor.execute(f"PRAGMA table_info({table_name})")
    return [row[1] for row in cursor.fetchall()]


def add_column_if_not_exists(cursor, table_name, column_name, column_def):
    """如果列不存在则添加"""
    existing_columns = get_existing_columns(cursor, table_name)
    
    if column_name not in existing_columns:
        sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}"
        cursor.execute(sql)
        print(f"  [添加] {table_name}.{column_name}")
        return True
    else:
        print(f"  [跳过] {table_name}.{column_name} (已存在)")
        return False


def create_table_if_not_exists(cursor, table_name, create_sql):
    """如果表不存在则创建"""
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    if cursor.fetchone() is None:
        cursor.execute(create_sql)
        print(f"  [创建] 表 {table_name}")
        return True
    else:
        print(f"  [跳过] 表 {table_name} (已存在)")
        return False


def migrate():
    """执行迁移"""
    print('=' * 50)
    print('MaxGamer V1.0 数据库迁移')
    print('=' * 50)
    
    if not os.path.exists(DB_PATH):
        print(f'\n[错误] 数据库文件不存在: {DB_PATH}')
        print('[提示] 请先运行 init_maxgamer_data.py 初始化数据库')
        return False
    
    print(f'\n数据库路径: {DB_PATH}')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 1. 为 users 表添加新字段
        print('\n[1/3] 迁移 users 表...')
        add_column_if_not_exists(cursor, 'users', 'role', "VARCHAR(20) DEFAULT 'user'")
        add_column_if_not_exists(cursor, 'users', 'balance', "INTEGER DEFAULT 0")
        
        # 2. 为 licenses 表添加 config_json 字段
        print('\n[2/3] 迁移 licenses 表...')
        add_column_if_not_exists(cursor, 'licenses', 'config_json', "TEXT")
        
        # 3. 创建 games 表
        print('\n[3/3] 创建 games 表...')
        create_table_if_not_exists(cursor, 'games', '''
            CREATE TABLE games (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                cover_url VARCHAR(255),
                description TEXT,
                price INTEGER DEFAULT 0,
                duration_days INTEGER DEFAULT 30,
                status VARCHAR(20) DEFAULT 'draft',
                category VARCHAR(50),
                tags TEXT,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 提交更改
        conn.commit()
        
        print('\n' + '=' * 50)
        print('[OK] 数据库迁移完成!')
        print('=' * 50)
        
        # 显示现有用户
        cursor.execute("SELECT id, email, nickname, role, balance FROM users LIMIT 5")
        users = cursor.fetchall()
        if users:
            print('\n现有用户:')
            for user in users:
                print(f'  - ID:{user[0]}, Email:{user[1]}, Role:{user[3]}, Balance:{user[4]}')
        
        return True
        
    except Exception as e:
        print(f'\n[错误] 迁移失败: {e}')
        conn.rollback()
        return False
        
    finally:
        conn.close()


def set_admin(email):
    """将指定用户设为管理员"""
    if not os.path.exists(DB_PATH):
        print(f'[错误] 数据库文件不存在: {DB_PATH}')
        return False
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("UPDATE users SET role = 'admin', balance = 99999 WHERE email = ?", (email,))
        if cursor.rowcount > 0:
            conn.commit()
            print(f'[OK] 已将 {email} 设为管理员')
            return True
        else:
            print(f'[警告] 未找到用户 {email}')
            return False
    finally:
        conn.close()


if __name__ == '__main__':
    success = migrate()
    
    if success:
        print('\n是否将当前用户设为管理员？')
        print('输入邮箱地址（直接回车跳过）: ', end='')
        
        try:
            email = input().strip()
            if email:
                set_admin(email)
        except:
            pass
    
    print('\n按回车键退出...')
    try:
        input()
    except:
        pass


