"""
数据库模型定义
使用 SQLAlchemy ORM 定义所有数据表
"""

import os
from pathlib import Path
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# 在模块导入时加载 .env（确保环境变量在 database 模块中可用）
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)

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
    role = Column(String(20), default='user', index=True)  # 【核心】用户角色: 'user', 'creator' 或 'admin'
    balance = Column(Integer, default=0)  # 【核心】用户当前积分余额 (MaxPoints)
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
            'role': self.role,
            'balance': self.balance,
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


class Game(Base):
    """游戏商品表 - MaxGamer 游戏库系统"""
    __tablename__ = 'games'
    
    # 基础标识 (来自 manifest)
    id = Column(String(50), primary_key=True)  # 游戏唯一标识 (来自 manifest.id)
    version = Column(String(20))  # 当前版本 (来自 manifest.version)
    engine = Column(String(20), default='HTML5')  # 引擎类型
    
    # 创作者信息 - 用于游戏库隔离
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)  # 创作者用户ID
    
    # 运营数据 (平台控制)
    name = Column(String(100), nullable=False)  # 原始名称 (来自 manifest)
    name_display = Column(String(100))  # 展示名称 (可由运营修改)
    description = Column(Text)
    price = Column(Integer, default=0)  # 租赁价格 (MaxPoints)
    duration_days = Column(Integer, default=30)  # 租赁时长
    status = Column(String(20), default='draft', index=True)  # 'draft', 'published', 'offline'
    category = Column(String(50))  # 游戏分类
    tags = Column(Text)  # JSON: 标签列表
    sort_order = Column(Integer, default=0)
    
    # 资源链接 (自动生成)
    index_url = Column(String(255))  # 游戏入口 (index.html 地址)
    icon_url = Column(String(255))  # 图标地址
    cover_url = Column(String(255))  # 封面地址
    
    # 核心逻辑 (从 Manifest 解析)
    actions_schema = Column(Text)  # 【重点】动作定义列表 JSON，用于生成前端配置页
    tech_config = Column(Text)  # 技术参数 JSON (分辨率、透明开关)
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    creator = relationship('User', backref='created_games', foreign_keys=[creator_id])
    
    def to_dict(self):
        """转换为字典"""
        import json
        tags_str: str = self.tags  # type: ignore
        actions_str: str = self.actions_schema  # type: ignore
        tech_str: str = self.tech_config  # type: ignore
        return {
            'id': self.id,
            'version': self.version,
            'engine': self.engine,
            'creator_id': self.creator_id,
            'name': self.name,
            'name_display': self.name_display or self.name,
            'description': self.description,
            'price': self.price,
            'duration_days': self.duration_days,
            'status': self.status,
            'category': self.category,
            'tags': json.loads(tags_str) if tags_str else [],
            'sort_order': self.sort_order,
            'index_url': self.index_url,
            'icon_url': self.icon_url,
            'cover_url': self.cover_url,
            'actions_schema': json.loads(actions_str) if actions_str else [],
            'tech_config': json.loads(tech_str) if tech_str else {},
            'created_at': self.created_at.isoformat() if self.created_at is not None else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at is not None else None
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
    """游戏授权表（新版）- 对应蓝图中的 user_licenses"""
    __tablename__ = 'licenses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    game_id = Column(String(50), nullable=False, index=True)
    license_type = Column(String(20), nullable=False)  # rental/permanent
    plan = Column(String(20), default='basic')  # basic/pro/premium
    features = Column(Text)  # JSON: ["no_watermark", "ai_enabled"]
    config_json = Column(Text)  # 【核心】用户的个性化配置 (OBS链接参数, 触发词等)
    purchased_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, index=True)  # 【核心】过期时间。NULL = 永久
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
        config_str: str = self.config_json  # type: ignore
        
        # 计算剩余天数
        days_remaining = None
        if self.expires_at:
            from datetime import datetime
            delta = self.expires_at - datetime.utcnow()
            days_remaining = max(0, delta.days)
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'license_type': self.license_type,
            'plan': self.plan,
            'features': json.loads(features_str) if features_str else [],
            'config': json.loads(config_str) if config_str else {},
            'purchased_at': self.purchased_at.isoformat() if self.purchased_at is not None else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at is not None else None,
            'days_remaining': days_remaining,
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


class AdminLog(Base):
    """管理员操作日志表"""
    __tablename__ = 'admin_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    admin_email = Column(String(255))  # 冗余存储，防止用户被删后无法查看
    admin_nickname = Column(String(50))
    action = Column(String(50), nullable=False, index=True)  # 操作类型: login, create_user, edit_user, delete_user, adjust_balance, set_role, etc.
    target_type = Column(String(50), index=True)  # 目标类型: user, game, system
    target_id = Column(String(100))  # 目标ID
    target_name = Column(String(255))  # 目标名称（冗余存储）
    details = Column(Text)  # JSON格式的详细信息
    ip_address = Column(String(50))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 关系
    admin = relationship('User', backref='admin_logs')
    
    def to_dict(self):
        """转换为字典"""
        import json
        details_str = self.details
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_email': self.admin_email,
            'admin_nickname': self.admin_nickname,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_name': self.target_name,
            'details': json.loads(details_str) if details_str else None,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
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


class PlatformBinding(Base):
    """平台绑定表 - 存储用户绑定的直播/游戏平台信息"""
    __tablename__ = 'platform_bindings'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    platform = Column(String(20), nullable=False, index=True)  # twitch, youtube, douyin, tiktok
    platform_user_id = Column(String(255), nullable=False)  # 平台用户ID
    platform_username = Column(String(255))  # 平台用户名
    platform_display_name = Column(String(255))  # 平台显示名称
    platform_avatar_url = Column(String(500))  # 平台头像

    # OAuth 凭证
    access_token = Column(Text, nullable=False)  # 访问令牌
    refresh_token = Column(Text)  # 刷新令牌
    token_expires_at = Column(DateTime)  # 令牌过期时间
    scope = Column(String(500))  # 授权范围

    # 附加数据
    platform_data = Column(Text)  # JSON: 平台特定的额外数据

    # 状态
    is_active = Column(Boolean, default=True, index=True)  # 是否启用
    last_used_at = Column(DateTime)  # 最后使用时间

    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    user = relationship('User', backref='platform_bindings')

    def to_dict(self, include_tokens=False):
        """转换为字典

        Args:
            include_tokens: 是否包含敏感的token信息（默认不包含）
        """
        import json
        platform_data_str = self.platform_data

        result = {
            'id': self.id,
            'user_id': self.user_id,
            'platform': self.platform,
            'platform_user_id': self.platform_user_id,
            'platform_username': self.platform_username,
            'platform_display_name': self.platform_display_name,
            'platform_avatar_url': self.platform_avatar_url,
            'scope': self.scope,
            'platform_data': json.loads(platform_data_str) if platform_data_str else {},
            'is_active': self.is_active,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # 只在明确要求时才包含敏感token
        if include_tokens:
            result['access_token'] = self.access_token
            result['refresh_token'] = self.refresh_token
            result['token_expires_at'] = self.token_expires_at.isoformat() if self.token_expires_at else None

        return result


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
    print(f'   游戏相关表: games, game_licenses, game_launches')
    print(f'   平台绑定表: platform_bindings')


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