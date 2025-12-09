// 队列显示管理器 - 在卡牌上方显示排队观众
class QueueDisplayManager {
    constructor() {
        this.queueDisplays = {};
        this.init();
    }

    init() {
        // 为每个运势类型创建队列显示元素
        const fortuneTypes = ['love', 'daily', 'career', 'health', 'wealth'];
        fortuneTypes.forEach(type => {
            this.createQueueDisplay(type);
        });
    }

    createQueueDisplay(fortuneType) {
        const display = document.createElement('div');
        display.id = `queue-display-${fortuneType}`;
        display.className = 'queue-display hidden';
        display.innerHTML = `
            <div class="queue-header">
                <span class="queue-icon">⏳</span>
                <span class="queue-count">0</span>
            </div>
            <div class="queue-list"></div>
        `;
        document.body.appendChild(display);
        this.queueDisplays[fortuneType] = display;
    }

    /**
     * 更新队列显示
     * @param {string} fortuneType - 运势类型
     * @param {Array} queue - 队列数据
     * @param {Object} cardPosition - 卡牌在屏幕上的位置
     */
    updateQueueDisplay(fortuneType, queue, cardPosition) {
        const display = this.queueDisplays[fortuneType];
        if (!display) return;

        if (queue.length === 0) {
            display.classList.add('hidden');
            return;
        }

        // 显示队列
        display.classList.remove('hidden');

        // 更新队列数量
        const countElement = display.querySelector('.queue-count');
        countElement.textContent = queue.length;

        // 更新队列列表（最多显示前3个）
        const listElement = display.querySelector('.queue-list');
        const displayQueue = queue.slice(0, 3);
        
        listElement.innerHTML = displayQueue.map((user, index) => {
            const label = index === 0 ? '正在翻牌' : `第${index}位`;
            return `
                <div class="queue-item ${index === 0 ? 'current' : ''}">
                    ${user.avatarUrl ? 
                        `<img src="${user.avatarUrl}" class="queue-avatar" alt="${user.userName}">` :
                        `<div class="queue-avatar-placeholder">👤</div>`
                    }
                    <div class="queue-user-info">
                        <div class="queue-user-name">${user.userName}</div>
                        <div class="queue-label">${label}</div>
                    </div>
                </div>
            `;
        }).join('');

        // 如果队列超过3个，显示省略号
        if (queue.length > 3) {
            listElement.innerHTML += `
                <div class="queue-more">
                    还有 ${queue.length - 3} 人排队中...
                </div>
            `;
        }

        // 更新位置（基于卡牌的屏幕坐标）
        if (cardPosition) {
            display.style.left = `${cardPosition.x}px`;
            display.style.top = `${cardPosition.y - 180}px`; // 卡牌上方
        }
    }

    /**
     * 隐藏指定队列显示
     * @param {string} fortuneType - 运势类型
     */
    hideQueueDisplay(fortuneType) {
        const display = this.queueDisplays[fortuneType];
        if (display) {
            display.classList.add('hidden');
        }
    }

    /**
     * 隐藏所有队列显示
     */
    hideAllQueueDisplays() {
        Object.values(this.queueDisplays).forEach(display => {
            display.classList.add('hidden');
        });
    }

    /**
     * 获取卡牌在屏幕上的位置
     * @param {Object} card - Three.js卡牌对象
     * @param {Object} camera - Three.js相机
     * @returns {Object} {x, y} 屏幕坐标
     */
    getCardScreenPosition(card, camera) {
        const vector = new THREE.Vector3();
        card.getWorldPosition(vector);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

        return { x, y };
    }
}

// 导出为全局变量
window.QueueDisplayManager = QueueDisplayManager;