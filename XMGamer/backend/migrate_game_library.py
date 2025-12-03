"""
游戏库系统数据库迁移脚本
添加 MaxGamer 游戏库所需的新字段
"""

import sqlite3
import os

def migrate():
    """执行数据库迁移"""
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'frameworker.db')
    
    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 获取 games 表的现有列
        cursor.execute("PRAGMA table_info(games)")
        existing_columns = {col[1] for col in cursor.fetchall()}
        print(f"现有列: {existing_columns}")
        
        # 需要添加的新列
        new_columns = [
            ("version", "VARCHAR(20)"),
            ("engine", "VARCHAR(20) DEFAULT 'HTML5'"),
            ("name_display", "VARCHAR(100)"),
            ("index_url", "VARCHAR(255)"),
            ("icon_url", "VARCHAR(255)"),
            ("actions_schema", "TEXT"),
            ("tech_config", "TEXT"),
        ]
        
        for col_name, col_type in new_columns:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE games ADD COLUMN {col_name} {col_type}")
                    print(f"✅ 添加列: {col_name}")
                except sqlite3.OperationalError as e:
                    print(f"⚠️ 添加列 {col_name} 失败: {e}")
            else:
                print(f"⏭️ 列已存在: {col_name}")
        
        conn.commit()
        print("\n✅ 数据库迁移完成!")
        return True
        
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()


