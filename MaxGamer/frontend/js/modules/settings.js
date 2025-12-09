/**
 * 个人设置模块 - 自动保存 & 即时生效
 */

const SettingsManager = {
    // 防抖定时器
    _saveTimer: null,
    
    /**
     * 初始化设置管理器
     */
    init() {
        // 加载用户信息
        this._loadUserInfo();

        // 绑定标签切换事件
        this._bindTabEvents();

        // 绑定表单事件
        this._bindFormEvents();

        // 加载并应用用户偏好设置
        this._loadAndApplyPreferences();
    },
    
    /**
     * 加载用户信息
     */
    async _loadUserInfo() {
        try {
            const user = AuthManager.getCurrentUser();
            if (!user) {
                const userData = await AuthManager.getUserInfo();
                this._updateUserDisplay(userData);
            } else {
                this._updateUserDisplay(user);
            }
        } catch (error) {
            console.error('[设置] 加载用户信息失败:', error);
        }
    },
    
    /**
     * 更新用户信息显示
     */
    _updateUserDisplay(user) {
        const nicknameInput = document.getElementById('nicknameInput');
        if (nicknameInput && user.nickname) {
            nicknameInput.value = user.nickname;
        }
        
        const emailDisplay = document.getElementById('emailDisplay');
        if (emailDisplay && user.email) {
            emailDisplay.value = user.email;
        }
        
        const avatarPreview = document.getElementById('avatarPreview');
        if (avatarPreview && user.avatar_url) {
            avatarPreview.innerHTML = `<img src="${user.avatar_url}" alt="头像">`;
        }
    },
    
    /**
     * 绑定标签切换事件
     */
    _bindTabEvents() {
        const navItems = document.querySelectorAll('.settings-nav-item');
        const panels = document.querySelectorAll('.settings-panel');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.dataset.tab;
                
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                panels.forEach(panel => panel.classList.remove('active'));
                const targetPanel = document.getElementById(`${tabName}-panel`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    },
    
    /**
     * 绑定表单事件
     */
    _bindFormEvents() {
        this._bindAvatarUpload();
        this._bindAutoSaveProfile();
        this._bindChangePassword();
        this._bindPasswordToggle();
        this._bindPreferenceToggles();
        this._bindLanguageChange();
        this._bindThemeChange();
        this._bindPlatformBindings();
    },
    
    /**
     * 绑定头像上传
     */
    _bindAvatarUpload() {
        const uploadBtn = document.getElementById('uploadAvatarBtn');
        const avatarInput = document.getElementById('avatarInput');
        const avatarPreview = document.getElementById('avatarPreview');
        
        if (uploadBtn && avatarInput) {
            uploadBtn.addEventListener('click', () => avatarInput.click());
            
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!file.type.startsWith('image/')) {
                    this._showToast('请选择图片文件', 'error');
                    return;
                }
                
                if (file.size > 2 * 1024 * 1024) {
                    this._showToast('图片大小不能超过2MB', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.innerHTML = `<img src="${e.target.result}" alt="头像">`;
                    this._showToast('头像已更新', 'success');
                };
                reader.readAsDataURL(file);
            });
        }
    },
    
    /**
     * 绑定自动保存个人资料
     */
    _bindAutoSaveProfile() {
        const nicknameInput = document.getElementById('nicknameInput');
        const saveHint = document.getElementById('profileSaveHint');
        
        if (nicknameInput) {
            nicknameInput.addEventListener('input', () => {
                // 防抖：用户停止输入500ms后自动保存
                clearTimeout(this._saveTimer);
                
                if (saveHint) {
                    saveHint.textContent = '正在输入...';
                    saveHint.classList.add('show');
                }
                
                this._saveTimer = setTimeout(async () => {
                    const nickname = nicknameInput.value.trim();
                    
                    if (!nickname || nickname.length < 2 || nickname.length > 20) {
                        if (saveHint) {
                            saveHint.textContent = '';
                            saveHint.classList.remove('show');
                        }
                        return;
                    }
                    
                    try {
                        if (saveHint) {
                            saveHint.textContent = '保存中...';
                        }
                        
                        await AuthManager.updateProfile({ nickname });
                        
                        if (saveHint) {
                            saveHint.textContent = '✓ 已保存';
                            setTimeout(() => {
                                saveHint.classList.remove('show');
                            }, 2000);
                        }
                        
                        // 更新主页面的用户名显示
                        const userNameEl = document.querySelector('.user-name');
                        if (userNameEl) {
                            userNameEl.textContent = nickname;
                        }
                    } catch (error) {
                        console.error('[设置] 自动保存失败:', error);
                        if (saveHint) {
                            saveHint.textContent = '保存失败';
                            saveHint.style.color = '#d93025';
                        }
                    }
                }, 500);
            });
        }
    },
    
    /**
     * 绑定修改密码
     */
    _bindChangePassword() {
        const changeBtn = document.getElementById('changePasswordBtn');
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (changeBtn && currentPassword && newPassword && confirmPassword) {
            changeBtn.addEventListener('click', async () => {
                const current = currentPassword.value.trim();
                const newPwd = newPassword.value.trim();
                const confirm = confirmPassword.value.trim();
                
                if (!current) {
                    this._showToast('请输入当前密码', 'error');
                    return;
                }
                
                if (!newPwd || newPwd.length < 6 || newPwd.length > 20) {
                    this._showToast('密码长度为6-20个字符', 'error');
                    return;
                }
                
                if (newPwd !== confirm) {
                    this._showToast('两次输入的密码不一致', 'error');
                    return;
                }
                
                try {
                    changeBtn.disabled = true;
                    changeBtn.textContent = '修改中...';
                    
                    await this._changePassword(current, newPwd);
                    
                    this._showToast('密码修改成功', 'success');
                    currentPassword.value = '';
                    newPassword.value = '';
                    confirmPassword.value = '';
                } catch (error) {
                    this._showToast(error.message || '修改失败', 'error');
                } finally {
                    changeBtn.disabled = false;
                    changeBtn.textContent = '修改密码';
                }
            });
        }
    },
    
    /**
     * 修改密码API调用
     */
    async _changePassword(currentPassword, newPassword) {
        const response = await AuthManager.authenticatedFetch(
            `${AuthManager.apiBaseUrl}/auth/change-password`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            }
        );
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || data.error || '修改密码失败');
        }
        return data;
    },
    
    /**
     * 绑定密码显示/隐藏
     */
    _bindPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);
                
                if (input) {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    
                    const icon = button.querySelector('.eye-icon');
                    if (icon) {
                        icon.innerHTML = isPassword
                            ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
                            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
                    }
                }
            });
        });
    },
    
    /**
     * 绑定偏好设置开关 - 即时生效
     */
    _bindPreferenceToggles() {
        // 深色模式
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                localStorage.setItem('dark_mode', enabled);
                this._applyDarkMode(enabled);
                const msg = window.I18n 
                    ? (enabled ? I18n.t('dark_mode_on') : I18n.t('dark_mode_off'))
                    : (enabled ? '已切换到深色模式' : '已切换到浅色模式');
                this._showToast(msg, 'success');
            });
        }
        
        // 动画效果
        const animationToggle = document.getElementById('animationToggle');
        if (animationToggle) {
            animationToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                localStorage.setItem('animations_enabled', enabled);
                this._applyAnimations(enabled);
                const msg = window.I18n 
                    ? (enabled ? I18n.t('animations_on') : I18n.t('animations_off'))
                    : (enabled ? '动画效果已开启' : '动画效果已关闭');
                this._showToast(msg, 'success');
            });
        }
        
        // 桌面通知
        const desktopNotificationToggle = document.getElementById('desktopNotificationToggle');
        if (desktopNotificationToggle) {
            desktopNotificationToggle.addEventListener('change', async (e) => {
                const enabled = e.target.checked;
                
                if (enabled && 'Notification' in window) {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        e.target.checked = false;
                        const msg = window.I18n ? I18n.t('notifications_denied') : '通知权限被拒绝';
                        this._showToast(msg, 'error');
                        return;
                    }
                }
                
                localStorage.setItem('desktop_notifications', enabled);
                const msg = window.I18n 
                    ? (enabled ? I18n.t('notifications_on') : I18n.t('notifications_off'))
                    : (enabled ? '桌面通知已开启' : '桌面通知已关闭');
                this._showToast(msg, 'success');
            });
        }
        
        // 声音提示
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                localStorage.setItem('sound_enabled', enabled);
                const msg = window.I18n 
                    ? (enabled ? I18n.t('sound_on') : I18n.t('sound_off'))
                    : (enabled ? '声音提示已开启' : '声音提示已关闭');
                this._showToast(msg, 'success');
            });
        }
    },
    
    /**
     * 绑定主题切换 - 即时生效
     */
    _bindThemeChange() {
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const theme = e.target.value;
                this._applyTheme(theme);
                localStorage.setItem('theme', theme);
                
                const themeNames = {
                    'white': '白色',
                    'purple': '紫色',
                    'gold': '金色',
                    'dark': '黑色'
                };
                
                this._showToast(`主题已切换为${themeNames[theme]}`, 'success');
            });
        });
    },
    
    /**
     * 绑定语言切换 - 即时生效
     */
    _bindLanguageChange() {
        const languageRadios = document.querySelectorAll('input[name="language"]');
        const saveHint = document.getElementById('languageSaveHint');
        
        languageRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const language = e.target.value;
                
                // 使用 I18n 模块切换语言
                if (window.I18n) {
                    I18n.setLanguage(language);
                } else {
                    localStorage.setItem('preferred_language', language);
                }
                
                // 显示保存提示
                if (saveHint) {
                    saveHint.textContent = window.I18n ? I18n.t('language_saved') : '✓ 已保存';
                    saveHint.classList.add('show');
                    setTimeout(() => {
                        saveHint.classList.remove('show');
                    }, 2000);
                }
                
                const langNames = {
                    'zh-CN': '简体中文',
                    'zh-TW': '繁體中文',
                    'en-US': 'English',
                    'ja-JP': '日本語',
                    'ko-KR': '한국어'
                };
                
                const message = window.I18n 
                    ? `${I18n.t('language_switched')} ${langNames[language]}`
                    : `语言已切换为 ${langNames[language]}`;
                this._showToast(message, 'success');
            });
        });
    },
    
    /**
     * 加载并应用用户偏好设置
     */
    _loadAndApplyPreferences() {
        // 主题色
        const savedTheme = localStorage.getItem('theme') || 'white';
        const themeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
        this._applyTheme(savedTheme);
        
        // 动画效果
        const animationsEnabled = localStorage.getItem('animations_enabled') !== 'false';
        const animationToggle = document.getElementById('animationToggle');
        if (animationToggle) {
            animationToggle.checked = animationsEnabled;
        }
        this._applyAnimations(animationsEnabled);
        
        // 桌面通知
        const desktopNotifications = localStorage.getItem('desktop_notifications') === 'true';
        const desktopNotificationToggle = document.getElementById('desktopNotificationToggle');
        if (desktopNotificationToggle) {
            desktopNotificationToggle.checked = desktopNotifications;
        }
        
        // 声音提示
        const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = soundEnabled;
        }
        
        // 语言设置
        const preferredLanguage = localStorage.getItem('preferred_language') || 'zh-CN';
        const languageRadio = document.querySelector(`input[name="language"][value="${preferredLanguage}"]`);
        if (languageRadio) {
            languageRadio.checked = true;
        }
    },
    
    /**
     * 应用主题色
     */
    _applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    /**
     * 应用动画效果
     */
    _applyAnimations(enabled) {
        if (enabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
    },
    
    /**
     * 应用语言设置
     */
    _applyLanguage(language) {
        document.documentElement.lang = language;
        // 使用 I18n 模块应用语言
        if (window.I18n) {
            I18n.setLanguage(language);
        }
    },
    
    /**
     * 显示Toast消息
     */
    _showToast(message, type = 'success') {
        // 移除旧的toast
        const oldToast = document.querySelector('.toast-message');
        if (oldToast) {
            oldToast.remove();
        }

        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 显示动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 3秒后移除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * 绑定平台绑定功能
     */
    _bindPlatformBindings() {
        // 加载已绑定的平台
        this._loadPlatformBindings();

        // 绑定所有平台按钮
        const bindButtons = document.querySelectorAll('.btn-platform-bind');
        bindButtons.forEach(button => {
            button.addEventListener('click', () => {
                const platform = button.dataset.platform;
                this._handlePlatformBind(platform);
            });
        });
    },

    /**
     * 加载已绑定的平台
     */
    async _loadPlatformBindings() {
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/auth/platform-bindings`,
                { method: 'GET' }
            );

            if (response.ok) {
                const data = await response.json();
                // 后端返回的是数组，转换为以 platform 为 key 的对象
                const bindingsArray = data.bindings || [];
                const bindingsMap = {};
                bindingsArray.forEach(binding => {
                    bindingsMap[binding.platform] = {
                        username: binding.platform_display_name || binding.platform_username,
                        user_id: binding.platform_user_id,
                        avatar_url: binding.platform_avatar_url
                    };
                });
                this._updatePlatformStatus(bindingsMap);
            }
        } catch (error) {
            console.error('加载平台绑定失败:', error);
            // 静默失败，不显示错误
        }
    },

    /**
     * 更新平台绑定状态
     */
    _updatePlatformStatus(bindings) {
        const platforms = ['twitch', 'douyin', 'tiktok', 'youtube'];

        platforms.forEach(platform => {
            const statusEl = document.getElementById(`${platform}-status`);
            const buttonEl = document.getElementById(`${platform}-bind-btn`);
            const itemEl = document.querySelector(`[data-platform="${platform}"]`);

            if (bindings[platform]) {
                if (statusEl) {
                    statusEl.textContent = `已绑定 - ${bindings[platform].username || bindings[platform].user_id}`;
                    statusEl.style.color = '#1a73e8';
                }
                if (buttonEl) {
                    buttonEl.textContent = '解除绑定';
                    buttonEl.classList.add('unbind');
                }
                if (itemEl) {
                    itemEl.classList.add('bound');
                }
            } else {
                if (statusEl) {
                    statusEl.textContent = '未绑定';
                    statusEl.style.color = '#5f6368';
                }
                if (buttonEl) {
                    buttonEl.textContent = '绑定账号';
                    buttonEl.classList.remove('unbind');
                }
                if (itemEl) {
                    itemEl.classList.remove('bound');
                }
            }
        });
    },

    /**
     * 处理平台绑定
     */
    async _handlePlatformBind(platform) {
        const button = document.getElementById(`${platform}-bind-btn`);
        const isUnbind = button.classList.contains('unbind');

        if (isUnbind) {
            // 解除绑定
            if (confirm(`确定要解除绑定 ${this._getPlatformName(platform)} 吗？`)) {
                await this._unbindPlatform(platform);
            }
        } else {
            // 绑定平台
            await this._bindPlatform(platform);
        }
    },

    /**
     * 绑定平台
     */
    async _bindPlatform(platform) {
        try {
            // 获取OAuth授权URL
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/auth/platform-oauth/${platform}`,
                { method: 'GET' }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || '获取授权链接失败');
            }

            if (!data.auth_url) {
                throw new Error('OAuth配置未完成，请联系管理员配置平台密钥');
            }

            // 打开OAuth授权窗口
            const width = 600;
            const height = 700;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            const authWindow = window.open(
                data.auth_url,
                `${platform}_oauth`,
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
            );

            if (!authWindow) {
                throw new Error('无法打开授权窗口，请检查浏览器弹窗设置');
            }

            // 监听授权结果
            const checkAuth = setInterval(async () => {
                if (authWindow.closed) {
                    clearInterval(checkAuth);
                    // 重新加载绑定状态
                    await this._loadPlatformBindings();
                }
            }, 1000);

            // 监听消息（来自OAuth回调页面）
            const messageHandler = async (event) => {
                if (event.data.type === 'platform_oauth_success' && event.data.platform === platform) {
                    window.removeEventListener('message', messageHandler);
                    this._showToast(`${this._getPlatformName(platform)} 绑定成功！`, 'success');
                    await this._loadPlatformBindings();
                    if (authWindow && !authWindow.closed) {
                        authWindow.close();
                    }
                } else if (event.data.type === 'platform_oauth_error') {
                    window.removeEventListener('message', messageHandler);
                    this._showToast(event.data.message || '绑定失败', 'error');
                    if (authWindow && !authWindow.closed) {
                        authWindow.close();
                    }
                }
            };

            window.addEventListener('message', messageHandler);

        } catch (error) {
            this._showToast(error.message || '绑定失败，请稍后重试', 'error');
        }
    },

    /**
     * 解除平台绑定
     */
    async _unbindPlatform(platform) {
        try {
            const response = await AuthManager.authenticatedFetch(
                `${AuthManager.apiBaseUrl}/auth/platform-unbind/${platform}`,
                { method: 'DELETE' }
            );

            const data = await response.json();

            if (response.ok) {
                this._showToast(`${this._getPlatformName(platform)} 已解除绑定`, 'success');
                await this._loadPlatformBindings();
            } else {
                throw new Error(data.message || '解除绑定失败');
            }
        } catch (error) {
            this._showToast(error.message || '解除绑定失败', 'error');
        }
    },

    /**
     * 获取平台中文名称
     */
    _getPlatformName(platform) {
        const names = {
            'twitch': 'Twitch',
            'douyin': '抖音直播',
            'tiktok': 'TikTok Live',
            'youtube': 'YouTube Live'
        };
        return names[platform] || platform;
    }
};

// 页面加载时应用保存的设置（在设置页面之外也生效）
(function applyGlobalSettings() {
    // 应用主题
    const savedTheme = localStorage.getItem('theme') || 'white';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 应用动画设置
    const animationsEnabled = localStorage.getItem('animations_enabled') !== 'false';
    if (!animationsEnabled) {
        document.body.classList.add('no-animations');
    }
})();

// 导出模块
window.SettingsManager = SettingsManager;
