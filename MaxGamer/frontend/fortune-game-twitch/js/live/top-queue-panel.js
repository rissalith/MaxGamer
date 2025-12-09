// 顶部队列面板管理器 - 半透明科技感UI
class TopQueuePanelManager {
    constructor() {
        this.panel = null;
        this.fortuneTypes = {
            'daily': { name: '日常运势', emoji: '❤️', color: '#f59e0b' },
            'love': { name: '爱情运势', emoji: '💐', color: '#ec4899' },
            'wealth': { name: '财富运势', emoji: '🍭', color: '#8b5cf6' },
            'career': { name: '事业运势', emoji: '🕶️', color: '#3b82f6' },
            'health': { name: '健康运势', emoji: '🍺', color: '#10b981' }
        };
        this.queues = {
            'daily': [],
            'love': [],
            'wealth': [],
            'career': [],
            'health': []
        };
        this.init();
    }

    init() {
        this.createPanel();
        this.updatePanel();
    }

    createPanel() {
        // 创建主面板
        this.panel = document.createElement('div');
        this.panel.className = 'top-queue-panel';
        this.panel.innerHTML = `
            <button class="top-queue-close-btn" id="close-top-queue" title="关闭">×</button>
            <div class="top-queue-container" id="top-queue-container"></div>
        `;
        
        document.body.appendChild(this.panel);
        
        // 绑定关闭按钮事件
        const closeBtn = document.getElementById('close-top-queue');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
        
        console.log('✅ 顶部队列面板已创建');
    }

    /**
     * 更新队列数据
     * @param {string} fortuneType - 运势类型
     * @param {Array} queue - 队列数据
     */
    updateQueue(fortuneType, queue) {
        if (!this.fortuneTypes[fortuneType]) {
            console.warn(`⚠️ 未知的运势类型: ${fortuneType}`);
            return;
        }

        this.queues[fortuneType] = queue || [];
        this.updatePanel();
    }

    /**
     * 更新整个面板显示
     */
    updatePanel() {
        const container = document.getElementById('top-queue-container');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 为每个运势类型创建卡片
        Object.keys(this.fortuneTypes).forEach(type => {
            const typeInfo = this.fortuneTypes[type];
            const queue = this.queues[type] || [];

            const card = this.createQueueCard(type, typeInfo, queue);
            container.appendChild(card);
        });
    }

    /**
     * 创建单个队列卡片
     * @param {string} type - 运势类型
     * @param {Object} typeInfo - 类型信息
     * @param {Array} queue - 队列数据
     * @returns {HTMLElement}
     */
    createQueueCard(type, typeInfo, queue) {
        const card = document.createElement('div');
        card.className = `top-queue-card ${queue.length === 0 ? 'empty' : ''}`;
        card.style.borderTopColor = typeInfo.color;

        // 卡片头部
        const header = document.createElement('div');
        header.className = 'top-queue-card-header';
        
        // 获取上上签统计数量
        const greatFortuneCount = this.getGreatFortuneCount(type);
        
        header.innerHTML = `
            <span class="top-queue-card-emoji">${typeInfo.emoji}</span>
            <span class="top-queue-card-type">${typeInfo.name}</span>
            <span class="top-queue-card-count">${queue.length}</span>
            <span class="top-queue-card-great-fortune" title="上上签统计">🌟 ${greatFortuneCount}</span>
        `;
        card.appendChild(header);

        // 用户列表
        const usersContainer = document.createElement('div');
        usersContainer.className = 'top-queue-users';

        if (queue.length === 0) {
            // 空队列提示 - 保持运势类型可见
            const empty = document.createElement('div');
            empty.className = 'top-queue-empty';
            empty.innerHTML = `
                <div class="top-queue-empty-text">暂无排队</div>
            `;
            usersContainer.appendChild(empty);
        } else {
            // 显示前3个用户
            const displayQueue = queue.slice(0, 3);
            displayQueue.forEach((user, index) => {
                const userEl = this.createUserElement(user, index === 0);
                usersContainer.appendChild(userEl);
            });

            // 如果还有更多用户
            if (queue.length > 3) {
                const more = document.createElement('div');
                more.className = 'top-queue-more';
                more.textContent = `还有 ${queue.length - 3} 人排队中...`;
                usersContainer.appendChild(more);
            }
        }

        card.appendChild(usersContainer);
        return card;
    }

    /**
     * 创建用户元素
     * @param {Object} user - 用户数据
     * @param {boolean} isCurrent - 是否是当前正在翻牌的用户
     * @returns {HTMLElement}
     */
    createUserElement(user, isCurrent) {
        const userEl = document.createElement('div');
        userEl.className = `top-queue-user ${isCurrent ? 'current' : ''}`;

        // 头像
        let avatarHTML;
        if (user.avatarUrl) {
            avatarHTML = `<img src="${user.avatarUrl}" class="top-queue-user-avatar" alt="${user.userName}">`;
        } else {
            avatarHTML = `<div class="top-queue-user-placeholder">👤</div>`;
        }

        // 用户信息
        const status = isCurrent ? '正在翻牌' : '排队中';
        userEl.innerHTML = `
            ${avatarHTML}
            <div class="top-queue-user-info">
                <div class="top-queue-user-name">${user.userName}</div>
                <div class="top-queue-user-status">${status}</div>
            </div>
        `;

        return userEl;
    }

    /**
     * 显示面板
     */
    show() {
        if (this.panel) {
            this.panel.classList.remove('hidden');
        }
    }

    /**
     * 隐藏面板
     */
    hide() {
        if (this.panel) {
            this.panel.classList.add('hidden');
        }
    }

    /**
     * 清空所有队列
     */
    clearAllQueues() {
        Object.keys(this.queues).forEach(type => {
            this.queues[type] = [];
        });
        this.updatePanel();
    }

    /**
     * 清空指定队列
     * @param {string} fortuneType - 运势类型
     */
    clearQueue(fortuneType) {
        if (this.queues[fortuneType]) {
            this.queues[fortuneType] = [];
            this.updatePanel();
        }
    }

    /**
     * 获取队列长度
     * @param {string} fortuneType - 运势类型
     * @returns {number}
     */
    getQueueLength(fortuneType) {
        return this.queues[fortuneType] ? this.queues[fortuneType].length : 0;
    }

    /**
     * 获取总队列长度
     * @returns {number}
     */
    getTotalQueueLength() {
        return Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);
    }

    /**
     * 获取上上签统计数量
     * @param {string} fortuneType - 运势类型
     * @returns {number}
     */
    getGreatFortuneCount(fortuneType) {
        const key = `greatFortune_${fortuneType}`;
        return parseInt(localStorage.getItem(key) || '0');
    }
}

// 导出为全局变量
window.TopQueuePanelManager = TopQueuePanelManager;