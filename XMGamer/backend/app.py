import os
import sys
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

# 导入游戏的直播服务
LIVE_SERVICE_AVAILABLE = False
live_service = None
try:
    # 添加游戏后端路径到 sys.path
    game_backend_path = str(Path(__file__).parent.parent / 'GameLibrary' / 'games' / 'fortune-game' / 'backend')
    if game_backend_path not in sys.path:
        sys.path.insert(0, game_backend_path)
    
    from services.live_service import LiveService
    LIVE_SERVICE_AVAILABLE = True
    print('[OK] 游戏直播服务模块已加载')
except ImportError as e:
    print(f'[WARNING] 游戏直播服务模块不可用: {e}')
    print('[INFO] 直播功能将不可用')

# 导入认证、历史记录、游戏、钱包、商品和AI对话路由
auth_bp = None
history_bp = None
games_bp = None
wallet_bp = None
products_bp = None
ai_dialogue_bp = None
ROUTES_AVAILABLE = False

try:
    from routes import auth_bp, history_bp  # type: ignore
    from routes.games import games_bp  # type: ignore
    from routes.wallet import wallet_bp  # type: ignore
    from routes.products import products_bp  # type: ignore
    from routes.ai_dialogue import ai_dialogue_bp  # type: ignore
    ROUTES_AVAILABLE = True
except ImportError as e:
    print(f'警告: 路由模块不可用: {e}')
    print('这可能是因为依赖包未安装，请运行: pip install -r requirements.txt')

# 导入游戏管理器和会话管理器
sys.path.insert(0, str(Path(__file__).parent.parent))
try:
    from GameLibrary.game_manager import game_manager
    from GameLibrary.game_session_manager import game_session_manager
    GAME_LIBRARY_AVAILABLE = True
    print('[OK] 游戏库模块已加载')
except ImportError as e:
    GAME_LIBRARY_AVAILABLE = False
    game_session_manager = None
    print(f'警告: 游戏库模块不可用: {e}')

# 加载环境变量
load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.config['SECRET_KEY'] = 'xmgamer-secret-key-2024'

# 配置ProxyFix以正确处理Nginx代理头
# 这样Flask就能正确识别HTTPS协议和真实的客户端IP
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=1,  # X-Forwarded-For
    x_proto=1,  # X-Forwarded-Proto
    x_host=1,  # X-Forwarded-Host
    x_prefix=1  # X-Forwarded-Prefix
)

# 配置CORS - 生产环境由Nginx处理，本地开发环境启用
# 检测是否在Docker容器中运行（生产环境）
import os.path
is_docker = os.path.exists('/.dockerenv')

if not is_docker:
    # 本地开发环境：启用CORS
    try:
        from flask_cors import CORS
        CORS(app, resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:*",
                    "http://127.0.0.1:*"
                ],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
                "max_age": 3600
            }
        })
        print('[OK] 本地开发环境：CORS已启用')
    except ImportError:
        print('[WARNING] flask-cors未安装，CORS功能不可用')
else:
    # 生产环境（Docker）：CORS由Nginx处理，不添加CORS头
    print('[OK] 生产环境（Docker）：CORS由Nginx处理')

# 初始化SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 初始化游戏直播服务
if LIVE_SERVICE_AVAILABLE:
    try:
        live_service = LiveService(socketio)
        print('[OK] 游戏直播服务已初始化')
    except Exception as e:
        print(f'[ERROR] 初始化游戏直播服务失败: {e}')
        LIVE_SERVICE_AVAILABLE = False

# 注册认证、历史记录、游戏、钱包、商品和AI对话路由蓝图
if ROUTES_AVAILABLE:
    if auth_bp is not None:
        app.register_blueprint(auth_bp)
        print('[OK] 认证路由已注册')
    if history_bp is not None:
        app.register_blueprint(history_bp)
        print('[OK] 历史记录路由已注册')
    if games_bp is not None:
        app.register_blueprint(games_bp)
        print('[OK] 游戏管理路由已注册')
    if wallet_bp is not None:
        app.register_blueprint(wallet_bp)
        print('[OK] 钱包管理路由已注册')
    if products_bp is not None:
        app.register_blueprint(products_bp)
        print('[OK] 商品管理路由已注册')
    if ai_dialogue_bp is not None:
        app.register_blueprint(ai_dialogue_bp, url_prefix='/api/ai')
        print('[OK] AI对话路由已注册')

# 初始化并注册游戏库
if GAME_LIBRARY_AVAILABLE:
    # 启动会话管理器
    if game_session_manager:
        game_session_manager.start()
        print('[OK] 游戏会话管理器已启动')
    
    # 初始化游戏管理器
    game_manager.init(app)  # 传入app以注册游戏后端API
    game_api_bp = game_manager.create_api_blueprint()
    app.register_blueprint(game_api_bp)
    print('[OK] 游戏库API已注册')

# 配置
PORT = int(os.getenv('PORT', 5000))


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'message': 'XMGamer 后端服务运行正常',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/info', methods=['GET'])
def api_info():
    """API 信息"""
    endpoints = {
        'health': '/api/health',
        'info': '/api/info',
        'fortune': {
            'chat': '/api/fortune/chat',
            'liveStart': '/api/fortune/live/start',
            'liveStop': '/api/fortune/live/stop',
            'liveStatus': '/api/fortune/live/status'
        }
    }
    
    # 如果认证路由可用，添加认证端点
    if ROUTES_AVAILABLE:
        auth_endpoints = {
            'sendSms': '/api/auth/send-sms',
            'loginWithSms': '/api/auth/login-with-sms',
            'me': '/api/auth/me',
            'logout': '/api/auth/logout',
            'profile': '/api/auth/profile'
        }
        history_endpoints = {
            'create': '/api/history',
            'list': '/api/history',
            'detail': '/api/history/:id',
            'delete': '/api/history/:id',
            'migrate': '/api/history/migrate'
        }
        games_endpoints = {
            'launch': '/api/games/launch',
            'verify': '/api/games/verify',
            'licenses': '/api/games/licenses',
            'history': '/api/games/history'
        }
        wallet_endpoints = {
            'getWallet': '/api/wallet',
            'recharge': '/api/wallet/recharge',
            'completeRecharge': '/api/wallet/recharge/complete',
            'transactions': '/api/wallet/transactions'
        }
        products_endpoints = {
            'list': '/api/products',
            'detail': '/api/products/:id',
            'purchase': '/api/products/purchase',
            'myLicenses': '/api/products/my-licenses'
        }
        endpoints['auth'] = auth_endpoints
        endpoints['history'] = history_endpoints
        endpoints['games'] = games_endpoints
        endpoints['wallet'] = wallet_endpoints
        endpoints['products'] = products_endpoints
    
    return jsonify({
        'name': 'XMGamer API',
        'version': '1.0.0',
        'description': '轻量级游戏发行平台',
        'features': [
            '用户认证系统',
            '游戏授权管理',
            '游戏启动服务',
            '直播互动游戏'
        ],
        'endpoints': endpoints,
        'authEnabled': ROUTES_AVAILABLE
    })


# ==================== 占卜游戏API ====================

@app.route('/api/fortune/chat', methods=['POST', 'OPTIONS'])
def fortune_chat():
    """占卜Agent聊天接口"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_input = data.get('message', '')
        username = data.get('username', '观众')
        grade = data.get('grade')
        topic = data.get('topic')
        
        if not user_input:
            return jsonify({
                'success': False,
                'message': '消息不能为空'
            }), 400
        
        # 简单的占卜回复逻辑（可以后续集成AI）
        response_text = f"感谢 {username} 的提问！{user_input}"
        
        return jsonify({
            'success': True,
            'response': response_text
        })
        
    except Exception as e:
        print(f"占卜Agent处理失败: {e}")
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

@app.route('/api/fortune/live/start', methods=['POST', 'OPTIONS'])
def start_live():
    """开始监听直播间"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        live_id = data.get('live_id')
        
        if not live_id:
            return jsonify({
                'success': False,
                'message': '缺少直播间ID'
            }), 400
        
        # 使用游戏的直播服务
        if LIVE_SERVICE_AVAILABLE and live_service:
            result = live_service.start_live(live_id)
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'message': '直播服务不可用，请检查游戏后端配置'
            }), 503
            
    except Exception as e:
        print(f"启动直播间监听失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

@app.route('/api/fortune/live/stop', methods=['POST', 'OPTIONS'])
def stop_live():
    """停止监听直播间"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        live_id = data.get('live_id')
        
        if not live_id:
            return jsonify({
                'success': False,
                'message': '缺少直播间ID'
            }), 400
        
        # 使用游戏的直播服务
        if LIVE_SERVICE_AVAILABLE and live_service:
            result = live_service.stop_live(live_id)
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'message': '直播服务不可用'
            }), 503
            
    except Exception as e:
        print(f"停止直播间监听失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

@app.route('/api/fortune/live/status', methods=['GET'])
def get_live_status():
    """获取当前监听状态"""
    try:
        # 使用游戏的直播服务
        if LIVE_SERVICE_AVAILABLE and live_service:
            result = live_service.get_status()
            return jsonify(result)
        else:
            return jsonify({
                'success': True,
                'is_running': False,
                'live_id': None,
                'message': '直播服务不可用'
            })
    except Exception as e:
        print(f"获取状态失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

# SocketIO事件处理
@socketio.on('connect')
def handle_connect():
    """客户端连接"""
    from flask import request as flask_request
    sid = flask_request.environ.get('HTTP_SEC_WEBSOCKET_KEY', 'unknown')
    print(f"客户端已连接: {sid}")
    emit('connected', {'message': '已连接到服务器'})

@socketio.on('disconnect')
def handle_disconnect():
    """客户端断开连接"""
    from flask import request as flask_request
    sid = flask_request.environ.get('HTTP_SEC_WEBSOCKET_KEY', 'unknown')
    print(f"客户端已断开: {sid}")

@socketio.on('join')
def handle_join(live_id):
    """加入直播间房间"""
    from flask import request as flask_request
    sid = flask_request.environ.get('HTTP_SEC_WEBSOCKET_KEY', 'unknown')
    join_room(live_id)
    print(f"客户端 {sid} 加入房间: {live_id}")
    emit('joined', {'live_id': live_id, 'message': f'已加入直播间 {live_id}'})

@socketio.on('leave')
def handle_leave(live_id):
    """离开直播间房间"""
    from flask import request as flask_request
    sid = flask_request.environ.get('HTTP_SEC_WEBSOCKET_KEY', 'unknown')
    leave_room(live_id)
    print(f"客户端 {sid} 离开房间: {live_id}")
    emit('left', {'live_id': live_id, 'message': f'已离开直播间 {live_id}'})

@socketio.on('fortune_chat')
def handle_fortune_chat(data):
    """处理占卜Agent实时聊天"""
    try:
        user_input = data.get('message', '')
        username = data.get('username', '观众')
        
        if not user_input:
            emit('fortune_response', {
                'success': False,
                'message': '消息不能为空'
            })
            return
        
        response_text = f"感谢 {username} 的提问！{user_input}"
        
        emit('fortune_response', {
            'success': True,
            'response': response_text,
            'username': username
        })
        
    except Exception as e:
        print(f"占卜Agent实时聊天失败: {e}")
        emit('fortune_response', {
            'success': False,
            'message': f'处理失败: {str(e)}'
        })

# ==================== 前端路由 ====================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """服务前端静态文件"""
    static_folder = app.static_folder or '../frontend'
    if path and Path(static_folder, path).exists():
        return send_from_directory(static_folder, path)
    return send_from_directory(static_folder, 'index.html')


@app.errorhandler(500)
def internal_error(error):
    """错误处理"""
    return jsonify({
        'error': '服务器内部错误',
        'message': str(error)
    }), 500


def cleanup_on_exit():
    """程序退出时清理资源"""
    if GAME_LIBRARY_AVAILABLE:
        try:
            if game_session_manager:
                print('[INFO] 正在清理游戏会话...')
                game_session_manager.stop()
                print('[OK] 游戏会话已清理')
        except Exception as e:
            print(f'[WARNING] 清理游戏会话时出错: {e}')


if __name__ == '__main__':
    import sys
    import io
    import atexit
    
    # 注册退出清理函数
    atexit.register(cleanup_on_exit)
    
    # 设置标准输出为UTF-8编码（Windows兼容性）
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print(f'[OK] XMGamer Python 后端启动在端口 {PORT}')
    print(f'[OK] 直播互动游戏平台 - 游戏市场和占卜游戏')
    if GAME_LIBRARY_AVAILABLE:
        try:
            if game_session_manager:
                print(f'[OK] 游戏会话管理: 按需启动模式 (超时: 30分钟)')
        except:
            pass
    
    try:
        socketio.run(app, host='0.0.0.0', port=PORT, debug=True, allow_unsafe_werkzeug=True)
    except KeyboardInterrupt:
        print('\n[INFO] 收到中断信号，正在关闭...')
        cleanup_on_exit()