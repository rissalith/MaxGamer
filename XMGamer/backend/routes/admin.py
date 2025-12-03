"""
管理员API路由
处理用户管理、游戏管理、手动补分等操作
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
from sqlalchemy import desc
import sys
import os
import json

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, User, Game, Transaction, License, Wallet, AdminLog
from utils.jwt_helper import verify_access_token

# 创建蓝图
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ==================== 辅助函数 ====================

def get_client_ip():
    """获取客户端IP地址"""
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0]
    return request.remote_addr or ''


def log_admin_action(db, admin_user, action, target_type=None, target_id=None, target_name=None, details=None):
    """
    记录管理员操作日志
    
    Args:
        db: 数据库会话
        admin_user: 管理员用户对象
        action: 操作类型 (login, create_user, edit_user, delete_user, adjust_balance, set_role, etc.)
        target_type: 目标类型 (user, game, system)
        target_id: 目标ID
        target_name: 目标名称
        details: 详细信息字典
    """
    try:
        log = AdminLog(
            admin_id=admin_user.id if admin_user else None,
            admin_email=admin_user.email if admin_user else None,
            admin_nickname=admin_user.nickname if admin_user else None,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            target_name=target_name,
            details=json.dumps(details, ensure_ascii=False) if details else None,
            ip_address=get_client_ip(),
            user_agent=request.headers.get('User-Agent', '')[:500]
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f'[WARN] 记录管理日志失败: {e}')


def require_admin(f):
    """管理员认证装饰器"""
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
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_access_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'error': '认证失败',
                'message': '令牌无效或已过期'
            }), 401
        
        # 检查用户角色
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == payload['user_id']).first()
            if not user or user.role != 'admin':
                return jsonify({
                    'success': False,
                    'error': '权限不足',
                    'message': '需要管理员权限'
                }), 403
            
            g.current_user_id = payload['user_id']
            g.current_user = user
            
        finally:
            db.close()
        
        return f(*args, **kwargs)
    
    return decorated_function


# ==================== 用户管理 ====================

@admin_bp.route('/users', methods=['GET'])
@require_admin
def list_users():
    """
    获取用户列表
    
    GET /api/admin/users?limit=20&offset=0&search=xxx
    """
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        search = request.args.get('search', '')
        
        db = get_db_session()
        try:
            query = db.query(User)
            
            # 搜索过滤
            if search:
                query = query.filter(
                    (User.email.like(f'%{search}%')) |
                    (User.nickname.like(f'%{search}%')) |
                    (User.phone.like(f'%{search}%'))
                )
            
            total = query.count()
            users = query.order_by(desc(User.created_at)).limit(limit).offset(offset).all()
            
            return jsonify({
                'success': True,
                'users': [u.to_dict() for u in users],
                'total': total,
                'limit': limit,
                'offset': offset
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取用户列表错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>/adjust-balance', methods=['POST'])
@require_admin
def adjust_user_balance(user_id):
    """
    手动调整用户余额（补分/扣分）
    
    POST /api/admin/users/<user_id>/adjust-balance
    Body: {
        "amount": 100,  // 正数加分，负数扣分
        "reason": "Bug补偿"
    }
    """
    try:
        data = request.get_json()
        amount = int(data.get('amount', 0))
        reason = data.get('reason', '管理员调账')
        
        if amount == 0:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '调整金额不能为0'
            }), 400
        
        db = get_db_session()
        try:
            db.begin()
            
            # 查询用户（加锁）
            user = db.query(User).filter(User.id == user_id).with_for_update().first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            # 检查扣分是否足够
            balance_before = user.balance or 0
            if amount < 0 and balance_before < abs(amount):
                return jsonify({
                    'success': False,
                    'error': '余额不足',
                    'message': f'用户余额 {balance_before} 不足以扣除 {abs(amount)}'
                }), 400
            
            # 更新余额
            user.balance = balance_before + amount
            balance_after = user.balance
            
            # 同时更新钱包表（如果存在）
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            if wallet:
                wallet.balance = balance_after
                if amount > 0:
                    wallet.total_recharged = (wallet.total_recharged or 0) + amount
            
            # 写入交易流水
            transaction = Transaction(
                user_id=user_id,
                amount=amount,
                type='ADJUST',
                status='completed',
                balance_before=balance_before,
                balance_after=balance_after,
                description=f'[管理员] {reason}',
                ip_address=get_client_ip(),
                completed_at=datetime.utcnow()
            )
            db.add(transaction)
            
            db.commit()
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'adjust_balance',
                target_type='user',
                target_id=user_id,
                target_name=user.nickname or user.email,
                details={
                    'amount': amount,
                    'balance_before': balance_before,
                    'balance_after': balance_after,
                    'reason': reason
                }
            )
            
            admin_id = g.current_user_id
            print(f'[ADMIN] 管理员 {admin_id} 调整用户 {user_id} 余额: {amount:+d}, 原因: {reason}')
            
            return jsonify({
                'success': True,
                'user_id': user_id,
                'amount': amount,
                'balance_before': balance_before,
                'balance_after': balance_after,
                'message': f'成功{"增加" if amount > 0 else "扣除"} {abs(amount)} 积分'
            })
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
            
    except Exception as e:
        print(f'调整用户余额错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>/set-role', methods=['POST'])
@require_admin
def set_user_role(user_id):
    """
    设置用户角色
    
    POST /api/admin/users/<user_id>/set-role
    Body: {
        "role": "admin"  // 'user', 'creator' 或 'admin'
    }
    """
    try:
        data = request.get_json()
        role = data.get('role', 'user')
        
        if role not in ['user', 'creator', 'admin']:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '角色只能是 user、creator 或 admin'
            }), 400
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            old_role = user.role
            user.role = role
            db.commit()
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'set_role',
                target_type='user',
                target_id=user_id,
                target_name=user.nickname or user.email,
                details={
                    'old_role': old_role,
                    'new_role': role
                }
            )
            
            admin_id = g.current_user_id
            print(f'[ADMIN] 管理员 {admin_id} 修改用户 {user_id} 角色: {old_role} -> {role}')
            
            return jsonify({
                'success': True,
                'user_id': user_id,
                'role': role,
                'message': f'成功设置用户角色为 {role}'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'设置用户角色错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@require_admin
def get_user_detail(user_id):
    """
    获取用户详情
    
    GET /api/admin/users/<user_id>
    """
    try:
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            # 获取钱包信息
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            wallet_info = wallet.to_dict() if wallet else None
            
            # 获取交易记录数量
            transaction_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
            
            # 获取授权数量
            license_count = db.query(License).filter(License.user_id == user_id).count()
            
            user_data = user.to_dict()
            user_data['wallet'] = wallet_info
            user_data['transaction_count'] = transaction_count
            user_data['license_count'] = license_count
            
            return jsonify({
                'success': True,
                'user': user_data
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取用户详情错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users', methods=['POST'])
@require_admin
def create_user():
    """
    手动创建用户
    
    POST /api/admin/users
    Body: {
        "email": "test@example.com",
        "phone": "13800138000",  // 可选
        "nickname": "测试用户",
        "password": "password123",
        "role": "user",  // 'user', 'creator' 或 'admin'
        "balance": 0  // 可选，初始积分
    }
    """
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip() or None
        nickname = data.get('nickname', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user')
        balance = int(data.get('balance', 0))
        
        # 验证必填字段
        if not email:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '邮箱不能为空'
            }), 400
        
        if not nickname:
            nickname = f'用户_{email.split("@")[0]}'
        
        if role not in ['user', 'creator', 'admin']:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '角色只能是 user、creator 或 admin'
            }), 400
        
        db = get_db_session()
        try:
            # 检查邮箱是否已存在
            existing_email = db.query(User).filter(User.email == email).first()
            if existing_email:
                return jsonify({
                    'success': False,
                    'error': '邮箱已存在',
                    'message': f'邮箱 {email} 已被注册'
                }), 400
            
            # 检查手机号是否已存在
            if phone:
                existing_phone = db.query(User).filter(User.phone == phone).first()
                if existing_phone:
                    return jsonify({
                        'success': False,
                        'error': '手机号已存在',
                        'message': f'手机号 {phone} 已被注册'
                    }), 400
            
            # 导入密码加密函数
            from utils.password_helper import hash_password
            
            # 创建用户
            user = User(
                email=email,
                phone=phone,
                nickname=nickname,
                password_hash=hash_password(password) if password else None,
                role=role,
                balance=balance,
                status='active'
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # 创建钱包
            wallet = Wallet(
                user_id=user.id,
                balance=balance
            )
            db.add(wallet)
            db.commit()
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'create_user',
                target_type='user',
                target_id=user.id,
                target_name=nickname or email,
                details={
                    'email': email,
                    'phone': phone,
                    'role': role,
                    'initial_balance': balance
                }
            )
            
            admin_id = g.current_user_id
            print(f'[ADMIN] 管理员 {admin_id} 创建用户: {email} (ID: {user.id})')
            
            return jsonify({
                'success': True,
                'user': user.to_dict(),
                'message': '用户创建成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'创建用户错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@require_admin
def update_user(user_id):
    """
    更新用户信息
    
    PUT /api/admin/users/<user_id>
    Body: {
        "email": "new@example.com",
        "phone": "13800138000",
        "nickname": "新昵称",
        "role": "creator",
        "status": "active",  // 'active', 'banned', 'suspended'
        "password": "newpassword"  // 可选，如果提供则重置密码
    }
    """
    try:
        data = request.get_json()
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            # 更新邮箱
            if 'email' in data and data['email']:
                new_email = data['email'].strip()
                if new_email != user.email:
                    existing = db.query(User).filter(User.email == new_email).first()
                    if existing:
                        return jsonify({
                            'success': False,
                            'error': '邮箱已存在',
                            'message': f'邮箱 {new_email} 已被使用'
                        }), 400
                    user.email = new_email
            
            # 更新手机号
            if 'phone' in data:
                new_phone = data['phone'].strip() if data['phone'] else None
                if new_phone and new_phone != user.phone:
                    existing = db.query(User).filter(User.phone == new_phone).first()
                    if existing:
                        return jsonify({
                            'success': False,
                            'error': '手机号已存在',
                            'message': f'手机号 {new_phone} 已被使用'
                        }), 400
                user.phone = new_phone
            
            # 更新昵称
            if 'nickname' in data and data['nickname']:
                user.nickname = data['nickname'].strip()
            
            # 更新角色
            if 'role' in data:
                if data['role'] not in ['user', 'creator', 'admin']:
                    return jsonify({
                        'success': False,
                        'error': '参数错误',
                        'message': '角色只能是 user、creator 或 admin'
                    }), 400
                user.role = data['role']
            
            # 更新状态
            if 'status' in data:
                if data['status'] not in ['active', 'banned', 'suspended']:
                    return jsonify({
                        'success': False,
                        'error': '参数错误',
                        'message': '状态只能是 active、banned 或 suspended'
                    }), 400
                user.status = data['status']
            
            # 重置密码
            if 'password' in data and data['password']:
                from utils.password_helper import hash_password
                user.password_hash = hash_password(data['password'])
            
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'edit_user',
                target_type='user',
                target_id=user_id,
                target_name=user.nickname or user.email,
                details={
                    'updated_fields': list(data.keys())
                }
            )
            
            admin_id = g.current_user_id
            print(f'[ADMIN] 管理员 {admin_id} 更新用户 {user_id} 信息')
            
            return jsonify({
                'success': True,
                'user': user.to_dict(),
                'message': '用户信息更新成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'更新用户错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    """
    删除用户
    
    DELETE /api/admin/users/<user_id>
    """
    try:
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            # 不能删除自己
            if user_id == g.current_user_id:
                return jsonify({
                    'success': False,
                    'error': '操作不允许',
                    'message': '不能删除自己的账号'
                }), 400
            
            # 记录被删除的用户信息
            deleted_email = user.email
            deleted_nickname = user.nickname
            deleted_role = user.role
            deleted_balance = user.balance
            
            # 记录日志（在删除之前）
            log_admin_action(
                db, g.current_user, 'delete_user',
                target_type='user',
                target_id=user_id,
                target_name=deleted_nickname or deleted_email,
                details={
                    'email': deleted_email,
                    'nickname': deleted_nickname,
                    'role': deleted_role,
                    'balance': deleted_balance
                }
            )
            
            # 删除用户（相关数据会因为 CASCADE 自动删除）
            db.delete(user)
            db.commit()
            
            admin_id = g.current_user_id
            print(f'[ADMIN] 管理员 {admin_id} 删除用户: {deleted_email} (ID: {user_id}, 昵称: {deleted_nickname})')
            
            return jsonify({
                'success': True,
                'message': f'用户 {deleted_nickname} 已删除'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'删除用户错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>/set-balance', methods=['POST'])
@require_admin
def set_user_balance(user_id):
    """
    直接设置用户余额（用于测试或特殊情况）
    
    POST /api/admin/users/<user_id>/set-balance
    Body: {
        "balance": 1000,
        "reason": "系统初始化"
    }
    """
    try:
        data = request.get_json()
        new_balance = int(data.get('balance', 0))
        reason = data.get('reason', '管理员设置')
        
        if new_balance < 0:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '余额不能为负数'
            }), 400
        
        db = get_db_session()
        try:
            db.begin()
            
            user = db.query(User).filter(User.id == user_id).with_for_update().first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            balance_before = user.balance or 0
            amount = new_balance - balance_before
            
            # 更新用户余额
            user.balance = new_balance
            
            # 同时更新钱包表
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            if wallet:
                wallet.balance = new_balance
            else:
                wallet = Wallet(user_id=user_id, balance=new_balance)
                db.add(wallet)
            
            # 记录交易流水
            transaction = Transaction(
                user_id=user_id,
                amount=amount,
                type='SET_BALANCE',
                status='completed',
                balance_before=balance_before,
                balance_after=new_balance,
                description=f'[管理员设置] {reason}',
                ip_address=get_client_ip(),
                completed_at=datetime.utcnow()
            )
            db.add(transaction)
            
            db.commit()
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'set_balance',
                target_type='user',
                target_id=user_id,
                target_name=user.nickname or user.email,
                details={
                    'balance_before': balance_before,
                    'balance_after': new_balance,
                    'reason': reason
                }
            )
            
            admin_id = g.current_user_id
            print(f'[ADMIN] 管理员 {admin_id} 设置用户 {user_id} 余额: {balance_before} -> {new_balance}, 原因: {reason}')
            
            return jsonify({
                'success': True,
                'user_id': user_id,
                'balance_before': balance_before,
                'balance_after': new_balance,
                'message': f'成功设置用户余额为 {new_balance}'
            })
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
            
    except Exception as e:
        print(f'设置用户余额错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/users/<int:user_id>/transactions', methods=['GET'])
@require_admin
def get_user_transactions(user_id):
    """
    获取用户交易记录
    
    GET /api/admin/users/<user_id>/transactions?limit=20&offset=0
    """
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        db = get_db_session()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': '用户不存在',
                    'message': f'未找到用户 {user_id}'
                }), 404
            
            query = db.query(Transaction).filter(Transaction.user_id == user_id)
            total = query.count()
            transactions = query.order_by(desc(Transaction.created_at)).limit(limit).offset(offset).all()
            
            return jsonify({
                'success': True,
                'transactions': [t.to_dict() for t in transactions],
                'total': total,
                'limit': limit,
                'offset': offset
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取用户交易记录错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


# ==================== 游戏管理 ====================

@admin_bp.route('/games', methods=['GET'])
@require_admin
def list_games():
    """
    获取游戏列表（管理员）
    
    GET /api/admin/games
    """
    try:
        db = get_db_session()
        try:
            games = db.query(Game).order_by(Game.sort_order, Game.id).all()
            
            return jsonify({
                'success': True,
                'games': [g.to_dict() for g in games],
                'total': len(games)
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取游戏列表错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/games', methods=['POST'])
@require_admin
def create_game():
    """
    创建游戏
    
    POST /api/admin/games
    Body: {
        "id": "fortune-teller",
        "name": "AI 占卜师",
        "cover_url": "...",
        "description": "...",
        "price": 500,
        "duration_days": 30,
        "status": "published"
    }
    """
    try:
        data = request.get_json()
        
        game_id = data.get('id')
        if not game_id:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '缺少游戏ID'
            }), 400
        
        db = get_db_session()
        try:
            # 检查是否已存在
            existing = db.query(Game).filter(Game.id == game_id).first()
            if existing:
                return jsonify({
                    'success': False,
                    'error': '游戏已存在',
                    'message': f'游戏 {game_id} 已存在'
                }), 400
            
            # 创建游戏
            game = Game(
                id=game_id,
                name=data.get('name', game_id),
                cover_url=data.get('cover_url'),
                description=data.get('description'),
                price=int(data.get('price', 0)),
                duration_days=int(data.get('duration_days', 30)),
                status=data.get('status', 'draft'),
                category=data.get('category'),
                tags=json.dumps(data.get('tags', [])),
                sort_order=int(data.get('sort_order', 0))
            )
            db.add(game)
            db.commit()
            db.refresh(game)
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'create_game',
                target_type='game',
                target_id=game_id,
                target_name=data.get('name', game_id),
                details={
                    'price': data.get('price'),
                    'status': data.get('status', 'draft')
                }
            )
            
            print(f'[ADMIN] 创建游戏: {game_id}')
            
            return jsonify({
                'success': True,
                'game': game.to_dict(),
                'message': '游戏创建成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'创建游戏错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/games/<game_id>', methods=['PUT'])
@require_admin
def update_game(game_id):
    """
    更新游戏
    
    PUT /api/admin/games/<game_id>
    Body: {
        "name": "...",
        "price": 600,
        "duration_days": 30,
        "status": "published"
    }
    """
    try:
        data = request.get_json()
        
        db = get_db_session()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            if not game:
                return jsonify({
                    'success': False,
                    'error': '游戏不存在',
                    'message': f'未找到游戏 {game_id}'
                }), 404
            
            # 更新字段
            if 'name' in data:
                game.name = data['name']
            if 'cover_url' in data:
                game.cover_url = data['cover_url']
            if 'description' in data:
                game.description = data['description']
            if 'price' in data:
                game.price = int(data['price'])
            if 'duration_days' in data:
                game.duration_days = int(data['duration_days'])
            if 'status' in data:
                game.status = data['status']
            if 'category' in data:
                game.category = data['category']
            if 'tags' in data:
                game.tags = json.dumps(data['tags'])
            if 'sort_order' in data:
                game.sort_order = int(data['sort_order'])
            
            game.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(game)
            
            # 记录日志
            log_admin_action(
                db, g.current_user, 'edit_game',
                target_type='game',
                target_id=game_id,
                target_name=game.name,
                details={
                    'updated_fields': list(data.keys())
                }
            )
            
            print(f'[ADMIN] 更新游戏: {game_id}')
            
            return jsonify({
                'success': True,
                'game': game.to_dict(),
                'message': '游戏更新成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'更新游戏错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/games/<game_id>', methods=['DELETE'])
@require_admin
def delete_game(game_id):
    """
    删除游戏
    
    DELETE /api/admin/games/<game_id>
    """
    try:
        db = get_db_session()
        try:
            game = db.query(Game).filter(Game.id == game_id).first()
            if not game:
                return jsonify({
                    'success': False,
                    'error': '游戏不存在',
                    'message': f'未找到游戏 {game_id}'
                }), 404
            
            game_name = game.name
            
            # 记录日志（在删除之前）
            log_admin_action(
                db, g.current_user, 'delete_game',
                target_type='game',
                target_id=game_id,
                target_name=game_name,
                details={}
            )
            
            db.delete(game)
            db.commit()
            
            print(f'[ADMIN] 删除游戏: {game_id}')
            
            return jsonify({
                'success': True,
                'message': '游戏删除成功'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'删除游戏错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


# ==================== 统计数据 ====================

@admin_bp.route('/stats', methods=['GET'])
@require_admin
def get_stats():
    """
    获取系统统计数据
    
    GET /api/admin/stats
    """
    try:
        db = get_db_session()
        try:
            # 用户统计
            total_users = db.query(User).count()
            admin_count = db.query(User).filter(User.role == 'admin').count()
            
            # 游戏统计
            total_games = db.query(Game).count()
            published_games = db.query(Game).filter(Game.status == 'published').count()
            
            # 授权统计
            total_licenses = db.query(License).count()
            active_licenses = db.query(License).filter(License.status == 'active').count()
            
            # 交易统计
            from sqlalchemy import func
            total_transactions = db.query(Transaction).count()
            total_recharge = db.query(func.sum(Transaction.amount)).filter(
                Transaction.type == 'DEPOSIT',
                Transaction.status == 'completed'
            ).scalar() or 0
            
            return jsonify({
                'success': True,
                'stats': {
                    'users': {
                        'total': total_users,
                        'admins': admin_count
                    },
                    'games': {
                        'total': total_games,
                        'published': published_games
                    },
                    'licenses': {
                        'total': total_licenses,
                        'active': active_licenses
                    },
                    'transactions': {
                        'total': total_transactions,
                        'total_recharge': total_recharge
                    }
                }
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取统计数据错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


# ==================== 管理日志 ====================

@admin_bp.route('/logs', methods=['GET'])
@require_admin
def get_admin_logs():
    """
    获取管理员操作日志
    
    GET /api/admin/logs?limit=50&offset=0&action=&admin_id=&target_type=
    """
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        action_filter = request.args.get('action', '')
        admin_id_filter = request.args.get('admin_id', '')
        target_type_filter = request.args.get('target_type', '')
        
        db = get_db_session()
        try:
            query = db.query(AdminLog)
            
            # 过滤条件
            if action_filter:
                query = query.filter(AdminLog.action == action_filter)
            if admin_id_filter:
                query = query.filter(AdminLog.admin_id == int(admin_id_filter))
            if target_type_filter:
                query = query.filter(AdminLog.target_type == target_type_filter)
            
            total = query.count()
            logs = query.order_by(desc(AdminLog.created_at)).limit(limit).offset(offset).all()
            
            return jsonify({
                'success': True,
                'logs': [log.to_dict() for log in logs],
                'total': total,
                'limit': limit,
                'offset': offset
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取管理日志错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@admin_bp.route('/logs/actions', methods=['GET'])
@require_admin
def get_log_action_types():
    """
    获取所有操作类型（用于筛选）
    
    GET /api/admin/logs/actions
    """
    # 定义所有操作类型
    action_types = [
        {'value': 'login', 'label': '管理员登录'},
        {'value': 'create_user', 'label': '创建用户'},
        {'value': 'edit_user', 'label': '编辑用户'},
        {'value': 'delete_user', 'label': '删除用户'},
        {'value': 'adjust_balance', 'label': '调整余额'},
        {'value': 'set_balance', 'label': '设置余额'},
        {'value': 'set_role', 'label': '设置角色'},
        {'value': 'create_game', 'label': '创建游戏'},
        {'value': 'edit_game', 'label': '编辑游戏'},
        {'value': 'delete_game', 'label': '删除游戏'},
    ]
    
    return jsonify({
        'success': True,
        'actions': action_types
    })


if __name__ == '__main__':
    print('管理员路由模块')
    print('可用端点:')
    print('  GET  /api/admin/users - 获取用户列表')
    print('  POST /api/admin/users/<id>/adjust-balance - 调整用户余额')
    print('  POST /api/admin/users/<id>/set-role - 设置用户角色')
    print('  GET  /api/admin/games - 获取游戏列表')
    print('  POST /api/admin/games - 创建游戏')
    print('  PUT  /api/admin/games/<id> - 更新游戏')
    print('  DELETE /api/admin/games/<id> - 删除游戏')
    print('  GET  /api/admin/stats - 获取统计数据')
    print('  GET  /api/admin/logs - 获取管理日志')

