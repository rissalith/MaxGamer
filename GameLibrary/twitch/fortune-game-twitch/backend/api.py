"""
Miko Fortune Twitch 版 - API 路由
提供直播间连接和游戏数据接口
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
import sys
import os

# 添加路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))))

# 尝试导入服务（如果失败也不影响蓝图注册）
try:
    from services import TwitchLiveService, get_twitch_live_service
    SERVICES_AVAILABLE = True
except ImportError as e:
    print(f'[Twitch Fortune] 服务模块导入失败: {e}')
    TwitchLiveService = None
    get_twitch_live_service = None
    SERVICES_AVAILABLE = False

# 创建蓝图
fortune_twitch_bp = Blueprint('fortune_twitch', __name__, url_prefix='/api/fortune-twitch')

# 全局服务实例
_live_service = None


def get_live_service():
    """获取直播服务实例"""
    global _live_service
    if not SERVICES_AVAILABLE:
        raise ImportError('Twitch服务模块不可用')
    if _live_service is None:
        _live_service = get_twitch_live_service()
    return _live_service


def init_fortune_twitch(socketio):
    """初始化 Fortune Twitch 模块"""
    global _live_service
    if not SERVICES_AVAILABLE:
        print('[Twitch Fortune] 服务不可用,跳过初始化')
        return
    from services import init_twitch_live_service
    _live_service = init_twitch_live_service(socketio)
    print('[Fortune Twitch] 初始化完成')
    return _live_service


# ==================== 认证装饰器 ====================

def require_auth(f):
    """认证装饰器"""
    from functools import wraps

    # 导入主项目的 JWT 验证
    try:
        from MaxGamer.backend.utils.jwt_helper import verify_access_token
    except ImportError:
        # 备用导入路径
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../MaxGamer/backend'))
        from utils.jwt_helper import verify_access_token

    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({
                'success': False,
                'error': '未授权',
                'message': '请提供认证令牌'
            }), 401

        # 去掉 Bearer 前缀
        if token.startswith('Bearer '):
            token = token[7:]

        payload = verify_access_token(token)
        if not payload:
            return jsonify({
                'success': False,
                'error': '认证失败',
                'message': '令牌无效或已过期'
            }), 401

        g.current_user_id = payload['user_id']
        return f(*args, **kwargs)

    return decorated_function


# ==================== 直播 API ====================

@fortune_twitch_bp.route('/live/start', methods=['POST'])
@require_auth
def start_live():
    """
    开始监听 Twitch 直播

    POST /api/fortune-twitch/live/start
    Headers: Authorization: Bearer <token>
    Body (可选):
    {
        "channel": "override_channel"  // 可选，默认使用绑定的频道
    }

    会自动获取用户绑定的 Twitch 凭证
    """
    try:
        user_id = g.current_user_id
        data = request.get_json() or {}

        # 获取用户的 Twitch 绑定凭证
        credentials = _get_user_twitch_credentials(user_id)

        if not credentials:
            return jsonify({
                'success': False,
                'error': '未绑定',
                'message': '请先在设置中绑定 Twitch 账号'
            }), 400

        # 使用绑定的频道或自定义频道
        channel = data.get('channel') or credentials['username']
        oauth_token = credentials['access_token']
        username = credentials['username']

        # 启动直播监听
        service = get_live_service()
        result = service.start_live(
            user_id=user_id,
            channel=channel,
            oauth_token=oauth_token,
            username=username
        )

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f'[Fortune Twitch] 启动直播监听失败: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@fortune_twitch_bp.route('/live/stop', methods=['POST'])
@require_auth
def stop_live():
    """
    停止监听 Twitch 直播

    POST /api/fortune-twitch/live/stop
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id

        service = get_live_service()
        result = service.stop_live(user_id)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f'[Fortune Twitch] 停止直播监听失败: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@fortune_twitch_bp.route('/live/status', methods=['GET'])
@require_auth
def get_live_status():
    """
    获取直播监听状态

    GET /api/fortune-twitch/live/status
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id

        service = get_live_service()
        status = service.get_status(user_id)

        return jsonify({
            'success': True,
            **status
        })

    except Exception as e:
        print(f'[Fortune Twitch] 获取状态失败: {e}')
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


@fortune_twitch_bp.route('/binding/check', methods=['GET'])
@require_auth
def check_binding():
    """
    检查用户是否已绑定 Twitch 账号

    GET /api/fortune-twitch/binding/check
    Headers: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user_id
        print(f'[Fortune Twitch] 检查绑定状态 - user_id: {user_id}')

        credentials = _get_user_twitch_credentials(user_id)

        if credentials:
            print(f'[Fortune Twitch] 绑定检查成功 - 返回用户 {credentials["username"]} 的凭证')
            return jsonify({
                'success': True,
                'bound': True,
                'username': credentials['username'],
                'display_name': credentials['display_name'],
                'avatar_url': credentials['avatar_url']
            })
        else:
            print(f'[Fortune Twitch] 绑定检查失败 - 用户 {user_id} 未绑定 Twitch')
            return jsonify({
                'success': True,
                'bound': False,
                'message': '请先绑定 Twitch 账号'
            })

    except Exception as e:
        print(f'[Fortune Twitch] 检查绑定状态失败: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': '服务器错误',
            'message': str(e)
        }), 500


# ==================== 辅助函数 ====================

def _refresh_twitch_token(binding, db):
    """
    刷新 Twitch access token

    Args:
        binding: PlatformBinding 对象
        db: 数据库会话

    Returns:
        bool: 刷新是否成功
    """
    import requests

    try:
        # Twitch OAuth 配置
        client_id = '3tfkf4ohu90fmn5v6r339cgim5task'
        client_secret = os.getenv('TWITCH_CLIENT_SECRET')

        if not client_secret:
            print('[Fortune Twitch] 缺少 TWITCH_CLIENT_SECRET 环境变量')
            return False

        # 请求新的 access token
        response = requests.post('https://id.twitch.tv/oauth2/token', data={
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': binding.refresh_token
        })

        if response.status_code != 200:
            print(f'[Fortune Twitch] Token刷新请求失败: {response.status_code}, {response.text}')
            return False

        data = response.json()
        new_access_token = data.get('access_token')
        new_refresh_token = data.get('refresh_token')  # Twitch 可能会返回新的 refresh_token
        expires_in = data.get('expires_in', 3600)

        # 更新数据库
        binding.access_token = new_access_token
        if new_refresh_token:
            binding.refresh_token = new_refresh_token
        binding.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        db.commit()

        print(f'[Fortune Twitch] Token刷新成功，新过期时间: {binding.token_expires_at}')
        return True

    except Exception as e:
        print(f'[Fortune Twitch] Token刷新异常: {e}')
        import traceback
        traceback.print_exc()
        return False


def _get_user_twitch_credentials(user_id: int) -> dict:
    """
    获取用户的 Twitch 凭证

    从 MaxGamer 主数据库查询用户绑定的 Twitch 信息
    """
    print(f'[Fortune Twitch DEBUG] 开始查询用户 {user_id} 的 Twitch 凭证')

    try:
        # 导入主项目的数据库模块
        try:
            from MaxGamer.backend.database import get_db_session, PlatformBinding
            print(f'[Fortune Twitch DEBUG] 成功导入 MaxGamer.backend.database')
        except ImportError as import_err:
            print(f'[Fortune Twitch DEBUG] 导入 MaxGamer.backend.database 失败: {import_err}')
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../MaxGamer/backend'))
            from database import get_db_session, PlatformBinding
            print(f'[Fortune Twitch DEBUG] 使用备用导入路径成功')

        db = get_db_session()
        print(f'[Fortune Twitch DEBUG] 获取数据库会话成功')

        try:
            # 查询所有该用户的绑定记录（用于调试）
            all_bindings = db.query(PlatformBinding).filter(
                PlatformBinding.user_id == user_id
            ).all()
            print(f'[Fortune Twitch DEBUG] 用户 {user_id} 共有 {len(all_bindings)} 条平台绑定记录')
            for b in all_bindings:
                print(f'[Fortune Twitch DEBUG]   - {b.platform}: username={b.platform_username}, active={b.is_active}')

            # 查询 Twitch 绑定
            binding = db.query(PlatformBinding).filter(
                PlatformBinding.user_id == user_id,
                PlatformBinding.platform == 'twitch',
                PlatformBinding.is_active == True
            ).first()

            print(f'[Fortune Twitch DEBUG] Twitch绑定查询结果: {binding}')

            if not binding:
                print(f'[Fortune Twitch DEBUG] 未找到用户 {user_id} 的活跃 Twitch 绑定')
                return None

            # 检查 token 是否过期
            print(f'[Fortune Twitch DEBUG] token_expires_at: {binding.token_expires_at}')
            if binding.token_expires_at:
                now = datetime.utcnow()
                print(f'[Fortune Twitch DEBUG] 当前UTC时间: {now}')
                if binding.token_expires_at < now:
                    print(f'[Fortune Twitch] 用户 {user_id} 的 Twitch token 已过期，尝试刷新...')

                    # 尝试使用 refresh_token 刷新
                    if binding.refresh_token:
                        refreshed = _refresh_twitch_token(binding, db)
                        if not refreshed:
                            print(f'[Fortune Twitch] Token刷新失败')
                            return None
                        print(f'[Fortune Twitch] Token刷新成功')
                    else:
                        print(f'[Fortune Twitch] 没有 refresh_token，无法刷新')
                        return None
                else:
                    print(f'[Fortune Twitch DEBUG] Token未过期，剩余 {binding.token_expires_at - now}')

            result = {
                'user_id': binding.platform_user_id,
                'username': binding.platform_username,
                'display_name': binding.platform_display_name,
                'avatar_url': binding.platform_avatar_url,
                'access_token': binding.access_token,
                'refresh_token': binding.refresh_token,
                'scope': binding.scope
            }
            print(f'[Fortune Twitch DEBUG] 成功返回凭证: username={result["username"]}')
            return result

        finally:
            db.close()

    except Exception as e:
        print(f'[Fortune Twitch] 获取 Twitch 凭证失败: {e}')
        import traceback
        traceback.print_exc()
        return None


# ==================== 游戏数据 API ====================

@fortune_twitch_bp.route('/game/info', methods=['GET'])
def get_game_info():
    """
    获取游戏信息

    GET /api/fortune-twitch/game/info
    """
    return jsonify({
        'success': True,
        'game': {
            'id': 'fortune-game-twitch',
            'name': 'Miko Fortune',
            'platform': 'twitch',
            'version': '1.0.0',
            'description': 'Twitch 直播互动抽奖游戏',
            'features': [
                '实时聊天互动',
                '订阅事件触发',
                'Raid 事件触发',
                '自定义奖品池'
            ]
        }
    })


# ==================== 蓝图导出 ====================

def get_blueprint():
    """返回蓝图实例供游戏管理器注册"""
    return fortune_twitch_bp


if __name__ == '__main__':
    print('Miko Fortune Twitch API 模块')
    print('可用端点:')
    print('  POST /api/fortune-twitch/live/start - 开始监听直播')
    print('  POST /api/fortune-twitch/live/stop - 停止监听')
    print('  GET  /api/fortune-twitch/live/status - 获取状态')
    print('  GET  /api/fortune-twitch/binding/check - 检查 Twitch 绑定')
    print('  GET  /api/fortune-twitch/game/info - 获取游戏信息')
