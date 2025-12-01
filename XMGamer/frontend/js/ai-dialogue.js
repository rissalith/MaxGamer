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
        
        // 知识库相关的介绍台词
        this.introMessages = [
            '欢迎来到MaxGamer！直播间里的AI互动专家~ ✨',
            'MaxGamer - 为主播提供AI驱动的互动工具，让每一秒都有价值！',
            '我是Max，你的AI助手！让直播更有趣，让互动更智能~',
            '无需下载，即插即用！5分钟让你的直播间焕然一新！',
            '支持抖音、B站、Twitch等所有主流平台，一套工具走天下！',
            '点击右侧按钮体验互动，看看AI如何让直播更精彩~'
        ];
        
        // 交互响应消息模板
        this.interactionResponses = {
            like: [
                '谢谢你的点赞！❤️',
                '哇！收到你的赞了！感觉超开心的~ ✨',
                '你的点赞让我充满能量！💪',
                '感谢认可！让我们一起创造更多精彩吧~'
            ],
            gift: [
                '哇！收到礼物了！🎁 太感谢啦~',
                '这个礼物好棒！你真是太贴心了~ ✨',
                '谢谢你的礼物！我会好好珍惜的~ 💝',
                '收到你的心意了！让我给你一个大大的拥抱~ 🤗'
            ],
            comment: [
                '看到你的评论啦！有什么想说的吗？💭',
                '欢迎留言互动！我很期待听到你的想法~ 📝',
                '你的评论我都会认真看的哦！💬',
                '感谢你的互动！让我们聊聊天吧~ ☺️'
            ]
        };
        
        // 配置
        this.config = {
            autoIntroInterval: 15000, // 自动介绍间隔（15秒）
            typingSpeed: 50, // 打字速度（毫秒/字符）
            displayDuration: 8000 // 消息显示时长（8秒）
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
        const randomIndex = Math.floor(Math.random() * this.introMessages.length);
        const message = this.introMessages[randomIndex];
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
            const responses = this.interactionResponses[type];
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
                        count: this.interactionCounts[interactionType] || 1  // 传递交互次数
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
        const responses = this.interactionResponses[interactionType];
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
        const thinkingMessages = {
            like: '收到你的赞了！让我想想怎么回应... 🤔',
            gift: '哇！礼物！让我好好看看... ✨',
            comment: '看到你的评论了！思考中... 💭'
        };
        
        const message = thinkingMessages[interactionType] || '正在思考中...';
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