/**
 * 占卜对话框管理器
 * 处理与占卜Agent的实时对话
 */

class FortuneChatManager {
    constructor() {
        this.container = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.toggleButton = null;
        this.isOpen = true; // 默认展开
        this.isTyping = false;
        this.socket = null;
        
        // 初始化UI
        this.init();
    }
    
    /**
     * 初始化对话框UI
     */
    init() {
        // 获取已存在的切换按钮
        this.toggleButton = document.getElementById('fortune-chat-toggle');
        
        // 创建对话框容器
        this.createChatContainer();
        
        // 绑定事件
        this.bindEvents();
        
        // 默认展开对话框
        this.open();
        
        console.log('[占卜对话框] 初始化完成');
    }
    
    /**
     * 创建对话框容器
     */
    createChatContainer() {
        this.container = document.createElement('div');
        this.container.className = 'fortune-chat-container';
        this.container.innerHTML = `
            <div class="fortune-chat-header">
                <div class="fortune-chat-title">
                    <div class="lili-avatar">
                        <div class="lili-hat"></div>
                        <div class="lili-face">
                            <div class="lili-eyes">
                                <div class="lili-eye left"></div>
                                <div class="lili-eye right"></div>
                            </div>
                            <div class="lili-mouth"></div>
                        </div>
                    </div>
                    <span>占卜师 Lili</span>
                </div>
                <div class="fortune-chat-controls">
                    <button class="fortune-chat-close">×</button>
                </div>
            </div>
            <div class="fortune-chat-messages" id="fortune-messages"></div>
            <div class="fortune-chat-input-area">
                <div class="fortune-chat-input-wrapper">
                    <input type="text" class="fortune-chat-input" placeholder="向占卜师Lili提问..." maxlength="200">
                    <button class="fortune-chat-send">发送</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);
        
        // 获取元素引用
        this.messagesContainer = this.container.querySelector('#fortune-messages');
        this.inputField = this.container.querySelector('.fortune-chat-input');
        this.sendButton = this.container.querySelector('.fortune-chat-send');
        
        // 添加欢迎消息
        this.addWelcomeMessage();
    }
    
    /**
     * 添加欢迎消息
     */
    addWelcomeMessage() {
        this.addMessage('agent', '欢迎来到占卜间！我是小魔女Lili～有什么想问的吗？', 'Lili');
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 切换按钮点击
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // 关闭按钮点击
        const closeBtn = this.container.querySelector('.fortune-chat-close');
        closeBtn.addEventListener('click', () => {
            this.close();
        });
        
        // 发送按钮点击
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // 输入框回车发送
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    /**
     * 切换对话框显示/隐藏
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * 打开对话框
     */
    open() {
        this.container.classList.add('active');
        this.toggleButton.classList.add('active');
        this.isOpen = true;
        this.inputField.focus();
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    /**
     * 关闭对话框
     */
    close() {
        this.container.classList.remove('active');
        this.toggleButton.classList.remove('active');
        this.isOpen = false;
    }
    
    /**
     * 发送消息
     */
    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isTyping) return;
        
        // 添加用户消息
        this.addMessage('user', message, '你');
        this.inputField.value = '';
        
        // 显示输入中状态
        this.showTyping();
        
        try {
            // 发送到后端
            const response = await this.sendToAgent(message);
            
            // 隐藏输入中状态
            this.hideTyping();
            
            // 添加Agent回复
            if (response && response.response) {
                this.addMessage('agent', response.response, 'Lili');
            } else {
                this.addMessage('system', 'Lili暂时无法回应，请稍后再试', '系统');
            }
        } catch (error) {
            console.error('[占卜对话框] 发送消息失败:', error);
            this.hideTyping();
            this.addMessage('system', '发送失败: ' + error.message, '系统');
        }
    }
    
    /**
     * 发送消息到Agent
     */
    async sendToAgent(message, fortuneContext = null) {
        const url = 'http://localhost:5000/api/fortune/chat';
        
        const payload = {
            message: message
        };
        
        // 如果有运势上下文，添加到payload
        if (fortuneContext) {
            payload.username = fortuneContext.username;
            payload.grade = fortuneContext.grade;
            payload.topic = fortuneContext.topic;
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '请求失败');
        }
        
        return await response.json();
    }
    
    /**
     * 添加消息到对话框
     */
    addMessage(type, text, sender = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fortune-message ${type}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'fortune-message-bubble';
        
        if (sender && type !== 'system') {
            const senderDiv = document.createElement('div');
            senderDiv.className = 'fortune-message-sender';
            senderDiv.textContent = sender;
            bubbleDiv.appendChild(senderDiv);
        }
        
        const textDiv = document.createElement('div');
        textDiv.className = 'fortune-message-text';
        textDiv.textContent = text;
        bubbleDiv.appendChild(textDiv);
        
        messageDiv.appendChild(bubbleDiv);
        this.messagesContainer.appendChild(messageDiv);
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    /**
     * 显示输入中状态
     */
    showTyping() {
        this.isTyping = true;
        this.sendButton.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'fortune-message agent';
        typingDiv.id = 'fortune-typing-indicator';
        typingDiv.innerHTML = `
            <div class="fortune-message-bubble">
                <div class="fortune-typing">
                    <div class="fortune-typing-dot"></div>
                    <div class="fortune-typing-dot"></div>
                    <div class="fortune-typing-dot"></div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    /**
     * 隐藏输入中状态
     */
    hideTyping() {
        this.isTyping = false;
        this.sendButton.disabled = false;
        
        const typingIndicator = document.getElementById('fortune-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    /**
     * 滚动到底部
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    /**
     * 处理抽签结果（从游戏系统调用）
     */
    handleFortuneResult(username, grade, topic) {
        if (!this.isOpen) {
            this.open();
        }
        
        // 构造运势上下文消息
        const contextMessage = `${username}抽到了${grade}，运势类型是${topic}`;
        
        // 发送到Agent
        this.showTyping();
        this.sendToAgent(contextMessage, { username, grade, topic })
            .then(response => {
                this.hideTyping();
                if (response && response.response) {
                    this.addMessage('agent', response.response, 'Lili');
                }
            })
            .catch(error => {
                console.error('[占卜对话框] 处理抽签结果失败:', error);
                this.hideTyping();
            });
    }
    
    /**
     * 清空对话历史
     */
    clearHistory() {
        this.messagesContainer.innerHTML = '';
        this.addWelcomeMessage();
    }
}

// 创建全局实例
let fortuneChatManager = null;

// 初始化函数
function initFortuneChatManager() {
    if (!fortuneChatManager) {
        fortuneChatManager = new FortuneChatManager();
        window.fortuneChatManager = fortuneChatManager;
        console.log('[占卜对话框] 管理器已初始化');
    }
    return fortuneChatManager;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FortuneChatManager, initFortuneChatManager };
}