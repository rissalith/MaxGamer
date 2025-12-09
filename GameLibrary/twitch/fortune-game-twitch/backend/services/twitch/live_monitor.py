"""
Twitch 直播监听器
使用 IRC 协议连接 Twitch 聊天室，接收实时弹幕
使用用户绑定的 OAuth Token 进行认证
"""

import asyncio
import threading
import socket
import ssl
import re
import time
from datetime import datetime
from queue import Queue
from typing import Optional, Callable, Dict, Any


class TwitchIRCClient:
    """Twitch IRC 客户端 - 连接聊天室接收弹幕"""

    IRC_HOST = "irc.chat.twitch.tv"
    IRC_PORT = 6697  # SSL端口

    def __init__(self, channel: str, oauth_token: str, username: str):
        """
        初始化 Twitch IRC 客户端

        Args:
            channel: Twitch 频道名（不带 #）
            oauth_token: 用户的 OAuth access token
            username: Twitch 用户名
        """
        self.channel = channel.lower()
        self.oauth_token = oauth_token
        self.username = username.lower()

        self.socket: Optional[ssl.SSLSocket] = None
        self.running = False
        self.connected = False

        # 事件回调
        self.on_message: Optional[Callable] = None
        self.on_connect: Optional[Callable] = None
        self.on_disconnect: Optional[Callable] = None
        self.on_error: Optional[Callable] = None

        # 统计信息
        self.message_count = 0
        self.connect_time: Optional[datetime] = None

    def connect(self) -> bool:
        """连接到 Twitch IRC 服务器"""
        try:
            print(f'[Twitch IRC] 正在连接到 {self.IRC_HOST}:{self.IRC_PORT}...')

            # 创建 SSL 连接
            context = ssl.create_default_context()
            raw_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket = context.wrap_socket(raw_socket, server_hostname=self.IRC_HOST)
            self.socket.connect((self.IRC_HOST, self.IRC_PORT))
            self.socket.settimeout(300)  # 5分钟超时

            # 发送认证信息
            # OAuth token 需要以 "oauth:" 为前缀
            token = self.oauth_token if self.oauth_token.startswith('oauth:') else f'oauth:{self.oauth_token}'
            self._send(f'PASS {token}')
            self._send(f'NICK {self.username}')

            # 请求额外功能（tags, commands, membership）
            self._send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership')

            # 加入频道
            self._send(f'JOIN #{self.channel}')

            self.connected = True
            self.connect_time = datetime.utcnow()
            print(f'[Twitch IRC] 已连接到频道 #{self.channel}')

            if self.on_connect:
                self.on_connect()

            return True

        except Exception as e:
            print(f'[Twitch IRC] 连接失败: {e}')
            self.connected = False
            if self.on_error:
                self.on_error(str(e))
            return False

    def _send(self, message: str):
        """发送 IRC 消息"""
        if self.socket:
            self.socket.send(f'{message}\r\n'.encode('utf-8'))

    def disconnect(self):
        """断开连接"""
        self.running = False
        self.connected = False
        if self.socket:
            try:
                self._send(f'PART #{self.channel}')
                self.socket.close()
            except:
                pass
            self.socket = None
        print(f'[Twitch IRC] 已断开连接')
        if self.on_disconnect:
            self.on_disconnect()

    def start_listening(self):
        """开始监听消息（阻塞）"""
        self.running = True
        buffer = ''

        while self.running and self.connected:
            try:
                data = self.socket.recv(4096).decode('utf-8', errors='ignore')
                if not data:
                    break

                buffer += data
                lines = buffer.split('\r\n')
                buffer = lines.pop()  # 保留未完成的行

                for line in lines:
                    if line:
                        self._handle_message(line)

            except socket.timeout:
                # 发送 PING 保持连接
                self._send('PING :tmi.twitch.tv')
            except Exception as e:
                print(f'[Twitch IRC] 接收错误: {e}')
                if self.on_error:
                    self.on_error(str(e))
                break

        self.connected = False
        if self.on_disconnect:
            self.on_disconnect()

    def _handle_message(self, raw_message: str):
        """处理 IRC 消息"""
        # 处理 PING
        if raw_message.startswith('PING'):
            self._send('PONG :tmi.twitch.tv')
            return

        # 解析 PRIVMSG（聊天消息）
        # 格式: @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
        privmsg_match = re.match(
            r'^(@\S+\s+)?:(\w+)!\w+@\w+\.tmi\.twitch\.tv\s+PRIVMSG\s+#(\w+)\s+:(.+)$',
            raw_message
        )

        if privmsg_match:
            tags_str = privmsg_match.group(1) or ''
            username = privmsg_match.group(2)
            channel = privmsg_match.group(3)
            message = privmsg_match.group(4)

            # 解析 tags
            tags = self._parse_tags(tags_str)

            self.message_count += 1

            chat_data = {
                'type': 'chat',
                'username': username,
                'display_name': tags.get('display-name', username),
                'message': message,
                'channel': channel,
                'user_id': tags.get('user-id'),
                'color': tags.get('color', '#FFFFFF'),
                'badges': tags.get('badges', ''),
                'emotes': tags.get('emotes', ''),
                'is_subscriber': '1' in tags.get('subscriber', '0'),
                'is_mod': '1' in tags.get('mod', '0'),
                'is_vip': 'vip' in tags.get('badges', ''),
                'timestamp': datetime.utcnow().isoformat(),
                'raw_tags': tags
            }

            if self.on_message:
                self.on_message(chat_data)

        # 处理 USERNOTICE（订阅、礼物订阅等）
        elif 'USERNOTICE' in raw_message:
            self._handle_usernotice(raw_message)

    def _parse_tags(self, tags_str: str) -> Dict[str, str]:
        """解析 IRC tags"""
        tags = {}
        if not tags_str:
            return tags

        # 移除开头的 @ 和结尾的空格
        tags_str = tags_str.strip().lstrip('@').strip()

        for tag in tags_str.split(';'):
            if '=' in tag:
                key, value = tag.split('=', 1)
                tags[key] = value

        return tags

    def _handle_usernotice(self, raw_message: str):
        """处理订阅、礼物等通知"""
        # 解析 USERNOTICE
        match = re.match(r'^(@\S+\s+)?:\w+\.tmi\.twitch\.tv\s+USERNOTICE\s+#(\w+)(?:\s+:(.+))?$', raw_message)
        if not match:
            return

        tags_str = match.group(1) or ''
        channel = match.group(2)
        message = match.group(3) or ''

        tags = self._parse_tags(tags_str)
        msg_id = tags.get('msg-id', '')

        # 订阅相关事件
        if msg_id in ['sub', 'resub', 'subgift', 'submysterygift']:
            event_data = {
                'type': 'subscription',
                'sub_type': msg_id,
                'username': tags.get('login', ''),
                'display_name': tags.get('display-name', ''),
                'channel': channel,
                'message': message,
                'months': int(tags.get('msg-param-cumulative-months', 0)),
                'sub_plan': tags.get('msg-param-sub-plan', ''),
                'sub_plan_name': tags.get('msg-param-sub-plan-name', ''),
                'timestamp': datetime.utcnow().isoformat()
            }

            # 礼物订阅特有字段
            if msg_id == 'subgift':
                event_data['recipient'] = tags.get('msg-param-recipient-display-name', '')
                event_data['recipient_id'] = tags.get('msg-param-recipient-id', '')
            elif msg_id == 'submysterygift':
                event_data['gift_count'] = int(tags.get('msg-param-mass-gift-count', 0))

            if self.on_message:
                self.on_message(event_data)

        # Raid 事件
        elif msg_id == 'raid':
            event_data = {
                'type': 'raid',
                'username': tags.get('msg-param-login', ''),
                'display_name': tags.get('msg-param-displayName', ''),
                'viewer_count': int(tags.get('msg-param-viewerCount', 0)),
                'channel': channel,
                'timestamp': datetime.utcnow().isoformat()
            }
            if self.on_message:
                self.on_message(event_data)


class TwitchLiveMonitor:
    """Twitch 直播监听器 - 管理 IRC 连接和消息队列"""

    def __init__(self, channel: str, oauth_token: str, username: str, message_queue: Queue):
        """
        初始化直播监听器

        Args:
            channel: Twitch 频道名
            oauth_token: 用户的 OAuth access token
            username: Twitch 用户名
            message_queue: 消息队列，用于将消息传递给游戏服务
        """
        self.channel = channel
        self.oauth_token = oauth_token
        self.username = username
        self.message_queue = message_queue

        self.irc_client: Optional[TwitchIRCClient] = None
        self.listen_thread: Optional[threading.Thread] = None
        self.running = False
        self.reconnect_count = 0
        self.max_reconnects = 5

    def start(self) -> bool:
        """启动监听"""
        if self.running:
            print(f'[Twitch Monitor] 已经在监听频道 {self.channel}')
            return True

        self.running = True
        self.reconnect_count = 0

        # 在新线程中启动
        self.listen_thread = threading.Thread(target=self._run, daemon=True)
        self.listen_thread.start()

        return True

    def _run(self):
        """运行监听循环"""
        while self.running and self.reconnect_count < self.max_reconnects:
            try:
                # 创建 IRC 客户端
                self.irc_client = TwitchIRCClient(
                    channel=self.channel,
                    oauth_token=self.oauth_token,
                    username=self.username
                )

                # 设置回调
                self.irc_client.on_message = self._on_message
                self.irc_client.on_connect = self._on_connect
                self.irc_client.on_disconnect = self._on_disconnect
                self.irc_client.on_error = self._on_error

                # 连接
                if self.irc_client.connect():
                    self.reconnect_count = 0  # 重置重连计数
                    self.irc_client.start_listening()
                else:
                    self.reconnect_count += 1

            except Exception as e:
                print(f'[Twitch Monitor] 运行错误: {e}')
                self.reconnect_count += 1

            # 等待后重连
            if self.running and self.reconnect_count < self.max_reconnects:
                wait_time = min(30, 5 * self.reconnect_count)
                print(f'[Twitch Monitor] {wait_time}秒后尝试重连 ({self.reconnect_count}/{self.max_reconnects})')
                time.sleep(wait_time)

        if self.reconnect_count >= self.max_reconnects:
            print(f'[Twitch Monitor] 达到最大重连次数，停止监听')
            self._put_system_message('error', '连接失败，已达到最大重连次数')

    def stop(self):
        """停止监听"""
        self.running = False
        if self.irc_client:
            self.irc_client.disconnect()
        print(f'[Twitch Monitor] 已停止监听频道 {self.channel}')

    def _on_message(self, data: Dict[str, Any]):
        """处理接收到的消息"""
        try:
            self.message_queue.put(data)
        except Exception as e:
            print(f'[Twitch Monitor] 消息入队失败: {e}')

    def _on_connect(self):
        """连接成功回调"""
        self._put_system_message('connected', f'已连接到频道 {self.channel}')

    def _on_disconnect(self):
        """断开连接回调"""
        if self.running:
            self._put_system_message('disconnected', f'与频道 {self.channel} 断开连接')

    def _on_error(self, error: str):
        """错误回调"""
        self._put_system_message('error', error)

    def _put_system_message(self, event_type: str, message: str):
        """发送系统消息"""
        try:
            self.message_queue.put({
                'type': 'system',
                'event': event_type,
                'message': message,
                'channel': self.channel,
                'timestamp': datetime.utcnow().isoformat()
            })
        except:
            pass

    def get_status(self) -> Dict[str, Any]:
        """获取监听状态"""
        return {
            'channel': self.channel,
            'running': self.running,
            'connected': self.irc_client.connected if self.irc_client else False,
            'reconnect_count': self.reconnect_count,
            'message_count': self.irc_client.message_count if self.irc_client else 0,
            'connect_time': self.irc_client.connect_time.isoformat() if self.irc_client and self.irc_client.connect_time else None
        }
