"""
数据库模型定义
使用 SQLAlchemy ORM 定义所有数据表
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# 创建基类
Base = declarative_base()


class User(Base):
    """用户表"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255))
    nickname = Column(String(50))
    avatar_url = Column(String(255))
    wechat_openid = Column(String(100), unique=True, index=True)
    wechat_unionid = Column(String(100))
    oauth_provider = Column(String(20), index=True)  # google, wechat, etc.
    oauth_id = Column(String(255), index=True)  # OAuth提供商的用户ID
    status = Column(String(20), default='active', index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime)
    
    # 关系
    sessions = relationship('Session', back_populates='user', cascade='all, delete-orphan')
    history = relationship('GenerationHistory', back_populates='user', cascade='all, delete-orphan')
    quota = relationship('UserQuota', back_populates='user', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'phone': self.phone,
            'email': self.email,
            'nickname': self.nickname,
            'avatar_url': self.avatar_url,
            'oauth_provider': self.oauth_provider,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at is not None else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at is not None else None
        }


class Session(Base):
    """会话表"""
    __tablename__ = 'sessions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    token = Column(String(500), nullable=False, index=True)
    device_info = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime)
    
    # 关系
    user = relationship('User', back_populates='sessions')


class SmsCode(Base):
    """短信验证码表"""
    __tablename__ = 'sms_codes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(20), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    purpose = Column(String(20), nullable=False)  # login, register, reset
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class EmailCode(Base):
    """邮箱验证码表"""
    __tablename__ = 'email_codes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    purpose = Column(String(20), nullable=False)  # login, register, reset
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class GenerationHistory(Base):
    """生成历史记录表"""
    __tablename__ = 'generation_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    model = Column(String(50), nullable=False, index=True)
    frame_count = Column(Integer, nullable=False)
    loop_consistency = Column(Boolean, default=False)
    tolerance = Column(Integer, default=50)
    sprite_url = Column(Text)
    raw_image_url = Column(Text)
    frames_data = Column(Text)  # JSON格式
    rows = Column(Integer)
    cols = Column(Integer)
    file_size = Column(Integer)
    generation_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship('User', back_populates='history')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prompt': self.prompt,
            'model': self.model,
            'frame_count': self.frame_count,
            'loop_consistency': self.loop_consistency,
            'tolerance': self.tolerance,
            'sprite_url': self.sprite_url,
            'raw_image_url': self.raw_image_url,
            'frames_data': self.frames_data,
            'rows': self.rows,
            'cols': self.cols,
            'file_size': self.file_size,
            'generation_time': self.generation_time,
            'created_at': self.created_at.isoformat() if self.created_at is not None else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at is not None else None
        }


class UserQuota(Base):
    """用户配额表"""
    __tablename__ = 'user_quotas'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    daily_limit = Column(Integer, default=10)
    daily_used = Column(Integer, default=0)
    total_used = Column(Integer, default=0)
    last_reset_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship('User', back_populates='quota')


class Wallet(Base):
    """用户钱包表"""
    __tablename__ = 'wallets'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    balance = Column(Integer, default=0)  # 当前余额（整数，避免浮点误差）
    frozen_balance = Column(Integer, default=0)  # 冻结余额
    total_recharged = Column(Integer, default=0)  # 累计充值
    total_consumed = Column(Integer, default=0)  # 累计消费
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship('User', backref='wallet', uselist=False)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'user_id': self.user_id,
            'balance': self.balance,
            'frozen_balance': self.frozen_balance,
            'total_recharged': self.total_recharged,
            'total_consumed': self.total_consumed,
            'created_at': self.created_at.isoformat() if self.created_at is not None else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at is not None else None
        }


class Transaction(Base):
    """交易流水表"""
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # 变动金额（+充值，-消费）
    type = Column(String(20), nullable=False, index=True)  # DEPOSIT/PURCHASE/REFUND/REWARD
    status = Column(String(20), default='pending', index=True)  # pending/completed/failed
    product_id = Column(String(50))  # 关联商品ID
    product_name = Column(String(100))  # 商品名称
    order_id = Column(String(50), unique=True, index=True)  # 订单号
    payment_method = Column(String(20))  # stripe/wechat/alipay
    payment_id = Column(String(100))  # 第三方支付ID
    balance_before = Column(Integer, nullable=False)  # 变动前余额
    balance_after = Column(Integer, nullable=False)  # 变动后余额
    description = Column(Text)  # 描述
    extra_data = Column(Text)  # JSON 元数据（避免使用metadata保留字）
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime)
    
    # 关系
    user = relationship('User', backref='transactions')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'type': self.type,
            'status': self.status,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'order_id': self.order_id,
            'payment_method': self.payment_method,
            'balance_before': self.balance_before,
            'balance_after': self.balance_after,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at is not None else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at is not None else None
        }


class Product(Base):
    """商品表"""
    __tablename__ = 'products'
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(20), nullable=False, index=True)  # game/feature/package/recharge
    game_id = Column(String(50), index=True)  # 关联游戏ID
    price = Column(Integer, nullable=False)  # 点数价格
    price_cny = Column(Float)  # 人民币价格（充值套餐用）
    duration_days = Column(Integer)  # 租赁天数（NULL=永久）
    features = Column(Text)  # JSON: 包含的功能
    is_active = Column(Boolean, default=True, index=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典"""
        import json
        # 类型注释帮助Pylance理解这是字符串值
        features_str: str = self.features  # type: ignore
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'game_id': self.game_id,
            'price': self.price,
            'price_cny': self.price_cny,
            'duration_days': self.duration_days,
            'features': json.loads(features_str) if features_str else [],
            'is_active': self.is_active,
            'sort_order': self.sort_order
        }


class License(Base):
    """游戏授权表（新版）"""
    __tablename__ = 'licenses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    game_id = Column(String(50), nullable=False, index=True)
    license_type = Column(String(20), nullable=False)  # rental/permanent
    plan = Column(String(20), default='basic')  # basic/pro/premium
    features = Column(Text)  # JSON: ["no_watermark", "ai_enabled"]
    purchased_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, index=True)  # NULL = 永久
    auto_renew = Column(Boolean, default=False)
    transaction_id = Column(Integer, ForeignKey('transactions.id'))
    status = Column(String(20), default='active', index=True)  # active/expired/revoked
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship('User', backref='licenses')
    transaction = relationship('Transaction', backref='licenses')
    
    def to_dict(self):
        """转换为字典"""
        import json
        # 类型注释帮助Pylance理解这是字符串值
        features_str: str = self.features  # type: ignore
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'license_type': self.license_type,
            'plan': self.plan,
            'features': json.loads(features_str) if features_str else [],
            'purchased_at': self.purchased_at.isoformat() if self.purchased_at is not None else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at is not None else None,
            'auto_renew': self.auto_renew,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at is not None else None
        }


class GameLicense(Base):
    """游戏授权表（旧版，保持兼容）"""
    __tablename__ = 'game_licenses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    game_id = Column(String(50), nullable=False, index=True)
    plan = Column(String(20), default='free')  # free, pro, premium
    expires_at = Column(DateTime)  # None表示永久
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship('User', backref='game_licenses')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'plan': self.plan,
            'expires_at': self.expires_at.isoformat() if self.expires_at is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at is not None else None
        }


class GameLaunch(Base):
    """游戏启动记录表"""
    __tablename__ = 'game_launches'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    game_id = Column(String(50), nullable=False, index=True)
    token_hash = Column(String(64))  # Token的SHA256哈希
    ip_address = Column(String(50))
    user_agent = Column(Text)
    launched_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 关系
    user = relationship('User', backref='game_launches')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'ip_address': self.ip_address,
            'launched_at': self.launched_at.isoformat() if self.launched_at is not None else None
        }


# 数据库配置
# 使用持久化目录存储SQLite数据库
# 本地开发时使用相对路径，Docker容器内使用绝对路径
if os.getenv('FLASK_ENV') == 'production':
    # 生产环境（Docker容器内）
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:////app/data/frameworker.db')
else:
    # 本地开发环境
    db_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, 'frameworker.db')
    DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')

# 创建引擎
engine = create_engine(
    DATABASE_URL,
    echo=False,  # 设置为True可以看到SQL语句
    pool_pre_ping=True,  # 连接池预检查
    pool_recycle=3600  # 连接回收时间（秒）
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """初始化数据库，创建所有表"""
    print('正在初始化数据库...')
    Base.metadata.create_all(bind=engine)
    print('[OK] 数据库初始化完成!')
    print(f'   数据库位置: {DATABASE_URL}')
    print(f'   创建的表: users, sessions, sms_codes, email_codes, generation_history, user_quotas')
    print(f'   点数系统表: wallets, transactions, products, licenses')
    print(f'   游戏相关表: game_licenses, game_launches')


# 自动初始化数据库（如果不存在）
try:
    # 检查数据库是否存在
    if 'sqlite' in DATABASE_URL:
        db_path = DATABASE_URL.replace('sqlite:///', '')
        if not os.path.exists(db_path):
            print(f'[INFO] 数据库文件不存在，正在创建: {db_path}')
            init_db()
    else:
        # 对于非SQLite数据库，尝试创建表
        Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f'[WARNING] 自动初始化数据库失败: {e}')


def get_db():
    """获取数据库会话（用于依赖注入）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session():
    """获取数据库会话（直接使用）"""
    return SessionLocal()


if __name__ == '__main__':
    # 直接运行此文件时初始化数据库
    init_db()