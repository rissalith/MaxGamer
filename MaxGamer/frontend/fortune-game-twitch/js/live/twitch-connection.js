/**
 * Twitch 直播间连接管理器
 * 用于 Miko Fortune Twitch 版
 *
 * 与 TikTok 版不同，Twitch 版：
 * 1. 使用用户已绑定的 Twitch 账号（从设置页面绑定）
 * 2. 自动获取用户的 OAuth token
 * 3. 连接到用户自己的直播间
 */
class TwitchLiveConnectionManager {
    constructor(options = {}) {
        this.socket = null;
        this.currentChannel = null;
        this.isConnected = false;
        this.isRestoring = false;

        // 配置
        this.apiBaseUrl = options.apiBaseUrl || 'http://localhost:5000';
        this.token = options.token || localStorage.getItem('token'); // MaxGamer JWT token

        // UI 元素（可选）
        this.connectBtn = options.connectBtn || document.getElementById('connect-twitch-btn');
        this.disconnectBtn = options.disconnectBtn || document.getElementById('disconnect-twitch-btn');
        this.statusElement = options.statusElement || document.getElementById('twitch-status');
        this.channelDisplay = options.channelDisplay || document.getElementById('twitch-channel');

        // 回调
        this.onChat = options.onChat || null;
        this.onSubscription = options.onSubscription || null;
        this.onRaid = options.onRaid || null;
        this.onSystem = options.onSystem || null;
        this.onConnected = options.onConnected || null;
        this.onDisconnected = options.onDisconnected || null;
        this.onError = options.onError || null;

        // 礼物队列管理器
        this.giftQueueManager = null;

        // 绑定信息缓存
        this.bindingInfo = null;
    }

    /**
     * 初始化连接管理器
     */
    async init() {
        // 绑定按钮事件
        if (this.connectBtn) {
            this.connectBtn.addEventListener('click', () => this.connect());
        }
        if (this.disconnectBtn) {
            this.disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        // 检查 Twitch 绑定状态
        const bindingStatus = await this.checkBinding();

        if (!bindingStatus.bound) {
            this.updateStatus('请先绑定 Twitch 账号', 'warning');
            return false;
        }

        this.bindingInfo = bindingStatus;
        this.updateStatus(`已绑定: ${bindingStatus.display_name || bindingStatus.username}`, 'ready');

        // 尝试恢复之前的连接
        await this.restoreConnection();

        return true;
    }

    /**
     * 检查用户的 Twitch 绑定状态
     */
    async checkBinding() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/fortune-twitch/binding/check`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                return {
                    bound: result.bound,
                    username: result.username,
                    display_name: result.display_name,
                    avatar_url: result.avatar_url
                };
            }

            return { bound: false };
        } catch (error) {
            console.error('[TwitchConnection] 检查绑定状态失败:', error);
            return { bound: false, error: error.message };
        }
    }

    /**
     * 连接到 Twitch 直播间
     * @param {string} channel - 可选，指定频道名（默认使用绑定的账号）
     */
    async connect(channel = null) {
        if (!this.token) {
            this.updateStatus('请先登录', 'error');
            if (this.onError) this.onError({ message: '请先登录' });
            return false;
        }

        try {
            this.updateStatus('正在连接 Twitch...', 'connecting');

            // 初始化 WebSocket 连接
            if (!this.socket) {
                await this.initSocketIO();
            }

            // 调用后端 API 开始监听
            const requestBody = {};
            if (channel) {
                requestBody.channel = channel;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/fortune-twitch/live/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (result.success) {
                this.currentChannel = result.channel;
                this.isConnected = true;

                // 加入 SocketIO 房间
                const userId = this.getUserIdFromToken();
                if (userId && this.socket) {
                    this.socket.emit('join', `twitch_${userId}`);
                }

                // 保存连接状态
                this.saveConnectionState(result.channel);

                const statusMsg = this.isRestoring ?
                    `已恢复: ${result.channel}` :
                    `已连接: ${result.channel}`;
                this.updateStatus(statusMsg, 'connected');

                // 更新 UI
                this.updateUI(true);

                if (this.onConnected) {
                    this.onConnected({ channel: result.channel });
                }

                this.isRestoring = false;
                return true;
            } else {
                this.updateStatus(`连接失败: ${result.message}`, 'error');
                if (this.onError) this.onError({ message: result.message });
                this.isRestoring = false;
                return false;
            }
        } catch (error) {
            console.error('[TwitchConnection] 连接失败:', error);
            this.updateStatus(`连接失败: ${error.message}`, 'error');
            if (this.onError) this.onError({ message: error.message });
            this.isRestoring = false;
            return false;
        }
    }

    /**
     * 断开连接
     */
    async disconnect() {
        if (!this.isConnected) return false;

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/fortune-twitch/live/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            // 离开 SocketIO 房间
            const userId = this.getUserIdFromToken();
            if (userId && this.socket) {
                this.socket.emit('leave', `twitch_${userId}`);
            }

            // 清除状态
            this.clearConnectionState();
            this.currentChannel = null;
            this.isConnected = false;

            this.updateStatus('已断开连接', 'disconnected');
            this.updateUI(false);

            if (this.onDisconnected) {
                this.onDisconnected();
            }

            return true;
        } catch (error) {
            console.error('[TwitchConnection] 断开连接失败:', error);
            return false;
        }
    }

    /**
     * 初始化 SocketIO 连接
     */
    async initSocketIO() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(this.apiBaseUrl);

                this.socket.on('connect', () => {
                    console.log('[TwitchConnection] WebSocket 已连接');
                    resolve();
                });

                this.socket.on('disconnect', () => {
                    console.log('[TwitchConnection] WebSocket 已断开');
                });

                // 监听 Twitch 聊天消息
                this.socket.on('twitch_chat', (data) => {
                    console.log('[TwitchConnection] 收到聊天:', data);
                    this.handleChatMessage(data);
                });

                // 监听订阅事件
                this.socket.on('twitch_subscription', (data) => {
                    console.log('[TwitchConnection] 收到订阅:', data);
                    this.handleSubscription(data);
                });

                // 监听 Raid 事件
                this.socket.on('twitch_raid', (data) => {
                    console.log('[TwitchConnection] 收到 Raid:', data);
                    this.handleRaid(data);
                });

                // 监听系统消息
                this.socket.on('twitch_system', (data) => {
                    console.log('[TwitchConnection] 系统消息:', data);
                    this.handleSystemMessage(data);
                });

                this.socket.on('error', (error) => {
                    console.error('[TwitchConnection] WebSocket 错误:', error);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 处理聊天消息
     */
    handleChatMessage(data) {
        // 调用自定义回调
        if (this.onChat) {
            this.onChat(data);
        }

        // 触发弹幕显示（如果有弹幕管理器）
        if (window.danmakuManager) {
            window.danmakuManager.handleLiveMessage({
                type: 'chat',
                user_name: data.username,
                content: data.message,
                ...data
            });
        }

        // 触发飞行弹幕（如果有）
        if (window.flyingDanmakuManager) {
            window.flyingDanmakuManager.createFlyingDanmaku({
                type: 'chat',
                user_name: data.username,
                content: data.message,
                ...data
            });
        }

        // 检查是否是触发占卜的关键词
        if (this.checkFortuneKeyword(data.message)) {
            this.triggerFortune(data);
        }
    }

    /**
     * 处理订阅事件
     */
    handleSubscription(data) {
        if (this.onSubscription) {
            this.onSubscription(data);
        }

        // 订阅自动触发占卜
        if (this.giftQueueManager) {
            this.giftQueueManager.addToQueue({
                type: 'subscription',
                user_name: data.username,
                sub_type: data.sub_type,
                months: data.months,
                fortune_type: 'daily', // 订阅默认触发每日运势
                ...data
            });
        }
    }

    /**
     * 处理 Raid 事件
     */
    handleRaid(data) {
        if (this.onRaid) {
            this.onRaid(data);
        }

        // Raid 触发特殊奖励
        console.log(`🎉 ${data.username} 带来了 ${data.viewer_count} 位观众！`);
    }

    /**
     * 处理系统消息
     */
    handleSystemMessage(data) {
        if (this.onSystem) {
            this.onSystem(data);
        }
    }

    /**
     * 检查消息是否包含占卜关键词
     */
    checkFortuneKeyword(message) {
        const keywords = ['!fortune', '!占卜', '抽签', '求签'];
        const lowerMessage = message.toLowerCase();
        return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
    }

    /**
     * 触发占卜
     */
    triggerFortune(data) {
        if (this.giftQueueManager) {
            this.giftQueueManager.addToQueue({
                type: 'chat_trigger',
                user_name: data.username,
                message: data.message,
                fortune_type: 'daily',
                ...data
            });
        }
    }

    /**
     * 从 localStorage 恢复连接
     */
    async restoreConnection() {
        try {
            const savedChannel = localStorage.getItem('currentTwitchChannel');
            if (savedChannel) {
                this.isRestoring = true;
                await this.connect(savedChannel);
            }
        } catch (error) {
            console.error('[TwitchConnection] 恢复连接失败:', error);
        }
    }

    /**
     * 保存连接状态
     */
    saveConnectionState(channel) {
        try {
            localStorage.setItem('currentTwitchChannel', channel);
        } catch (error) {
            console.error('[TwitchConnection] 保存连接状态失败:', error);
        }
    }

    /**
     * 清除连接状态
     */
    clearConnectionState() {
        try {
            localStorage.removeItem('currentTwitchChannel');
        } catch (error) {
            console.error('[TwitchConnection] 清除连接状态失败:', error);
        }
    }

    /**
     * 从 JWT token 中获取 user_id
     */
    getUserIdFromToken() {
        if (!this.token) return null;
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload.user_id;
        } catch (error) {
            return null;
        }
    }

    /**
     * 更新状态显示
     */
    updateStatus(text, className) {
        if (this.statusElement) {
            this.statusElement.textContent = text;
            this.statusElement.className = `twitch-status ${className || ''}`;
        }
        console.log(`[TwitchConnection] 状态: ${text}`);
    }

    /**
     * 更新 UI 状态
     */
    updateUI(connected) {
        if (this.connectBtn) {
            this.connectBtn.style.display = connected ? 'none' : 'block';
        }
        if (this.disconnectBtn) {
            if (connected) {
                this.disconnectBtn.classList.add('show');
            } else {
                this.disconnectBtn.classList.remove('show');
            }
        }
        if (this.channelDisplay && this.currentChannel) {
            this.channelDisplay.textContent = this.currentChannel;
        }
    }

    /**
     * 设置礼物队列管理器
     */
    setGiftQueueManager(queueManager) {
        this.giftQueueManager = queueManager;
    }

    /**
     * 获取当前状态
     */
    async getStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/fortune-twitch/live/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return await response.json();
        } catch (error) {
            console.error('[TwitchConnection] 获取状态失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 导出为全局变量
window.TwitchLiveConnectionManager = TwitchLiveConnectionManager;

// 导出为 ES 模块（如果支持）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwitchLiveConnectionManager;
}
