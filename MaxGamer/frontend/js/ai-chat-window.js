/**
 * AI聊天窗口功能模块
 * 提供完整的对话窗口交互界面
 */

class AIChatWindow {
    constructor() {
        this.isOpen = false;
        this.chatHistory = [];
        this.isWaitingResponse = false;
        this.apiEndpoint = '/api/ai/chat';
        this.container = null;
        this.messageContainer = null;
        this.inputField = null;
        this.sendButton = null;
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
        const translations = {
            'chat_window_title': {
                'zh-CN': '与Max对话',
                'en-US': 'Chat with Max'
            },
            'chat_placeholder': {
                'zh-CN': '输入消息...',
                'en-US': 'Type a message...'
            },
            'chat_send': {
                'zh-CN': '发送',
                'en-US': 'Send'
            },
            'chat_thinking': {
                'zh-CN': 'Max正在思考...',
                'en-US': 'Max is thinking...'
            }
        };

        const lang = this.getCurrentLanguage();
        return translations[key]?.[lang] || translations[key]?.['en-US'] || key;
    }

    /**
     * 初始化聊天窗口
     */
    init() {
        this.createChatWindow();
        this.bindEvents();
        console.log('AI聊天窗口初始化完成');
    }

    /**
     * 创建聊天窗口DOM结构
     */
    createChatWindow() {
        // 获取当前语言
        const currentLang = this.getCurrentLanguage();
        const isZhCN = currentLang === 'zh-CN';

        // 创建主容器
        this.container = document.createElement('div');
        this.container.className = 'ai-chat-window hidden';

        // 创建窗口内容
        this.container.innerHTML = `
            <div class="chat-window-content">
                <div class="chat-header">
                    <div class="chat-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="chat-title">
                        <h3>${isZhCN ? '与Max对话' : 'Chat with Max'}</h3>
                        <span class="chat-status online">${isZhCN ? '在线' : 'Online'}</span>
                    </div>
                    <button class="chat-close-btn" aria-label="Close chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <div class="message ai-message">
                            <div class="message-avatar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div class="message-content">
                                <div class="message-bubble">
                                    ${isZhCN ? '你好！我是Max，有什么可以帮助你的吗？' : 'Hi! I\'m Max, how can I help you today?'}
                                </div>
                                <div class="message-time">${this.getCurrentTime()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chat-input-area">
                    <div class="input-wrapper">
                        <input
                            type="text"
                            class="chat-input"
                            placeholder="${isZhCN ? '输入消息...' : 'Type a message...'}"
                            maxlength="500"
                            id="chatInput"
                        />
                        <button class="send-btn" id="chatSendBtn" aria-label="${isZhCN ? '发送' : 'Send'}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        // 获取DOM引用
        this.messageContainer = document.getElementById('chatMessages');
        this.inputField = document.getElementById('chatInput');
        this.sendButton = document.getElementById('chatSendBtn');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮
        const closeBtn = this.container.querySelector('.chat-close-btn');
        closeBtn.addEventListener('click', () => this.close());

        // 发送按钮
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // 回车发送
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 点击背景关闭
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });
    }

    /**
     * 打开聊天窗口
     */
    open() {
        this.container.classList.remove('hidden');
        this.container.classList.add('show');
        this.isOpen = true;

        // 聚焦输入框
        setTimeout(() => {
            this.inputField.focus();
        }, 300);

        // 滚动到底部
        this.scrollToBottom();
    }

    /**
     * 关闭聊天窗口
     */
    close() {
        this.container.classList.remove('show');
        this.container.classList.add('hidden');
        this.isOpen = false;
    }

    /**
     * 切换窗口显示
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * 发送消息
     */
    async sendMessage() {
        const message = this.inputField.value.trim();

        if (!message || this.isWaitingResponse) {
            return;
        }

        // 清空输入框
        this.inputField.value = '';

        // 添加用户消息
        this.addUserMessage(message);

        // 添加到历史
        this.chatHistory.push({
            role: 'user',
            content: message
        });

        // 显示思考中状态
        this.showThinking();

        // 调用AI API
        this.isWaitingResponse = true;
        this.sendButton.disabled = true;
        this.inputField.disabled = true;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interaction_type: 'comment',
                    message: message,
                    history: this.chatHistory.slice(-10), // 发送最近10条历史
                    context: {
                        platform: 'MaxGamer',
                        page: 'login',
                        count: this.chatHistory.length,
                        language: this.getCurrentLanguage()
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.message) {
                    // 移除思考状态
                    this.removeThinking();

                    // 添加AI回复
                    this.addAIMessage(data.message);

                    // 添加到历史
                    this.chatHistory.push({
                        role: 'assistant',
                        content: data.message
                    });
                } else {
                    this.handleError();
                }
            } else {
                this.handleError();
            }
        } catch (error) {
            console.error('AI API调用失败:', error);
            this.handleError();
        } finally {
            this.isWaitingResponse = false;
            this.sendButton.disabled = false;
            this.inputField.disabled = false;
            this.inputField.focus();
        }
    }

    /**
     * 添加用户消息
     */
    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(text)}</div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;

        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * 添加AI消息
     */
    addAIMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(text)}</div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;

        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * 显示思考中状态
     */
    showThinking() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message ai-message thinking-message';
        thinkingDiv.id = 'thinkingMessage';
        thinkingDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.messageContainer.appendChild(thinkingDiv);
        this.scrollToBottom();
    }

    /**
     * 移除思考中状态
     */
    removeThinking() {
        const thinkingMsg = document.getElementById('thinkingMessage');
        if (thinkingMsg) {
            thinkingMsg.remove();
        }
    }

    /**
     * 处理错误
     */
    handleError() {
        this.removeThinking();

        const errorMessage = this.getCurrentLanguage() === 'zh-CN'
            ? '抱歉，我现在有点忙，请稍后再试！'
            : 'Sorry, I\'m a bit busy right now. Please try again later!';

        this.addAIMessage(errorMessage);
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }, 100);
    }

    /**
     * 获取当前时间
     */
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 清空聊天历史
     */
    clearHistory() {
        this.chatHistory = [];
        this.messageContainer.innerHTML = '';

        // 重新添加欢迎消息
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        ${this.getCurrentLanguage() === 'zh-CN'
                            ? '你好！我是Max，有什么可以帮助你的吗？'
                            : 'Hi! I\'m Max, how can I help you today?'}
                    </div>
                    <div class="message-time">${this.getCurrentTime()}</div>
                </div>
            </div>
        `;

        this.messageContainer.appendChild(welcomeDiv);
    }

    /**
     * 销毁聊天窗口
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.chatHistory = [];
    }
}

// 立即初始化
const aiChatWindow = new AIChatWindow();
aiChatWindow.init();

// 挂载到window
window.aiChatWindow = aiChatWindow;
