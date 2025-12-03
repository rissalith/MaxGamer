"""
认证API路由
处理用户注册、登录、退出等认证相关操作
"""

from flask import Blueprint, request, jsonify, g, redirect
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
import sys
import os
import requests
import json

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, User, Session, SmsCode, EmailCode, UserQuota, AdminLog
from utils.jwt_helper import create_access_token, verify_access_token
from utils.password_helper import hash_password, verify_password
from utils.sms_helper import generate_code, send_sms_code
from utils.email_helper import generate_code as generate_email_code, send_email_code
from utils.validators import validate_phone, validate_code, validate_nickname

# 创建蓝图
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ==================== 辅助函数 ====================

def log_admin_login(db, user):
    """记录管理员登录日志"""
    if user.role == 'admin':
        try:
            log = AdminLog(
                admin_id=user.id,
                admin_email=user.email,
                admin_nickname=user.nickname,
                action='login',
                target_type='system',
                target_id=None,
                target_name=None,
                details=json.dumps({'login_method': 'password'}, ensure_ascii=False),
                ip_address=get_client_ip(),
                user_agent=request.headers.get('User-Agent', '')[:500]
            )
            db.add(log)
            db.commit()
        except Exception as e:
            print(f'[WARN] 记录管理员登录日志失败: {e}')


def get_client_ip():
    """获取客户端IP地址"""
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0]
    return request.remote_addr or ''


def get_user_agent():
    """获取User-Agent"""
    return request.headers.get('User-Agent', '')


def require_auth(f):
    """认证装饰器"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({
                'success': False,
                'error': '未授权',
                'message': '请提供认证令牌'
            }), 401
        
        payload = verify_access_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'error': '认证失败',
                'message': '令牌无效或已过期'
            }), 401
        
        # 将用户信息添加到请求上下文
        g.current_user_id = payload['user_id']
        g.current_user_phone = payload['phone']
        
        return f(*args, **kwargs)
    
    return decorated_function


# ==================== API端点 ====================

@auth_bp.route('/send-sms', methods=['POST'])
def send_sms():
    """
    发送短信验证码
    
    POST /api/auth/send-sms
    {
        "phone": "13800138000",
        "purpose": "login"  // login, register, reset
    }
    """
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        purpose = data.get('purpose', 'login')
        
        # 验证手机号
        is_valid, error_msg = validate_phone(phone)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': error_msg
            }), 400
        
        # 验证用途
        if purpose not in ['login', 'register', 'reset']:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '无效的用途参数'
            }), 400
        
        db = get_db_session()
        try:
            # 检查发送频率限制（1分钟内只能发送一次）
            one_minute_ago = datetime.utcnow() - timedelta(seconds=60)
            recent_code = db.query(SmsCode).filter(
                SmsCode.phone == phone,
                SmsCode.created_at > one_minute_ago
            ).first()
            
            if recent_code:
                return jsonify({
                    'success': False,
                    'error': '发送过于频繁',
                    'message': '请稍后再试'
                }), 429
            
            # 生成验证码
            code = generate_code()
            
            # 保存到数据库
            expires_at = datetime.utcnow() + timedelta(seconds=300)  # 5分钟有效期
            sms_code = SmsCode(
                phone=phone,
                code=code,
                purpose=purpose,
                expires_at=expires_at,
                ip_address=get_client_ip()
            )
            db.add(sms_code)
            db.commit()
            
            # 发送短信
            success = send_sms_code(phone, code, purpose)
            
            if not success:
                return jsonify({
                    'success': False,
                    'error': '发送失败',
                    'message': '短信发送失败，请稍后重试'
                }), 500
            
            return jsonify({
                'success': True,
                'message': '验证码已发送',
                'expires_in': 300
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'发送验证码错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/send-email', methods=['POST'])
def send_email():
    """
    发送邮箱验证码
    
    POST /api/auth/send-email
    {
        "email": "user@example.com",
        "purpose": "login"  // login, register, reset
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        purpose = data.get('purpose', 'login')
        
        # 验证邮箱
        if not email:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入邮箱'
            }), 400
        
        import re
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入正确的邮箱地址'
            }), 400
        
        # 验证用途
        if purpose not in ['login', 'register', 'reset']:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '无效的用途参数'
            }), 400
        
        db = get_db_session()
        try:
            # 检查发送频率限制（1分钟内只能发送一次）
            one_minute_ago = datetime.utcnow() - timedelta(seconds=60)
            recent_code = db.query(EmailCode).filter(
                EmailCode.email == email,
                EmailCode.created_at > one_minute_ago
            ).first()
            
            if recent_code:
                return jsonify({
                    'success': False,
                    'error': '发送过于频繁',
                    'message': '请稍后再试'
                }), 429
            
            # 生成验证码
            code = generate_email_code()
            
            # 保存到数据库
            expires_at = datetime.utcnow() + timedelta(seconds=300)  # 5分钟有效期
            email_code = EmailCode(
                email=email,
                code=code,
                purpose=purpose,
                expires_at=expires_at,
                ip_address=get_client_ip()
            )
            db.add(email_code)
            db.commit()
            
            # 发送邮件
            success = send_email_code(email, code, purpose)
            
            if not success:
                return jsonify({
                    'success': False,
                    'error': '发送失败',
                    'message': '邮件发送失败，请稍后重试'
                }), 500
            
            return jsonify({
                'success': True,
                'message': '验证码已发送',
                'expires_in': 300
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'发送邮箱验证码错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/login-with-email', methods=['POST'])
def login_with_email():
    """
    邮箱验证码登录/注册
    
    POST /api/auth/login-with-email
    {
        "email": "user@example.com",
        "code": "123456"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        code = data.get('code', '').strip()
        
        # 验证邮箱
        if not email:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入邮箱'
            }), 400
        
        import re
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入正确的邮箱地址'
            }), 400
        
        # 验证验证码格式
        is_valid, error_msg = validate_code(code)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': error_msg
            }), 400
        
        db = get_db_session()
        try:
            # 查询验证码
            email_code = db.query(EmailCode).filter(
                EmailCode.email == email,
                EmailCode.code == code,
                EmailCode.used == False,
                EmailCode.expires_at > datetime.utcnow()
            ).order_by(EmailCode.created_at.desc()).first()
            
            if not email_code:
                return jsonify({
                    'success': False,
                    'error': '验证失败',
                    'message': '验证码错误或已过期'
                }), 400
            
            # 标记验证码为已使用
            email_code.used = True
            email_code.used_at = datetime.utcnow()
            db.commit()
            
            # 查询或创建用户
            user = db.query(User).filter(User.email == email).first()
            is_new_user = False
            need_set_password = False
            
            if not user:
                # 自动注册新用户
                user = User(
                    email=email,
                    nickname=f'用户_{email.split("@")[0]}',
                    status='active',
                    last_login_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # 创建用户配额
                quota = UserQuota(
                    user_id=user.id,
                    daily_limit=10,
                    daily_used=0,
                    total_used=0
                )
                db.add(quota)
                db.commit()
                
                is_new_user = True
                need_set_password = True
                print(f'[OK] 新用户注册: {email}')
            else:
                # 检查是否需要设置密码
                if not user.password_hash:
                    need_set_password = True
                
                # 更新最后登录时间
                user.last_login_at = datetime.utcnow()
                db.commit()
                print(f'[OK] 用户登录: {email}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.email)
            
            # 创建会话记录
            expires_at = datetime.utcnow() + timedelta(seconds=604800)  # 7天
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            # 记录管理员登录日志
            log_admin_login(db, user)
            
            response_data = {
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': '登录成功'
            }
            
            # 如果需要设置密码，添加标记
            if need_set_password:
                response_data['needSetPassword'] = True
                response_data['message'] = '首次登录，请设置密码'
            
            return jsonify(response_data)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'邮箱登录错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/login-with-sms', methods=['POST'])
def login_with_sms():
    """
    手机号验证码登录/注册
    
    POST /api/auth/login-with-sms
    {
        "phone": "13800138000",
        "code": "123456"
    }
    """
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        code = data.get('code', '').strip()
        
        # 验证手机号
        is_valid, error_msg = validate_phone(phone)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': error_msg
            }), 400
        
        # 验证验证码格式
        is_valid, error_msg = validate_code(code)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': error_msg
            }), 400
        
        db = get_db_session()
        try:
            # 查询验证码
            sms_code = db.query(SmsCode).filter(
                SmsCode.phone == phone,
                SmsCode.code == code,
                SmsCode.used == False,
                SmsCode.expires_at > datetime.utcnow()
            ).order_by(SmsCode.created_at.desc()).first()
            
            if not sms_code:
                return jsonify({
                    'success': False,
                    'error': '验证失败',
                    'message': '验证码错误或已过期'
                }), 400
            
            # 标记验证码为已使用
            sms_code.used = True
            sms_code.used_at = datetime.utcnow()
            db.commit()
            
            # 查询或创建用户
            user = db.query(User).filter(User.phone == phone).first()
            is_new_user = False
            need_set_password = False
            
            if not user:
                # 自动注册新用户
                user = User(
                    phone=phone,
                    nickname=f'用户_{phone[-4:]}',
                    status='active',
                    last_login_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # 创建用户配额
                quota = UserQuota(
                    user_id=user.id,
                    daily_limit=10,
                    daily_used=0,
                    total_used=0
                )
                db.add(quota)
                db.commit()
                
                is_new_user = True
                need_set_password = True
                print(f'[OK] 新用户注册: {phone}')
            else:
                # 检查是否需要设置密码
                if not user.password_hash:
                    need_set_password = True
                
                # 更新最后登录时间
                user.last_login_at = datetime.utcnow()
                db.commit()
                print(f'[OK] 用户登录: {phone}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.phone)
            
            # 创建会话记录
            expires_at = datetime.utcnow() + timedelta(seconds=604800)  # 7天
            session = Session(
                user_id=user.id,
                token=token[:50],  # 只存储token的前50个字符作为标识
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            response_data = {
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': '登录成功'
            }
            
            # 如果需要设置密码，添加标记
            if need_set_password:
                response_data['needSetPassword'] = True
                response_data['message'] = '首次登录，请设置密码'
            
            return jsonify(response_data)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'登录错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/login-with-password', methods=['POST'])
def login_with_password():
    """
    账号密码登录
    
    POST /api/auth/login-with-password
    {
        "account": "13800138000 或 email@example.com",
        "password": "password123"
    }
    """
    try:
        data = request.get_json()
        account = data.get('account', '').strip()
        password = data.get('password', '').strip()
        
        # 验证账号
        if not account:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入账号'
            }), 400
        
        # 验证密码
        if not password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入密码'
            }), 400
        
        db = get_db_session()
        try:
            # 查询用户（支持手机号或邮箱登录）
            user = None
            if '@' in account:
                # 邮箱登录
                user = db.query(User).filter(User.email == account).first()
            else:
                # 手机号登录
                user = db.query(User).filter(User.phone == account).first()
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': '登录失败',
                    'message': '账号未注册，请先注册'
                }), 400
            
            # 检查用户是否设置了密码
            if not user.password_hash:
                return jsonify({
                    'success': False,
                    'error': '登录失败',
                    'message': '该账号未设置密码，请使用验证码登录'
                }), 400
            
            # 验证密码
            if not verify_password(password, user.password_hash):
                return jsonify({
                    'success': False,
                    'error': '登录失败',
                    'message': '账号或密码错误'
                }), 400
            
            # 更新最后登录时间
            user.last_login_at = datetime.utcnow()
            db.commit()
            
            print(f'[OK] 用户密码登录: {account}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.phone or user.email or '')
            
            # 创建会话记录
            expires_at = datetime.utcnow() + timedelta(seconds=604800)  # 7天
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            # 记录管理员登录日志
            log_admin_login(db, user)
            
            return jsonify({
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': '登录成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'账号密码登录错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    注册新用户
    
    POST /api/auth/register
    {
        "email": "user@example.com",
        "code": "123456",
        "password": "password123",
        "nickname": "昵称（可选）"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        code = data.get('code', '').strip()
        password = data.get('password', '').strip()
        nickname = data.get('nickname', '').strip()
        
        # 验证邮箱
        if not email:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入邮箱'
            }), 400
        
        import re
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入正确的邮箱地址'
            }), 400
        
        # 验证验证码格式
        is_valid, error_msg = validate_code(code)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': error_msg
            }), 400
        
        # 验证密码
        if not password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入密码'
            }), 400
        
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '密码至少6位'
            }), 400
        
        if len(password) > 20:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '密码最多20位'
            }), 400
        
        # 验证昵称
        if nickname:
            is_valid, error_msg = validate_nickname(nickname)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': '参数错误',
                    'message': error_msg
                }), 400
        
        db = get_db_session()
        try:
            # 查询验证码
            email_code = db.query(EmailCode).filter(
                EmailCode.email == email,
                EmailCode.code == code,
                EmailCode.used == False,
                EmailCode.expires_at > datetime.utcnow()
            ).order_by(EmailCode.created_at.desc()).first()
            
            if not email_code:
                return jsonify({
                    'success': False,
                    'error': '验证失败',
                    'message': '验证码错误或已过期'
                }), 400
            
            # 检查邮箱是否已注册
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return jsonify({
                    'success': False,
                    'error': '注册失败',
                    'message': '该邮箱已注册'
                }), 400
            
            # 标记验证码为已使用
            email_code.used = True
            email_code.used_at = datetime.utcnow()
            db.commit()
            
            # 创建新用户
            user = User(
                email=email,
                nickname=nickname or f'用户_{email.split("@")[0]}',
                password_hash=hash_password(password),
                status='active',
                last_login_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # 创建用户配额
            quota = UserQuota(
                user_id=user.id,
                daily_limit=10,
                daily_used=0,
                total_used=0
            )
            db.add(quota)
            db.commit()
            
            print(f'[OK] 新用户注册: {email}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.email)
            
            # 创建会话记录
            expires_at = datetime.utcnow() + timedelta(seconds=604800)  # 7天
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            return jsonify({
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': '注册成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'注册错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/set-password', methods=['POST'])
@require_auth
def set_password():
    """
    设置密码（首次登录或修改密码）
    
    POST /api/auth/set-password
    Headers: Authorization: Bearer <token>
    {
        "password": "newpassword123"
    }
    """
    try:
        user_id = g.current_user_id
        data = request.get_json()
        password = data.get('password', '').strip()
        
        # 验证密码
        if not password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入密码'
            }), 400
        
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '密码至少6位'
            }), 400
        
        if len(password) > 20:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '密码最多20位'
            }), 400
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': '用户信息未找到'
                }), 404
            
            # 设置密码
            user.password_hash = hash_password(password)
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            print(f'[OK] 用户设置密码: {user.email or user.phone or user.id}')
            
            return jsonify({
                'success': True,
                'user': user.to_dict(),
                'message': '密码设置成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'设置密码错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """
    修改密码
    
    POST /api/auth/change-password
    Headers: Authorization: Bearer <token>
    {
        "current_password": "oldpassword123",
        "new_password": "newpassword123"
    }
    """
    try:
        user_id = g.current_user_id
        data = request.get_json()
        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()
        
        # 验证当前密码
        if not current_password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入当前密码'
            }), 400
        
        # 验证新密码
        if not new_password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入新密码'
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '新密码至少6位'
            }), 400
        
        if len(new_password) > 20:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '新密码最多20位'
            }), 400
        
        if current_password == new_password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '新密码不能与当前密码相同'
            }), 400
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': '用户信息未找到'
                }), 404
            
            # 验证当前密码
            if not user.password_hash:
                return jsonify({
                    'success': False,
                    'error': '操作失败',
                    'message': '该账号未设置密码，请先设置密码'
                }), 400
            
            if not verify_password(current_password, user.password_hash):
                return jsonify({
                    'success': False,
                    'error': '验证失败',
                    'message': '当前密码错误'
                }), 400
            
            # 更新密码
            user.password_hash = hash_password(new_password)
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            print(f'[OK] 用户修改密码: {user.email or user.phone or user.id}')
            
            return jsonify({
                'success': True,
                'user': user.to_dict(),
                'message': '密码修改成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'修改密码错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """
    获取当前用户信息
    
    GET /api/auth/me
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': '用户信息未找到'
                }), 404
            
            return jsonify({
                'success': True,
                'user': user.to_dict()
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取用户信息错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """
    退出登录
    
    POST /api/auth/logout
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        db = get_db_session()
        try:
            # 撤销会话
            session = db.query(Session).filter(
                Session.user_id == user_id,
                Session.token == token[:50]
            ).first()
            
            if session:
                session.revoked = True
                session.revoked_at = datetime.utcnow()
                db.commit()
            
            return jsonify({
                'success': True,
                'message': '已退出登录'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'退出登录错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile():
    """
    更新用户信息
    
    PUT /api/auth/profile
    Headers: Authorization: Bearer <token>
    {
        "nickname": "新昵称",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    """
    try:
        user_id = g.current_user_id
        data = request.get_json()
        
        nickname = data.get('nickname', '').strip()
        avatar_url = data.get('avatar_url', '').strip()
        
        # 验证昵称
        if nickname:
            is_valid, error_msg = validate_nickname(nickname)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': '参数错误',
                    'message': error_msg
                }), 400
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': '用户信息未找到'
                }), 404
            
            # 更新信息
            if nickname:
                user.nickname = nickname
            if avatar_url:
                user.avatar_url = avatar_url
            
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            return jsonify({
                'success': True,
                'user': user.to_dict(),
                'message': '更新成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'更新用户信息错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


# ==================== 第三方登录 ====================

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """
    Google OAuth回调（弹窗模式）
    
    GET /api/auth/google/callback?code=xxx&state=xxx
    """
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        # 如果有错误，返回错误页面
        if error:
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        message: 'Google登录失败: {error}'
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
        
        if not code or not state:
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        message: '缺少必要参数'
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
        
        # 配置（需要在环境变量或配置文件中设置）
        client_id = os.getenv('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET')
        # 使用前端域名构建redirect_uri（从环境变量或Referer获取）
        frontend_domain = os.getenv('FRONTEND_DOMAIN', 'www.xmframer.com')
        redirect_uri = f"https://{frontend_domain}/oauth-callback.html"
        
        # 交换授权码获取access token
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'error' in token_json:
            return redirect(f'/login.html?error={token_json["error"]}')
        
        access_token = token_json.get('access_token')
        
        # 获取用户信息
        userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        userinfo = userinfo_response.json()
        
        # 处理用户登录/注册
        db = get_db_session()
        try:
            google_id = userinfo.get('id')
            email = userinfo.get('email')
            name = userinfo.get('name')
            picture = userinfo.get('picture')
            
            # 查找或创建用户（使用email作为唯一标识）
            user = db.query(User).filter(User.email == email).first()
            
            if not user:
                # 创建新用户
                user = User(
                    email=email,
                    nickname=name or f'Google用户',
                    avatar_url=picture,
                    oauth_provider='google',
                    oauth_id=google_id,
                    status='active',
                    last_login_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # 创建用户配额
                quota = UserQuota(
                    user_id=user.id,
                    daily_limit=10,
                    daily_used=0,
                    total_used=0
                )
                db.add(quota)
                db.commit()
                
                print(f'[OK] Google新用户注册: {email}')
            else:
                # 更新最后登录时间
                user.last_login_at = datetime.utcnow()
                if picture:
                    user.avatar_url = picture
                db.commit()
                print(f'[OK] Google用户登录: {email}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.email or user.phone or '')
            
            # 创建会话记录
            expires_at = datetime.utcnow() + timedelta(seconds=604800)
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            # 返回HTML页面，通过postMessage发送登录成功消息
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_success',
                        token: '{token}',
                        user: {json.dumps(user.to_dict())}
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'Google登录错误: {e}')
        return f'''
            <html>
            <script>
                window.opener.postMessage({{
                    type: 'oauth_error',
                    message: 'Google登录失败: {str(e)}'
                }}, window.location.origin);
                window.close();
            </script>
            </html>
        '''


@auth_bp.route('/google/login', methods=['POST'])
def google_login():
    """
    处理Google登录的后端逻辑
    
    POST /api/auth/google/login
    {
        "code": "xxx",
        "state": "xxx"
    }
    """
    try:
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')
        redirect_uri = data.get('redirect_uri')
        
        print(f'[DEBUG] Google登录请求开始')
        print(f'[DEBUG] Request host: {request.host}')
        print(f'[DEBUG] Request scheme: {request.scheme}')
        print(f'[DEBUG] Code length: {len(code) if code else 0}')
        print(f'[DEBUG] State: {state}')
        print(f'[DEBUG] Redirect URI from client: {redirect_uri}')
        
        if not code or not state:
            print(f'[ERROR] 缺少必要参数 - code: {bool(code)}, state: {bool(state)}')
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '缺少必要参数'
            }), 400
        
        # 配置
        client_id = os.getenv('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET')
        
        # 确定redirect_uri
        if not redirect_uri:
            # 如果前端没传，尝试构建（兼容旧版）
            frontend_domain = os.getenv('FRONTEND_DOMAIN', 'www.xmframer.com')
            # 本地开发环境特殊处理
            if request.host.startswith('localhost') or request.host.startswith('127.0.0.1'):
                redirect_uri = f"http://{request.host}/oauth-callback.html"
            else:
                redirect_uri = f"https://{frontend_domain}/oauth-callback.html"
        
        print(f'[DEBUG] Final redirect_uri: {redirect_uri}')
        print(f'[DEBUG] client_id: {client_id}')
        
        # 交换授权码
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        print(f'[DEBUG] 发送token请求到Google')
        token_response = requests.post(token_url, data=token_data)
        print(f'[DEBUG] Google响应状态码: {token_response.status_code}')
        
        token_json = token_response.json()
        print(f'[DEBUG] Google响应: {token_json}')
        
        if 'error' in token_json:
            error_msg = token_json.get('error_description', token_json.get('error', '获取token失败'))
            print(f'[ERROR] Google OAuth错误: {error_msg}')
            return jsonify({
                'success': False,
                'error': 'OAuth错误',
                'message': error_msg
            }), 400
        
        access_token = token_json.get('access_token')
        
        # 获取用户信息
        userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        userinfo = userinfo_response.json()
        
        # 处理用户登录/注册
        db = get_db_session()
        try:
            google_id = userinfo.get('id')
            email = userinfo.get('email')
            name = userinfo.get('name')
            picture = userinfo.get('picture')
            
            user = db.query(User).filter(User.email == email).first()
            is_new_user = False
            need_set_password = False
            
            if not user:
                # 直接创建新用户（首次登录）
                user = User(
                    email=email,
                    nickname=name or f'Google用户',
                    avatar_url=picture,
                    oauth_provider='google',
                    oauth_id=google_id,
                    status='active',
                    last_login_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                # 创建用户配额
                quota = UserQuota(
                    user_id=user.id,
                    daily_limit=10,
                    daily_used=0,
                    total_used=0
                )
                db.add(quota)
                db.commit()
                
                is_new_user = True
                need_set_password = True
                print(f'[OK] Google新用户首次登录: {email}')
            else:
                # 检查用户是否设置了密码
                need_set_password = not user.password_hash
                print(f'[DEBUG] 老用户 {email} - password_hash存在: {bool(user.password_hash)}, need_set_password: {need_set_password}')
                
                # 更新最后登录时间和头像
                user.last_login_at = datetime.utcnow()
                if picture:
                    user.avatar_url = picture
                db.commit()
                print(f'[OK] Google用户登录: {email}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.email or user.phone or '')
            
            # 创建会话
            expires_at = datetime.utcnow() + timedelta(seconds=604800)
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            response_data = {
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': 'Google登录成功'
            }
            
            # 如果需要设置密码，添加标记（无论新老用户）
            print(f'[DEBUG] 准备返回响应 - need_set_password: {need_set_password}, is_new_user: {is_new_user}')
            if need_set_password:
                response_data['needSetPassword'] = True
                response_data['isNewUser'] = is_new_user
                response_data['googleInfo'] = {
                    'name': name,
                    'email': email,
                    'avatar_url': picture
                }
                if is_new_user:
                    response_data['message'] = '首次登录，请设置密码和昵称'
                else:
                    response_data['message'] = '请设置密码以完善账号信息'
                print(f'[DEBUG] 已添加needSetPassword标记到响应')
            else:
                print(f'[DEBUG] 用户已有密码，无需设置')
            
            print(f'[DEBUG] 最终响应数据: {response_data}')
            return jsonify(response_data)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'Google登录处理错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/google/register', methods=['POST'])
def google_register():
    """
    Google新用户注册（设置密码）
    
    POST /api/auth/google/register
    {
        "email": "user@example.com",
        "google_id": "xxx",
        "name": "用户名",
        "avatar_url": "https://...",
        "password": "password123",
        "confirm_password": "password123"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        google_id = data.get('google_id', '').strip()
        name = data.get('name', '').strip()
        avatar_url = data.get('avatar_url', '').strip()
        password = data.get('password', '').strip()
        confirm_password = data.get('confirm_password', '').strip()
        
        print(f'[DEBUG] Google用户注册请求: {email}')
        
        # 验证必填字段
        if not email or not google_id or not password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请填写完整信息'
            }), 400
        
        # 验证邮箱格式
        import re
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '请输入正确的邮箱地址'
            }), 400
        
        # 验证密码
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '密码至少6位'
            }), 400
        
        if len(password) > 20:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '密码最多20位'
            }), 400
        
        # 验证密码确认
        if password != confirm_password:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '两次输入的密码不一致'
            }), 400
        
        db = get_db_session()
        try:
            # 检查邮箱是否已注册
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                return jsonify({
                    'success': False,
                    'error': '注册失败',
                    'message': '该邮箱已注册'
                }), 400
            
            # 创建新用户
            user = User(
                email=email,
                nickname=name or f'Google用户',
                avatar_url=avatar_url,
                password_hash=hash_password(password),
                oauth_provider='google',
                oauth_id=google_id,
                status='active',
                last_login_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # 创建用户配额
            quota = UserQuota(
                user_id=user.id,
                daily_limit=10,
                daily_used=0,
                total_used=0
            )
            db.add(quota)
            db.commit()
            
            print(f'[OK] Google新用户注册成功: {email}')
            
            # 生成JWT token
            token = create_access_token(user.id, user.email)
            
            # 创建会话
            expires_at = datetime.utcnow() + timedelta(seconds=604800)
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            return jsonify({
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': '注册成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'Google用户注册错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@auth_bp.route('/twitter/callback', methods=['GET'])
def twitter_callback():
    """
    Twitter/X OAuth回调（弹窗模式）
    
    GET /api/auth/twitter/callback?code=xxx&state=xxx
    """
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        # 如果有错误，返回错误页面
        if error:
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        message: 'X登录失败'
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
        
        if not code or not state:
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        message: '缺少必要参数'
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
        
        # 配置
        client_id = os.getenv('TWITTER_CLIENT_ID', 'YOUR_TWITTER_CLIENT_ID')
        client_secret = os.getenv('TWITTER_CLIENT_SECRET', 'YOUR_TWITTER_CLIENT_SECRET')
        redirect_uri = f"{request.host_url}api/auth/twitter/callback"
        
        # 获取access_token
        token_url = 'https://api.twitter.com/2/oauth2/token'
        token_data = {
            'code': code,
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'code_verifier': 'challenge'  # 需要从session获取
        }
        
        # 使用Basic Auth
        auth = (client_id, client_secret)
        token_response = requests.post(token_url, data=token_data, auth=auth)
        token_json = token_response.json()
        
        if 'error' in token_json:
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        message: 'X认证失败'
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
        
        access_token = token_json.get('access_token')
        
        # 获取用户信息
        userinfo_url = 'https://api.twitter.com/2/users/me'
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        params = {
            'user.fields': 'id,name,username,profile_image_url'
        }
        
        userinfo_response = requests.get(userinfo_url, headers=headers, params=params)
        userinfo = userinfo_response.json()
        
        if 'errors' in userinfo:
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_error',
                        message: '获取用户信息失败'
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
        
        # 处理用户登录/注册
        db = get_db_session()
        try:
            user_data = userinfo.get('data', {})
            twitter_id = user_data.get('id')
            username = user_data.get('username')
            name = user_data.get('name')
            profile_image = user_data.get('profile_image_url')
            
            # 查找或创建用户（使用twitter_id作为唯一标识）
            user = db.query(User).filter(
                User.oauth_provider == 'twitter',
                User.oauth_id == twitter_id
            ).first()
            
            if not user:
                user = User(
                    nickname=name or username or 'X用户',
                    avatar_url=profile_image,
                    oauth_provider='twitter',
                    oauth_id=twitter_id,
                    status='active',
                    last_login_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                quota = UserQuota(
                    user_id=user.id,
                    daily_limit=10,
                    daily_used=0,
                    total_used=0
                )
                db.add(quota)
                db.commit()
                
                print(f'[OK] X新用户注册: {username}')
            else:
                user.last_login_at = datetime.utcnow()
                if profile_image:
                    user.avatar_url = profile_image
                if name:
                    user.nickname = name
                db.commit()
                print(f'[OK] X用户登录: {username}')
            
            # 生成JWT token
            token = create_access_token(user.id, twitter_id)
            
            # 创建会话
            expires_at = datetime.utcnow() + timedelta(seconds=604800)
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            # 返回HTML页面，通过postMessage发送登录成功消息
            return f'''
                <html>
                <script>
                    window.opener.postMessage({{
                        type: 'oauth_success',
                        token: '{token}',
                        user: {json.dumps(user.to_dict())}
                    }}, window.location.origin);
                    window.close();
                </script>
                </html>
            '''
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'X登录错误: {e}')
        return f'''
            <html>
            <script>
                window.opener.postMessage({{
                    type: 'oauth_error',
                    message: 'X登录失败: {str(e)}'
                }}, window.location.origin);
                window.close();
            </script>
            </html>
        '''


@auth_bp.route('/twitter/login', methods=['POST'])
def twitter_login():
    """
    处理Twitter/X登录的后端逻辑
    
    POST /api/auth/twitter/login
    {
        "code": "xxx",
        "state": "xxx",
        "code_verifier": "xxx"
    }
    """
    try:
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')
        code_verifier = data.get('code_verifier')
        redirect_uri = data.get('redirect_uri')
        
        if not code or not state:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '缺少必要参数'
            }), 400
        
        if not code_verifier:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '缺少code_verifier参数'
            }), 400
        
        # 配置 - 优先使用环境变量，否则使用前端配置
        client_id = os.getenv('TWITTER_CLIENT_ID', 'Y05TdWhBWXJhdUxVdlRLQnVLcEc6MTpjaQ')
        client_secret = os.getenv('TWITTER_CLIENT_SECRET', 'o0hMC7-8Pe_3EEMYYIOyTlkOG8aZ56WfK8WM71PLu72vTDxMXM')
        
        if not redirect_uri:
            redirect_uri = f"{request.host_url}oauth-callback.html"
        
        print(f'[DEBUG] X登录开始')
        print(f'[DEBUG] client_id: {client_id}')
        print(f'[DEBUG] redirect_uri: {redirect_uri}')
        print(f'[DEBUG] code长度: {len(code)}')
        print(f'[DEBUG] code_verifier长度: {len(code_verifier)}')
        print(f'[DEBUG] state: {state}')
        
        # 获取access_token
        token_url = 'https://api.twitter.com/2/oauth2/token'
        token_data = {
            'code': code,
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'code_verifier': code_verifier
        }
        
        # X OAuth 2.0 Confidential Client 需要使用 Basic Auth
        import base64
        auth_str = f"{client_id}:{client_secret}"
        auth_bytes = auth_str.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {auth_b64}'
        }
        
        print(f'[DEBUG] 发送token请求到: {token_url}')
        print(f'[DEBUG] 请求数据: {token_data}')
        
        token_response = requests.post(token_url, data=token_data, headers=headers)
        
        print(f'[DEBUG] Token响应状态码: {token_response.status_code}')
        print(f'[DEBUG] Token响应头: {dict(token_response.headers)}')
        
        try:
            token_json = token_response.json()
            print(f'[DEBUG] Token响应JSON: {token_json}')
        except:
            print(f'[ERROR] 无法解析JSON响应')
            print(f'[DEBUG] 原始响应: {token_response.text}')
            token_json = {'error': 'invalid_response', 'error_description': token_response.text}
        
        if 'error' in token_json:
            error_msg = token_json.get('error_description', token_json.get('error', '获取token失败'))
            print(f'[ERROR] X OAuth错误: {error_msg}')
            return jsonify({
                'success': False,
                'error': 'X OAuth错误',
                'message': error_msg
            }), 400
        
        access_token = token_json.get('access_token')
        
        if not access_token:
            return jsonify({
                'success': False,
                'error': 'X OAuth错误',
                'message': '未获取到access_token'
            }), 400
        
        # 获取用户信息
        userinfo_url = 'https://api.twitter.com/2/users/me'
        headers = {'Authorization': f'Bearer {access_token}'}
        params = {'user.fields': 'id,name,username,profile_image_url'}
        
        userinfo_response = requests.get(userinfo_url, headers=headers, params=params)
        userinfo = userinfo_response.json()
        
        print(f'[DEBUG] X用户信息: {userinfo}')
        
        if 'errors' in userinfo:
            error_msg = userinfo['errors'][0].get('message', '获取用户信息失败')
            print(f'[ERROR] X获取用户信息错误: {error_msg}')
            return jsonify({
                'success': False,
                'error': '获取用户信息失败',
                'message': error_msg
            }), 400
        
        # 处理用户登录/注册
        db = get_db_session()
        try:
            user_data = userinfo.get('data', {})
            twitter_id = user_data.get('id')
            username = user_data.get('username')
            name = user_data.get('name')
            profile_image = user_data.get('profile_image_url')
            
            if not twitter_id:
                return jsonify({
                    'success': False,
                    'error': '数据错误',
                    'message': '未获取到用户ID'
                }), 400
            
            user = db.query(User).filter(
                User.oauth_provider == 'twitter',
                User.oauth_id == twitter_id
            ).first()
            
            if not user:
                user = User(
                    nickname=name or username or 'X用户',
                    avatar_url=profile_image,
                    oauth_provider='twitter',
                    oauth_id=twitter_id,
                    status='active',
                    last_login_at=datetime.utcnow()
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                
                quota = UserQuota(
                    user_id=user.id,
                    daily_limit=10,
                    daily_used=0,
                    total_used=0
                )
                db.add(quota)
                db.commit()
                
                print(f'[OK] X新用户注册: {username} (ID: {twitter_id})')
            else:
                user.last_login_at = datetime.utcnow()
                if profile_image:
                    user.avatar_url = profile_image
                if name:
                    user.nickname = name
                db.commit()
                print(f'[OK] X用户登录: {username} (ID: {twitter_id})')
            
            # 生成JWT token
            token = create_access_token(user.id, twitter_id)
            
            # 创建会话
            expires_at = datetime.utcnow() + timedelta(seconds=604800)
            session = Session(
                user_id=user.id,
                token=token[:50],
                device_info=get_user_agent()[:200],
                ip_address=get_client_ip(),
                user_agent=get_user_agent(),
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            
            return jsonify({
                'success': True,
                'token': token,
                'user': user.to_dict(),
                'message': 'X登录成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'[ERROR] X登录处理错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500

        
# ==================== 测试端点（仅开发环境） ====================

@auth_bp.route('/test-token', methods=['GET'])
def test_token():
    """
    测试JWT token生成和验证
    仅用于开发测试
    """
    try:
        # 生成测试token
        token = create_access_token(1, '13800138000')
        
        # 验证token
        payload = verify_access_token(token)
        
        return jsonify({
            'success': True,
            'token': token,
            'payload': payload,
            'message': 'Token测试成功'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': '测试失败',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print('认证路由模块')
    print('可用端点:')
    print('  POST /api/auth/send-sms - 发送验证码')
    print('  POST /api/auth/login-with-sms - 登录/注册')
    print('  GET  /api/auth/me - 获取当前用户')
    print('  POST /api/auth/logout - 退出登录')
    print('  PUT  /api/auth/profile - 更新用户信息')
    print('  GET  /api/auth/google/callback - Google OAuth回调')
    print('  POST /api/auth/google/login - Google登录处理')
    print('  GET  /api/auth/twitter/callback - Twitter OAuth回调')
    print('  POST /api/auth/twitter/login - Twitter登录处理')