import sqlite3
conn = sqlite3.connect('data/frameworker.db')
conn.execute("UPDATE users SET role='admin', balance=99999 WHERE email='xanderpxw@gmail.com'")
conn.commit()
print('已将 xanderpxw@gmail.com 设为管理员，余额 99999 MP')
conn.close()


