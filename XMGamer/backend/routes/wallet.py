"""
钱包管理API路由
处理点数充值、查询、交易记录等操作
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
from sqlalchemy import desc
import sys
import os
import uuid

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, User, Wallet, Transaction, Product, License
from utils.jwt_helper import verify_access_token

# 创建蓝图
wallet_bp = Blueprint('wallet', __name__, url_prefix='/api/wallet')


# ==================== 辅助函数 ====================

def get_client_ip():
    """获取客户端IP地址"""
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0]
    return request.remote_addr or ''


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
        
        # 移除 "Bearer " 前缀
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_access_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'error': '认证失败',
                'message': '令牌无效或已过期'
            }), 401
        
        # 将用户信息添加到请求上下文
        g.current_user_id = payload['user_id']
        
        return f(*args, **kwargs)
    
    return decorated_function


def generate_order_id():
    """生成订单号"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = uuid.uuid4().hex[:8].upper()
    return f'ORD{timestamp}{random_str}'


def get_or_create_wallet(db, user_id):
    """获取或创建用户钱包，并同步用户表余额"""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not wallet:
        # 创建钱包，使用用户表的余额（如果有）
        initial_balance = user.balance if user and user.balance else 0
        wallet = Wallet(
            user_id=user_id,
            balance=initial_balance,
            frozen_balance=0,
            total_recharged=initial_balance,
            total_consumed=0
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    else:
        # 同步：确保用户表和钱包表余额一致
        if user and user.balance != wallet.balance:
            user.balance = wallet.balance
            db.commit()
    
    return wallet


# ==================== API端点 ====================

@wallet_bp.route('', methods=['GET'])
@require_auth
def get_wallet():
    """
    获取钱包信息
    
    GET /api/wallet
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id
        
        db = get_db_session()
        try:
            wallet = get_or_create_wallet(db, user_id)
            
            return jsonify({
                'success': True,
                'wallet': wallet.to_dict()
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'获取钱包信息错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@wallet_bp.route('/recharge', methods=['POST'])
@require_auth
def create_recharge_order():
    """
    创建充值订单
    
    POST /api/wallet/recharge
    Headers: Authorization: Bearer <token>
    Body: {
        "product_id": "recharge_100",
        "payment_method": "stripe"  // stripe/wechat/alipay
    }
    """
    try:
        user_id = g.current_user_id
        data = request.get_json()
        
        product_id = data.get('product_id')
        payment_method = data.get('payment_method', 'stripe')
        
        if not product_id:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '缺少商品ID'
            }), 400
        
        db = get_db_session()
        try:
            # 查询商品
            product = db.query(Product).filter(
                Product.id == product_id,
                Product.category == 'recharge',
                Product.is_active == True
            ).first()
            
            if not product:
                return jsonify({
                    'success': False,
                    'error': '商品不存在',
                    'message': '充值套餐不存在或已下架'
                }), 404
            
            # 获取钱包
            wallet = get_or_create_wallet(db, user_id)
            
            # 生成订单号
            order_id = generate_order_id()
            
            # 创建交易记录（待支付状态）
            transaction = Transaction(
                user_id=user_id,
                amount=product.price,
                type='DEPOSIT',
                status='pending',
                product_id=product_id,
                product_name=product.name,
                order_id=order_id,
                payment_method=payment_method,
                balance_before=wallet.balance,
                balance_after=wallet.balance,  # 支付成功后更新
                description=f'充值 {product.name}',
                ip_address=get_client_ip()
            )
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            
            # TODO: 集成真实支付接口
            # 这里返回支付URL，前端跳转到支付页面
            payment_url = f'/payment.html?order_id={order_id}&method={payment_method}'
            
            print(f'[OK] 用户 {user_id} 创建充值订单: {order_id}, 金额: {product.price}点')
            
            return jsonify({
                'success': True,
                'order_id': order_id,
                'transaction_id': transaction.id,
                'payment_url': payment_url,
                'amount': product.price,
                'price_cny': product.price_cny,
                'product_name': product.name,
                'message': '充值订单已创建'
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'创建充值订单错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@wallet_bp.route('/recharge/complete', methods=['POST'])
@require_auth
def complete_recharge():
    """
    完成充值（模拟支付成功回调）
    
    POST /api/wallet/recharge/complete
    Headers: Authorization: Bearer <token>
    Body: {
        "order_id": "ORD20250125123456",
        "payment_id": "pi_xxx"  // 第三方支付ID
    }
    """
    try:
        user_id = g.current_user_id
        data = request.get_json()
        
        order_id = data.get('order_id')
        payment_id = data.get('payment_id', '')
        
        if not order_id:
            return jsonify({
                'success': False,
                'error': '参数错误',
                'message': '缺少订单号'
            }), 400
        
        db = get_db_session()
        try:
            # 开始事务
            db.begin()
            
            # 查询交易记录
            transaction = db.query(Transaction).filter(
                Transaction.order_id == order_id,
                Transaction.user_id == user_id,
                Transaction.type == 'DEPOSIT'
            ).with_for_update().first()
            
            if not transaction:
                return jsonify({
                    'success': False,
                    'error': '订单不存在',
                    'message': '未找到充值订单'
                }), 404
            
            status_val: str = transaction.status  # type: ignore
            if status_val == 'completed':
                return jsonify({
                    'success': False,
                    'error': '订单已完成',
                    'message': '该订单已经完成充值'
                }), 400
            
            # 锁定钱包
            wallet = db.query(Wallet).filter(
                Wallet.user_id == user_id
            ).with_for_update().first()
            
            if not wallet:
                wallet = Wallet(user_id=user_id, balance=0)
                db.add(wallet)
                db.flush()
            
            # 更新余额
            amount_val: int = transaction.amount  # type: ignore
            wallet.balance = wallet.balance + amount_val  # type: ignore
            wallet.total_recharged = wallet.total_recharged + amount_val  # type: ignore
            
            # 同步用户表余额
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.balance = wallet.balance
            
            # 更新交易记录
            transaction.status = 'completed'  # type: ignore
            transaction.payment_id = payment_id  # type: ignore
            transaction.balance_after = wallet.balance  # type: ignore
            transaction.completed_at = datetime.utcnow()  # type: ignore
            
            db.commit()
            
            print(f'[OK] 用户 {user_id} 充值成功: +{transaction.amount}点, 余额: {wallet.balance}')
            
            return jsonify({
                'success': True,
                'transaction_id': transaction.id,
                'amount': transaction.amount,
                'balance': wallet.balance,
                'message': '充值成功'
            })
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
            
    except Exception as e:
        print(f'完成充值错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@wallet_bp.route('/transactions', methods=['GET'])
@require_auth
def get_transactions():
    """
    获取交易历史
    
    GET /api/wallet/transactions?type=PURCHASE&limit=20&offset=0
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id
        
        # 获取查询参数
        trans_type = request.args.get('type')  # DEPOSIT/PURCHASE/REFUND/REWARD
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        db = get_db_session()
        try:
            # 构建查询
            query = db.query(Transaction).filter(Transaction.user_id == user_id)
            
            if trans_type:
                query = query.filter(Transaction.type == trans_type)
            
            # 获取总数
            total = query.count()
            
            # 分页查询
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
        print(f'获取交易历史错误: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print('钱包管理路由模块')
    print('可用端点:')
    print('  GET  /api/wallet - 获取钱包信息')
    print('  POST /api/wallet/recharge - 创建充值订单')
    print('  POST /api/wallet/recharge/complete - 完成充值')
    print('  GET  /api/wallet/transactions - 获取交易历史')