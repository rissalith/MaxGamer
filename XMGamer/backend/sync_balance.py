import sqlite3
conn = sqlite3.connect('data/frameworker.db')
cursor = conn.cursor()

# 获取用户ID和余额
cursor.execute("SELECT id, balance FROM users WHERE email='xanderpxw@gmail.com'")
user = cursor.fetchone()

if user:
    user_id, balance = user
    print(f"用户ID: {user_id}, 余额: {balance}")
    
    # 检查是否有钱包记录
    cursor.execute("SELECT id, balance FROM wallets WHERE user_id=?", (user_id,))
    wallet = cursor.fetchone()
    
    if wallet:
        # 更新钱包余额
        cursor.execute("UPDATE wallets SET balance=?, total_recharged=? WHERE user_id=?", (balance, balance, user_id))
        print(f"已更新钱包余额: {balance}")
    else:
        # 创建钱包记录
        cursor.execute("INSERT INTO wallets (user_id, balance, total_recharged, total_consumed, frozen_balance) VALUES (?, ?, ?, 0, 0)", (user_id, balance, balance))
        print(f"已创建钱包，余额: {balance}")
    
    conn.commit()
    print("同步完成！")
else:
    print("未找到用户")

conn.close()


