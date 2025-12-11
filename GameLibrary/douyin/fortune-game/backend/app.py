#!/usr/bin/python
# coding:utf-8

"""
Flask后端服务器 - 提供直播间监控API
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from services.live_service import LiveService
from services.fortune_agent_llmx import get_agent, reset_agent
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# API密钥从环境变量读取
# 在生产环境中，应通过GitHub Secrets的FORTUNE_GAME_AIAGENT_API提供
if not os.environ.get('DEEPSEEK_API_KEY'):
    print("WARNING: DEEPSEEK_API_KEY not set in environment variables")
    print("Please set it via .env file or environment variable")

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# 配置CORS，允许来自任何源的请求，支持所有HTTP方法和头部
CORS(app,
     resources={r"/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=False,
     send_wildcard=True,
     always_send=True,
     max_age=3600)

# 初始化SocketIO，配置CORS
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 初始化直播服务
live_service = LiveService(socketio)

@app.route('/')
def index():
    """首页"""
    return jsonify({
        'status': 'running',
        'message': '抖音直播间监控服务正在运行',
        'version': '1.0.0'
    })

@app.route('/api/live/start', methods=['POST', 'OPTIONS'])
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
        
        result = live_service.start_live(live_id)
        return jsonify(result)
    except Exception as e:
        print(f"【X】启动直播间监听失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

@app.route('/api/live/stop', methods=['POST', 'OPTIONS'])
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
        
        result = live_service.stop_live(live_id)
        return jsonify(result)
    except Exception as e:
        print(f"【X】停止直播间监听失败: {e}")
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

@app.route('/api/live/status', methods=['GET'])
def get_status():
    """获取当前监听状态"""
    try:
        result = live_service.get_status()
        return jsonify(result)
    except Exception as e:
        print(f"【X】获取状态失败: {e}")
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

# SocketIO事件处理
@socketio.on('connect')
def handle_connect():
    """客户端连接"""
    print(f"【√】客户端已连接: {request.sid}")
    emit('connected', {'message': '已连接到服务器'})

@socketio.on('disconnect')
def handle_disconnect():
    """客户端断开连接"""
    print(f"【X】客户端已断开: {request.sid}")

@socketio.on('join')
def handle_join(live_id):
    """加入直播间房间"""
    join_room(live_id)
    print(f"【√】客户端 {request.sid} 加入房间: {live_id}")
    emit('joined', {'live_id': live_id, 'message': f'已加入直播间 {live_id}'})

@socketio.on('leave')
def handle_leave(live_id):
    """离开直播间房间"""
    leave_room(live_id)
    print(f"【X】客户端 {request.sid} 离开房间: {live_id}")
    emit('left', {'live_id': live_id, 'message': f'已离开直播间 {live_id}'})

# 占卜Agent API端点
@app.route('/api/fortune/chat', methods=['POST', 'OPTIONS'])
def fortune_chat():
    """占卜Agent聊天接口"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        user_input = data.get('message', '')
        username = data.get('username', '观众')
        grade = data.get('grade')  # 可选：签级
        topic = data.get('topic')  # 可选：运势类型
        
        if not user_input:
            return jsonify({
                'success': False,
                'message': '消息不能为空'
            }), 400
        
        # 获取Agent实例（使用环境变量中的API Key）
        agent = get_agent()
        
        # 根据是否有抽签结果选择不同的回复方式
        if grade and topic:
            # 有抽签结果，生成占卜回复
            response_text = agent.make_fortune_response(
                username=username,
                grade=grade,
                topic=topic,
                user_input=user_input
            )
        else:
            # 纯聊天模式
            response_text = agent.chat(user_input)
        
        return jsonify({
            'success': True,
            'response': response_text
        })
        
    except Exception as e:
        print(f"【X】占卜Agent处理失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500

# SocketIO事件 - 占卜Agent实时聊天
@socketio.on('fortune_chat')
def handle_fortune_chat(data):
    """处理占卜Agent实时聊天"""
    try:
        user_input = data.get('message', '')
        username = data.get('username', '观众')
        grade = data.get('grade')
        topic = data.get('topic')
        
        if not user_input:
            emit('fortune_response', {
                'success': False,
                'message': '消息不能为空'
            })
            return
        
        # 获取Agent实例
        agent = get_agent()
        
        # 生成回复
        if grade and topic:
            response_text = agent.make_fortune_response(
                username=username,
                grade=grade,
                topic=topic,
                user_input=user_input
            )
        else:
            response_text = agent.chat(user_input)
        
        # 发送回复
        emit('fortune_response', {
            'success': True,
            'response': response_text,
            'username': username
        })
        
    except Exception as e:
        print(f"【X】占卜Agent实时聊天失败: {e}")
        emit('fortune_response', {
            'success': False,
            'message': f'处理失败: {str(e)}'
        })

if __name__ == '__main__':
    # 从环境变量获取端口，默认5001
    port = int(os.environ.get('PORT', 3000))
    
    print("=" * 50)
    print("抖音直播间监控服务启动中...")
    print("=" * 50)
    print(f"服务地址: http://0.0.0.0:{port}")
    print(f"WebSocket: ws://0.0.0.0:{port}")
    print("=" * 50)
    
    # 启动服务器
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)