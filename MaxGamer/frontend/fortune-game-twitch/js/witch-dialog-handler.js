// 魔女对话框处理器
class WitchDialogHandler {
    constructor() {
        this.dialogContainer = null;
        this.dialogText = null;
        this.replyInput = null;
        this.replyBtn = null;
        this.characterImage = null;
        this.isVisible = false;
        
        // 精灵图动画相关
        this.spriteImage = null;
        this.spriteCanvas = null;
        this.spriteCtx = null;
        this.currentFrame = 0;
        this.totalFrames = 16;
        this.frameDelay = 300; // 每帧300ms
        this.lastFrameTime = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.dialogContainer = document.getElementById('witch-dialog-container');
        this.dialogText = document.getElementById('witch-dialog-text');
        this.replyInput = document.getElementById('witch-reply-input');
        this.replyBtn = document.getElementById('witch-reply-btn');
        this.characterImage = document.getElementById('witch-character');
        
        if (!this.dialogContainer) {
            console.warn('魔女对话框容器未找到');
            return;
        }
        
        // 初始化精灵图Canvas
        this.initSpriteCanvas();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始显示欢迎消息
        setTimeout(() => {
            this.show('欢迎来到占卜屋～我是巫女莉莉，让我为你揭示命运的秘密吧！✨');
        }, 1000);
    }
    
    initSpriteCanvas() {
        if (!this.characterImage) return;
        
        // 创建Canvas元素
        this.spriteCanvas = document.createElement('canvas');
        this.spriteCanvas.width = 180;
        this.spriteCanvas.height = 180;
        this.spriteCtx = this.spriteCanvas.getContext('2d', { willReadFrequently: true });
        this.characterImage.appendChild(this.spriteCanvas);
        
        // 加载精灵图
        this.spriteImage = new Image();
        this.spriteImage.onload = () => {
            console.log('✅ 精灵图加载成功');
            this.startSpriteAnimation();
        };
        this.spriteImage.onerror = () => {
            console.error('❌ 精灵图加载失败');
        };
        this.spriteImage.src = 'assets/待机2.png';
    }
    
    startSpriteAnimation() {
        const animate = (timestamp) => {
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;
            
            const elapsed = timestamp - this.lastFrameTime;
            
            if (elapsed >= this.frameDelay) {
                this.drawSpriteFrame();
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                this.lastFrameTime = timestamp;
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    drawSpriteFrame() {
        if (!this.spriteImage || !this.spriteCtx) return;
        
        const frameWidth = this.spriteImage.width / 4;
        const frameHeight = this.spriteImage.height / 4;
        
        const col = this.currentFrame % 4;
        const row = Math.floor(this.currentFrame / 4);
        
        const sx = col * frameWidth;
        const sy = row * frameHeight;
        
        // 清空画布
        this.spriteCtx.clearRect(0, 0, this.spriteCanvas.width, this.spriteCanvas.height);
        
        // 绘制当前帧
        this.spriteCtx.drawImage(
            this.spriteImage,
            sx, sy, frameWidth, frameHeight,
            0, 0, this.spriteCanvas.width, this.spriteCanvas.height
        );
        
        // 移除白色背景（将白色或接近白色的像素变为透明）
        const imageData = this.spriteCtx.getImageData(0, 0, this.spriteCanvas.width, this.spriteCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 如果像素接近白色（RGB都大于240），则设为透明
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // 设置alpha为0（透明）
            }
        }
        
        this.spriteCtx.putImageData(imageData, 0, 0);
    }
    
    bindEvents() {
        // 发送按钮点击
        if (this.replyBtn) {
            this.replyBtn.addEventListener('click', () => {
                this.handleReply();
            });
        }
        
        // 回车发送
        if (this.replyInput) {
            this.replyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleReply();
                }
            });
        }
        
        // 眨眼动画
        if (this.characterImage) {
            setInterval(() => {
                this.blink();
            }, 3000 + Math.random() * 2000);
        }
    }
    
    show(message, duration = 0) {
        if (!this.dialogContainer || !this.dialogText) return;
        
        // 更新对话内容
        this.dialogText.innerHTML = message;
        
        // 显示对话框
        this.dialogContainer.classList.add('show');
        this.isVisible = true;
        
        // 添加说话动画
        if (this.characterImage) {
            this.characterImage.classList.add('talking');
        }
        
        // 如果设置了持续时间，自动隐藏说话动画
        if (duration > 0) {
            setTimeout(() => {
                if (this.characterImage) {
                    this.characterImage.classList.remove('talking');
                }
            }, duration);
        }
    }
    
    hide() {
        if (!this.dialogContainer) return;
        
        this.dialogContainer.classList.remove('show');
        this.isVisible = false;
        
        if (this.characterImage) {
            this.characterImage.classList.remove('talking');
        }
    }
    
    async handleReply() {
        if (!this.replyInput) return;
        
        const message = this.replyInput.value.trim();
        if (!message) return;
        
        // 清空输入框
        this.replyInput.value = '';
        
        // 显示思考状态
        this.show('让我想想... 🤔', 0);
        
        try {
            // 调用后端AI接口
            const response = await fetch('http://localhost:5000/api/fortune/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    username: '访客',
                    event_type: 'chat'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.response) {
                    // 显示AI回复
                    this.show(data.response, 0);
                } else {
                    this.show('抱歉，我现在有点累了... 😴', 3000);
                }
            } else {
                throw new Error('API请求失败');
            }
        } catch (error) {
            console.error('❌ AI对话失败:', error);
            // 后端未启动时的降级回复
            this.show(`收到你的消息啦："${message}"～不过我现在需要连接到后端服务才能更好地回复你呢... 🔌`, 4000);
        }
    }
    
    blink() {
        if (!this.characterImage) return;
        
        this.characterImage.classList.add('blinking');
        setTimeout(() => {
            this.characterImage.classList.remove('blinking');
        }, 300);
    }
    
    // 高亮用户名
    highlightUsername(text, username) {
        if (!username) return text;
        return text.replace(
            new RegExp(username, 'g'),
            `<span class="username-highlight">${username}</span>`
        );
    }
    
    // 添加表情符号动画
    addEmojiAnimation(text) {
        const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;
        return text.replace(emojiRegex, '<span class="emoji">$1</span>');
    }
    
    // 格式化消息（包含用户名高亮和表情动画）
    formatMessage(text, username = null) {
        let formatted = text;
        if (username) {
            formatted = this.highlightUsername(formatted, username);
        }
        formatted = this.addEmojiAnimation(formatted);
        return formatted;
    }
    
    // 显示格式化的消息
    showFormatted(text, username = null, duration = 0) {
        const formatted = this.formatMessage(text, username);
        this.show(formatted, duration);
    }
}

// 全局实例
let witchDialogHandler = null;

// 初始化函数
function initWitchDialog() {
    if (!witchDialogHandler) {
        witchDialogHandler = new WitchDialogHandler();
    }
    return witchDialogHandler;
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.WitchDialogHandler = WitchDialogHandler;
    window.initWitchDialog = initWitchDialog;
    window.witchDialogHandler = null;
}