/**
 * 认证管理模块
 * 负责用户认证状态管理、登录、注册、退出等功能
 */

const AuthManager = {
    // 认证状态
    isAuthenticated: false,
    currentUser: null,
    token: null,
    
    // API基础URL - 根据环境自动选择
    apiBaseUrl: (() => {
        const hostname = window.location.hostname;
        // 本地开发环境
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        // 生产环境 - 使用HTTPS（Cloudflare提供SSL）
        return `https://api.${hostname.replace('www.', '')}/api`;
    })(),
    
    /**
     * 初始化认证管理器
     */
    init() {
        // 从localStorage加载token
        this._loadTokenFromStorage();
        
        // 如果有token，验证并获取用户信息
        if (this.token) {
            this.verifyToken().then(valid => {
                if (valid) {
                    this.getUserInfo();
                } else {
                    this.logout();
                }
            });
        }
    },
    
    /**
     * 从localStorage加载token
     * @private
     */
    _loadTokenFromStorage() {
        try {
            const token = localStorage.getItem('xmframer_token');
            if (token) {
                this.token = token;
                this.isAuthenticated = true;
            }
        } catch (error) {
            console.error('加载token失败:', error);
        }
    },
    
    /**
     * 保存token到localStorage
     * @private
     */
    _saveTokenToStorage(token) {
        try {
            localStorage.setItem('xmframer_token', token);
            this.token = token;
            this.isAuthenticated = true;
        } catch (error) {
            console.error('保存token失败:', error);
        }
    },
    
    /**
     * 清除token
     * @private
     */
    _clearToken() {
        try {
            localStorage.removeItem('xmframer_token');
            this.token = null;
            this.isAuthenticated = false;
            this.currentUser = null;
        } catch (error) {
            console.error('清除token失败:', error);
        }
    },
    
    /**
     * 发送邮箱验证码
     * @param {string} email - 邮箱
     * @param {string} purpose - 用途 (login/register)
     * @returns {Promise<Object>}
     */
    async sendEmailCode(email, purpose = 'login') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, purpose })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || '发送验证码失败');
            }
            
            return data;
        } catch (error) {
            console.error('发送验证码错误:', error);
            throw error;
        }
    },
    
    /**
     * 使用邮箱验证码登录/注册
     * @param {string} email - 邮箱
     * @param {string} code - 验证码
     * @returns {Promise<Object>}
     */
    async loginWithEmail(email, code) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login-with-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || '登录失败');
            }
            
            // 保存token
            this._saveTokenToStorage(data.token);
            
            // 保存用户信息
            this.currentUser = data.user;
            
            // 触发登录成功事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: true, user: data.user }
            }));
            
            return data;
        } catch (error) {
            console.error('登录错误:', error);
            throw error;
        }
    },
    
    /**
     * 使用账号密码登录
     * @param {string} account - 账号（手机号或邮箱）
     * @param {string} password - 密码
     * @returns {Promise<Object>}
     */
    async loginWithPassword(account, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login-with-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ account, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || '登录失败');
            }
            
            // 保存token
            this._saveTokenToStorage(data.token);
            
            // 保存用户信息
            this.currentUser = data.user;
            
            // 触发登录成功事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: true, user: data.user }
            }));
            
            return data;
        } catch (error) {
            console.error('账号密码登录错误:', error);
            throw error;
        }
    },
    
    /**
     * 注册新用户
     * @param {Object} userData - 用户数据
     * @returns {Promise<Object>}
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || '注册失败');
            }
            
            // 保存token
            this._saveTokenToStorage(data.token);
            
            // 保存用户信息
            this.currentUser = data.user;
            
            // 触发登录成功事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: true, user: data.user }
            }));
            
            return data;
        } catch (error) {
            console.error('注册错误:', error);
            throw error;
        }
    },
    
    /**
     * 设置密码（首次登录）
     * @param {string} password - 新密码
     * @param {string} token - 可选的token（如果未登录）
     * @returns {Promise<Object>}
     */
    async setPassword(password, token = null) {
        try {
            const authToken = token || this.token;
            if (!authToken) {
                throw new Error('未登录');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/auth/set-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || '设置密码失败');
            }
            
            // 如果传入了token，保存它
            if (token && !this.token) {
                this._saveTokenToStorage(token);
                this.currentUser = data.user;
            }
            
            return data;
        } catch (error) {
            console.error('设置密码错误:', error);
            throw error;
        }
    },
    
    /**
     * 使用Google登录（弹窗方式）
     * @returns {Promise<Object>}
     */
    async loginWithGoogle() {
        try {
            // 从环境变量或配置获取Client ID
            const clientId = window.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
            const redirectUri = `${window.location.origin}/oauth-callback.html`;
            const scope = 'openid profile email';
            const state = this._generateState();
            
            // 保存state用于验证
            sessionStorage.setItem('oauth_state', state);
            sessionStorage.setItem('oauth_provider', 'google');
            
            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent(scope)}` +
                `&state=${encodeURIComponent(state)}` +
                `&access_type=offline` +
                `&prompt=consent`;
            
            // 使用弹窗打开登录页面
            return this._openOAuthPopup(googleAuthUrl, 'Google登录');
            
        } catch (error) {
            console.error('Google登录错误:', error);
            throw error;
        }
    },
    
    /**
     * 使用X (Twitter)登录（弹窗方式）
     * @returns {Promise<Object>}
     */
    async loginWithTwitter() {
        try {
            // 从环境变量或配置获取Client ID
            const clientId = window.TWITTER_CLIENT_ID || 'YOUR_TWITTER_CLIENT_ID';
            const redirectUri = `${window.location.origin}/oauth-callback.html`;
            const state = this._generateState();
            
            // 生成PKCE code challenge (异步)
            const codeChallenge = await this._generateCodeChallenge();
            
            // 保存state和code_verifier用于验证
            sessionStorage.setItem('oauth_state', state);
            sessionStorage.setItem('oauth_provider', 'twitter');
            sessionStorage.setItem('code_verifier', codeChallenge.verifier);
            
            const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent('tweet.read users.read')}` +
                `&state=${encodeURIComponent(state)}` +
                `&code_challenge=${encodeURIComponent(codeChallenge.challenge)}` +
                `&code_challenge_method=S256`;
            
            // 使用弹窗打开登录页面
            return this._openOAuthPopup(twitterAuthUrl, 'X登录');
            
        } catch (error) {
            console.error('X登录错误:', error);
            throw error;
        }
    },
    
    /**
     * 打开OAuth弹窗
     * @private
     * @param {string} url - OAuth URL
     * @param {string} title - 窗口标题
     * @returns {Promise<Object>}
     */
    _openOAuthPopup(url, title) {
        return new Promise((resolve, reject) => {
            // 保存this上下文
            const self = this;
            
            // 计算弹窗位置（居中）
            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            // 打开弹窗
            const popup = window.open(
                url,
                title,
                `width=${width},height=${height},left=${left},top=${top},` +
                `toolbar=no,location=no,directories=no,status=no,menubar=no,` +
                `scrollbars=yes,resizable=yes,copyhistory=no`
            );
            
            if (!popup) {
                reject(new Error('无法打开登录窗口，请检查浏览器弹窗设置'));
                return;
            }
            
            let timeoutId = null;
            let isResolved = false;
            
            // 清理函数
            const cleanup = () => {
                if (isResolved) return;
                isResolved = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                window.removeEventListener('message', messageHandler);
                
                // 不检查 popup.closed，直接尝试关闭
                try {
                    if (popup) {
                        popup.close();
                    }
                } catch (e) {
                    // 忽略所有错误
                }
            };
            
            // 设置超时时间（5分钟）
            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('登录超时，请重试'));
            }, 5 * 60 * 1000);
            
            // 监听来自弹窗的消息
            const messageHandler = (event) => {
                // 验证消息来源
                if (event.origin !== window.location.origin) {
                    return;
                }
                
                if (event.data.type === 'oauth_success') {
                    cleanup();
                    
                    // 如果需要设置密码，不保存token，只返回数据
                    if (event.data.needSetPassword) {
                        // 不保存token，让用户先设置密码
                        resolve(event.data);
                    } else {
                        // 不需要设置密码，直接保存token并登录
                        self._saveTokenToStorage(event.data.token);
                        self.currentUser = event.data.user;
                        
                        // 触发登录成功事件
                        window.dispatchEvent(new CustomEvent('authStateChanged', {
                            detail: { isAuthenticated: true, user: event.data.user }
                        }));
                        
                        resolve(event.data);
                    }
                } else if (event.data.type === 'oauth_error') {
                    cleanup();
                    reject(new Error(event.data.message || '登录失败'));
                } else if (event.data.type === 'oauth_cancel') {
                    cleanup();
                    reject(new Error('登录已取消'));
                }
            };
            
            window.addEventListener('message', messageHandler);
        });
    },
    
    /**
     * 处理OAuth回调
     * @param {string} provider - 提供商 (google/wechat)
     * @param {string} code - 授权码
     * @param {string} state - 状态码
     * @returns {Promise<Object>}
     */
    async handleOAuthCallback(provider, code, state) {
        try {
            // 验证state
            const savedState = sessionStorage.getItem('oauth_state');
            if (state !== savedState) {
                throw new Error('状态验证失败');
            }
            
            // 清除保存的state
            sessionStorage.removeItem('oauth_state');
            
            // 构造redirect_uri，确保与发起登录时一致
            const redirectUri = `${window.location.origin}/oauth-callback.html`;
            
            // 调用后端API处理OAuth登录
            const response = await fetch(`${this.apiBaseUrl}/auth/${provider}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, state, redirect_uri: redirectUri })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '第三方登录失败');
            }
            
            // 保存token
            this._saveTokenToStorage(data.token);
            
            // 保存用户信息
            this.currentUser = data.user;
            
            // 触发登录成功事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: true, user: data.user }
            }));
            
            return data;
            
        } catch (error) {
            console.error('OAuth回调处理错误:', error);
            throw error;
        }
    },
    
    /**
     * 生成随机state字符串
     * @private
     * @returns {string}
     */
    _generateState() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },
    
    /**
     * 生成PKCE code challenge（用于Twitter OAuth 2.0）
     * @private
     * @returns {Promise<Object>} { verifier, challenge }
     */
    async _generateCodeChallenge() {
        // 生成code_verifier (43-128个字符的随机字符串)
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const verifier = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        
        // 使用SHA256生成code_challenge
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        const challenge = btoa(String.fromCharCode.apply(null, hashArray))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        
        return { verifier, challenge };
    },
    
    /**
     * 验证token是否有效
     * @returns {Promise<boolean>}
     */
    async verifyToken() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/test-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('验证token错误:', error);
            return false;
        }
    },
    
    /**
     * 获取当前用户信息
     * @returns {Promise<Object>}
     */
    async getUserInfo() {
        if (!this.token) {
            throw new Error('未登录');
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '获取用户信息失败');
            }
            
            this.currentUser = data.user;
            
            // 触发用户信息更新事件
            window.dispatchEvent(new CustomEvent('userInfoUpdated', {
                detail: { user: data.user }
            }));
            
            return data.user;
        } catch (error) {
            console.error('获取用户信息错误:', error);
            throw error;
        }
    },
    
    /**
     * 更新用户信息
     * @param {Object} updates - 要更新的字段
     * @returns {Promise<Object>}
     */
    async updateProfile(updates) {
        if (!this.token) {
            throw new Error('未登录');
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '更新用户信息失败');
            }
            
            this.currentUser = data.user;
            
            // 触发用户信息更新事件
            window.dispatchEvent(new CustomEvent('userInfoUpdated', {
                detail: { user: data.user }
            }));
            
            return data.user;
        } catch (error) {
            console.error('更新用户信息错误:', error);
            throw error;
        }
    },
    
    /**
     * 退出登录
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            if (this.token) {
                // 调用后端退出接口
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('退出登录错误:', error);
        } finally {
            // 清除本地状态
            this._clearToken();
            
            // 触发登录状态改变事件
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isAuthenticated: false, user: null }
            }));
        }
    },
    
    /**
     * 获取认证状态
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.isAuthenticated && this.token !== null;
    },
    
    /**
     * 获取当前用户
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    },
    
    /**
     * 获取token
     * @returns {string|null}
     */
    getToken() {
        return this.token;
    },
    
    /**
     * 创建带认证的fetch请求
     * @param {string} url - 请求URL
     * @param {Object} options - fetch选项
     * @returns {Promise<Response>}
     */
    async authenticatedFetch(url, options = {}) {
        if (!this.token) {
            throw new Error('未登录');
        }
        
        // 添加Authorization头
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.token}`
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // 如果返回401，说明token失效
        if (response.status === 401) {
            this.logout();
            throw new Error('登录已过期，请重新登录');
        }
        
        return response;
    }
};

// 导出模块
window.AuthManager = AuthManager;