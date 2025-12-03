/**
 * MaxGamer SDK v1.0
 * 游戏接入标准开发包
 * 
 * 使用方法:
 * 1. 在游戏 HTML 中引入此 SDK
 * 2. 初始化: MaxGamer.init({ onAction: handleAction })
 * 3. 监听动作: function handleAction(action) { ... }
 */

(function(window) {
    'use strict';

    const SDK_VERSION = '1.0.0';
    
    // 消息类型常量
    const MESSAGE_TYPES = {
        // SDK -> 平台
        READY: 'MAXGAMER_READY',           // 游戏准备就绪
        CONFIG_REQUEST: 'CONFIG_REQUEST',   // 请求配置
        LOG: 'MAXGAMER_LOG',                // 日志消息
        EVENT: 'MAXGAMER_EVENT',            // 游戏事件
        
        // 平台 -> SDK
        ACTION: 'ACTION',                   // 执行动作
        CONFIG: 'CONFIG',                   // 配置数据
        INIT: 'INIT',                       // 初始化数据
        PAUSE: 'PAUSE',                     // 暂停游戏
        RESUME: 'RESUME',                   // 恢复游戏
    };

    /**
     * MaxGamer SDK 主对象
     */
    const MaxGamer = {
        version: SDK_VERSION,
        isInitialized: false,
        isReady: false,
        config: null,
        userConfig: null,
        
        // 回调函数
        _callbacks: {
            onAction: null,
            onConfig: null,
            onInit: null,
            onPause: null,
            onResume: null,
            onError: null,
        },
        
        // 动作队列 (初始化前收到的动作)
        _actionQueue: [],
        
        /**
         * 初始化 SDK
         * @param {Object} options - 配置选项
         * @param {Function} options.onAction - 动作回调
         * @param {Function} options.onConfig - 配置回调
         * @param {Function} options.onInit - 初始化回调
         * @param {Function} options.onPause - 暂停回调
         * @param {Function} options.onResume - 恢复回调
         * @param {Function} options.onError - 错误回调
         */
        init: function(options = {}) {
            if (this.isInitialized) {
                this._log('warn', 'SDK 已初始化，忽略重复调用');
                return;
            }
            
            this._log('info', `MaxGamer SDK v${SDK_VERSION} 初始化中...`);
            
            // 注册回调
            this._callbacks.onAction = options.onAction || null;
            this._callbacks.onConfig = options.onConfig || null;
            this._callbacks.onInit = options.onInit || null;
            this._callbacks.onPause = options.onPause || null;
            this._callbacks.onResume = options.onResume || null;
            this._callbacks.onError = options.onError || null;
            
            // 监听消息
            window.addEventListener('message', this._handleMessage.bind(this));
            
            this.isInitialized = true;
            
            // 发送准备就绪消息
            this._sendReady();
            
            this._log('info', 'SDK 初始化完成 ✅');
        },
        
        /**
         * 发送准备就绪消息
         */
        _sendReady: function() {
            this._postMessage({
                type: MESSAGE_TYPES.READY,
                version: SDK_VERSION,
                timestamp: Date.now()
            });
            this.isReady = true;
        },
        
        /**
         * 处理收到的消息
         */
        _handleMessage: function(event) {
            // 安全检查 - 验证消息来源
            // 在生产环境中，应该验证 event.origin
            
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            
            this._log('debug', `收到消息: ${data.type}`, data);
            
            switch (data.type) {
                case MESSAGE_TYPES.ACTION:
                    this._handleAction(data);
                    break;
                    
                case MESSAGE_TYPES.CONFIG:
                    this._handleConfig(data);
                    break;
                    
                case MESSAGE_TYPES.INIT:
                    this._handleInit(data);
                    break;
                    
                case MESSAGE_TYPES.PAUSE:
                    this._handlePause();
                    break;
                    
                case MESSAGE_TYPES.RESUME:
                    this._handleResume();
                    break;
            }
        },
        
        /**
         * 处理动作消息
         */
        _handleAction: function(data) {
            const action = {
                code: data.code,
                params: data.params || {},
                user: data.user || null,  // 触发用户信息
                source: data.source || null,  // 来源 (gift/comment/like)
                timestamp: data.timestamp || Date.now()
            };
            
            this._log('info', `执行动作: ${action.code}`, action);
            
            // 如果还没有注册回调，加入队列
            if (!this._callbacks.onAction) {
                this._actionQueue.push(action);
                return;
            }
            
            try {
                this._callbacks.onAction(action);
            } catch (error) {
                this._log('error', `动作处理错误: ${error.message}`);
                this._triggerError(error);
            }
        },
        
        /**
         * 处理配置消息
         */
        _handleConfig: function(data) {
            this.userConfig = data.config || {};
            this._log('info', '收到用户配置', this.userConfig);
            
            if (this._callbacks.onConfig) {
                try {
                    this._callbacks.onConfig(this.userConfig);
                } catch (error) {
                    this._log('error', `配置处理错误: ${error.message}`);
                }
            }
        },
        
        /**
         * 处理初始化消息
         */
        _handleInit: function(data) {
            this.config = data.config || {};
            this._log('info', '收到初始化配置', this.config);
            
            if (this._callbacks.onInit) {
                try {
                    this._callbacks.onInit(this.config);
                } catch (error) {
                    this._log('error', `初始化处理错误: ${error.message}`);
                }
            }
            
            // 处理队列中的动作
            this._processActionQueue();
        },
        
        /**
         * 处理暂停消息
         */
        _handlePause: function() {
            this._log('info', '游戏暂停');
            if (this._callbacks.onPause) {
                this._callbacks.onPause();
            }
        },
        
        /**
         * 处理恢复消息
         */
        _handleResume: function() {
            this._log('info', '游戏恢复');
            if (this._callbacks.onResume) {
                this._callbacks.onResume();
            }
        },
        
        /**
         * 处理动作队列
         */
        _processActionQueue: function() {
            if (!this._callbacks.onAction || this._actionQueue.length === 0) return;
            
            this._log('info', `处理队列中的 ${this._actionQueue.length} 个动作`);
            
            while (this._actionQueue.length > 0) {
                const action = this._actionQueue.shift();
                try {
                    this._callbacks.onAction(action);
                } catch (error) {
                    this._log('error', `队列动作处理错误: ${error.message}`);
                }
            }
        },
        
        /**
         * 触发错误回调
         */
        _triggerError: function(error) {
            if (this._callbacks.onError) {
                this._callbacks.onError(error);
            }
        },
        
        /**
         * 发送消息给平台
         */
        _postMessage: function(data) {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(data, '*');
            }
        },
        
        /**
         * 日志输出
         */
        _log: function(level, message, data = null) {
            const prefix = `[MaxGamer SDK]`;
            const logFn = console[level] || console.log;
            
            if (data) {
                logFn(`${prefix} ${message}`, data);
            } else {
                logFn(`${prefix} ${message}`);
            }
            
            // 发送日志给平台
            this._postMessage({
                type: MESSAGE_TYPES.LOG,
                level: level,
                message: message,
                data: data,
                timestamp: Date.now()
            });
        },
        
        // ==================== 公共 API ====================
        
        /**
         * 请求配置
         */
        requestConfig: function() {
            this._postMessage({
                type: MESSAGE_TYPES.CONFIG_REQUEST,
                timestamp: Date.now()
            });
        },
        
        /**
         * 发送游戏事件
         * @param {string} eventName - 事件名称
         * @param {Object} eventData - 事件数据
         */
        sendEvent: function(eventName, eventData = {}) {
            this._postMessage({
                type: MESSAGE_TYPES.EVENT,
                event: eventName,
                data: eventData,
                timestamp: Date.now()
            });
        },
        
        /**
         * 获取用户配置
         */
        getUserConfig: function() {
            return this.userConfig;
        },
        
        /**
         * 检查是否在平台容器中运行
         */
        isInPlatform: function() {
            return window.parent && window.parent !== window;
        },
        
        /**
         * 模拟动作 (用于开发测试)
         */
        simulateAction: function(code, params = {}, user = null) {
            this._handleAction({
                type: MESSAGE_TYPES.ACTION,
                code: code,
                params: params,
                user: user,
                source: 'simulate'
            });
        }
    };
    
    // 暴露到全局
    window.MaxGamer = MaxGamer;
    
    // 自动检测是否在 iframe 中
    if (window.parent && window.parent !== window) {
        console.log('[MaxGamer SDK] 检测到在 iframe 容器中运行');
    } else {
        console.log('[MaxGamer SDK] 独立运行模式 (开发测试)');
    }
    
})(window);


