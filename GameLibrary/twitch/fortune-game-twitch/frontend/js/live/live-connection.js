// 直播间连接管理器
class LiveConnectionManager {
    constructor() {
        this.socket = null;
        this.currentLiveId = null;
        this.liveRoomInput = document.getElementById('live-room-input');
        this.connectLiveBtn = document.getElementById('connect-live-btn');
        this.disconnectLiveBtn = document.getElementById('disconnect-live-btn');
        this.liveStatus = document.getElementById('live-status');
        this.giftQueueManager = null; // 礼物队列管理器
        this.isRestoring = false; // 标记是否正在恢复连接
        
        this.init();
    }

    init() {
        this.connectLiveBtn.addEventListener('click', () => this.connect());
        this.disconnectLiveBtn.addEventListener('click', () => this.disconnect());
        
        // 页面加载时尝试恢复之前的连接
        this.restoreConnection();
    }

    /**
     * 从localStorage恢复之前的连接状态
     */
    async restoreConnection() {
        try {
            const savedLiveId = localStorage.getItem('currentLiveId');
            if (savedLiveId) {
                this.isRestoring = true;
                this.liveRoomInput.value = savedLiveId;
                
                // 延迟一点时间，确保其他组件已初始化
                setTimeout(() => {
                    this.connect();
                }, 500);
            }
        } catch (error) {
            console.error('恢复连接失败:', error);
        }
    }

    /**
     * 保存当前连接状态到localStorage
     */
    saveConnectionState(liveId) {
        try {
            if (liveId) {
                localStorage.setItem('currentLiveId', liveId);
            }
        } catch (error) {
            console.error('保存连接状态失败:', error);
        }
    }

    /**
     * 清除保存的连接状态
     */
    clearConnectionState() {
        try {
            localStorage.removeItem('currentLiveId');
        } catch (error) {
            console.error('清除连接状态失败:', error);
        }
    }

    /**
     * 设置礼物队列管理器
     * @param {GiftQueueManager} queueManager - 队列管理器实例
     */
    setGiftQueueManager(queueManager) {
        this.giftQueueManager = queueManager;
    }

    async connect() {
        const liveId = this.liveRoomInput.value.trim();
        if (!liveId) {
            this.updateStatus('请输入直播间ID', 'error');
            return;
        }

        try {
            this.updateStatus('正在连接...', '');

            // 连接到后端WebSocket服务器
            if (!this.socket) {
                this.socket = io('http://localhost:3000');
                
                this.socket.on('connect', () => {
                    console.log('WebSocket已连接');
                });

                this.socket.on('live_message', (data) => {
                    if (window.danmakuManager) {
                        window.danmakuManager.handleLiveMessage(data);
                    }
                    if (window.flyingDanmakuManager) {
                        window.flyingDanmakuManager.createFlyingDanmaku(data);
                    }
                    // 处理礼物消息
                    if (data.type === 'gift' && data.is_valid_gift && data.fortune_type) {
                        this.handleGiftMessage(data);
                    }
                    // 处理点赞消息 - 触发敲打动画
                    if (data.type === 'like') {
                        this.handleLikeMessage(data);
                    }
                });

                this.socket.on('live_error', (data) => {
                    this.updateStatus(`错误: ${data.message}`, 'error');
                });
            }

            // 发送开始监听请求
            const response = await fetch('http://localhost:3000/api/live/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ live_id: liveId })
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentLiveId = liveId;
                this.socket.emit('join', liveId);
                
                // 保存连接状态
                this.saveConnectionState(liveId);
                
                const statusMsg = this.isRestoring ?
                    `已恢复连接: ${liveId}` :
                    `已连接: ${liveId}`;
                this.updateStatus(statusMsg, 'connected');
                
                this.connectLiveBtn.style.display = 'none';
                this.disconnectLiveBtn.classList.add('show');
                this.liveRoomInput.disabled = true;
                
                this.isRestoring = false;
            } else {
                this.updateStatus(`连接失败: ${result.message}`, 'error');
                this.isRestoring = false;
            }
        } catch (error) {
            console.error('连接失败:', error);
            this.updateStatus(`连接失败: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        if (!this.currentLiveId) return;

        try {
            const response = await fetch('http://localhost:3000/api/live/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ live_id: this.currentLiveId })
            });

            if (this.socket) {
                this.socket.emit('leave', this.currentLiveId);
            }

            // 清除保存的连接状态
            this.clearConnectionState();
            
            this.currentLiveId = null;
            this.updateStatus('未连接', '');
            this.connectLiveBtn.style.display = 'block';
            this.disconnectLiveBtn.classList.remove('show');
            this.liveRoomInput.disabled = false;
        } catch (error) {
            console.error('断开连接失败:', error);
        }
    }

    /**
     * 处理礼物消息
     * @param {Object} data - 礼物数据
     */
    handleGiftMessage(data) {
        if (!this.giftQueueManager) {
            console.warn('礼物队列管理器未初始化');
            return;
        }

        console.log(`🎁 收到有效礼物: ${data.user_name} 送出 ${data.gift_name} -> ${data.fortune_type}运势`);
        
        // 添加到队列
        this.giftQueueManager.addToQueue(data);
    }

    /**
     * 处理点赞消息 - 触发敲打动画并显示功德提示
     * @param {Object} data - 点赞数据
     */
    handleLikeMessage(data) {
        // 触发巫女敲打动画，传入用户信息
        if (window.game && window.game.interactionManager && window.game.interactionManager.mikoManager) {
            console.log(`❤️ ${data.user_name} 点赞 x${data.count} - 触发敲打动画和功德提示`);
            
            // 传递用户数据给敲打动画
            const userData = {
                userName: data.user_name,
                likeCount: data.count
            };
            window.game.interactionManager.mikoManager.triggerHammerHit(userData);
            
            // 创建特效
            if (window.game.interactionManager.particleManager && window.game.interactionManager.mikoManager.miko) {
                const position = window.game.interactionManager.mikoManager.miko.position;
                window.game.interactionManager.particleManager.createBurst(position, 0xff69b4); // 粉色爱心特效
            }
        }
    }

    updateStatus(text, className) {
        this.liveStatus.textContent = text;
        this.liveStatus.className = className;
    }
}

// 导出为全局变量
window.LiveConnectionManager = LiveConnectionManager;