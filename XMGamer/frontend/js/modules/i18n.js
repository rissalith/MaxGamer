/**
 * 国际化(i18n)模块
 * 支持多语言切换
 */

const I18n = {
    // 当前语言 - 默认英文
    currentLang: 'en-US',
    
    // 语言包
    translations: {
        'zh-CN': {
            // 通用
            app_name: 'XMGamer',
            app_subtitle: '直播互动游戏平台',
            loading: '加载中...',
            save: '保存',
            cancel: '取消',
            confirm: '确认',
            close: '关闭',
            success: '成功',
            error: '错误',
            warning: '警告',
            
            // 侧边栏
            sidebar_game_market: '游戏市场',
            sidebar_guest: '访客用户',
            
            // 用户菜单
            menu_settings: '个人设置',
            menu_wallet: '钱包',
            menu_logout: '退出',
            logout_confirm: '确定要退出登录吗？',
            
            // 设置页面
            settings_title: '设置',
            settings_profile: '个人资料',
            settings_security: '安全',
            settings_general: '通用',
            settings_language: '语言',
            
            // 个人资料
            profile_basic_info: '基本信息',
            profile_avatar: '头像',
            profile_nickname: '昵称',
            profile_nickname_placeholder: '请输入昵称',
            profile_email: '邮箱',
            profile_email_hint: '邮箱不可修改',
            profile_saved: '✓ 已保存',
            profile_saving: '保存中...',
            profile_typing: '正在输入...',
            
            // 安全设置
            security_change_password: '修改密码',
            security_current_password: '当前密码',
            security_current_password_placeholder: '请输入当前密码',
            security_new_password: '新密码',
            security_new_password_placeholder: '6-20位字符',
            security_confirm_password: '确认密码',
            security_confirm_password_placeholder: '再次输入新密码',
            security_change_btn: '修改密码',
            security_changing: '修改中...',
            security_password_changed: '密码修改成功',
            security_password_mismatch: '两次输入的密码不一致',
            security_password_length: '密码长度为6-20个字符',
            
            // 通用设置
            general_appearance: '外观',
            general_dark_mode: '深色模式',
            general_dark_mode_desc: '使用深色主题减少眼睛疲劳',
            general_animations: '动画效果',
            general_animations_desc: '界面动画和过渡效果',
            general_notifications: '通知',
            general_desktop_notifications: '桌面通知',
            general_desktop_notifications_desc: '接收重要消息推送',
            general_sound: '声音提示',
            general_sound_desc: '播放消息提示音',
            
            // 语言设置
            language_title: '显示语言',
            language_saved: '✓ 已保存',
            language_switched: '语言已切换为',
            
            // 游戏市场
            market_title: '游戏市场',
            market_view_card: '卡片视图',
            market_view_list: '列表视图',
            market_start_game: '开始游戏',
            market_coming_soon: '即将推出',
            
            // 游戏
            game_fortune: '巫女占卜',
            game_fortune_desc: '体验神秘的占卜之旅，探索你的运势',
            game_coming_soon: '敬请期待',
            game_coming_soon_desc: '更多精彩游戏即将上线',
            
            // 标签
            tag_fortune: '占卜',
            tag_interactive: '互动',
            tag_live: '直播',
            
            // 深色模式提示
            dark_mode_on: '已切换到深色模式',
            dark_mode_off: '已切换到浅色模式',
            animations_on: '动画效果已开启',
            animations_off: '动画效果已关闭',
            notifications_on: '桌面通知已开启',
            notifications_off: '桌面通知已关闭',
            notifications_denied: '通知权限被拒绝',
            sound_on: '声音提示已开启',
            sound_off: '声音提示已关闭',
            
            // 钱包
            wallet_coming_soon: '钱包功能即将推出'
        },
        
        'zh-TW': {
            app_name: 'XMGamer',
            app_subtitle: '直播互動遊戲平台',
            loading: '載入中...',
            save: '儲存',
            cancel: '取消',
            confirm: '確認',
            close: '關閉',
            success: '成功',
            error: '錯誤',
            warning: '警告',
            
            sidebar_game_market: '遊戲市場',
            sidebar_guest: '訪客用戶',
            
            menu_settings: '個人設定',
            menu_wallet: '錢包',
            menu_logout: '登出',
            logout_confirm: '確定要登出嗎？',
            
            settings_title: '設定',
            settings_profile: '個人資料',
            settings_security: '安全',
            settings_general: '通用',
            settings_language: '語言',
            
            profile_basic_info: '基本資訊',
            profile_avatar: '頭像',
            profile_nickname: '暱稱',
            profile_nickname_placeholder: '請輸入暱稱',
            profile_email: '電子郵件',
            profile_email_hint: '電子郵件不可修改',
            profile_saved: '✓ 已儲存',
            profile_saving: '儲存中...',
            profile_typing: '正在輸入...',
            
            security_change_password: '修改密碼',
            security_current_password: '目前密碼',
            security_current_password_placeholder: '請輸入目前密碼',
            security_new_password: '新密碼',
            security_new_password_placeholder: '6-20位字元',
            security_confirm_password: '確認密碼',
            security_confirm_password_placeholder: '再次輸入新密碼',
            security_change_btn: '修改密碼',
            security_changing: '修改中...',
            security_password_changed: '密碼修改成功',
            security_password_mismatch: '兩次輸入的密碼不一致',
            security_password_length: '密碼長度為6-20個字元',
            
            general_appearance: '外觀',
            general_dark_mode: '深色模式',
            general_dark_mode_desc: '使用深色主題減少眼睛疲勞',
            general_animations: '動畫效果',
            general_animations_desc: '介面動畫和過渡效果',
            general_notifications: '通知',
            general_desktop_notifications: '桌面通知',
            general_desktop_notifications_desc: '接收重要訊息推送',
            general_sound: '聲音提示',
            general_sound_desc: '播放訊息提示音',
            
            language_title: '顯示語言',
            language_saved: '✓ 已儲存',
            language_switched: '語言已切換為',
            
            market_title: '遊戲市場',
            market_view_card: '卡片檢視',
            market_view_list: '列表檢視',
            market_start_game: '開始遊戲',
            market_coming_soon: '即將推出',
            
            game_fortune: '巫女占卜',
            game_fortune_desc: '體驗神秘的占卜之旅，探索你的運勢',
            game_coming_soon: '敬請期待',
            game_coming_soon_desc: '更多精彩遊戲即將上線',
            
            tag_fortune: '占卜',
            tag_interactive: '互動',
            tag_live: '直播',
            
            dark_mode_on: '已切換到深色模式',
            dark_mode_off: '已切換到淺色模式',
            animations_on: '動畫效果已開啟',
            animations_off: '動畫效果已關閉',
            notifications_on: '桌面通知已開啟',
            notifications_off: '桌面通知已關閉',
            notifications_denied: '通知權限被拒絕',
            sound_on: '聲音提示已開啟',
            sound_off: '聲音提示已關閉',
            
            wallet_coming_soon: '錢包功能即將推出'
        },
        
        'en-US': {
            app_name: 'XMGamer',
            app_subtitle: 'Live Interactive Gaming Platform',
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            confirm: 'Confirm',
            close: 'Close',
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            
            sidebar_game_market: 'Game Market',
            sidebar_guest: 'Guest',
            
            menu_settings: 'Settings',
            menu_wallet: 'Wallet',
            menu_logout: 'Logout',
            logout_confirm: 'Are you sure you want to logout?',
            
            settings_title: 'Settings',
            settings_profile: 'Profile',
            settings_security: 'Security',
            settings_general: 'General',
            settings_language: 'Language',
            
            profile_basic_info: 'Basic Info',
            profile_avatar: 'Avatar',
            profile_nickname: 'Nickname',
            profile_nickname_placeholder: 'Enter nickname',
            profile_email: 'Email',
            profile_email_hint: 'Email cannot be changed',
            profile_saved: '✓ Saved',
            profile_saving: 'Saving...',
            profile_typing: 'Typing...',
            
            security_change_password: 'Change Password',
            security_current_password: 'Current Password',
            security_current_password_placeholder: 'Enter current password',
            security_new_password: 'New Password',
            security_new_password_placeholder: '6-20 characters',
            security_confirm_password: 'Confirm Password',
            security_confirm_password_placeholder: 'Re-enter new password',
            security_change_btn: 'Change Password',
            security_changing: 'Changing...',
            security_password_changed: 'Password changed successfully',
            security_password_mismatch: 'Passwords do not match',
            security_password_length: 'Password must be 6-20 characters',
            
            general_appearance: 'Appearance',
            general_dark_mode: 'Dark Mode',
            general_dark_mode_desc: 'Use dark theme to reduce eye strain',
            general_animations: 'Animations',
            general_animations_desc: 'Interface animations and transitions',
            general_notifications: 'Notifications',
            general_desktop_notifications: 'Desktop Notifications',
            general_desktop_notifications_desc: 'Receive important message alerts',
            general_sound: 'Sound',
            general_sound_desc: 'Play notification sounds',
            
            language_title: 'Display Language',
            language_saved: '✓ Saved',
            language_switched: 'Language switched to',
            
            market_title: 'Game Market',
            market_view_card: 'Card View',
            market_view_list: 'List View',
            market_start_game: 'Play Now',
            market_coming_soon: 'Coming Soon',
            
            game_fortune: 'Fortune Teller',
            game_fortune_desc: 'Experience a mystical fortune-telling journey',
            game_coming_soon: 'Coming Soon',
            game_coming_soon_desc: 'More exciting games coming soon',
            
            tag_fortune: 'Fortune',
            tag_interactive: 'Interactive',
            tag_live: 'Live',
            
            dark_mode_on: 'Dark mode enabled',
            dark_mode_off: 'Light mode enabled',
            animations_on: 'Animations enabled',
            animations_off: 'Animations disabled',
            notifications_on: 'Desktop notifications enabled',
            notifications_off: 'Desktop notifications disabled',
            notifications_denied: 'Notification permission denied',
            sound_on: 'Sound enabled',
            sound_off: 'Sound disabled',
            
            wallet_coming_soon: 'Wallet feature coming soon'
        },
        
        'ja-JP': {
            app_name: 'XMGamer',
            app_subtitle: 'ライブインタラクティブゲームプラットフォーム',
            loading: '読み込み中...',
            save: '保存',
            cancel: 'キャンセル',
            confirm: '確認',
            close: '閉じる',
            success: '成功',
            error: 'エラー',
            warning: '警告',
            
            sidebar_game_market: 'ゲームマーケット',
            sidebar_guest: 'ゲスト',
            
            menu_settings: '設定',
            menu_wallet: 'ウォレット',
            menu_logout: 'ログアウト',
            logout_confirm: 'ログアウトしますか？',
            
            settings_title: '設定',
            settings_profile: 'プロフィール',
            settings_security: 'セキュリティ',
            settings_general: '一般',
            settings_language: '言語',
            
            profile_basic_info: '基本情報',
            profile_avatar: 'アバター',
            profile_nickname: 'ニックネーム',
            profile_nickname_placeholder: 'ニックネームを入力',
            profile_email: 'メール',
            profile_email_hint: 'メールは変更できません',
            profile_saved: '✓ 保存済み',
            profile_saving: '保存中...',
            profile_typing: '入力中...',
            
            security_change_password: 'パスワード変更',
            security_current_password: '現在のパスワード',
            security_current_password_placeholder: '現在のパスワードを入力',
            security_new_password: '新しいパスワード',
            security_new_password_placeholder: '6-20文字',
            security_confirm_password: 'パスワード確認',
            security_confirm_password_placeholder: '新しいパスワードを再入力',
            security_change_btn: 'パスワード変更',
            security_changing: '変更中...',
            security_password_changed: 'パスワードが変更されました',
            security_password_mismatch: 'パスワードが一致しません',
            security_password_length: 'パスワードは6-20文字である必要があります',
            
            general_appearance: '外観',
            general_dark_mode: 'ダークモード',
            general_dark_mode_desc: '目の疲れを軽減するダークテーマを使用',
            general_animations: 'アニメーション',
            general_animations_desc: 'インターフェースのアニメーションと遷移',
            general_notifications: '通知',
            general_desktop_notifications: 'デスクトップ通知',
            general_desktop_notifications_desc: '重要なメッセージ通知を受け取る',
            general_sound: 'サウンド',
            general_sound_desc: '通知音を再生',
            
            language_title: '表示言語',
            language_saved: '✓ 保存済み',
            language_switched: '言語が切り替わりました：',
            
            market_title: 'ゲームマーケット',
            market_view_card: 'カード表示',
            market_view_list: 'リスト表示',
            market_start_game: 'プレイ',
            market_coming_soon: '近日公開',
            
            game_fortune: '巫女占い',
            game_fortune_desc: '神秘的な占いの旅を体験しよう',
            game_coming_soon: '近日公開',
            game_coming_soon_desc: 'もっと楽しいゲームが近日公開',
            
            tag_fortune: '占い',
            tag_interactive: 'インタラクティブ',
            tag_live: 'ライブ',
            
            dark_mode_on: 'ダークモードが有効になりました',
            dark_mode_off: 'ライトモードが有効になりました',
            animations_on: 'アニメーションが有効になりました',
            animations_off: 'アニメーションが無効になりました',
            notifications_on: 'デスクトップ通知が有効になりました',
            notifications_off: 'デスクトップ通知が無効になりました',
            notifications_denied: '通知の許可が拒否されました',
            sound_on: 'サウンドが有効になりました',
            sound_off: 'サウンドが無効になりました',
            
            wallet_coming_soon: 'ウォレット機能は近日公開'
        },
        
        'ko-KR': {
            app_name: 'XMGamer',
            app_subtitle: '라이브 인터랙티브 게임 플랫폼',
            loading: '로딩 중...',
            save: '저장',
            cancel: '취소',
            confirm: '확인',
            close: '닫기',
            success: '성공',
            error: '오류',
            warning: '경고',
            
            sidebar_game_market: '게임 마켓',
            sidebar_guest: '게스트',
            
            menu_settings: '설정',
            menu_wallet: '지갑',
            menu_logout: '로그아웃',
            logout_confirm: '로그아웃 하시겠습니까?',
            
            settings_title: '설정',
            settings_profile: '프로필',
            settings_security: '보안',
            settings_general: '일반',
            settings_language: '언어',
            
            profile_basic_info: '기본 정보',
            profile_avatar: '아바타',
            profile_nickname: '닉네임',
            profile_nickname_placeholder: '닉네임 입력',
            profile_email: '이메일',
            profile_email_hint: '이메일은 변경할 수 없습니다',
            profile_saved: '✓ 저장됨',
            profile_saving: '저장 중...',
            profile_typing: '입력 중...',
            
            security_change_password: '비밀번호 변경',
            security_current_password: '현재 비밀번호',
            security_current_password_placeholder: '현재 비밀번호 입력',
            security_new_password: '새 비밀번호',
            security_new_password_placeholder: '6-20자',
            security_confirm_password: '비밀번호 확인',
            security_confirm_password_placeholder: '새 비밀번호 다시 입력',
            security_change_btn: '비밀번호 변경',
            security_changing: '변경 중...',
            security_password_changed: '비밀번호가 변경되었습니다',
            security_password_mismatch: '비밀번호가 일치하지 않습니다',
            security_password_length: '비밀번호는 6-20자여야 합니다',
            
            general_appearance: '외관',
            general_dark_mode: '다크 모드',
            general_dark_mode_desc: '눈의 피로를 줄이는 다크 테마 사용',
            general_animations: '애니메이션',
            general_animations_desc: '인터페이스 애니메이션 및 전환',
            general_notifications: '알림',
            general_desktop_notifications: '데스크톱 알림',
            general_desktop_notifications_desc: '중요한 메시지 알림 받기',
            general_sound: '소리',
            general_sound_desc: '알림 소리 재생',
            
            language_title: '표시 언어',
            language_saved: '✓ 저장됨',
            language_switched: '언어가 변경되었습니다:',
            
            market_title: '게임 마켓',
            market_view_card: '카드 보기',
            market_view_list: '목록 보기',
            market_start_game: '플레이',
            market_coming_soon: '출시 예정',
            
            game_fortune: '무녀 점술',
            game_fortune_desc: '신비로운 점술 여행을 경험하세요',
            game_coming_soon: '출시 예정',
            game_coming_soon_desc: '더 많은 게임이 곧 출시됩니다',
            
            tag_fortune: '점술',
            tag_interactive: '인터랙티브',
            tag_live: '라이브',
            
            dark_mode_on: '다크 모드가 활성화되었습니다',
            dark_mode_off: '라이트 모드가 활성화되었습니다',
            animations_on: '애니메이션이 활성화되었습니다',
            animations_off: '애니메이션이 비활성화되었습니다',
            notifications_on: '데스크톱 알림이 활성화되었습니다',
            notifications_off: '데스크톱 알림이 비활성화되었습니다',
            notifications_denied: '알림 권한이 거부되었습니다',
            sound_on: '소리가 활성화되었습니다',
            sound_off: '소리가 비활성화되었습니다',
            
            wallet_coming_soon: '지갑 기능 출시 예정'
        }
    },
    
    /**
     * 初始化
     */
    init() {
        const savedLang = localStorage.getItem('preferred_language') || 'zh-CN';
        this.currentLang = savedLang;
        document.documentElement.lang = savedLang;
        this.applyTranslations();
    },
    
    /**
     * 获取翻译文本
     */
    t(key) {
        const translations = this.translations[this.currentLang] || this.translations['zh-CN'];
        return translations[key] || key;
    },
    
    /**
     * 切换语言
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`[i18n] 不支持的语言: ${lang}`);
            return;
        }
        
        this.currentLang = lang;
        localStorage.setItem('preferred_language', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();
        
        // 触发语言变更事件
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    },
    
    /**
     * 应用翻译到页面
     */
    applyTranslations() {
        // 更新所有带 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const text = this.t(key);
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder !== undefined && el.dataset.i18nAttr === 'placeholder') {
                    el.placeholder = text;
                } else {
                    el.value = text;
                }
            } else {
                el.textContent = text;
            }
        });
        
        // 更新 placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            el.placeholder = this.t(key);
        });
        
        // 更新 title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            el.title = this.t(key);
        });
        
        // 更新页面标题
        const titleKey = document.querySelector('title')?.dataset?.i18n;
        if (titleKey) {
            document.title = this.t(titleKey);
        }
        
        // 更新特定元素
        this._updateSpecificElements();
    },
    
    /**
     * 更新特定元素
     */
    _updateSpecificElements() {
        // 侧边栏 - logo-subtitle 固定显示 "Max Gamer"，不翻译
        // const logoSubtitle = document.querySelector('.logo-subtitle');
        // if (logoSubtitle) logoSubtitle.textContent = this.t('app_subtitle');
        
        const menuText = document.querySelector('.menu-text');
        if (menuText) menuText.textContent = this.t('sidebar_game_market');
        
        const userName = document.querySelector('.user-name');
        if (userName && userName.textContent === '访客用户') {
            userName.textContent = this.t('sidebar_guest');
        }
        
        // 用户菜单
        const menuOptions = document.querySelectorAll('.menu-option');
        menuOptions.forEach(option => {
            const action = option.dataset.action;
            const span = option.querySelector('span');
            if (span) {
                if (action === 'settings') span.textContent = this.t('menu_settings');
                if (action === 'wallet') span.textContent = this.t('menu_wallet');
                if (action === 'logout') span.textContent = this.t('menu_logout');
            }
        });
        
        // 设置页面
        this._updateSettingsPage();
        
        // 游戏市场
        this._updateGameMarket();
    },
    
    /**
     * 更新设置页面
     */
    _updateSettingsPage() {
        // 标题
        const settingsTitle = document.querySelector('.settings-title');
        if (settingsTitle) settingsTitle.textContent = this.t('settings_title');
        
        // 导航
        const navItems = document.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => {
            const tab = item.dataset.tab;
            const span = item.querySelector('span');
            if (span) {
                if (tab === 'profile') span.textContent = this.t('settings_profile');
                if (tab === 'security') span.textContent = this.t('settings_security');
                if (tab === 'preferences') span.textContent = this.t('settings_general');
                if (tab === 'language') span.textContent = this.t('settings_language');
            }
        });
        
        // 个人资料面板
        const profilePanel = document.getElementById('profile-panel');
        if (profilePanel) {
            const h2 = profilePanel.querySelector('h2');
            if (h2) h2.textContent = this.t('profile_basic_info');
            
            const labels = profilePanel.querySelectorAll('.form-label');
            labels.forEach(label => {
                if (label.textContent.includes('昵称') || label.textContent.includes('Nickname')) {
                    label.textContent = this.t('profile_nickname');
                }
                if (label.textContent.includes('邮箱') || label.textContent.includes('Email')) {
                    label.textContent = this.t('profile_email');
                }
            });
            
            const nicknameInput = document.getElementById('nicknameInput');
            if (nicknameInput) nicknameInput.placeholder = this.t('profile_nickname_placeholder');
            
            const emailHint = profilePanel.querySelector('.input-hint');
            if (emailHint) emailHint.textContent = this.t('profile_email_hint');
        }
        
        // 安全面板
        const securityPanel = document.getElementById('security-panel');
        if (securityPanel) {
            const h2 = securityPanel.querySelector('h2');
            if (h2) h2.textContent = this.t('security_change_password');
            
            const labels = securityPanel.querySelectorAll('.form-label');
            if (labels[0]) labels[0].textContent = this.t('security_current_password');
            if (labels[1]) labels[1].textContent = this.t('security_new_password');
            if (labels[2]) labels[2].textContent = this.t('security_confirm_password');
            
            const currentPwd = document.getElementById('currentPassword');
            if (currentPwd) currentPwd.placeholder = this.t('security_current_password_placeholder');
            
            const newPwd = document.getElementById('newPassword');
            if (newPwd) newPwd.placeholder = this.t('security_new_password_placeholder');
            
            const confirmPwd = document.getElementById('confirmPassword');
            if (confirmPwd) confirmPwd.placeholder = this.t('security_confirm_password_placeholder');
            
            const changeBtn = document.getElementById('changePasswordBtn');
            if (changeBtn) changeBtn.textContent = this.t('security_change_btn');
        }
        
        // 通用设置面板
        const preferencesPanel = document.getElementById('preferences-panel');
        if (preferencesPanel) {
            const cards = preferencesPanel.querySelectorAll('.panel-card');
            if (cards[0]) {
                const h2 = cards[0].querySelector('h2');
                if (h2) h2.textContent = this.t('general_appearance');
            }
            if (cards[1]) {
                const h2 = cards[1].querySelector('h2');
                if (h2) h2.textContent = this.t('general_notifications');
            }
            
            const settingRows = preferencesPanel.querySelectorAll('.setting-row');
            settingRows.forEach(row => {
                const label = row.querySelector('.setting-label');
                const desc = row.querySelector('.setting-desc');
                const toggle = row.querySelector('input[type="checkbox"]');
                
                if (toggle) {
                    if (toggle.id === 'darkModeToggle') {
                        if (label) label.textContent = this.t('general_dark_mode');
                        if (desc) desc.textContent = this.t('general_dark_mode_desc');
                    }
                    if (toggle.id === 'animationToggle') {
                        if (label) label.textContent = this.t('general_animations');
                        if (desc) desc.textContent = this.t('general_animations_desc');
                    }
                    if (toggle.id === 'desktopNotificationToggle') {
                        if (label) label.textContent = this.t('general_desktop_notifications');
                        if (desc) desc.textContent = this.t('general_desktop_notifications_desc');
                    }
                    if (toggle.id === 'soundToggle') {
                        if (label) label.textContent = this.t('general_sound');
                        if (desc) desc.textContent = this.t('general_sound_desc');
                    }
                }
            });
        }
        
        // 语言面板
        const languagePanel = document.getElementById('language-panel');
        if (languagePanel) {
            const h2 = languagePanel.querySelector('h2');
            if (h2) h2.textContent = this.t('language_title');
        }
    },
    
    /**
     * 更新游戏市场
     */
    _updateGameMarket() {
        // 游戏卡片
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            const title = card.querySelector('.game-title');
            const desc = card.querySelector('.game-description');
            const btn = card.querySelector('.btn-play');
            
            if (title) {
                if (title.textContent.includes('巫女') || title.textContent.includes('Fortune')) {
                    title.textContent = this.t('game_fortune');
                    if (desc) desc.textContent = this.t('game_fortune_desc');
                }
                if (title.textContent.includes('敬请') || title.textContent.includes('Coming')) {
                    title.textContent = this.t('game_coming_soon');
                    if (desc) desc.textContent = this.t('game_coming_soon_desc');
                }
            }
            
            if (btn) {
                if (btn.classList.contains('disabled')) {
                    btn.textContent = this.t('market_coming_soon');
                } else {
                    btn.textContent = this.t('market_start_game');
                }
            }
        });
        
        // 标签
        const tags = document.querySelectorAll('.tag');
        tags.forEach(tag => {
            const text = tag.textContent.trim();
            if (text === '占卜' || text === 'Fortune') tag.textContent = this.t('tag_fortune');
            if (text === '互动' || text === 'Interactive') tag.textContent = this.t('tag_interactive');
            if (text === '直播' || text === 'Live') tag.textContent = this.t('tag_live');
        });
    }
};

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
    I18n.init();
}

// 导出
window.I18n = I18n;

