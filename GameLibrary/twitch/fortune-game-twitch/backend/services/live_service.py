"""
Twitch 直播服务
为 Miko Fortune 游戏提供 Twitch 直播数据流
"""

import threading
import time
from datetime import datetime
from queue import Queue, Empty
from typing import Dict, Optional, Any, Callable

from .twitch.connection_manager import get_connection_manager, TwitchConnectionManager


class TwitchLiveService:
    """Twitch 直播服务 - 管理直播数据流"""

    def __init__(self, socketio=None):
        """
        初始化 Twitch 直播服务

        Args:
            socketio: Flask-SocketIO 实例，用于实时推送消息
        """
        self.socketio = socketio
        self.connection_manager: TwitchConnectionManager = get_connection_manager()

        # 用户会话数据
        self.user_sessions: Dict[int, Dict[str, Any]] = {}  # {user_id: session_data}

        # 消息处理线程
        self.message_threads: Dict[str, threading.Thread] = {}  # {channel: thread}
        self.running_channels: Dict[str, bool] = {}  # {channel: is_running}

        print('[TwitchLiveService] 初始化完成')

    def start_live(
        self,
        user_id: int,
        channel: str,
        oauth_token: str,
        username: str
    ) -> Dict[str, Any]:
        """
        开始监听 Twitch 直播

        Args:
            user_id: MaxGamer 用户ID
            channel: Twitch 频道名（用户绑定的 Twitch 账号）
            oauth_token: 用户的 Twitch OAuth access token
            username: Twitch 用户名
        """
        try:
            # 检查是否已在监听
            existing = self.connection_manager.get_user_connection(user_id)
            if existing and existing.monitor and existing.monitor.running:
                return {
                    'success': True,
                    'message': f'已在监听频道 {existing.channel}',
                    'channel': existing.channel,
                    'status': 'already_running'
                }

            # 创建消息队列
            message_queue = Queue()

            # 添加连接
            success = self.connection_manager.add_connection(
                channel=channel,
                user_id=user_id,
                oauth_token=oauth_token,
                username=username,
                message_queue=message_queue
            )

            if not success:
                return {
                    'success': False,
                    'message': f'无法连接到频道 {channel}',
                    'error': 'connection_failed'
                }

            # 启动消息处理线程
            self._start_message_processor(user_id, channel, message_queue)

            # 保存用户会话
            self.user_sessions[user_id] = {
                'channel': channel,
                'started_at': datetime.utcnow().isoformat(),
                'message_queue': message_queue
            }

            return {
                'success': True,
                'message': f'已开始监听频道 {channel}',
                'channel': channel,
                'status': 'started'
            }

        except Exception as e:
            print(f'[TwitchLiveService] 启动失败: {e}')
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': str(e),
                'error': 'start_failed'
            }

    def stop_live(self, user_id: int) -> Dict[str, Any]:
        """停止监听直播"""
        try:
            # 获取用户的连接
            conn_info = self.connection_manager.get_user_connection(user_id)
            if not conn_info:
                return {
                    'success': False,
                    'message': '没有正在运行的直播监听',
                    'error': 'not_running'
                }

            channel = conn_info.channel

            # 停止消息处理
            self.running_channels[channel] = False

            # 移除连接
            self.connection_manager.remove_connection(channel)

            # 清理用户会话
            if user_id in self.user_sessions:
                del self.user_sessions[user_id]

            return {
                'success': True,
                'message': f'已停止监听频道 {channel}',
                'channel': channel
            }

        except Exception as e:
            print(f'[TwitchLiveService] 停止失败: {e}')
            return {
                'success': False,
                'message': str(e),
                'error': 'stop_failed'
            }

    def get_status(self, user_id: int) -> Dict[str, Any]:
        """获取直播监听状态"""
        conn_info = self.connection_manager.get_user_connection(user_id)

        if not conn_info:
            return {
                'running': False,
                'channel': None
            }

        status = self.connection_manager.get_connection_status(conn_info.channel)
        session = self.user_sessions.get(user_id, {})

        return {
            'running': conn_info.monitor.running if conn_info.monitor else False,
            'channel': conn_info.channel,
            'connected': status.get('connected', False),
            'message_count': status.get('message_count', 0),
            'started_at': session.get('started_at'),
            'reconnect_count': status.get('reconnect_count', 0)
        }

    def _start_message_processor(self, user_id: int, channel: str, message_queue: Queue):
        """启动消息处理线程"""
        self.running_channels[channel] = True

        def process_messages():
            while self.running_channels.get(channel, False):
                try:
                    # 从队列获取消息
                    message = message_queue.get(timeout=1.0)

                    # 处理消息
                    self._process_message(user_id, channel, message)

                except Empty:
                    continue
                except Exception as e:
                    print(f'[TwitchLiveService] 消息处理错误: {e}')

        thread = threading.Thread(target=process_messages, daemon=True)
        thread.start()
        self.message_threads[channel] = thread
        print(f'[TwitchLiveService] 已启动频道 {channel} 的消息处理线程')

    def _process_message(self, user_id: int, channel: str, message: Dict[str, Any]):
        """处理单条消息"""
        msg_type = message.get('type', '')

        # 更新活动时间
        self.connection_manager.update_activity(channel)

        # 通过 SocketIO 推送消息
        if self.socketio:
            room = f'twitch_{user_id}'

            if msg_type == 'chat':
                # 聊天消息
                self.socketio.emit('twitch_chat', {
                    'username': message.get('display_name', message.get('username', '')),
                    'message': message.get('message', ''),
                    'user_id': message.get('user_id'),
                    'color': message.get('color', '#FFFFFF'),
                    'is_subscriber': message.get('is_subscriber', False),
                    'is_mod': message.get('is_mod', False),
                    'is_vip': message.get('is_vip', False),
                    'badges': message.get('badges', ''),
                    'timestamp': message.get('timestamp')
                }, room=room)

            elif msg_type == 'subscription':
                # 订阅事件
                self.socketio.emit('twitch_subscription', {
                    'sub_type': message.get('sub_type'),
                    'username': message.get('display_name', message.get('username', '')),
                    'months': message.get('months', 0),
                    'message': message.get('message', ''),
                    'sub_plan': message.get('sub_plan'),
                    'recipient': message.get('recipient'),  # 礼物订阅接收者
                    'gift_count': message.get('gift_count'),  # 神秘礼物数量
                    'timestamp': message.get('timestamp')
                }, room=room)

            elif msg_type == 'raid':
                # Raid 事件
                self.socketio.emit('twitch_raid', {
                    'username': message.get('display_name', message.get('username', '')),
                    'viewer_count': message.get('viewer_count', 0),
                    'timestamp': message.get('timestamp')
                }, room=room)

            elif msg_type == 'system':
                # 系统消息
                self.socketio.emit('twitch_system', {
                    'event': message.get('event'),
                    'message': message.get('message'),
                    'timestamp': message.get('timestamp')
                }, room=room)

        # 调试输出
        if msg_type == 'chat':
            print(f'[Twitch {channel}] {message.get("display_name")}: {message.get("message")}')


# 全局服务实例
_twitch_live_service: Optional[TwitchLiveService] = None


def get_twitch_live_service(socketio=None) -> TwitchLiveService:
    """获取 Twitch 直播服务实例"""
    global _twitch_live_service
    if _twitch_live_service is None:
        _twitch_live_service = TwitchLiveService(socketio)
    return _twitch_live_service


def init_twitch_live_service(socketio) -> TwitchLiveService:
    """初始化 Twitch 直播服务"""
    global _twitch_live_service
    _twitch_live_service = TwitchLiveService(socketio)
    return _twitch_live_service
