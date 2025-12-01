/**
 * 图片轮播器
 * 用于轮播登录页背景的动画webp图片
 * 等待每个动画播放完成后自动切换到下一个
 */

class ImageCarousel {
    constructor() {
        // 两张动画图片配置
        this.images = [
            { name: '待机-常态', path: '/images/待机-常态.webp' },
            { name: '待机-深呼吸', path: '/images/待机-深呼吸.webp' }
        ];
        
        this.currentIndex = 0;
        this.imageElements = [];
        this.container = null;
        this.animationCheckInterval = null;
    }

    /**
     * 初始化轮播器
     */
    init() {
        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'carousel-container';
        this.container.style.cssText = `
            position: absolute;
            top: -20%;
            left: 20%;
            width: 20%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
        `;
        
        // 插入到body的第一个子元素
        document.body.insertBefore(this.container, document.body.firstChild);
        
        // 预加载所有图片
        this.preloadImages();
    }

    /**
     * 预加载所有图片
     */
    preloadImages() {
        let loadedCount = 0;
        
        this.images.forEach((imageData, index) => {
            const img = document.createElement('img');
            img.src = imageData.path;
            img.alt = imageData.name;
            img.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: left center;
                opacity: 0;
                will-change: opacity;
                transform: translate3d(0, 0, 0);
                backface-visibility: hidden;
                transition: opacity 1s ease-in-out;
                pointer-events: none;
            `;
            
            img.onload = () => {
                loadedCount++;
                
                // 所有图片加载完成后开始轮播
                if (loadedCount === this.images.length) {
                    this.onAllImagesLoaded();
                }
            };
            
            img.onerror = () => {
                loadedCount++;
                
                // 即使有图片加载失败，也继续
                if (loadedCount === this.images.length) {
                    this.onAllImagesLoaded();
                }
            };
            
            this.container.appendChild(img);
            this.imageElements.push(img);
        });
    }

    /**
     * 所有图片加载完成后的回调
     */
    onAllImagesLoaded() {
        // 等待视频加载完成后再显示动画
        this.waitForVideo();
    }

    /**
     * 等待视频加载完成
     */
    waitForVideo() {
        const video = document.getElementById('loginVideo');
        const videoContainer = document.querySelector('.video-container');
        
        if (!video) {
            this.startCarousel();
            return;
        }

        // 检查视频容器是否已经渲染完成
        const checkVideoReady = () => {
            const isVideoRendered = videoContainer &&
                                   window.getComputedStyle(videoContainer).display !== 'none' &&
                                   videoContainer.offsetHeight > 0;
            const isVideoLoaded = video.readyState >= 3; // HAVE_FUTURE_DATA or better
            
            return isVideoRendered && isVideoLoaded;
        };

        // 如果视频已经准备好，直接开始
        if (checkVideoReady()) {
            // 额外延迟确保视频容器完全渲染
            setTimeout(() => {
                this.startCarousel();
            }, 300);
            return;
        }

        // 使用多重监听确保视频完全加载
        let started = false;
        const startOnce = () => {
            if (started) return;
            if (checkVideoReady()) {
                started = true;
                // 延迟确保视频容器完全渲染和稳定
                setTimeout(() => {
                    this.startCarousel();
                }, 300);
            }
        };

        // 监听多个事件
        video.addEventListener('canplay', startOnce, { once: true });
        video.addEventListener('canplaythrough', startOnce, { once: true });
        video.addEventListener('loadeddata', startOnce, { once: true });

        // 使用 requestAnimationFrame 轮询检查
        let checkCount = 0;
        const maxChecks = 60; // 最多检查60次（约1秒）
        const checkLoop = () => {
            checkCount++;
            if (started) return;
            
            if (checkVideoReady()) {
                startOnce();
            } else if (checkCount < maxChecks) {
                requestAnimationFrame(checkLoop);
            } else {
                // 超时保护：即使视频未完全加载，也开始动画
                started = true;
                this.startCarousel();
            }
        };
        
        requestAnimationFrame(checkLoop);
    }

    /**
     * 开始轮播动画
     */
    startCarousel() {
        // 随机选择一张图片开始
        this.currentIndex = Math.floor(Math.random() * this.images.length);
        
        // 显示第一张图片
        this.showImage(this.currentIndex);
        
        // 开始监听动画完成
        this.startAnimationMonitoring();
    }

    /**
     * 显示指定索引的图片（使用 requestAnimationFrame 确保流畅切换）
     */
    showImage(index) {
        const nextImg = this.imageElements[index];
        
        // 使用交叉淡入淡出效果（crossfade）
        // 先淡出当前图片，同时淡入下一张图片
        requestAnimationFrame(() => {
            // 隐藏所有其他图片（淡出）
            this.imageElements.forEach((img, i) => {
                if (i !== index) {
                    img.style.opacity = '0';
                }
            });
            
            // 显示目标图片（淡入）
            nextImg.style.opacity = '1';
        });
    }

    /**
     * 开始监听动画完成
     * 对于animated webp，我们使用固定时长（约5秒）作为一个循环
     */
    startAnimationMonitoring() {
        // animated webp 通常会自动循环播放
        // 我们设置一个合理的时长后切换到下一个动画
        const animationDuration = 5000; // 5秒，可以根据实际动画时长调整
        
        setInterval(() => {
            this.next();
        }, animationDuration);
    }

    /**
     * 切换到下一张图片
     */
    next() {
        const prevIndex = this.currentIndex;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.showImage(this.currentIndex);
    }

    /**
     * 销毁轮播器
     */
    destroy() {
        if (this.animationCheckInterval) {
            clearInterval(this.animationCheckInterval);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.imageElements = [];
    }
}

// 立即初始化（因为脚本是动态加载的，DOM已经准备好了）
const carousel = new ImageCarousel();
carousel.init();

// 将轮播器实例挂载到window，方便调试
window.imageCarousel = carousel;