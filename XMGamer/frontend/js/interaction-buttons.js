/**
 * 交互按钮功能模块
 * 实现点赞、礼物、评论按钮的交互效果
 */

class InteractionButtons {
    constructor() {
        this.buttons = {
            like: { count: 0, active: false },
            gift: { count: 0, active: false },
            comment: { count: 0, active: false }
        };
        
        this.container = null;
        this.particlePool = [];
    }

    /**
     * 初始化交互按钮
     */
    init() {
        // 创建按钮容器
        this.createButtonContainer();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('交互按钮初始化完成');
    }

    /**
     * 创建按钮容器和按钮
     */
    createButtonContainer() {
        // 创建容器
        this.container = document.createElement('div');
        this.container.className = 'interaction-buttons';
        
        // 创建点赞按钮 - SVG图标
        const likeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>`;
        const likeBtn = this.createButton('like', likeSvg, '点赞');
        
        // 创建礼物按钮 - SVG图标
        const giftSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>`;
        const giftBtn = this.createButton('gift', giftSvg, '礼物');
        
        // 创建评论按钮 - SVG图标
        const commentSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>`;
        const commentBtn = this.createButton('comment', commentSvg, '评论');
        
        // 添加到容器
        this.container.appendChild(likeBtn);
        this.container.appendChild(giftBtn);
        this.container.appendChild(commentBtn);
        
        // 添加到页面
        document.body.appendChild(this.container);
    }

    /**
     * 创建单个按钮
     */
    createButton(type, iconSvg, title) {
        const button = document.createElement('div');
        button.className = `interaction-btn ${type}-btn`;
        button.setAttribute('data-type', type);
        button.setAttribute('title', title);
        
        // 图标容器
        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon';
        iconSpan.innerHTML = iconSvg;
        
        // 计数
        const countSpan = document.createElement('span');
        countSpan.className = 'count';
        countSpan.textContent = '0';
        
        // 粒子容器
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-container';
        
        button.appendChild(iconSpan);
        button.appendChild(countSpan);
        button.appendChild(particleContainer);
        
        return button;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const buttons = this.container.querySelectorAll('.interaction-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = button.getAttribute('data-type');
                this.handleButtonClick(type, button);
            });
        });
    }

    /**
     * 处理按钮点击
     */
    handleButtonClick(type, button) {
        const data = this.buttons[type];
        
        // 每次点击都增加计数（不再切换状态）
        data.count++;
        
        // 始终保持激活状态
        if (!data.active) {
            data.active = true;
            button.classList.add('active');
        }
        
        // 显示/更新计数
        const countSpan = button.querySelector('.count');
        countSpan.textContent = this.formatCount(data.count);
        countSpan.classList.add('show');
        
        // 触发特效
        this.triggerEffect(type, button);
        
        // 播放音效（如果需要）
        this.playSound(type);
    }

    /**
     * 触发特效
     */
    triggerEffect(type, button) {
        // 创建粒子效果
        this.createParticles(type, button);
        
        // 根据类型触发不同效果
        switch(type) {
            case 'like':
                this.likeEffect(button);
                break;
            case 'gift':
                this.giftEffect(button);
                break;
            case 'comment':
                this.commentEffect(button);
                break;
        }
    }

    /**
     * 点赞特效
     */
    likeEffect(button) {
        // 创建飘心动画
        const heart = document.createElement('div');
        heart.style.cssText = `
            position: absolute;
            font-size: 32px;
            color: #ff6b6b;
            pointer-events: none;
            animation: floatHeart 1.5s ease-out forwards;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
        `;
        heart.textContent = '❤️';
        
        button.appendChild(heart);
        
        // 动画结束后移除
        setTimeout(() => {
            heart.remove();
        }, 1500);
        
        // 添加飘心动画样式（如果还没有）
        if (!document.getElementById('floatHeartStyle')) {
            const style = document.createElement('style');
            style.id = 'floatHeartStyle';
            style.textContent = `
                @keyframes floatHeart {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -100px) scale(1.2);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -150px) scale(0.8);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 礼物特效
     */
    giftEffect(button) {
        // 创建礼物盒打开动画
        const giftBox = document.createElement('div');
        giftBox.style.cssText = `
            position: absolute;
            font-size: 40px;
            pointer-events: none;
            animation: giftOpen 1s ease-out forwards;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
        `;
        giftBox.textContent = '🎁';
        
        button.appendChild(giftBox);
        
        // 0.5秒后变成星星
        setTimeout(() => {
            giftBox.textContent = '✨';
        }, 500);
        
        // 动画结束后移除
        setTimeout(() => {
            giftBox.remove();
        }, 1000);
        
        // 添加礼物动画样式
        if (!document.getElementById('giftOpenStyle')) {
            const style = document.createElement('style');
            style.id = 'giftOpenStyle';
            style.textContent = `
                @keyframes giftOpen {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -80px) scale(1.5) rotate(180deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -120px) scale(2) rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 评论特效
     */
    commentEffect(button) {
        // 创建对话气泡动画
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            position: absolute;
            font-size: 36px;
            pointer-events: none;
            animation: bubbleFloat 1.2s ease-out forwards;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
        `;
        bubble.textContent = '💭';
        
        button.appendChild(bubble);
        
        // 动画结束后移除
        setTimeout(() => {
            bubble.remove();
        }, 1200);
        
        // 添加气泡动画样式
        if (!document.getElementById('bubbleFloatStyle')) {
            const style = document.createElement('style');
            style.id = 'bubbleFloatStyle';
            style.textContent = `
                @keyframes bubbleFloat {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -90px) scale(1.3);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -130px) scale(0.7);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 创建粒子效果
     */
    createParticles(type, button) {
        const particleContainer = button.querySelector('.particle-container');
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${type}`;
            
            // 随机角度和距离
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 40 + Math.random() * 20;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                --tx: ${tx}px;
                --ty: ${ty}px;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            `;
            
            particleContainer.appendChild(particle);
            
            // 动画结束后移除
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    /**
     * 播放音效
     */
    playSound(type) {
        // 这里可以添加音效播放逻辑
        // 例如：new Audio(`/sounds/${type}.mp3`).play();
        console.log(`播放${type}音效`);
    }

    /**
     * 格式化计数显示
     */
    formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    /**
     * 获取按钮数据
     */
    getButtonData(type) {
        return this.buttons[type];
    }

    /**
     * 设置按钮计数
     */
    setButtonCount(type, count) {
        if (this.buttons[type]) {
            this.buttons[type].count = count;
            const button = this.container.querySelector(`[data-type="${type}"]`);
            if (button) {
                const countSpan = button.querySelector('.count');
                countSpan.textContent = this.formatCount(count);
                if (count > 0) {
                    countSpan.classList.add('show');
                } else {
                    countSpan.classList.remove('show');
                }
            }
        }
    }

    /**
     * 销毁按钮
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.buttons = {
            like: { count: 0, active: false },
            gift: { count: 0, active: false },
            comment: { count: 0, active: false }
        };
    }
}

// 立即初始化（因为脚本是动态加载的，DOM已经准备好了）
const interactionButtons = new InteractionButtons();
interactionButtons.init();

// 将实例挂载到window，方便调试和外部访问
window.interactionButtons = interactionButtons;