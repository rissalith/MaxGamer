/**
 * 粒子爆炸效果
 * 为品牌副标题添加点击爆炸和拖动交互
 */

class ParticleExplosion {
    constructor() {
        this.brandSection = null;
        this.title = null;
        this.subtitle = null;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.isDragging = false;
        this.dragStartTime = 0;
        this.longPressDuration = 500; // 长按阈值（毫秒）
        this.dragTimer = null;
        this.initialPosition = { x: 0, y: 0 };
        this.currentPosition = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
    }

    init() {
        this.brandSection = document.querySelector('.brand-section');
        this.title = document.querySelector('.brand-title');
        this.subtitle = document.querySelector('.brand-subtitle');
        
        if (!this.brandSection || !this.title || !this.subtitle) {
            console.warn('未找到品牌区域元素');
            return;
        }

        // 创建画布
        this.createCanvas();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('粒子爆炸效果已初始化 ✨');
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        // 为标题和副标题绑定点击爆炸事件
        [this.title, this.subtitle].forEach(element => {
            // 点击事件 - 触发爆炸效果
            element.addEventListener('click', (e) => {
                this.explode(e.clientX, e.clientY);
            });
        });
        
        // 拖拽功能已移至 brand-draggable.js
    }

    explode(x, y) {
        const particleCount = 80;
        const colors = ['#ffffff', '#667eea', '#764ba2', '#ffd700', '#ff69b4', '#00ffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 3 + Math.random() * 5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                radius: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                decay: 0.015 + Math.random() * 0.015
            });
        }
        
        // 开始动画
        if (!this.animationId) {
            this.animate();
        }
        
        // 标题和副标题短暂消失并震动
        this.title.style.animation = 'explodeDisappear 0.8s ease-in-out';
        this.subtitle.style.animation = 'explodeDisappear 0.8s ease-in-out';
        
        // 重置动画，但不恢复初始的fadeInLeft动画
        setTimeout(() => {
            this.title.style.animation = 'none';
            this.subtitle.style.animation = 'none';
        }, 800);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新和绘制粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 更新位置
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // 重力
            p.alpha -= p.decay;
            
            // 绘制粒子
            if (p.alpha > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            } else {
                this.particles.splice(i, 1);
            }
        }
        
        // 继续动画或停止
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.animationId = null;
        }
    }
}

// 添加动画到CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes explodeDisappear {
        0% {
            opacity: 1;
            transform: scale(1) translateX(0);
        }
        15% {
            transform: scale(1.1) translateX(-10px);
        }
        30% {
            transform: scale(0.95) translateX(10px);
        }
        40% {
            opacity: 0;
            transform: scale(0.8);
        }
        60% {
            opacity: 0;
            transform: scale(0.8);
        }
        80% {
            opacity: 0.5;
            transform: scale(1.05);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateX(0);
        }
    }
    
    .brand-title,
    .brand-subtitle {
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        position: relative;
        transition: transform 0.3s ease;
    }
    
    .brand-section {
        cursor: pointer;
    }
`;
document.head.appendChild(style);

// 立即初始化（因为脚本是动态加载的，DOM已经准备好了）
const explosion = new ParticleExplosion();
explosion.init();

// 将实例挂载到window，方便调试和外部访问
window.particleExplosion = explosion;