"""
MaxGamer V1.0 初始数据初始化脚本
创建充值套餐和示例游戏数据
"""

import sys
import os
import json

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db_session, init_db, Game, Product, User


def init_recharge_packages():
    """初始化充值套餐"""
    packages = [
        {
            'id': 'recharge_1000',
            'name': '入门套餐',
            'description': '1,000 MaxPoints，适合新手体验',
            'category': 'recharge',
            'price': 1000,
            'price_cny': 10.00,
            'is_active': True,
            'sort_order': 1
        },
        {
            'id': 'recharge_5500',
            'name': '超值套餐',
            'description': '5,500 MaxPoints，性价比之选',
            'category': 'recharge',
            'price': 5500,
            'price_cny': 50.00,
            'is_active': True,
            'sort_order': 2
        },
        {
            'id': 'recharge_12000',
            'name': '豪华套餐',
            'description': '12,000 MaxPoints，20%额外赠送',
            'category': 'recharge',
            'price': 12000,
            'price_cny': 100.00,
            'is_active': True,
            'sort_order': 3
        },
        {
            'id': 'recharge_65000',
            'name': '至尊套餐',
            'description': '65,000 MaxPoints，30%额外赠送',
            'category': 'recharge',
            'price': 65000,
            'price_cny': 500.00,
            'is_active': True,
            'sort_order': 4
        }
    ]
    
    db = get_db_session()
    try:
        for pkg_data in packages:
            existing = db.query(Product).filter(Product.id == pkg_data['id']).first()
            if existing:
                # 更新现有记录
                for key, value in pkg_data.items():
                    setattr(existing, key, value)
                print(f'  [更新] {pkg_data["name"]}')
            else:
                # 创建新记录
                product = Product(**pkg_data)
                db.add(product)
                print(f'  [创建] {pkg_data["name"]}')
        
        db.commit()
        print('[OK] 充值套餐初始化完成')
        
    finally:
        db.close()


def init_games():
    """初始化游戏数据"""
    games = [
        {
            'id': 'fortune-game',
            'name': '巫女占卜',
            'cover_url': '/fortune-game/images/cover.jpg',
            'description': 'AI驱动的直播互动占卜游戏，观众可以通过弹幕或礼物触发占卜',
            'price': 500,
            'duration_days': 30,
            'status': 'published',
            'category': '直播互动',
            'tags': json.dumps(['AI', '占卜', '直播互动', 'OBS']),
            'sort_order': 1
        }
    ]
    
    db = get_db_session()
    try:
        for game_data in games:
            existing = db.query(Game).filter(Game.id == game_data['id']).first()
            if existing:
                # 更新现有记录
                for key, value in game_data.items():
                    setattr(existing, key, value)
                print(f'  [更新] {game_data["name"]}')
            else:
                # 创建新记录
                game = Game(**game_data)
                db.add(game)
                print(f'  [创建] {game_data["name"]}')
        
        db.commit()
        print('[OK] 游戏数据初始化完成')
        
    finally:
        db.close()


def init_game_products():
    """初始化游戏商品（租赁套餐）"""
    products = [
        {
            'id': 'fortune_30d',
            'name': '巫女占卜 - 月度版',
            'description': '30天使用权限，包含所有基础功能',
            'category': 'game',
            'game_id': 'fortune-game',
            'price': 500,
            'duration_days': 30,
            'features': json.dumps(['基础占卜', '直播互动', 'OBS集成']),
            'is_active': True,
            'sort_order': 1
        },
        {
            'id': 'fortune_90d',
            'name': '巫女占卜 - 季度版',
            'description': '90天使用权限，享受9折优惠',
            'category': 'game',
            'game_id': 'fortune-game',
            'price': 1350,  # 原价 1500，9折
            'duration_days': 90,
            'features': json.dumps(['基础占卜', '直播互动', 'OBS集成', '优先客服']),
            'is_active': True,
            'sort_order': 2
        },
        {
            'id': 'fortune_365d',
            'name': '巫女占卜 - 年度版',
            'description': '365天使用权限，享受7折优惠',
            'category': 'game',
            'game_id': 'fortune-game',
            'price': 4200,  # 原价 6000，7折
            'duration_days': 365,
            'features': json.dumps(['基础占卜', '直播互动', 'OBS集成', '优先客服', '专属定制']),
            'is_active': True,
            'sort_order': 3
        },
        {
            'id': 'fortune_permanent',
            'name': '巫女占卜 - 永久版',
            'description': '永久使用权限，一次购买终身使用',
            'category': 'game',
            'game_id': 'fortune-game',
            'price': 9999,
            'duration_days': None,  # 永久
            'features': json.dumps(['基础占卜', '直播互动', 'OBS集成', '优先客服', '专属定制', '免费升级']),
            'is_active': True,
            'sort_order': 4
        }
    ]
    
    db = get_db_session()
    try:
        for prod_data in products:
            existing = db.query(Product).filter(Product.id == prod_data['id']).first()
            if existing:
                for key, value in prod_data.items():
                    setattr(existing, key, value)
                print(f'  [更新] {prod_data["name"]}')
            else:
                product = Product(**prod_data)
                db.add(product)
                print(f'  [创建] {prod_data["name"]}')
        
        db.commit()
        print('[OK] 游戏商品初始化完成')
        
    finally:
        db.close()


def create_admin_user(email='admin@maxgamer.com', password='admin123'):
    """创建管理员账号"""
    from utils.password_helper import hash_password
    
    db = get_db_session()
    try:
        # 检查是否已存在
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            # 更新为管理员
            existing.role = 'admin'
            existing.balance = 99999  # 给管理员充足的测试余额
            db.commit()
            print(f'  [更新] 已将 {email} 设为管理员')
        else:
            # 创建新管理员
            admin = User(
                email=email,
                password_hash=hash_password(password),
                nickname='管理员',
                role='admin',
                balance=99999,
                status='active'
            )
            db.add(admin)
            db.commit()
            print(f'  [创建] 管理员账号 {email}')
        
        print('[OK] 管理员账号初始化完成')
        print(f'     邮箱: {email}')
        print(f'     密码: {password}')
        
    finally:
        db.close()


def main():
    """主函数"""
    print('=' * 50)
    print('MaxGamer V1.0 数据初始化')
    print('=' * 50)
    
    # 确保数据库表已创建
    print('\n[1/5] 初始化数据库表...')
    init_db()
    
    # 初始化充值套餐
    print('\n[2/5] 初始化充值套餐...')
    init_recharge_packages()
    
    # 初始化游戏数据
    print('\n[3/5] 初始化游戏数据...')
    init_games()
    
    # 初始化游戏商品
    print('\n[4/5] 初始化游戏商品...')
    init_game_products()
    
    # 创建管理员账号
    print('\n[5/5] 初始化管理员账号...')
    create_admin_user()
    
    print('\n' + '=' * 50)
    print('MaxGamer V1.0 数据初始化完成!')
    print('=' * 50)
    print('\n下一步:')
    print('  1. 启动后端服务: python start.py')
    print('  2. 访问前端页面: http://localhost:5000')
    print('  3. 使用管理员账号登录测试')


if __name__ == '__main__':
    main()


