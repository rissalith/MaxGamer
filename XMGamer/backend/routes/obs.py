"""
OBS 鉴权API路由
处理 OBS 浏览器源的游戏访问验证
"""

from flask import Blueprint, request, jsonify, render_template_string
from datetime import datetime
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, User, License, Game

# 创建蓝图
obs_bp = Blueprint('obs', __name__, url_prefix='/play')


# 过期/未授权的错误页面 HTML
ERROR_PAGE_HTML = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Unavailable</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 500px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 16px;
            background: linear-gradient(90deg, #e94560, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        p {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .error-code {
            font-family: monospace;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.4);
            background: rgba(0, 0, 0, 0.3);
            padding: 8px 16px;
            border-radius: 8px;
            display: inline-block;
        }
        .renew-hint {
            margin-top: 20px;
            font-size: 14px;
            color: #4ecdc4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔒</div>
        <h1>{{ title }}</h1>
        <p>{{ message }}</p>
        {% if error_code %}
        <div class="error-code">Error: {{ error_code }}</div>
        {% endif %}
        {% if show_renew %}
        <p class="renew-hint">请访问 MaxGamer 平台续费您的服务</p>
        {% endif %}
    </div>
</body>
</html>
'''

# 成功验证后的重定向页面
SUCCESS_PAGE_HTML = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading Game...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: #fff;
        }
        .loader {
            text-align: center;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>正在加载游戏...</p>
    </div>
    <script>
        // 跳转到实际游戏页面
        window.location.href = '{{ game_url }}';
    </script>
</body>
</html>
'''


@obs_bp.route('/<game_id>', methods=['GET'])
def play_game(game_id):
    """
    OBS 鉴权接口
    
    当 OBS 浏览器源加载 https://maxgamer.com/play/fortune-teller?user=123 时：
    1. 查询 user_licenses 表
    2. 检查授权是否有效
    3. 有效则返回游戏画面，无效则返回错误画面
    
    GET /play/<game_id>?user=<user_id>&token=<optional_token>
    """
    try:
        # 获取用户标识（可以是 user_id 或 token）
        user_id = request.args.get('user')
        token = request.args.get('token')
        
        if not user_id and not token:
            return render_template_string(ERROR_PAGE_HTML,
                title='参数缺失',
                message='请提供用户标识 (user) 或访问令牌 (token)',
                error_code='MISSING_AUTH',
                show_renew=False
            ), 400
        
        db = get_db_session()
        try:
            # 查询游戏信息
            game = db.query(Game).filter(Game.id == game_id).first()
            
            # 如果游戏表中没有，尝试从旧的方式获取（兼容）
            game_name = game.name if game else game_id
            
            # 解析用户ID
            actual_user_id = None
            if user_id:
                try:
                    actual_user_id = int(user_id)
                except ValueError:
                    # 可能是用户名，尝试查询
                    user = db.query(User).filter(
                        (User.nickname == user_id) | (User.email == user_id)
                    ).first()
                    if user:
                        actual_user_id = user.id
            
            if not actual_user_id:
                return render_template_string(ERROR_PAGE_HTML,
                    title='用户不存在',
                    message='未找到指定的用户账号',
                    error_code='USER_NOT_FOUND',
                    show_renew=False
                ), 404
            
            # 查询授权记录
            license = db.query(License).filter(
                License.user_id == actual_user_id,
                License.game_id == game_id
            ).first()
            
            if not license:
                return render_template_string(ERROR_PAGE_HTML,
                    title='未购买服务',
                    message=f'您尚未购买 {game_name}，请前往 MaxGamer 平台购买',
                    error_code='NO_LICENSE',
                    show_renew=True
                ), 403
            
            # 检查授权状态
            if license.status == 'revoked':
                return render_template_string(ERROR_PAGE_HTML,
                    title='授权已撤销',
                    message='您的服务授权已被撤销，请联系客服',
                    error_code='LICENSE_REVOKED',
                    show_renew=False
                ), 403
            
            # 检查过期时间
            if license.expires_at is not None:
                if license.expires_at < datetime.utcnow():
                    # 更新状态为过期
                    license.status = 'expired'
                    db.commit()
                    
                    return render_template_string(ERROR_PAGE_HTML,
                        title='服务已过期',
                        message=f'您的 {game_name} 服务已于 {license.expires_at.strftime("%Y-%m-%d")} 过期，请续费',
                        error_code='SERVICE_EXPIRED',
                        show_renew=True
                    ), 403
            
            # 验证通过，获取用户配置
            import json
            config = {}
            if license.config_json:
                try:
                    config = json.loads(license.config_json)
                except:
                    pass
            
            # 构建游戏URL（带配置参数）
            base_url = f'/fortune-game/index.html'
            params = [f'user_id={actual_user_id}']
            
            # 添加配置参数
            for key, value in config.items():
                params.append(f'{key}={value}')
            
            game_url = f'{base_url}?{"&".join(params)}'
            
            # 记录访问日志
            print(f'[OBS] 用户 {actual_user_id} 访问游戏 {game_id}, 剩余 {(license.expires_at - datetime.utcnow()).days if license.expires_at else "永久"} 天')
            
            # 返回成功页面（或直接重定向）
            return render_template_string(SUCCESS_PAGE_HTML, game_url=game_url)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'OBS鉴权错误: {e}')
        import traceback
        traceback.print_exc()
        return render_template_string(ERROR_PAGE_HTML,
            title='服务器错误',
            message='服务暂时不可用，请稍后再试',
            error_code='SERVER_ERROR',
            show_renew=False
        ), 500


@obs_bp.route('/<game_id>/verify', methods=['GET'])
def verify_access(game_id):
    """
    验证游戏访问权限（JSON API）
    
    GET /play/<game_id>/verify?user=<user_id>
    
    返回 JSON 格式的验证结果，供前端 JS 调用
    """
    try:
        user_id = request.args.get('user')
        
        if not user_id:
            return jsonify({
                'valid': False,
                'error': 'MISSING_USER',
                'message': '缺少用户标识'
            }), 400
        
        db = get_db_session()
        try:
            # 解析用户ID
            try:
                actual_user_id = int(user_id)
            except ValueError:
                user = db.query(User).filter(
                    (User.nickname == user_id) | (User.email == user_id)
                ).first()
                if not user:
                    return jsonify({
                        'valid': False,
                        'error': 'USER_NOT_FOUND',
                        'message': '用户不存在'
                    }), 404
                actual_user_id = user.id
            
            # 查询授权
            license = db.query(License).filter(
                License.user_id == actual_user_id,
                License.game_id == game_id
            ).first()
            
            if not license:
                return jsonify({
                    'valid': False,
                    'error': 'NO_LICENSE',
                    'message': '未购买服务'
                }), 403
            
            # 检查过期
            if license.expires_at and license.expires_at < datetime.utcnow():
                license.status = 'expired'
                db.commit()
                
                return jsonify({
                    'valid': False,
                    'error': 'EXPIRED',
                    'message': '服务已过期',
                    'expired_at': license.expires_at.isoformat()
                }), 403
            
            if license.status != 'active':
                return jsonify({
                    'valid': False,
                    'error': 'INVALID_STATUS',
                    'message': f'授权状态异常: {license.status}'
                }), 403
            
            # 验证通过
            import json
            config = {}
            if license.config_json:
                try:
                    config = json.loads(license.config_json)
                except:
                    pass
            
            return jsonify({
                'valid': True,
                'user_id': actual_user_id,
                'game_id': game_id,
                'plan': license.plan,
                'expires_at': license.expires_at.isoformat() if license.expires_at else None,
                'days_remaining': (license.expires_at - datetime.utcnow()).days if license.expires_at else None,
                'config': config
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'验证访问权限错误: {e}')
        return jsonify({
            'valid': False,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }), 500


# 播放器路由蓝图
player_bp = Blueprint('player', __name__, url_prefix='/api/player')


@player_bp.route('/verify', methods=['GET'])
def verify_player_access():
    """
    验证播放器访问权限
    
    GET /api/player/verify?game=<game_id>&ticket=<jwt_ticket>
    
    返回游戏URL和用户配置
    """
    try:
        game_id = request.args.get('game')
        ticket = request.args.get('ticket')
        
        if not game_id or not ticket:
            return jsonify({
                'success': False,
                'error': 'MISSING_PARAMS',
                'message': '缺少必要参数'
            }), 400
        
        # 验证票据
        from utils.jwt_helper import verify_access_token
        payload = verify_access_token(ticket)
        
        if not payload:
            return jsonify({
                'success': False,
                'error': 'INVALID_TICKET',
                'message': '票据无效或已过期'
            }), 401
        
        user_id = payload.get('user_id')
        
        db = get_db_session()
        try:
            # 查询授权
            license = db.query(License).filter(
                License.user_id == user_id,
                License.game_id == game_id
            ).first()
            
            if not license:
                return jsonify({
                    'success': False,
                    'error': 'NO_LICENSE',
                    'message': '未购买该游戏'
                }), 403
            
            # 检查过期
            if license.expires_at and license.expires_at < datetime.utcnow():
                return jsonify({
                    'success': False,
                    'error': 'EXPIRED',
                    'message': '授权已过期'
                }), 403
            
            if license.status != 'active':
                return jsonify({
                    'success': False,
                    'error': 'INVALID_STATUS',
                    'message': '授权状态异常'
                }), 403
            
            # 获取游戏信息
            game = db.query(Game).filter(Game.id == game_id).first()
            game_url = game.index_url if game else f'/games/{game_id}/index.html'
            
            # 解析用户配置
            import json
            user_config = {}
            if license.config_json:
                try:
                    user_config = json.loads(license.config_json)
                except:
                    pass
            
            return jsonify({
                'success': True,
                'game_url': game_url,
                'user_config': user_config,
                'game_info': game.to_dict() if game else {'id': game_id}
            })
            
        finally:
            db.close()
            
    except Exception as e:
        print(f'播放器验证错误: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'SERVER_ERROR',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print('OBS鉴权路由模块')
    print('可用端点:')
    print('  GET /play/<game_id>?user=<user_id> - OBS浏览器源访问入口')
    print('  GET /play/<game_id>/verify?user=<user_id> - JSON格式验证接口')
    print('  GET /api/player/verify?game=<game_id>&ticket=<ticket> - 播放器验证接口')

