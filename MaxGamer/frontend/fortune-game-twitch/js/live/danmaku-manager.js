// 弹幕管理器
class DanmakuManager {
    constructor() {
        this.danmakuTabs = document.querySelectorAll('.danmaku-tab');
        this.danmakuList = document.getElementById('danmaku-list');
        this.currentTab = 'all';
        this.danmakuData = [];
        this.MAX_DANMAKU = 100; // 最多保留100条弹幕
        this.renderedIds = new Set(); // 跟踪已渲染的消息ID
        
        this.init();
    }

    init() {
        // 切换标签页
        this.danmakuTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.danmakuTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.renderDanmaku(true); // 切换标签时强制重新渲染
            });
        });
    }

    // 添加弹幕到列表
    addDanmaku(data) {
        // 为消息生成唯一ID
        if (!data.id) {
            data.id = `${data.type}_${data.user_id}_${data.timestamp}`;
        }
        
        this.danmakuData.unshift(data); // 添加到开头
        if (this.danmakuData.length > this.MAX_DANMAKU) {
            this.danmakuData = this.danmakuData.slice(0, this.MAX_DANMAKU); // 保留最新的100条
        }
        this.renderDanmaku(false, data.id); // 传递新消息ID
    }

    // 渲染弹幕列表
    renderDanmaku(forceRerender = false, newMessageId = null) {
        const filteredData = this.currentTab === 'all'
            ? this.danmakuData
            : this.danmakuData.filter(d => d.type === this.currentTab);

        // 如果是强制重新渲染(如切换标签),清空已渲染ID集合
        if (forceRerender) {
            this.renderedIds.clear();
            this.danmakuList.innerHTML = filteredData.map(data => this.createDanmakuHTML(data, false)).join('');
            filteredData.forEach(data => this.renderedIds.add(data.id));
            return;
        }

        // 只添加新消息,不重新渲染整个列表
        if (newMessageId && !this.renderedIds.has(newMessageId)) {
            const newData = filteredData.find(d => d.id === newMessageId);
            if (newData) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.createDanmakuHTML(newData, true).trim();
                const newElement = tempDiv.firstElementChild;
                
                // 确保元素存在后再插入
                if (newElement) {
                    // 插入到列表开头
                    if (this.danmakuList.firstChild) {
                        this.danmakuList.insertBefore(newElement, this.danmakuList.firstChild);
                    } else {
                        this.danmakuList.appendChild(newElement);
                    }
                    
                    this.renderedIds.add(newMessageId);
                    
                    // 移除超出显示范围的旧元素
                    while (this.danmakuList.children.length > this.MAX_DANMAKU) {
                        this.danmakuList.removeChild(this.danmakuList.lastChild);
                    }
                }
            }
        }
    }

    // 创建弹幕HTML
    createDanmakuHTML(data, isNew = false) {
        const time = new Date(data.timestamp * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let emoji = '👤';
        let content = '';
        let contentClass = '';
        
        switch(data.type) {
            case 'chat':
                emoji = '💬';
                content = data.content;
                break;
            case 'gift':
                emoji = '🎁';
                content = `送出 ${data.gift_name} x${data.gift_count}`;
                contentClass = 'gift';
                break;
            case 'member':
                emoji = '👋';
                content = '进入直播间';
                contentClass = 'member';
                break;
            case 'like':
                emoji = '❤️';
                content = `点赞 x${data.count}`;
                contentClass = 'like';
                break;
            case 'follow':
                emoji = '⭐';
                content = '关注了主播';
                contentClass = 'follow';
                break;
            default:
                return '';
        }
        
        // 构建头像HTML - 优先使用真实头像
        const avatarHTML = data.user_avatar
            ? `<img src="${data.user_avatar}" class="danmaku-item-avatar-img" alt="头像">`
            : `<div class="danmaku-item-avatar">${emoji}</div>`;
        
        // 只对新消息添加动画类
        const animationClass = isNew ? ' slideInRight' : '';
        
        return `
            <div class="danmaku-item ${data.type}${animationClass}">
                <div class="danmaku-item-header">
                    ${avatarHTML}
                    <div class="danmaku-item-user">${data.user_name || '匿名用户'}</div>
                    <div class="danmaku-item-time">${time}</div>
                </div>
                <div class="danmaku-item-content ${contentClass}">${content}</div>
            </div>
        `;
    }

    // 更新统计数据
    updateStats(data) {
        if (data.type === 'stats') {
            document.getElementById('stat-viewers').textContent = data.current_viewers || 0;
            document.getElementById('stat-total').textContent = data.total_viewers || '0';
        }
    }

    // 处理直播间消息
    handleLiveMessage(data) {
        // console.log('收到直播间消息:', data);  // 已注释,减少日志
        
        // 添加到弹幕面板
        this.addDanmaku(data);
        
        // 更新统计数据
        this.updateStats(data);
    }
}

// 导出为全局变量
window.DanmakuManager = DanmakuManager;