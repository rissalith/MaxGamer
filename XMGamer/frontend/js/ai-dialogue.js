/**
 * AI对话气泡功能模块
 * 单个气泡显示在人物右上方，内容动态更新
 */

class AIDialogue {
    constructor() {
        this.container = null;
        this.bubble = null;
        this.currentText = '';
        this.isTyping = false;
        this.isThinking = false; // 新增：AI思考状态
        this.autoIntroTimer = null;
        this.typingInterval = null;
        this.useRealAPI = true; // 启用真实AI API
        this.apiEndpoint = '/api/ai/chat'; // AI API端点
        
        // 记录每种交互类型的次数
        this.interactionCounts = {
            like: 0,
            gift: 0,
            comment: 0
        };
        
        // 配置
        this.config = {
            autoIntroInterval: 15000, // 自动介绍间隔（15秒）
            typingSpeed: 50, // 打字速度（毫秒/字符）
            displayDuration: 8000 // 消息显示时长（8秒）
        };
    }
    
    /**
     * 获取当前语言
     */
    getCurrentLanguage() {
        if (window.LoginI18n) {
            return window.LoginI18n.currentLang;
        }
        return localStorage.getItem('preferred_language') || 'en-US';
    }
    
    /**
     * 获取翻译文本
     */
    t(key) {
        if (window.LoginI18n) {
            return window.LoginI18n.t(key);
        }
        return key;
    }
    
    /**
     * 获取介绍消息列表（根据当前语言）
     */
    getIntroMessages() {
        return [
            this.t('max_intro_1'),
            this.t('max_intro_2'),
            this.t('max_intro_3'),
            this.t('max_intro_4'),
            this.t('max_intro_5'),
            this.t('max_intro_6')
        ];
    }
    
    /**
     * 获取交互响应消息（根据当前语言）
     */
    getInteractionResponses() {
        return {
            like: [
                this.t('max_like_1'),
                this.t('max_like_2'),
                this.t('max_like_3'),
                this.t('max_like_4')
            ],
            gift: [
                this.t('max_gift_1'),
                this.t('max_gift_2'),
                this.t('max_gift_3'),
                this.t('max_gift_4')
            ],
            comment: [
                this.t('max_comment_1'),
                this.t('max_comment_2'),
                this.t('max_comment_3'),
                this.t('max_comment_4')
            ]
        };
    }
    
    /**
     * 获取思考中消息（根据当前语言）
     */
    getThinkingMessages() {
        return {
            like: this.t('max_thinking_like'),
            gift: this.t('max_thinking_gift'),
            comment: this.t('max_thinking_comment'),
            default: this.t('max_thinking_default')
        };
    }

    /**
     * 初始化AI对话气泡
     */
    init() {
        this.createBubble();
        this.listenToInteractionButtons();
        // 不再自动开始介绍，只在交互时显示
        // this.startAutoIntro();
    }

    /**
     * 创建单个气泡
     */
    createBubble() {
        this.container = document.createElement('div');
        this.container.className = 'ai-dialogue-container hidden'; // 初始隐藏
        
        this.bubble = document.createElement('div');
        this.bubble.className = 'ai-message intro';
        this.bubble.textContent = '';
        
        this.container.appendChild(this.bubble);
        document.body.appendChild(this.container);
    }

    /**
     * 监听交互按钮的点击事件
     */
    listenToInteractionButtons() {
        // 等待交互按钮初始化
        const checkInterval = setInterval(() => {
            if (window.interactionButtons) {
                clearInterval(checkInterval);
                
                // 监听按钮点击
                const buttons = document.querySelectorAll('.interaction-btn');
                buttons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const type = button.getAttribute('data-type');
                        
                        // 每次点击都触发AI响应
                        this.handleInteraction(type);
                    });
                });
            }
        }, 100);
        
        // 10秒后停止检查
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    /**
     * 开始自动介绍
     */
    startAutoIntro() {
        // 首次延迟3秒后显示第一条消息
        setTimeout(() => {
            this.showRandomIntro();
        }, 3000);
        
        // 之后每隔一段时间显示一条
        this.autoIntroTimer = setInterval(() => {
            // 只在没有打字时显示
            if (!this.isTyping) {
                this.showRandomIntro();
            }
        }, this.config.autoIntroInterval);
    }

    /**
     * 显示随机介绍消息
     */
    showRandomIntro() {
        const introMessages = this.getIntroMessages();
        const randomIndex = Math.floor(Math.random() * introMessages.length);
        const message = introMessages[randomIndex];
        this.updateBubble(message, 'intro');
    }

    /**
     * 处理交互事件
     */
    handleInteraction(type) {
        // 如果正在思考，忽略新的交互
        if (this.isThinking) {
            return;
        }
        
        // 暂停自动介绍
        this.pauseAutoIntro();
        
        if (this.useRealAPI) {
            // 调用真实AI API
            this.callAIAPI(type);
        } else {
            // 使用预设消息（备用方案）
            const responses = this.getInteractionResponses()[type];
            if (responses && responses.length > 0) {
                const randomIndex = Math.floor(Math.random() * responses.length);
                const message = responses[randomIndex];
                this.updateBubble(message, `${type}-response`);
            }
        }
        
        // 5秒后恢复自动介绍
        setTimeout(() => {
            this.resumeAutoIntro();
        }, 5000);
    }

    /**
     * 更新气泡内容
     */
    updateBubble(text, type = 'intro') {
        // 显示容器（如果是隐藏的）
        this.show();
        
        // 停止当前打字
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
        
        // 更新气泡类型（颜色）
        this.bubble.className = `ai-message ${type}`;
        
        // 清空内容
        this.bubble.textContent = '';
        this.currentText = text;
        
        // 开始打字效果
        this.typeText(text);
    }

    /**
     * 打字效果
     */
    typeText(text) {
        this.isTyping = true;
        this.bubble.classList.add('typing');
        
        let index = 0;
        this.typingInterval = setInterval(() => {
            if (index < text.length) {
                this.bubble.textContent += text[index];
                index++;
            } else {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
                this.bubble.classList.remove('typing');
                this.isTyping = false;
            }
        }, this.config.typingSpeed);
    }

    /**
     * 暂停自动介绍
     */
    pauseAutoIntro() {
        if (this.autoIntroTimer) {
            clearInterval(this.autoIntroTimer);
            this.autoIntroTimer = null;
        }
    }

    /**
     * 恢复自动介绍
     */
    resumeAutoIntro() {
        if (!this.autoIntroTimer) {
            this.autoIntroTimer = setInterval(() => {
                if (!this.isTyping) {
                    this.showRandomIntro();
                }
            }, this.config.autoIntroInterval);
        }
    }

    /**
     * 切换显示/隐藏
     */
    toggleVisibility() {
        this.container.classList.toggle('hidden');
    }

    /**
     * 显示
     */
    show() {
        this.container.classList.remove('hidden');
    }

    /**
     * 隐藏
     */
    hide() {
        this.container.classList.add('hidden');
    }

    /**
     * 调用AI API
     */
    async callAIAPI(interactionType, userMessage = '') {
        // 增加交互计数
        if (this.interactionCounts[interactionType] !== undefined) {
            this.interactionCounts[interactionType]++;
        }
        
        // 设置思考状态
        this.isThinking = true;
        this.disableInteractionButtons();
        this.showThinkingMessage(interactionType);
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interaction_type: interactionType,
                    message: userMessage,
                    context: {
                        platform: 'MaxGamer',
                        page: 'login',
                        count: this.interactionCounts[interactionType] || 1,  // 传递交互次数
                        language: this.getCurrentLanguage()  // 传递当前语言
                    }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.message) {
                    this.updateBubble(data.message, `${interactionType}-response`);
                } else {
                    // API返回失败，使用预设消息
                    this.useFallbackMessage(interactionType);
                }
            } else {
                // HTTP错误，使用预设消息
                this.useFallbackMessage(interactionType);
            }
        } catch (error) {
            // 网络错误，使用预设消息
            this.useFallbackMessage(interactionType);
        } finally {
            // 恢复按钮状态
            this.isThinking = false;
            this.enableInteractionButtons();
        }
    }
    
    /**
     * 使用备用消息（当API失败时）
     */
    useFallbackMessage(interactionType) {
        const responses = this.getInteractionResponses()[interactionType];
        if (responses && responses.length > 0) {
            const randomIndex = Math.floor(Math.random() * responses.length);
            const message = responses[randomIndex];
            this.updateBubble(message, `${interactionType}-response`);
        }
    }

    /**
     * 显示思考中消息
     */
    showThinkingMessage(interactionType) {
        const thinkingMessages = this.getThinkingMessages();
        const message = thinkingMessages[interactionType] || thinkingMessages.default;
        this.updateBubble(message, 'thinking');
    }
    
    /**
     * 禁用交互按钮
     */
    disableInteractionButtons() {
        if (window.interactionButtons && window.interactionButtons.container) {
            const buttons = window.interactionButtons.container.querySelectorAll('.interaction-btn');
            buttons.forEach(button => {
                button.classList.add('disabled');
                button.style.pointerEvents = 'none';
                button.style.opacity = '0.5';
            });
        }
    }
    
    /**
     * 启用交互按钮
     */
    enableInteractionButtons() {
        if (window.interactionButtons && window.interactionButtons.container) {
            const buttons = window.interactionButtons.container.querySelectorAll('.interaction-btn');
            buttons.forEach(button => {
                button.classList.remove('disabled');
                button.style.pointerEvents = 'auto';
                button.style.opacity = '1';
            });
        }
    }

    /**
     * 销毁
     */
    destroy() {
        this.pauseAutoIntro();
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// 立即初始化（因为脚本是动态加载的，DOM已经准备好了）
const aiDialogue = new AIDialogue();
aiDialogue.init();

// 将实例挂载到window，方便调试和外部访问
window.aiDialogue = aiDialogue;