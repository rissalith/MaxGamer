/**
 * 登录页面脚本
 * 处理登录表单交互和验证
 */

const LoginPage = {
    // DOM元素
    elements: {},
    
    // 当前登录模式
    currentMode: 'password', // 'password' 或 'email'
    
    // 当前表单模式
    formMode: 'login', // 'login' 或 'register'
    
    // 倒计时相关
    countdown: 0,
    countdownTimer: null,
    registerCountdown: 0,
    registerCountdownTimer: null,
    
    /**
     * 初始化登录页面
     */
    init() {
        console.log('登录页面初始化...');
        
        // 初始化认证管理器
        AuthManager.init();
        
        // 检查是否已登录
        if (AuthManager.isLoggedIn()) {
            // 已登录，跳转到主页
            window.location.href = '/home.html';
            return;
        }
        
        // 缓存DOM元素
        this._cacheElements();
        
        // 绑定事件
        this._bindEvents();
        
        // 设置初始登录模式（确保required属性正确）
        this.switchLoginMode('password');
        
        console.log('登录页面已初始化 ✅');
    },
    
    /**
     * 缓存DOM元素
     * @private
     */
    _cacheElements() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            loginHeader: document.getElementById('loginHeader'),
            loginModeSwitch: document.querySelector('.login-mode-switch'),
            // 登录模式切换
            modeBtns: document.querySelectorAll('.mode-btn'),
            passwordLoginMode: document.getElementById('passwordLoginMode'),
            emailLoginMode: document.getElementById('emailLoginMode'),
            // 账号密码登录
            accountInput: document.getElementById('accountInput'),
            passwordInput: document.getElementById('passwordInput'),
            accountError: document.getElementById('accountError'),
            passwordError: document.getElementById('passwordError'),
            // 邮箱验证码登录
            emailInput: document.getElementById('emailInput'),
            codeInput: document.getElementById('codeInput'),
            sendCodeBtn: document.getElementById('sendCodeBtn'),
            emailError: document.getElementById('emailError'),
            codeError: document.getElementById('codeError'),
            // 通用
            loginBtn: document.getElementById('loginBtn'),
            authStatus: document.getElementById('authStatus'),
            googleLoginBtn: document.getElementById('googleLoginBtn'),
            twitterLoginBtn: document.getElementById('twitterLoginBtn'),
            wechatLoginBtn: document.getElementById('wechatLoginBtn'),
            // 表单切换
            showRegisterBtn: document.getElementById('showRegisterBtn'),
            showLoginBtn: document.getElementById('showLoginBtn'),
            loginFooter: document.getElementById('loginFooter'),
            registerFooter: document.getElementById('registerFooter'),
            // 注册表单
            registerForm: document.getElementById('registerForm'),
            registerEmailInput: document.getElementById('registerEmailInput'),
            registerCodeInput: document.getElementById('registerCodeInput'),
            registerPasswordInput: document.getElementById('registerPasswordInput'),
            registerConfirmPasswordInput: document.getElementById('registerConfirmPasswordInput'),
            registerNicknameInput: document.getElementById('registerNicknameInput'),
            registerSendCodeBtn: document.getElementById('registerSendCodeBtn'),
            registerBtn: document.getElementById('registerBtn'),
            registerEmailError: document.getElementById('registerEmailError'),
            registerCodeError: document.getElementById('registerCodeError'),
            registerPasswordError: document.getElementById('registerPasswordError'),
            registerConfirmPasswordError: document.getElementById('registerConfirmPasswordError'),
            registerNicknameError: document.getElementById('registerNicknameError'),
            registerAuthStatus: document.getElementById('registerAuthStatus')
        };
    },
    
    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        const {
            loginForm, modeBtns, sendCodeBtn,
            emailInput, codeInput, accountInput, passwordInput,
            googleLoginBtn, twitterLoginBtn, wechatLoginBtn
        } = this.elements;
        
        // 初始化拖动功能
        this._initDraggable();
        
        // 登录模式切换
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchLoginMode(mode);
            });
        });
        
        // 表单提交
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // 发送验证码
        if (sendCodeBtn) {
            sendCodeBtn.addEventListener('click', () => {
                this.handleSendCode();
            });
        }
        
        // 账号输入验证
        if (accountInput) {
            accountInput.addEventListener('input', () => {
                this.clearError('account');
            });
        }
        
        // 密码输入验证
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.clearError('password');
            });
        }
        
        // 邮箱输入验证
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.clearError('email');
            });
        }
        
        // 验证码输入验证
        if (codeInput) {
            codeInput.addEventListener('input', (e) => {
                // 只允许输入数字
                e.target.value = e.target.value.replace(/\D/g, '');
                // 清除错误提示
                this.clearError('code');
            });
        }
        
        // Google登录
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                this.handleGoogleLogin();
            });
        }
        
        // Twitter/X登录
        if (twitterLoginBtn) {
            twitterLoginBtn.addEventListener('click', () => {
                this.handleTwitterLogin();
            });
        }
        
        // 微信登录
        if (wechatLoginBtn) {
            wechatLoginBtn.addEventListener('click', () => {
                this.handleWechatLogin();
            });
        }
        
        // 表单切换
        if (this.elements.showRegisterBtn) {
            this.elements.showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchFormMode('register');
            });
        }
        
        if (this.elements.showLoginBtn) {
            this.elements.showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchFormMode('login');
            });
        }
        
        // 注册表单提交
        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        // 注册发送验证码
        if (this.elements.registerSendCodeBtn) {
            this.elements.registerSendCodeBtn.addEventListener('click', () => {
                this.handleRegisterSendCode();
            });
        }
        
        // 注册表单输入验证
        if (this.elements.registerEmailInput) {
            this.elements.registerEmailInput.addEventListener('input', () => {
                this.clearError('registerEmail');
            });
        }
        
        if (this.elements.registerCodeInput) {
            this.elements.registerCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
                this.clearError('registerCode');
            });
        }
        
        if (this.elements.registerPasswordInput) {
            this.elements.registerPasswordInput.addEventListener('input', () => {
                this.clearError('registerPassword');
            });
        }
        
        if (this.elements.registerConfirmPasswordInput) {
            this.elements.registerConfirmPasswordInput.addEventListener('input', () => {
                this.clearError('registerConfirmPassword');
            });
        }
        
        if (this.elements.registerNicknameInput) {
            this.elements.registerNicknameInput.addEventListener('input', () => {
                this.clearError('registerNickname');
            });
        }
        
        // 检查是否是OAuth回调
        this._checkOAuthCallback();
    },
    
    /**
     * 切换登录模式
     */
    switchLoginMode(mode) {
        const { modeBtns, passwordLoginMode, emailLoginMode, accountInput, passwordInput, emailInput, codeInput } = this.elements;
        
        this.currentMode = mode;
        
        // 更新按钮状态
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 切换显示的表单并管理required属性
        if (mode === 'password') {
            passwordLoginMode.style.display = 'block';
            emailLoginMode.style.display = 'none';
            // 账号密码模式：账号密码必填，邮箱验证码不必填
            if (accountInput) accountInput.required = true;
            if (passwordInput) passwordInput.required = true;
            if (emailInput) emailInput.required = false;
            if (codeInput) codeInput.required = false;
        } else {
            passwordLoginMode.style.display = 'none';
            emailLoginMode.style.display = 'block';
            // 邮箱验证码模式：邮箱验证码必填，账号密码不必填
            if (accountInput) accountInput.required = false;
            if (passwordInput) passwordInput.required = false;
            if (emailInput) emailInput.required = true;
            if (codeInput) codeInput.required = true;
        }
        
        // 清除所有错误
        this.clearAllErrors();
        this.hideStatus();
    },
    
    /**
     * 切换表单模式（登录/注册）
     */
    switchFormMode(mode) {
        const { loginForm, registerForm, loginHeader, loginModeSwitch } = this.elements;
        
        this.formMode = mode;
        
        if (mode === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            // 保持登录头部隐藏
            // if (loginHeader) loginHeader.style.display = 'block';
            if (loginModeSwitch) loginModeSwitch.style.display = 'flex';
            // 清除注册表单的required属性
            this._setRegisterFormRequired(false);
            // 设置登录表单的required属性
            this.switchLoginMode(this.currentMode);
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            if (loginHeader) loginHeader.style.display = 'none';
            if (loginModeSwitch) loginModeSwitch.style.display = 'none';
            // 清除登录表单的required属性
            this._setLoginFormRequired(false);
            // 设置注册表单的required属性
            this._setRegisterFormRequired(true);
        }
        
        // 清除所有错误和状态
        this.clearAllErrors();
        this.hideStatus();
        this.hideRegisterStatus();
    },
    
    /**
     * 设置登录表单required属性
     * @private
     */
    _setLoginFormRequired(required) {
        const { accountInput, passwordInput, emailInput, codeInput } = this.elements;
        if (accountInput) accountInput.required = required && this.currentMode === 'password';
        if (passwordInput) passwordInput.required = required && this.currentMode === 'password';
        if (emailInput) emailInput.required = required && this.currentMode === 'email';
        if (codeInput) codeInput.required = required && this.currentMode === 'email';
    },
    
    /**
     * 设置注册表单required属性
     * @private
     */
    _setRegisterFormRequired(required) {
        const { registerEmailInput, registerCodeInput, registerPasswordInput, registerConfirmPasswordInput } = this.elements;
        if (registerEmailInput) registerEmailInput.required = required;
        if (registerCodeInput) registerCodeInput.required = required;
        if (registerPasswordInput) registerPasswordInput.required = required;
        if (registerConfirmPasswordInput) registerConfirmPasswordInput.required = required;
    },
    
    /**
     * 清除所有错误
     */
    clearAllErrors() {
        ['account', 'password', 'email', 'code', 'registerEmail', 'registerCode',
         'registerPassword', 'registerConfirmPassword', 'registerNickname'].forEach(field => {
            this.clearError(field);
        });
    },
    
    /**
     * 验证邮箱
     * @private
     */
    _validateEmail(email) {
        if (!email) {
            return '请输入邮箱';
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return '请输入正确的邮箱地址';
        }
        
        return null;
    },
    
    /**
     * 验证验证码
     * @private
     */
    _validateCode(code) {
        if (!code) {
            return '请输入验证码';
        }
        
        if (!/^\d{6}$/.test(code)) {
            return '验证码为6位数字';
        }
        
        return null;
    },
    
    /**
     * 显示错误
     */
    showError(field, message) {
        const errorElement = this.elements[`${field}Error`];
        if (errorElement) {
            errorElement.textContent = message;
        }
    },
    
    /**
     * 清除错误
     */
    clearError(field) {
        const errorElement = this.elements[`${field}Error`];
        if (errorElement) {
            errorElement.textContent = '';
        }
    },
    
    /**
     * 显示状态消息
     */
    showStatus(type, message) {
        const { authStatus } = this.elements;
        authStatus.className = `auth-status ${type}`;
        authStatus.textContent = message;
        authStatus.style.display = 'block';
    },
    
    /**
     * 隐藏状态消息
     */
    hideStatus() {
        const { authStatus } = this.elements;
        if (authStatus) authStatus.style.display = 'none';
    },
    
    /**
     * 显示注册状态消息
     */
    showRegisterStatus(type, message) {
        const { registerAuthStatus } = this.elements;
        if (registerAuthStatus) {
            registerAuthStatus.className = `auth-status ${type}`;
            registerAuthStatus.textContent = message;
            registerAuthStatus.style.display = 'block';
        }
    },
    
    /**
     * 隐藏注册状态消息
     */
    hideRegisterStatus() {
        const { registerAuthStatus } = this.elements;
        if (registerAuthStatus) registerAuthStatus.style.display = 'none';
    },
    
    /**
     * 开始倒计时
     * @private
     */
    _startCountdown() {
        const { sendCodeBtn } = this.elements;
        this.countdown = 60;
        sendCodeBtn.disabled = true;
        
        this.countdownTimer = setInterval(() => {
            this.countdown--;
            sendCodeBtn.textContent = `${this.countdown}秒后重试`;
            
            if (this.countdown <= 0) {
                this._stopCountdown();
            }
        }, 1000);
    },
    
    /**
     * 停止倒计时
     * @private
     */
    _stopCountdown() {
        const { sendCodeBtn } = this.elements;
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        this.countdown = 0;
        sendCodeBtn.disabled = false;
        sendCodeBtn.textContent = '获取验证码';
    },
    
    /**
     * 处理发送验证码
     */
    async handleSendCode() {
        const { emailInput, sendCodeBtn } = this.elements;
        const email = emailInput.value.trim();
        
        // 验证邮箱
        const emailError = this._validateEmail(email);
        if (emailError) {
            this.showError('email', emailError);
            return;
        }
        
        // 禁用按钮
        sendCodeBtn.disabled = true;
        this.hideStatus();
        
        try {
            this.showStatus('processing', '正在发送验证码...');
            
            // 调用API发送验证码
            await AuthManager.sendEmailCode(email, 'login');
            
            this.showStatus('success', '✅ 验证码已发送，请查收邮件');
            
            // 开始倒计时
            this._startCountdown();
            
            // 3秒后隐藏成功消息
            setTimeout(() => {
                this.hideStatus();
            }, 3000);
            
        } catch (error) {
            console.error('发送验证码失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            sendCodeBtn.disabled = false;
        }
    },
    
    /**
     * 处理登录
     */
    async handleLogin() {
        if (this.currentMode === 'password') {
            await this.handlePasswordLogin();
        } else {
            await this.handleEmailLogin();
        }
    },
    
    /**
     * 处理账号密码登录
     */
    async handlePasswordLogin() {
        const { accountInput, passwordInput, loginBtn } = this.elements;
        const account = accountInput.value.trim();
        const password = passwordInput.value.trim();
        
        // 验证账号
        if (!account) {
            this.showError('account', '请输入手机号或邮箱');
            return;
        }
        
        // 验证密码
        if (!password) {
            this.showError('password', '请输入密码');
            return;
        }
        
        if (password.length < 6) {
            this.showError('password', '密码至少6位');
            return;
        }
        
        // 禁用按钮并显示加载状态
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = '登录中...';
        this.hideStatus();
        
        try {
            // 调用API登录
            const result = await AuthManager.loginWithPassword(account, password);
            
            loginBtn.textContent = '登录成功';
            this.showStatus('success', `✅ 登录成功！欢迎 ${result.user.nickname || result.user.phone}`);
            
            // 1秒后跳转到主页
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 1000);
            
        } catch (error) {
            console.error('登录失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.textContent = originalText;
        }
    },
    
    /**
     * 处理邮箱验证码登录
     */
    async handleEmailLogin() {
        const { emailInput, codeInput, loginBtn } = this.elements;
        const email = emailInput.value.trim();
        const code = codeInput.value.trim();
        
        // 验证邮箱
        const emailError = this._validateEmail(email);
        if (emailError) {
            this.showError('email', emailError);
            return;
        }
        
        // 验证验证码
        const codeError = this._validateCode(code);
        if (codeError) {
            this.showError('code', codeError);
            return;
        }
        
        // 禁用按钮并显示加载状态
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = '登录中...';
        this.hideStatus();
        
        try {
            // 调用API登录
            const result = await AuthManager.loginWithEmail(email, code);
            
            // 检查是否需要设置密码
            if (result.needSetPassword) {
                loginBtn.textContent = '登录成功';
                this.showStatus('success', '✅ 首次登录，请设置密码');
                // 显示设置密码对话框
                setTimeout(() => {
                    this.showSetPasswordDialog(result.token, result.user);
                }, 1000);
                return;
            }
            
            loginBtn.textContent = '登录成功';
            this.showStatus('success', `✅ 登录成功！欢迎 ${result.user.nickname || result.user.email}`);
            
            // 1秒后跳转到主页
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 1000);
            
        } catch (error) {
            console.error('登录失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.textContent = originalText;
        }
    },
    
    /**
     * 显示设置密码对话框
     */
    showSetPasswordDialog(token, user) {
        const modal = document.getElementById('setPasswordModal');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const confirmBtn = document.getElementById('confirmPasswordBtn');
        const skipBtn = document.getElementById('skipPasswordBtn');
        const newPasswordError = document.getElementById('newPasswordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        
        // 显示模态框
        modal.style.display = 'flex';
        
        // 清空输入
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        newPasswordError.textContent = '';
        confirmPasswordError.textContent = '';
        
        // 确认按钮点击
        const handleConfirm = async () => {
            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            
            // 验证新密码
            if (!newPassword) {
                newPasswordError.textContent = '请输入密码';
                return;
            }
            if (newPassword.length < 6) {
                newPasswordError.textContent = '密码至少6位';
                return;
            }
            if (newPassword.length > 20) {
                newPasswordError.textContent = '密码最多20位';
                return;
            }
            
            // 验证确认密码
            if (!confirmPassword) {
                confirmPasswordError.textContent = '请再次输入密码';
                return;
            }
            if (newPassword !== confirmPassword) {
                confirmPasswordError.textContent = '两次密码不一致';
                return;
            }
            
            // 清除错误
            newPasswordError.textContent = '';
            confirmPasswordError.textContent = '';
            
            // 设置密码
            try {
                confirmBtn.disabled = true;
                await this.setPassword(token, newPassword);
                modal.style.display = 'none';
            } catch (error) {
                confirmBtn.disabled = false;
            }
        };
        
        // 跳过按钮点击
        const handleSkip = () => {
            modal.style.display = 'none';
            window.location.href = '/home.html';
        };
        
        // 绑定事件（移除旧的事件监听器）
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirm);
        
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
        newSkipBtn.addEventListener('click', handleSkip);
        
        // 回车键提交
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            }
        };
        newPasswordInput.addEventListener('keypress', handleKeyPress);
        confirmPasswordInput.addEventListener('keypress', handleKeyPress);
        
        // 输入时清除错误
        newPasswordInput.addEventListener('input', () => {
            newPasswordError.textContent = '';
        });
        confirmPasswordInput.addEventListener('input', () => {
            confirmPasswordError.textContent = '';
        });
    },
    
    /**
     * 设置密码
     */
    async setPassword(token, password) {
        try {
            this.showStatus('processing', '正在设置密码...');
            
            await AuthManager.setPassword(password, token);
            
            this.showStatus('success', '✅ 密码设置成功！');
            
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 1000);
            
        } catch (error) {
            console.error('设置密码失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
        }
    },
    
    /**
     * 处理Google登录
     */
    async handleGoogleLogin() {
        const { googleLoginBtn } = this.elements;
        
        try {
            googleLoginBtn.disabled = true;
            this.showStatus('processing', '正在打开Google登录窗口...');
            
            // 调用AuthManager的Google登录方法
            const result = await AuthManager.loginWithGoogle();
            
            // 登录成功
            this.showStatus('success', `✅ 登录成功！欢迎 ${result.user.nickname || result.user.email || '用户'}`);
            
            // 立即跳转到主页
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 500);
            
        } catch (error) {
            console.error('Google登录失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            googleLoginBtn.disabled = false;
        }
    },
    
    /**
     * 处理Twitter/X登录
     */
    async handleTwitterLogin() {
        const { twitterLoginBtn } = this.elements;
        
        try {
            twitterLoginBtn.disabled = true;
            this.showStatus('processing', '正在打开X登录窗口...');
            
            // 调用AuthManager的Twitter登录方法
            const result = await AuthManager.loginWithTwitter();
            
            if (result.success) {
                this.showStatus('success', `✅ 登录成功！欢迎 ${result.user.nickname}`);
                
                // 1秒后跳转到主页
                setTimeout(() => {
                    window.location.href = '/home.html';
                }, 1000);
            }
            
        } catch (error) {
            console.error('X登录失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            twitterLoginBtn.disabled = false;
        }
    },
    
    /**
     * 处理微信登录
     */
    async handleWechatLogin() {
        const { wechatLoginBtn } = this.elements;
        
        try {
            wechatLoginBtn.disabled = true;
            this.showStatus('processing', '正在打开微信登录窗口...');
            
            // 调用AuthManager的微信登录方法
            const result = await AuthManager.loginWithWechat();
            
            if (result.success) {
                this.showStatus('success', `✅ 登录成功！欢迎 ${result.user.nickname}`);
                
                // 1秒后跳转到主页
                setTimeout(() => {
                    window.location.href = '/home.html';
                }, 1000);
            }
            
        } catch (error) {
            console.error('微信登录失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            wechatLoginBtn.disabled = false;
        }
    },
    
    /**
     * 检查是否是OAuth回调
     * @private
     */
    _checkOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const provider = urlParams.get('provider');
        
        if (code && state && provider) {
            this.handleOAuthCallback(provider, code, state);
        }
    },
    
    /**
     * 处理OAuth回调
     * @param {string} provider - 提供商
     * @param {string} code - 授权码
     * @param {string} state - 状态码
     */
    async handleOAuthCallback(provider, code, state) {
        try {
            this.showStatus('processing', '正在完成登录...');
            
            // 调用AuthManager处理OAuth回调
            const result = await AuthManager.handleOAuthCallback(provider, code, state);
            
            this.showStatus('success', `✅ 登录成功！欢迎 ${result.user.nickname || result.user.phone}`);
            
            // 清除URL参数
            window.history.replaceState({}, document.title, '/login.html');
            
            // 1秒后跳转到主页
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 1000);
            
        } catch (error) {
            console.error('OAuth回调处理失败:', error);
            this.showStatus('error', `❌ ${error.message}`);
            
            // 清除URL参数
            window.history.replaceState({}, document.title, '/login.html');
        }
    },
    
    /**
     * 处理注册发送验证码
     */
    async handleRegisterSendCode() {
        const { registerEmailInput, registerSendCodeBtn } = this.elements;
        const email = registerEmailInput.value.trim();
        
        // 验证邮箱
        const emailError = this._validateEmail(email);
        if (emailError) {
            this.showError('registerEmail', emailError);
            return;
        }
        
        // 禁用按钮
        registerSendCodeBtn.disabled = true;
        this.hideRegisterStatus();
        
        try {
            this.showRegisterStatus('processing', '正在发送验证码...');
            
            // 调用API发送验证码
            await AuthManager.sendEmailCode(email, 'register');
            
            this.showRegisterStatus('success', '✅ 验证码已发送，请查收邮件');
            
            // 开始倒计时
            this._startRegisterCountdown();
            
            // 3秒后隐藏成功消息
            setTimeout(() => {
                this.hideRegisterStatus();
            }, 3000);
            
        } catch (error) {
            console.error('发送验证码失败:', error);
            this.showRegisterStatus('error', `❌ ${error.message}`);
            registerSendCodeBtn.disabled = false;
        }
    },
    
    /**
     * 开始注册倒计时
     * @private
     */
    _startRegisterCountdown() {
        const { registerSendCodeBtn } = this.elements;
        this.registerCountdown = 60;
        registerSendCodeBtn.disabled = true;
        
        this.registerCountdownTimer = setInterval(() => {
            this.registerCountdown--;
            registerSendCodeBtn.textContent = `${this.registerCountdown}秒后重试`;
            
            if (this.registerCountdown <= 0) {
                this._stopRegisterCountdown();
            }
        }, 1000);
    },
    
    /**
     * 停止注册倒计时
     * @private
     */
    _stopRegisterCountdown() {
        const { registerSendCodeBtn } = this.elements;
        
        if (this.registerCountdownTimer) {
            clearInterval(this.registerCountdownTimer);
            this.registerCountdownTimer = null;
        }
        
        this.registerCountdown = 0;
        registerSendCodeBtn.disabled = false;
        registerSendCodeBtn.textContent = '获取验证码';
    },
    
    /**
     * 处理注册
     */
    async handleRegister() {
        const {
            registerEmailInput, registerCodeInput, registerPasswordInput,
            registerConfirmPasswordInput, registerNicknameInput, registerBtn
        } = this.elements;
        
        const email = registerEmailInput.value.trim();
        const code = registerCodeInput.value.trim();
        const password = registerPasswordInput.value.trim();
        const confirmPassword = registerConfirmPasswordInput.value.trim();
        const nickname = registerNicknameInput.value.trim();
        
        // 验证邮箱
        const emailError = this._validateEmail(email);
        if (emailError) {
            this.showError('registerEmail', emailError);
            return;
        }
        
        // 验证验证码
        const codeError = this._validateCode(code);
        if (codeError) {
            this.showError('registerCode', codeError);
            return;
        }
        
        // 验证密码
        if (!password) {
            this.showError('registerPassword', '请输入密码');
            return;
        }
        if (password.length < 6) {
            this.showError('registerPassword', '密码至少6位');
            return;
        }
        if (password.length > 20) {
            this.showError('registerPassword', '密码最多20位');
            return;
        }
        
        // 验证确认密码
        if (password !== confirmPassword) {
            this.showError('registerConfirmPassword', '两次密码不一致');
            return;
        }
        
        // 验证昵称
        if (nickname && nickname.length < 2) {
            this.showError('registerNickname', '昵称至少2个字符');
            return;
        }
        if (nickname && nickname.length > 20) {
            this.showError('registerNickname', '昵称最多20个字符');
            return;
        }
        
        // 禁用按钮并显示加载状态
        registerBtn.disabled = true;
        registerBtn.classList.add('loading');
        const originalText = registerBtn.textContent;
        registerBtn.textContent = '注册中...';
        this.hideRegisterStatus();
        
        try {
            // 调用API注册
            const result = await AuthManager.register({
                email,
                code,
                password,
                nickname: nickname || undefined
            });
            
            registerBtn.textContent = '注册成功';
            this.showRegisterStatus('success', `✅ 注册成功！欢迎 ${result.user.nickname || result.user.email}`);
            
            // 1秒后跳转到主页
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 1000);
            
        } catch (error) {
            console.error('注册失败:', error);
            this.showRegisterStatus('error', `❌ ${error.message}`);
            registerBtn.disabled = false;
            registerBtn.classList.remove('loading');
            registerBtn.textContent = originalText;
        }
    },
    
    /**
     * 初始化拖动功能
     * @private
     */
    _initDraggable() {
        const brandSection = document.querySelector('.brand-section');
        const brandTitle = document.querySelector('.brand-title');
        const brandSubtitle = document.querySelector('.brand-subtitle');
        
        if (!brandSection) return;
        
        // 保存初始位置
        const initialPosition = {
            left: '5%',
            top: '30%'
        };
        
        // 拖动状态
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        // 鼠标按下事件
        const dragStart = (e) => {
            // 只允许在brand-section、标题或副标题上拖动
            if (e.target === brandSection || e.target === brandTitle || e.target === brandSubtitle) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
                brandSection.style.cursor = 'grabbing';
            }
        };
        
        // 鼠标移动事件
        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                // 使用transform进行拖动,不改变left/top
                brandSection.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };
        
        // 鼠标松开事件 - 回到初始位置
        const dragEnd = () => {
            if (isDragging) {
                isDragging = false;
                brandSection.style.cursor = 'move';
                
                // 添加过渡动画
                brandSection.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                // 重置到初始位置
                brandSection.style.transform = 'translate(0, 0)';
                xOffset = 0;
                yOffset = 0;
                
                // 移除过渡效果(避免影响后续拖动)
                setTimeout(() => {
                    brandSection.style.transition = '';
                }, 500);
            }
        };
        
        // 绑定事件
        brandSection.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        // 触摸事件支持(移动端)
        const touchStart = (e) => {
            if (e.target === brandSection || e.target === brandTitle || e.target === brandSubtitle) {
                const touch = e.touches[0];
                initialX = touch.clientX - xOffset;
                initialY = touch.clientY - yOffset;
                isDragging = true;
                brandSection.style.cursor = 'grabbing';
            }
        };
        
        const touchMove = (e) => {
            if (isDragging) {
                e.preventDefault();
                const touch = e.touches[0];
                currentX = touch.clientX - initialX;
                currentY = touch.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                brandSection.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };
        
        const touchEnd = () => {
            if (isDragging) {
                isDragging = false;
                brandSection.style.cursor = 'move';
                
                brandSection.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                brandSection.style.transform = 'translate(0, 0)';
                xOffset = 0;
                yOffset = 0;
                
                setTimeout(() => {
                    brandSection.style.transition = '';
                }, 500);
            }
        };
        
        brandSection.addEventListener('touchstart', touchStart, { passive: false });
        document.addEventListener('touchmove', touchMove, { passive: false });
        document.addEventListener('touchend', touchEnd);
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoginPage.init());
} else {
    LoginPage.init();
}

// 导出供调试使用
window.LoginPage = LoginPage;