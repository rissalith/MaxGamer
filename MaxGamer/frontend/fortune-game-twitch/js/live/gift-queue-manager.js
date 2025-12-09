// 礼物队列管理器 - 管理每个卡牌类型的翻牌队列
class GiftQueueManager {
    constructor(interactionManager, cardManager, camera, topQueuePanel) {
        this.interactionManager = interactionManager;
        this.cardManager = cardManager;
        this.camera = camera;
        this.topQueuePanel = topQueuePanel;
        // 每个运势类型的队列
        this.queues = {
            'love': [],
            'daily': [],
            'career': [],
            'health': [],
            'wealth': []
        };
        // 正在处理的运势类型
        this.processing = new Set();
        // 处理间隔（毫秒）
        this.processInterval = 6000; // 6秒，给卡片翻转和显示留出时间
        
        // 初始化队列显示管理器
        this.queueDisplay = new QueueDisplayManager();
        
        // 启动定期更新队列显示位置
        this.startPositionUpdater();
    }
    
    /**
     * 启动定期更新队列显示位置
     */
    startPositionUpdater() {
        // 每100ms更新一次队列显示位置
        setInterval(() => {
            this.updateAllQueuePositions();
        }, 100);
    }
    
    /**
     * 更新所有队列的显示位置
     */
    updateAllQueuePositions() {
        for (const fortuneType in this.queues) {
            if (this.queues[fortuneType].length > 0 || this.processing.has(fortuneType)) {
                this.updateQueueDisplay(fortuneType);
            }
        }
    }

    /**
     * 添加礼物到队列
     * @param {Object} giftData - 礼物数据
     * @param {string} giftData.fortune_type - 运势类型
     * @param {string} giftData.user_name - 用户名
     * @param {string} giftData.user_id - 用户ID
     * @param {string} giftData.avatar_url - 头像URL
     * @param {string} giftData.gift_name - 礼物名称
     * @param {number} giftData.gift_count - 礼物数量
     */
    addToQueue(giftData) {
        const fortuneType = giftData.fortune_type;
        
        if (!fortuneType || !this.queues[fortuneType]) {
            return;
        }

        // 添加到对应队列
        this.queues[fortuneType].push({
            userName: giftData.user_name,
            userId: giftData.user_id,
            avatarUrl: giftData.user_avatar,
            giftName: giftData.gift_name,
            giftCount: giftData.gift_count,
            timestamp: Date.now()
        });

        // 更新队列显示
        this.updateQueueDisplay(fortuneType);
        
        // 更新顶部队列面板
        if (this.topQueuePanel) {
            this.topQueuePanel.updateQueue(fortuneType, this.queues[fortuneType]);
        }

        // 开始处理该队列
        this.processQueue(fortuneType);
    }

    /**
     * 处理指定运势类型的队列
     * @param {string} fortuneType - 运势类型
     */
    async processQueue(fortuneType) {
        // 如果该类型正在处理中，不重复处理
        if (this.processing.has(fortuneType)) {
            return;
        }

        // 如果队列为空，不处理
        if (this.queues[fortuneType].length === 0) {
            return;
        }

        // 标记为处理中
        this.processing.add(fortuneType);

        try {
            // 取出队列第一个
            const userData = this.queues[fortuneType].shift();

            // 获取对应的礼物类型配置
            const giftType = GIFT_TO_FORTUNE[fortuneType];
            
            if (!giftType) {
                return;
            }

            // 调用翻牌功能，传入用户数据
            await this.interactionManager.handleLiveGiftDrawFortune(giftType, userData);

            // 等待一段时间后处理下一个
            setTimeout(() => {
                this.processing.delete(fortuneType);
                // 更新队列显示
                this.updateQueueDisplay(fortuneType);
                // 更新顶部队列面板
                if (this.topQueuePanel) {
                    this.topQueuePanel.updateQueue(fortuneType, this.queues[fortuneType]);
                }
                // 如果队列还有内容，继续处理
                if (this.queues[fortuneType].length > 0) {
                    this.processQueue(fortuneType);
                }
            }, this.processInterval);

        } catch (error) {
            this.processing.delete(fortuneType);
        }
    }

    /**
     * 获取队列状态
     */
    getQueueStatus() {
        const status = {};
        for (const [type, queue] of Object.entries(this.queues)) {
            status[type] = {
                length: queue.length,
                processing: this.processing.has(type)
            };
        }
        return status;
    }

    /**
     * 清空所有队列
     */
    clearAllQueues() {
        for (const type in this.queues) {
            this.queues[type] = [];
            this.queueDisplay.hideQueue(type);
            if (this.topQueuePanel) {
                this.topQueuePanel.updateQueue(type, []);
            }
        }
        this.processing.clear();
    }

    /**
     * 清空指定队列
     * @param {string} fortuneType - 运势类型
     */
    clearQueue(fortuneType) {
        if (this.queues[fortuneType]) {
            this.queues[fortuneType] = [];
            this.processing.delete(fortuneType);
            this.queueDisplay.hideQueue(fortuneType);
            if (this.topQueuePanel) {
                this.topQueuePanel.updateQueue(fortuneType, []);
            }
        }
    }

    /**
     * 更新队列显示
     * @param {string} fortuneType - 运势类型
     */
    updateQueueDisplay(fortuneType) {
        const queue = this.queues[fortuneType];
        const isProcessing = this.processing.has(fortuneType);
        
        if (queue.length === 0 && !isProcessing) {
            // 队列为空且没有正在处理，隐藏显示
            this.queueDisplay.hideQueueDisplay(fortuneType);
        } else {
            // 获取对应卡牌的屏幕位置
            let cardPosition = null;
            if (this.cardManager && this.camera) {
                // 根据运势类型获取对应的卡牌索引
                const cardIndexMap = {
                    'love': 0,
                    'daily': 1,
                    'career': 2,
                    'health': 3,
                    'wealth': 4
                };
                const cardIndex = cardIndexMap[fortuneType];
                const card = this.cardManager.cards[cardIndex];
                
                if (card) {
                    cardPosition = this.queueDisplay.getCardScreenPosition(card, this.camera);
                }
            }
            
            // 更新队列显示
            this.queueDisplay.updateQueueDisplay(fortuneType, queue, cardPosition);
        }
    }
}

// 导出为全局变量
window.GiftQueueManager = GiftQueueManager;