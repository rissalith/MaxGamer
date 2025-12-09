// 飞行弹幕管理器
class FlyingDanmakuManager {
    constructor() {
        this.danmakuQueue = [];
        this.lastDanmakuTime = 0;
        this.DANMAKU_INTERVAL = 500; // 每500ms最多显示一条弹幕
        this.opacity = 0.95; // 默认透明度
        this.speed = 8; // 默认飞行速度(秒)
        
        // 弹幕类型筛选配置 - 默认全部显示
        this.typeFilters = {
            chat: true,
            gift: true,
            like: true,
            member: true,
            follow: true
        };
        
        this.init();
    }

    init() {
        // 从localStorage加载配置
        this.loadFilterSettings();
        this.loadSpeedSetting();
        this.loadOpacitySetting();
    }
    
    loadOpacitySetting() {
        const saved = localStorage.getItem('flyingDanmakuOpacity');
        if (saved) {
            this.opacity = parseFloat(saved) || 0.95;
        }
    }
    
    saveOpacitySetting() {
        localStorage.setItem('flyingDanmakuOpacity', this.opacity.toString());
    }
    
    loadFilterSettings() {
        const saved = localStorage.getItem('flyingDanmakuFilters');
        if (saved) {
            try {
                this.typeFilters = JSON.parse(saved);
            } catch (e) {
                console.error('加载弹幕筛选配置失败:', e);
            }
        }
    }
    
    saveFilterSettings() {
        localStorage.setItem('flyingDanmakuFilters', JSON.stringify(this.typeFilters));
    }
    
    loadSpeedSetting() {
        const saved = localStorage.getItem('flyingDanmakuSpeed');
        if (saved) {
            this.speed = parseFloat(saved) || 8;
        }
    }
    
    saveSpeedSetting() {
        localStorage.setItem('flyingDanmakuSpeed', this.speed.toString());
    }

    /**
     * 设置弹幕类型是否启用
     */
    setTypeEnabled(type, enabled) {
        if (this.typeFilters.hasOwnProperty(type)) {
            this.typeFilters[type] = enabled;
            this.saveFilterSettings();
        }
    }
    
    /**
     * 设置飞行速度
     */
    setSpeed(speed) {
        this.speed = speed;
        this.saveSpeedSetting();
    }
    
    /**
     * 设置透明度
     */
    setOpacity(opacity) {
        this.opacity = opacity;
        this.saveOpacitySetting();
        
        // 更新所有现有飞行弹幕的透明度
        document.querySelectorAll('.flying-danmaku').forEach(danmaku => {
            danmaku.style.opacity = this.opacity;
        });
    }

    createFlyingDanmaku(data) {
        // 检查是否应该显示此类型的弹幕
        if (data.type === 'stats' || !this.typeFilters[data.type]) {
            // 统计信息或被筛选掉的类型不显示
            return;
        }
        
        const now = Date.now();
        if (now - this.lastDanmakuTime < this.DANMAKU_INTERVAL) {
            // 如果间隔太短，加入队列
            this.danmakuQueue.push(data);
            return;
        }
        
        this.lastDanmakuTime = now;
        
        const danmaku = document.createElement('div');
        danmaku.className = 'flying-danmaku';
        danmaku.style.opacity = this.opacity; // 应用当前透明度
        
        // 随机Y位置（避开顶部和底部的UI）
        const minY = 100;
        const maxY = window.innerHeight - 200;
        const randomY = minY + Math.random() * (maxY - minY);
        danmaku.style.top = randomY + 'px';
        
        let emoji = '👤';
        let content = '';
        let className = '';
        
        switch(data.type) {
            case 'gift':
                emoji = data.gift_emoji || '🎁';
                content = `送出 ${data.gift_name} x${data.gift_count}`;
                className = 'danmaku-gift';
                break;
            case 'chat':
                emoji = '💬';
                content = data.content;
                break;
            case 'member':
                emoji = '👋';
                content = '进入直播间';
                className = 'danmaku-member';
                break;
            case 'like':
                emoji = '❤️';
                content = `点赞 x${data.count}`;
                className = 'danmaku-like';
                break;
            case 'follow':
                emoji = '⭐';
                content = '关注了主播';
                className = 'danmaku-follow';
                break;
        }
        
        // 构建头像HTML - 优先使用真实头像
        const avatarHTML = data.user_avatar
            ? `<img src="${data.user_avatar}" class="danmaku-avatar-img" alt="头像">`
            : `<div class="danmaku-avatar">${emoji}</div>`;
        
        danmaku.innerHTML = `
            ${avatarHTML}
            <div class="danmaku-content">
                <div class="danmaku-user">${data.user_name}</div>
                <div class="danmaku-text ${className}">${content}</div>
            </div>
        `;
        
        // 设置动画时长
        danmaku.style.animationDuration = `${this.speed}s`;
        
        document.body.appendChild(danmaku);
        
        // 动画结束后移除
        setTimeout(() => {
            danmaku.remove();
            // 处理队列中的下一条
            if (this.danmakuQueue.length > 0) {
                const nextData = this.danmakuQueue.shift();
                this.createFlyingDanmaku(nextData);
            }
        }, this.speed * 1000);
    }
}

// 导出为全局变量
window.FlyingDanmakuManager = FlyingDanmakuManager;