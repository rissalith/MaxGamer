// 2D场景管理器 - 使用Canvas替代Three.js
class SceneManager2D {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetZoom: 1,
            minZoom: 0.5,
            maxZoom: 2.0,
            zoomSpeed: 0.1
        };
        this.mouse = { x: 0, y: 0 };
        this.objects = []; // 存储所有2D对象
        this.animationFrame = null;
        
        // 背景效果
        this.stars = [];
        this.groundY = 0;
    }

    init() {
        // 创建Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'game-canvas-2d';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.canvas.style.touchAction = 'none';
        
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false,
            willReadFrequently: false 
        });
        
        this.container.appendChild(this.canvas);
        
        // 设置Canvas尺寸
        this.onWindowResize();
        
        // 初始化背景元素
        this.initBackground();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 监听鼠标/触摸事件用于缩放
        this.setupZoomControls();
    }

    initBackground() {
        // 创建星空背景
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height * 0.7, // 只在上半部分
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
        
        // 地面Y坐标（屏幕底部20%）
        this.groundY = this.height * 0.8;
    }

    setupZoomControls() {
        // 鼠标滚轮缩放
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.camera.targetZoom = Math.max(
                this.camera.minZoom,
                Math.min(this.camera.maxZoom, this.camera.targetZoom + delta)
            );
        }, { passive: false });
        
        // 触摸缩放
        let lastTouchDistance = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const delta = (distance - lastTouchDistance) * 0.01;
                    this.camera.targetZoom = Math.max(
                        this.camera.minZoom,
                        Math.min(this.camera.maxZoom, this.camera.targetZoom + delta)
                    );
                }
                lastTouchDistance = distance;
            }
        }, { passive: false });
    }

    onWindowResize() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        // 设置Canvas实际像素尺寸（考虑设备像素比）
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        
        // 缩放上下文以匹配设备像素比
        this.ctx.scale(dpr, dpr);
        
        // 更新地面位置
        this.groundY = this.height * 0.8;
        
        // 重新初始化星星位置
        if (this.stars.length > 0) {
            this.stars.forEach(star => {
                if (star.x > this.width) star.x = Math.random() * this.width;
                if (star.y > this.height * 0.7) star.y = Math.random() * this.height * 0.7;
            });
        }
    }

    // 世界坐标转屏幕坐标
    worldToScreen(x, y) {
        return {
            x: (x - this.camera.x) * this.camera.zoom + this.width / 2,
            y: (y - this.camera.y) * this.camera.zoom + this.height / 2
        };
    }

    // 屏幕坐标转世界坐标
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.width / 2) / this.camera.zoom + this.camera.x,
            y: (screenY - this.height / 2) / this.camera.zoom + this.camera.y
        };
    }

    // 检测点击/触摸的对象
    checkIntersection(event, objects) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0]?.clientX);
        const clientY = event.clientY || (event.touches && event.touches[0]?.clientY);
        
        if (clientX === undefined || clientY === undefined) return null;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // 转换为世界坐标
        const worldPos = this.screenToWorld(x, y);
        
        // 检测碰撞（从后往前检测，后绘制的在上层）
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (obj.containsPoint && obj.containsPoint(worldPos.x, worldPos.y)) {
                return { object: obj, point: worldPos };
            }
        }
        
        return null;
    }

    // 渲染背景
    renderBackground(time) {
        // 渐变背景（深色到浅色）
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.7, '#1a1a2e');
        gradient.addColorStop(1, '#2a2a4a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制星星
        this.stars.forEach((star, index) => {
            const twinkle = Math.sin(time * star.twinkleSpeed + index) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 绘制地面
        this.ctx.fillStyle = '#2a2a4a';
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.width / 2,
            this.groundY,
            this.width * 0.4,
            this.width * 0.1,
            0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // 地面发光圆环
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.7)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.ellipse(
            this.width / 2,
            this.groundY,
            this.width * 0.35,
            this.width * 0.09,
            0, 0, Math.PI * 2
        );
        this.ctx.stroke();
    }

    // 主渲染循环
    render(time = 0) {
        // 平滑缩放
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 渲染背景
        this.renderBackground(time * 0.001);
        
        // 保存上下文状态
        this.ctx.save();
        
        // 应用相机变换
        this.ctx.translate(this.width / 2, this.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // 渲染所有对象（按z-index排序）
        const sortedObjects = [...this.objects].sort((a, b) => 
            (a.zIndex || 0) - (b.zIndex || 0)
        );
        
        sortedObjects.forEach(obj => {
            if (obj.render && obj.visible !== false) {
                obj.render(this.ctx, time * 0.001);
            }
        });
        
        // 恢复上下文状态
        this.ctx.restore();
    }

    // 添加对象到场景
    addObject(obj) {
        if (!this.objects.includes(obj)) {
            this.objects.push(obj);
        }
    }

    // 从场景移除对象
    removeObject(obj) {
        const index = this.objects.indexOf(obj);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    // 镜头特写动画（聚焦到指定位置）
    async zoomToPosition(x, y, duration = 2000) {
        const startX = this.camera.x;
        const startY = this.camera.y;
        const startZoom = this.camera.zoom;
        const targetZoom = 1.5;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = this.easeInOutCubic(progress);

                // 插值相机位置和缩放
                this.camera.x = startX + (x - startX) * easeProgress;
                this.camera.y = startY + (y - startY) * easeProgress;
                this.camera.zoom = startZoom + (targetZoom - startZoom) * easeProgress;
                this.camera.targetZoom = this.camera.zoom;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 停留3秒后恢复
                    setTimeout(() => {
                        this.resetCamera();
                        resolve();
                    }, 3000);
                }
            };

            animate();
        });
    }

    // 恢复镜头到原始位置
    resetCamera(duration = 1500) {
        const startX = this.camera.x;
        const startY = this.camera.y;
        const startZoom = this.camera.zoom;
        const targetX = 0;
        const targetY = 0;
        const targetZoom = 1;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeInOutCubic(progress);

            this.camera.x = startX + (targetX - startX) * easeProgress;
            this.camera.y = startY + (targetY - startY) * easeProgress;
            this.camera.zoom = startZoom + (targetZoom - startZoom) * easeProgress;
            this.camera.targetZoom = this.camera.zoom;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // 缓动函数
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // 清理资源
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.objects = [];
    }
}