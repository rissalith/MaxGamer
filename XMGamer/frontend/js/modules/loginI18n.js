/**
 * 登录页国际化(i18n)模块
 * 支持多语言切换
 */

const LoginI18n = {
    // 当前语言 - 默认英文
    currentLang: 'en-US',
    
    // 语言包
    translations: {
        'zh-CN': {
            // 页面标题
            page_title: '登录 - XMGamer',
            
            // 品牌
            brand_subtitle: '我们的关系需要更多想象力',
            
            // 登录表单
            login_title: '登录',
            login_subtitle: '欢迎回来',
            login_btn: '登录',
            
            // 登录模式
            mode_password: '账号密码',
            mode_email: '邮箱验证码',
            
            // 表单字段
            email_placeholder: '邮箱',
            password_placeholder: '密码',
            email_address_placeholder: '邮箱地址',
            code_placeholder: '验证码',
            send_code: '获取验证码',
            resend_code: '秒后重发',
            
            // 第三方登录
            social_login_title: '或使用第三方账号登录',
            google_login: '使用 Google 登录',
            twitter_login: '使用 X 登录',
            
            // 注册
            no_account: '还没有账号？',
            register_now: '立即注册',
            register_title: '创建账号',
            register_subtitle: '加入我们，开始创作',
            register_btn: '注册',
            set_password_placeholder: '设置密码（至少6位）',
            confirm_password_placeholder: '确认密码',
            nickname_placeholder: '昵称（可选）',
            has_account: '已有账号？',
            login_now: '立即登录',
            
            // 设置密码模态框
            set_password_title: '设置登录密码',
            set_password_subtitle: '首次登录，请设置您的密码',
            password_input_placeholder: '请输入密码（至少6位）',
            confirm_input_placeholder: '请再次输入密码',
            skip_btn: '跳过',
            confirm_btn: '确定',
            
            // 首次登录模态框
            first_time_title: '完善账号信息',
            first_time_subtitle: '首次登录，请设置密码和昵称',
            nickname_optional_placeholder: '昵称（选填）',
            
            // 底部链接
            help: '帮助',
            privacy: '隐私权',
            terms: '条款',
            
            // 错误消息
            video_not_supported: '您的浏览器不支持视频播放',
            toggle_volume: '切换音量',
            
            // Max 对话 - 介绍消息
            max_intro_1: '欢迎来到MaxGamer！直播间里的AI互动专家~ ✨',
            max_intro_2: 'MaxGamer - 为主播提供AI驱动的互动工具，让每一秒都有价值！',
            max_intro_3: '我是Max，你的AI助手！让直播更有趣，让互动更智能~',
            max_intro_4: '无需下载，即插即用！5分钟让你的直播间焕然一新！',
            max_intro_5: '支持抖音、B站、Twitch等所有主流平台，一套工具走天下！',
            max_intro_6: '点击右侧按钮体验互动，看看AI如何让直播更精彩~',
            
            // Max 对话 - 点赞回复
            max_like_1: '谢谢你的点赞！❤️',
            max_like_2: '哇！收到你的赞了！感觉超开心的~ ✨',
            max_like_3: '你的点赞让我充满能量！💪',
            max_like_4: '感谢认可！让我们一起创造更多精彩吧~',
            
            // Max 对话 - 礼物回复
            max_gift_1: '哇！收到礼物了！🎁 太感谢啦~',
            max_gift_2: '这个礼物好棒！你真是太贴心了~ ✨',
            max_gift_3: '谢谢你的礼物！我会好好珍惜的~ 💝',
            max_gift_4: '收到你的心意了！让我给你一个大大的拥抱~ 🤗',
            
            // Max 对话 - 评论回复
            max_comment_1: '看到你的评论啦！有什么想说的吗？💭',
            max_comment_2: '欢迎留言互动！我很期待听到你的想法~ 📝',
            max_comment_3: '你的评论我都会认真看的哦！💬',
            max_comment_4: '感谢你的互动！让我们聊聊天吧~ ☺️',
            
            // Max 对话 - 思考中消息
            max_thinking_like: '收到你的赞了！让我想想怎么回应... 🤔',
            max_thinking_gift: '哇！礼物！让我好好看看... ✨',
            max_thinking_comment: '看到你的评论了！思考中... 💭',
            max_thinking_default: '正在思考中...'
        },
        
        'zh-TW': {
            page_title: '登入 - XMGamer',
            brand_subtitle: '我們的關係需要更多想像力',
            login_title: '登入',
            login_subtitle: '歡迎回來',
            login_btn: '登入',
            mode_password: '帳號密碼',
            mode_email: '郵箱驗證碼',
            email_placeholder: '郵箱',
            password_placeholder: '密碼',
            email_address_placeholder: '郵箱地址',
            code_placeholder: '驗證碼',
            send_code: '獲取驗證碼',
            resend_code: '秒後重發',
            social_login_title: '或使用第三方帳號登入',
            google_login: '使用 Google 登入',
            twitter_login: '使用 X 登入',
            no_account: '還沒有帳號？',
            register_now: '立即註冊',
            register_title: '創建帳號',
            register_subtitle: '加入我們，開始創作',
            register_btn: '註冊',
            set_password_placeholder: '設置密碼（至少6位）',
            confirm_password_placeholder: '確認密碼',
            nickname_placeholder: '暱稱（可選）',
            has_account: '已有帳號？',
            login_now: '立即登入',
            set_password_title: '設置登入密碼',
            set_password_subtitle: '首次登入，請設置您的密碼',
            password_input_placeholder: '請輸入密碼（至少6位）',
            confirm_input_placeholder: '請再次輸入密碼',
            skip_btn: '跳過',
            confirm_btn: '確定',
            first_time_title: '完善帳號資訊',
            first_time_subtitle: '首次登入，請設置密碼和暱稱',
            nickname_optional_placeholder: '暱稱（選填）',
            help: '幫助',
            privacy: '隱私權',
            terms: '條款',
            video_not_supported: '您的瀏覽器不支持視頻播放',
            toggle_volume: '切換音量',
            
            // Max 對話 - 介紹消息
            max_intro_1: '歡迎來到MaxGamer！直播間裡的AI互動專家~ ✨',
            max_intro_2: 'MaxGamer - 為主播提供AI驅動的互動工具，讓每一秒都有價值！',
            max_intro_3: '我是Max，你的AI助手！讓直播更有趣，讓互動更智能~',
            max_intro_4: '無需下載，即插即用！5分鐘讓你的直播間煥然一新！',
            max_intro_5: '支持抖音、B站、Twitch等所有主流平台，一套工具走天下！',
            max_intro_6: '點擊右側按鈕體驗互動，看看AI如何讓直播更精彩~',
            
            // Max 對話 - 點讚回覆
            max_like_1: '謝謝你的點讚！❤️',
            max_like_2: '哇！收到你的讚了！感覺超開心的~ ✨',
            max_like_3: '你的點讚讓我充滿能量！💪',
            max_like_4: '感謝認可！讓我們一起創造更多精彩吧~',
            
            // Max 對話 - 禮物回覆
            max_gift_1: '哇！收到禮物了！🎁 太感謝啦~',
            max_gift_2: '這個禮物好棒！你真是太貼心了~ ✨',
            max_gift_3: '謝謝你的禮物！我會好好珍惜的~ 💝',
            max_gift_4: '收到你的心意了！讓我給你一個大大的擁抱~ 🤗',
            
            // Max 對話 - 評論回覆
            max_comment_1: '看到你的評論啦！有什麼想說的嗎？💭',
            max_comment_2: '歡迎留言互動！我很期待聽到你的想法~ 📝',
            max_comment_3: '你的評論我都會認真看的哦！💬',
            max_comment_4: '感謝你的互動！讓我們聊聊天吧~ ☺️',
            
            // Max 對話 - 思考中消息
            max_thinking_like: '收到你的讚了！讓我想想怎麼回應... 🤔',
            max_thinking_gift: '哇！禮物！讓我好好看看... ✨',
            max_thinking_comment: '看到你的評論了！思考中... 💭',
            max_thinking_default: '正在思考中...'
        },
        
        'en-US': {
            page_title: 'Sign in - XMGamer',
            brand_subtitle: 'Our Relationship Needs More Imagination',
            login_title: 'Sign in',
            login_subtitle: 'Welcome back',
            login_btn: 'Sign in',
            mode_password: 'Password',
            mode_email: 'Email Code',
            email_placeholder: 'Email',
            password_placeholder: 'Password',
            email_address_placeholder: 'Email address',
            code_placeholder: 'Verification code',
            send_code: 'Send Code',
            resend_code: 's to resend',
            social_login_title: 'Or sign in with',
            google_login: 'Sign in with Google',
            twitter_login: 'Sign in with X',
            no_account: "Don't have an account?",
            register_now: 'Sign up',
            register_title: 'Create account',
            register_subtitle: 'Join us and start creating',
            register_btn: 'Sign up',
            set_password_placeholder: 'Set password (min 6 chars)',
            confirm_password_placeholder: 'Confirm password',
            nickname_placeholder: 'Nickname (optional)',
            has_account: 'Already have an account?',
            login_now: 'Sign in',
            set_password_title: 'Set Password',
            set_password_subtitle: 'First time login, please set your password',
            password_input_placeholder: 'Enter password (min 6 chars)',
            confirm_input_placeholder: 'Re-enter password',
            skip_btn: 'Skip',
            confirm_btn: 'Confirm',
            first_time_title: 'Complete Profile',
            first_time_subtitle: 'First time login, please set password and nickname',
            nickname_optional_placeholder: 'Nickname (optional)',
            help: 'Help',
            privacy: 'Privacy',
            terms: 'Terms',
            video_not_supported: 'Your browser does not support video playback',
            toggle_volume: 'Toggle volume',
            
            // Max Dialogue - Intro messages
            max_intro_1: 'Welcome to MaxGamer! Your AI interaction expert for livestreaming~ ✨',
            max_intro_2: 'MaxGamer - AI-powered tools for streamers, making every second count!',
            max_intro_3: "I'm Max, your AI assistant! Making streams more fun and interactions smarter~",
            max_intro_4: 'No download needed, plug and play! Transform your stream in 5 minutes!',
            max_intro_5: 'Supporting TikTok, YouTube, Twitch and all major platforms!',
            max_intro_6: 'Click the buttons to experience the interaction, see how AI enhances your stream~',
            
            // Max Dialogue - Like responses
            max_like_1: 'Thanks for the like! ❤️',
            max_like_2: 'Wow! Got your like! Feeling super happy~ ✨',
            max_like_3: 'Your like fills me with energy! 💪',
            max_like_4: "Thanks for the support! Let's create more amazing moments~",
            
            // Max Dialogue - Gift responses
            max_gift_1: 'Wow! Got a gift! 🎁 Thank you so much~',
            max_gift_2: 'This gift is amazing! You are so thoughtful~ ✨',
            max_gift_3: 'Thank you for the gift! I will treasure it~ 💝',
            max_gift_4: 'Received your kindness! Let me give you a big hug~ 🤗',
            
            // Max Dialogue - Comment responses
            max_comment_1: 'I see your comment! What would you like to say? 💭',
            max_comment_2: "Welcome to interact! I'm looking forward to hearing your thoughts~ 📝",
            max_comment_3: 'I read all your comments carefully! 💬',
            max_comment_4: "Thanks for the interaction! Let's chat~ ☺️",
            
            // Max Dialogue - Thinking messages
            max_thinking_like: 'Got your like! Let me think how to respond... 🤔',
            max_thinking_gift: 'Wow! A gift! Let me take a good look... ✨',
            max_thinking_comment: 'I see your comment! Thinking... 💭',
            max_thinking_default: 'Thinking...'
        },
        
        'ja-JP': {
            page_title: 'ログイン - XMGamer',
            brand_subtitle: '私たちの関係にはもっと想像力が必要です',
            login_title: 'ログイン',
            login_subtitle: 'おかえりなさい',
            login_btn: 'ログイン',
            mode_password: 'パスワード',
            mode_email: 'メール認証',
            email_placeholder: 'メール',
            password_placeholder: 'パスワード',
            email_address_placeholder: 'メールアドレス',
            code_placeholder: '認証コード',
            send_code: 'コード送信',
            resend_code: '秒後に再送',
            social_login_title: 'または以下でログイン',
            google_login: 'Googleでログイン',
            twitter_login: 'Xでログイン',
            no_account: 'アカウントをお持ちでないですか？',
            register_now: '新規登録',
            register_title: 'アカウント作成',
            register_subtitle: '参加して創作を始めましょう',
            register_btn: '登録',
            set_password_placeholder: 'パスワード設定（6文字以上）',
            confirm_password_placeholder: 'パスワード確認',
            nickname_placeholder: 'ニックネーム（任意）',
            has_account: 'すでにアカウントをお持ちですか？',
            login_now: 'ログイン',
            set_password_title: 'パスワード設定',
            set_password_subtitle: '初回ログイン、パスワードを設定してください',
            password_input_placeholder: 'パスワードを入力（6文字以上）',
            confirm_input_placeholder: 'パスワードを再入力',
            skip_btn: 'スキップ',
            confirm_btn: '確定',
            first_time_title: 'プロフィール完成',
            first_time_subtitle: '初回ログイン、パスワードとニックネームを設定',
            nickname_optional_placeholder: 'ニックネーム（任意）',
            help: 'ヘルプ',
            privacy: 'プライバシー',
            terms: '利用規約',
            video_not_supported: 'お使いのブラウザは動画再生に対応していません',
            toggle_volume: '音量切替',
            
            // Max 対話 - 紹介メッセージ
            max_intro_1: 'MaxGamerへようこそ！配信のAIインタラクションエキスパート~ ✨',
            max_intro_2: 'MaxGamer - 配信者向けAIツール、毎秒を価値あるものに！',
            max_intro_3: '私はMax、あなたのAIアシスタント！配信をもっと楽しく、インタラクションをスマートに~',
            max_intro_4: 'ダウンロード不要、すぐに使える！5分で配信を変えよう！',
            max_intro_5: 'TikTok、YouTube、Twitchなど全プラットフォーム対応！',
            max_intro_6: 'ボタンをクリックして体験、AIがどう配信を盛り上げるか見てみよう~',
            
            // Max 対話 - いいね応答
            max_like_1: 'いいねありがとう！❤️',
            max_like_2: 'わあ！いいねもらった！超うれしい~ ✨',
            max_like_3: 'あなたのいいねでエネルギー満タン！💪',
            max_like_4: '応援ありがとう！一緒にもっと素敵な瞬間を作ろう~',
            
            // Max 対話 - ギフト応答
            max_gift_1: 'わあ！ギフトもらった！🎁 ありがとう~',
            max_gift_2: 'このギフト素敵！優しいね~ ✨',
            max_gift_3: 'ギフトありがとう！大切にするね~ 💝',
            max_gift_4: '気持ち受け取った！大きなハグを送るね~ 🤗',
            
            // Max 対話 - コメント応答
            max_comment_1: 'コメント見たよ！何か言いたいことある？💭',
            max_comment_2: 'コメント歓迎！あなたの考えを聞きたいな~ 📝',
            max_comment_3: 'コメント全部ちゃんと読むよ！💬',
            max_comment_4: 'インタラクションありがとう！おしゃべりしよう~ ☺️',
            
            // Max 対話 - 思考中メッセージ
            max_thinking_like: 'いいねもらった！どう返そうか考え中... 🤔',
            max_thinking_gift: 'わあ！ギフト！じっくり見させて... ✨',
            max_thinking_comment: 'コメント見たよ！考え中... 💭',
            max_thinking_default: '考え中...'
        },
        
        'ko-KR': {
            page_title: '로그인 - XMGamer',
            brand_subtitle: '우리의 관계에는 더 많은 상상력이 필요합니다',
            login_title: '로그인',
            login_subtitle: '다시 오신 것을 환영합니다',
            login_btn: '로그인',
            mode_password: '비밀번호',
            mode_email: '이메일 인증',
            email_placeholder: '이메일',
            password_placeholder: '비밀번호',
            email_address_placeholder: '이메일 주소',
            code_placeholder: '인증 코드',
            send_code: '코드 전송',
            resend_code: '초 후 재전송',
            social_login_title: '또는 다음으로 로그인',
            google_login: 'Google로 로그인',
            twitter_login: 'X로 로그인',
            no_account: '계정이 없으신가요?',
            register_now: '가입하기',
            register_title: '계정 만들기',
            register_subtitle: '가입하고 창작을 시작하세요',
            register_btn: '가입',
            set_password_placeholder: '비밀번호 설정 (최소 6자)',
            confirm_password_placeholder: '비밀번호 확인',
            nickname_placeholder: '닉네임 (선택)',
            has_account: '이미 계정이 있으신가요?',
            login_now: '로그인',
            set_password_title: '비밀번호 설정',
            set_password_subtitle: '첫 로그인, 비밀번호를 설정해주세요',
            password_input_placeholder: '비밀번호 입력 (최소 6자)',
            confirm_input_placeholder: '비밀번호 재입력',
            skip_btn: '건너뛰기',
            confirm_btn: '확인',
            first_time_title: '프로필 완성',
            first_time_subtitle: '첫 로그인, 비밀번호와 닉네임을 설정해주세요',
            nickname_optional_placeholder: '닉네임 (선택)',
            help: '도움말',
            privacy: '개인정보',
            terms: '약관',
            video_not_supported: '브라우저가 비디오 재생을 지원하지 않습니다',
            toggle_volume: '음량 전환',
            
            // Max 대화 - 소개 메시지
            max_intro_1: 'MaxGamer에 오신 것을 환영합니다! 방송 AI 인터랙션 전문가~ ✨',
            max_intro_2: 'MaxGamer - 스트리머를 위한 AI 도구, 매 순간을 가치있게!',
            max_intro_3: '저는 Max, 당신의 AI 어시스턴트! 방송을 더 재미있게, 인터랙션을 더 스마트하게~',
            max_intro_4: '다운로드 없이 바로 사용! 5분 만에 방송을 변화시키세요!',
            max_intro_5: 'TikTok, YouTube, Twitch 등 모든 플랫폼 지원!',
            max_intro_6: '버튼을 클릭해서 체험해보세요, AI가 방송을 어떻게 업그레이드하는지~',
            
            // Max 대화 - 좋아요 응답
            max_like_1: '좋아요 감사합니다! ❤️',
            max_like_2: '와! 좋아요 받았어요! 너무 기뻐요~ ✨',
            max_like_3: '당신의 좋아요로 에너지 충전! 💪',
            max_like_4: '응원 감사해요! 함께 더 멋진 순간을 만들어요~',
            
            // Max 대화 - 선물 응답
            max_gift_1: '와! 선물 받았어요! 🎁 정말 감사해요~',
            max_gift_2: '이 선물 너무 좋아요! 정말 세심하시네요~ ✨',
            max_gift_3: '선물 감사합니다! 소중히 간직할게요~ 💝',
            max_gift_4: '마음 받았어요! 큰 포옹 보낼게요~ 🤗',
            
            // Max 대화 - 댓글 응답
            max_comment_1: '댓글 봤어요! 하고 싶은 말 있으세요? 💭',
            max_comment_2: '댓글 환영해요! 당신의 생각이 궁금해요~ 📝',
            max_comment_3: '댓글 다 정성껏 읽을게요! 💬',
            max_comment_4: '인터랙션 감사해요! 이야기해요~ ☺️',
            
            // Max 대화 - 생각 중 메시지
            max_thinking_like: '좋아요 받았어요! 어떻게 답할지 생각 중... 🤔',
            max_thinking_gift: '와! 선물! 잘 볼게요... ✨',
            max_thinking_comment: '댓글 봤어요! 생각 중... 💭',
            max_thinking_default: '생각 중...'
        }
    },
    
    // 语言显示名称
    langNames: {
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        'en-US': 'English',
        'ja-JP': '日本語',
        'ko-KR': '한국어'
    },
    
    /**
     * 初始化
     */
    init() {
        // 优先使用保存的语言，否则默认英文
        const savedLang = localStorage.getItem('preferred_language') || 'en-US';
        this.currentLang = savedLang;
        document.documentElement.lang = savedLang;
        
        // 创建语言切换器
        this._createLanguageSwitcher();
        
        // 应用翻译
        this.applyTranslations();
    },
    
    /**
     * 获取翻译文本
     */
    t(key) {
        const translations = this.translations[this.currentLang] || this.translations['en-US'];
        return translations[key] || key;
    },
    
    /**
     * 切换语言
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`[LoginI18n] 不支持的语言: ${lang}`);
            return;
        }
        
        this.currentLang = lang;
        localStorage.setItem('preferred_language', lang);
        document.documentElement.lang = lang;
        this.applyTranslations();
        this._updateSwitcherDisplay();
    },
    
    /**
     * 创建语言切换器
     */
    _createLanguageSwitcher() {
        // 创建语言切换器容器
        const switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        switcher.innerHTML = `
            <button class="lang-btn" id="langSwitcherBtn">
                <svg class="lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span class="lang-name" id="currentLangName">${this.langNames[this.currentLang]}</span>
                <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="lang-dropdown" id="langDropdown">
                <div class="lang-option" data-lang="en-US">
                    <span class="flag">🇺🇸</span>
                    <span>English</span>
                </div>
                <div class="lang-option" data-lang="zh-CN">
                    <span class="flag">🇨🇳</span>
                    <span>简体中文</span>
                </div>
                <div class="lang-option" data-lang="zh-TW">
                    <span class="flag">🇹🇼</span>
                    <span>繁體中文</span>
                </div>
                <div class="lang-option" data-lang="ja-JP">
                    <span class="flag">🇯🇵</span>
                    <span>日本語</span>
                </div>
                <div class="lang-option" data-lang="ko-KR">
                    <span class="flag">🇰🇷</span>
                    <span>한국어</span>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .language-switcher {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            
            .lang-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #dadce0;
                border-radius: 24px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #202124;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .lang-btn:hover {
                background: #fff;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            
            .lang-icon {
                width: 18px;
                height: 18px;
            }
            
            .arrow-icon {
                width: 16px;
                height: 16px;
                transition: transform 0.2s ease;
            }
            
            .language-switcher.open .arrow-icon {
                transform: rotate(180deg);
            }
            
            .lang-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                min-width: 160px;
                background: #fff;
                border: 1px solid #dadce0;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-8px);
                transition: all 0.2s ease;
            }
            
            .language-switcher.open .lang-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .lang-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                font-size: 14px;
                color: #202124;
                transition: background 0.15s ease;
            }
            
            .lang-option:hover {
                background: #f1f3f4;
            }
            
            .lang-option.active {
                background: #e8f0fe;
                color: #1a73e8;
            }
            
            .lang-option .flag {
                font-size: 18px;
            }
            
            @media (max-width: 768px) {
                .language-switcher {
                    top: 10px;
                    right: 10px;
                }
                
                .lang-btn {
                    padding: 6px 12px;
                    font-size: 13px;
                }
                
                .lang-name {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(switcher);
        
        // 绑定事件
        const btn = document.getElementById('langSwitcherBtn');
        const dropdown = document.getElementById('langDropdown');
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            switcher.classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
            switcher.classList.remove('open');
        });
        
        dropdown.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.dataset.lang;
                this.setLanguage(lang);
                switcher.classList.remove('open');
            });
        });
        
        // 更新当前选中状态
        this._updateSwitcherDisplay();
    },
    
    /**
     * 更新切换器显示
     */
    _updateSwitcherDisplay() {
        const langName = document.getElementById('currentLangName');
        if (langName) {
            langName.textContent = this.langNames[this.currentLang];
        }
        
        document.querySelectorAll('.lang-option').forEach(option => {
            if (option.dataset.lang === this.currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    },
    
    /**
     * 应用翻译到页面
     */
    applyTranslations() {
        // 页面标题
        document.title = this.t('page_title');
        
        // 品牌副标题
        const brandSubtitle = document.querySelector('.brand-subtitle');
        if (brandSubtitle) brandSubtitle.textContent = this.t('brand_subtitle');
        
        // 登录标题
        const authTitle = document.querySelector('#loginHeader .auth-title');
        if (authTitle) authTitle.textContent = this.t('login_title');
        
        const authSubtitle = document.querySelector('#loginHeader .auth-subtitle');
        if (authSubtitle) authSubtitle.textContent = this.t('login_subtitle');
        
        // 登录模式按钮
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === 'password') {
                btn.textContent = this.t('mode_password');
            } else if (btn.dataset.mode === 'email') {
                btn.textContent = this.t('mode_email');
            }
        });
        
        // 表单字段
        const accountInput = document.getElementById('accountInput');
        if (accountInput) accountInput.placeholder = this.t('email_placeholder');
        
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) passwordInput.placeholder = this.t('password_placeholder');
        
        const emailInput = document.getElementById('emailInput');
        if (emailInput) emailInput.placeholder = this.t('email_address_placeholder');
        
        const codeInput = document.getElementById('codeInput');
        if (codeInput) codeInput.placeholder = this.t('code_placeholder');
        
        const sendCodeBtn = document.getElementById('sendCodeBtn');
        if (sendCodeBtn && !sendCodeBtn.disabled) {
            sendCodeBtn.textContent = this.t('send_code');
        }
        
        // 第三方登录
        const socialTitle = document.querySelector('.social-login-title');
        if (socialTitle) socialTitle.textContent = this.t('social_login_title');
        
        const googleBtn = document.getElementById('googleLoginBtn');
        if (googleBtn) googleBtn.title = this.t('google_login');
        
        const twitterBtn = document.getElementById('twitterLoginBtn');
        if (twitterBtn) twitterBtn.title = this.t('twitter_login');
        
        // 登录按钮
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.textContent = this.t('login_btn');
        
        // 登录页脚
        const loginFooterText = document.querySelector('#loginFooter .footer-text');
        if (loginFooterText) loginFooterText.textContent = this.t('no_account');
        
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        if (showRegisterBtn) showRegisterBtn.textContent = this.t('register_now');
        
        // 注册表单
        const registerEmailInput = document.getElementById('registerEmailInput');
        if (registerEmailInput) registerEmailInput.placeholder = this.t('email_address_placeholder');
        
        const registerCodeInput = document.getElementById('registerCodeInput');
        if (registerCodeInput) registerCodeInput.placeholder = this.t('code_placeholder');
        
        const registerSendCodeBtn = document.getElementById('registerSendCodeBtn');
        if (registerSendCodeBtn && !registerSendCodeBtn.disabled) {
            registerSendCodeBtn.textContent = this.t('send_code');
        }
        
        const registerPasswordInput = document.getElementById('registerPasswordInput');
        if (registerPasswordInput) registerPasswordInput.placeholder = this.t('set_password_placeholder');
        
        const registerConfirmPasswordInput = document.getElementById('registerConfirmPasswordInput');
        if (registerConfirmPasswordInput) registerConfirmPasswordInput.placeholder = this.t('confirm_password_placeholder');
        
        const registerNicknameInput = document.getElementById('registerNicknameInput');
        if (registerNicknameInput) registerNicknameInput.placeholder = this.t('nickname_placeholder');
        
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) registerBtn.textContent = this.t('register_btn');
        
        const registerFooterText = document.querySelector('#registerFooter .footer-text');
        if (registerFooterText) registerFooterText.textContent = this.t('has_account');
        
        const showLoginBtn = document.getElementById('showLoginBtn');
        if (showLoginBtn) showLoginBtn.textContent = this.t('login_now');
        
        // 设置密码模态框
        const setPasswordTitle = document.querySelector('#setPasswordModal .modal-header h3');
        if (setPasswordTitle) setPasswordTitle.textContent = this.t('set_password_title');
        
        const setPasswordSubtitle = document.querySelector('#setPasswordModal .modal-subtitle');
        if (setPasswordSubtitle) setPasswordSubtitle.textContent = this.t('set_password_subtitle');
        
        const newPassword = document.getElementById('newPassword');
        if (newPassword) newPassword.placeholder = this.t('password_input_placeholder');
        
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) confirmPassword.placeholder = this.t('confirm_input_placeholder');
        
        const skipBtn = document.getElementById('skipPasswordBtn');
        if (skipBtn) skipBtn.textContent = this.t('skip_btn');
        
        const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
        if (confirmPasswordBtn) confirmPasswordBtn.textContent = this.t('confirm_btn');
        
        // 首次登录模态框
        const firstTimeTitle = document.querySelector('#firstTimeLoginModal .modal-header h3');
        if (firstTimeTitle) firstTimeTitle.textContent = this.t('first_time_title');
        
        const firstTimeSubtitle = document.querySelector('#firstTimeLoginModal .modal-subtitle');
        if (firstTimeSubtitle) firstTimeSubtitle.textContent = this.t('first_time_subtitle');
        
        const firstTimePassword = document.getElementById('firstTimePassword');
        if (firstTimePassword) firstTimePassword.placeholder = this.t('set_password_placeholder');
        
        const firstTimeConfirmPassword = document.getElementById('firstTimeConfirmPassword');
        if (firstTimeConfirmPassword) firstTimeConfirmPassword.placeholder = this.t('confirm_password_placeholder');
        
        const firstTimeNickname = document.getElementById('firstTimeNickname');
        if (firstTimeNickname) firstTimeNickname.placeholder = this.t('nickname_optional_placeholder');
        
        const confirmFirstTimeBtn = document.getElementById('confirmFirstTimeBtn');
        if (confirmFirstTimeBtn) confirmFirstTimeBtn.textContent = this.t('confirm_btn');
        
        // 底部链接
        const bottomLinks = document.querySelectorAll('.bottom-links .link');
        if (bottomLinks.length >= 4) {
            bottomLinks[0].textContent = this.langNames[this.currentLang];
            bottomLinks[1].textContent = this.t('help');
            bottomLinks[2].textContent = this.t('privacy');
            bottomLinks[3].textContent = this.t('terms');
        }
        
        // 音量按钮
        const volumeToggle = document.getElementById('volumeToggle');
        if (volumeToggle) volumeToggle.setAttribute('aria-label', this.t('toggle_volume'));
    }
};

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoginI18n.init());
} else {
    LoginI18n.init();
}

// 导出
window.LoginI18n = LoginI18n;

