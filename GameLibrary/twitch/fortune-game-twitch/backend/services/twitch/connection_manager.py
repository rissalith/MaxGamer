"""
Twitch 连接管理器
管理持久化连接，支持自动重连和多频道监听
"""

import threading
import time
from datetime import datetime
from queue import Queue
from typing import Dict, Optional, Any
from dataclasses import dataclass, field

from .live_monitor import TwitchLiveMonitor


@dataclass
class ConnectionInfo:
    """连接信息"""
    channel: str
    user_id: int
    monitor: Optional[TwitchLiveMonitor] = None
    message_queue: Optional[Queue] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    status: str = 'pending'  # pending, connecting, connected, disconnected, error


class TwitchConnectionManager:
    """Twitch 连接管理器 - 单例模式"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.connections: Dict[str, ConnectionInfo] = {}  # {channel: ConnectionInfo}
        self.user_connections: Dict[int, str] = {}  # {user_id: channel}
        self._lock = threading.Lock()
        self._initialized = True

        print('[Twitch ConnectionManager] 初始化完成')

    def add_connection(
        self,
        channel: str,
        user_id: int,
        oauth_token: str,
        username: str,
        message_queue: Queue
    ) -> bool:
        """
        添加新连接

        Args:
            channel: Twitch 频道名
            user_id: MaxGamer 用户ID
            oauth_token: 用户的 Twitch OAuth token
            username: Twitch 用户名
            message_queue: 消息队列
        """
        with self._lock:
            # 检查是否已有连接
            if channel in self.connections:
                existing = self.connections[channel]
                if existing.monitor and existing.monitor.running:
                    print(f'[Twitch ConnectionManager] 频道 {channel} 已有活跃连接')
                    # 更新消息队列引用
                    existing.message_queue = message_queue
                    existing.last_activity = datetime.utcnow()
                    return True
                else:
                    # 清理旧连接
                    self._cleanup_connection(channel)

            # 创建新连接
            conn_info = ConnectionInfo(
                channel=channel,
                user_id=user_id,
                message_queue=message_queue,
                status='connecting'
            )

            # 创建监听器
            monitor = TwitchLiveMonitor(
                channel=channel,
                oauth_token=oauth_token,
                username=username,
                message_queue=message_queue
            )

            conn_info.monitor = monitor
            self.connections[channel] = conn_info
            self.user_connections[user_id] = channel

            # 启动监听
            if monitor.start():
                conn_info.status = 'connected'
                print(f'[Twitch ConnectionManager] 已添加频道 {channel} 的连接')
                return True
            else:
                conn_info.status = 'error'
                print(f'[Twitch ConnectionManager] 启动频道 {channel} 监听失败')
                return False

    def remove_connection(self, channel: str) -> bool:
        """移除连接"""
        with self._lock:
            if channel not in self.connections:
                return False

            conn_info = self.connections[channel]

            # 停止监听
            if conn_info.monitor:
                conn_info.monitor.stop()

            # 清理用户映射
            if conn_info.user_id in self.user_connections:
                del self.user_connections[conn_info.user_id]

            # 移除连接
            del self.connections[channel]
            print(f'[Twitch ConnectionManager] 已移除频道 {channel} 的连接')
            return True

    def get_connection(self, channel: str) -> Optional[ConnectionInfo]:
        """获取连接信息"""
        return self.connections.get(channel)

    def get_user_connection(self, user_id: int) -> Optional[ConnectionInfo]:
        """获取用户的连接"""
        channel = self.user_connections.get(user_id)
        if channel:
            return self.connections.get(channel)
        return None

    def get_connection_status(self, channel: str) -> Dict[str, Any]:
        """获取连接状态"""
        conn_info = self.connections.get(channel)
        if not conn_info:
            return {
                'exists': False,
                'channel': channel
            }

        monitor_status = conn_info.monitor.get_status() if conn_info.monitor else {}

        return {
            'exists': True,
            'channel': channel,
            'user_id': conn_info.user_id,
            'status': conn_info.status,
            'created_at': conn_info.created_at.isoformat(),
            'last_activity': conn_info.last_activity.isoformat(),
            **monitor_status
        }

    def update_activity(self, channel: str):
        """更新活动时间"""
        if channel in self.connections:
            self.connections[channel].last_activity = datetime.utcnow()

    def _cleanup_connection(self, channel: str):
        """清理连接（内部方法）"""
        if channel in self.connections:
            conn_info = self.connections[channel]
            if conn_info.monitor:
                conn_info.monitor.stop()
            if conn_info.user_id in self.user_connections:
                del self.user_connections[conn_info.user_id]
            del self.connections[channel]

    def get_all_connections(self) -> Dict[str, Dict[str, Any]]:
        """获取所有连接状态"""
        result = {}
        for channel in self.connections:
            result[channel] = self.get_connection_status(channel)
        return result

    def cleanup_inactive(self, timeout_minutes: int = 60):
        """清理不活跃的连接"""
        now = datetime.utcnow()
        inactive_channels = []

        with self._lock:
            for channel, conn_info in self.connections.items():
                diff = (now - conn_info.last_activity).total_seconds() / 60
                if diff > timeout_minutes:
                    inactive_channels.append(channel)

        for channel in inactive_channels:
            print(f'[Twitch ConnectionManager] 清理不活跃连接: {channel}')
            self.remove_connection(channel)


# 获取全局连接管理器实例
def get_connection_manager() -> TwitchConnectionManager:
    return TwitchConnectionManager()
