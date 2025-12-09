/**
 * Miko Fortune - Twitch Edition
 * 应用初始化入口
 */

console.log('[Twitch Fortune] 初始化开始...');

// 获取URL参数中的ticket（游戏授权token）
const urlParams = new URLSearchParams(window.location.search);
const ticket = urlParams.get('ticket');

if (!ticket) {
    alert('Missing game authorization token. Please launch the game from MaxGamer.');
    console.error('[Twitch Fortune] 缺少授权ticket');
}

// 全局配置
window.GAME_CONFIG = {
    platform: 'twitch',
    apiBaseUrl: 'http://localhost:3000',
    ticket: ticket
};

console.log('[Twitch Fortune] 游戏配置:', window.GAME_CONFIG);

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[Twitch Fortune] DOM加载完成，开始初始化游戏');

        // 初始化 Twitch 连接管理器
        const twitchConnectionManager = new TwitchLiveConnectionManager({
            apiBaseUrl: window.GAME_CONFIG.apiBaseUrl,
            token: ticket,
            connectBtn: document.getElementById('connect-live-btn'),
            disconnectBtn: document.getElementById('disconnect-live-btn'),
            statusElement: document.getElementById('live-status'),
            channelDisplay: document.getElementById('live-room-input'),
            onChat: handleTwitchChat,
            onSubscription: handleTwitchSubscription,
            onRaid: handleTwitchRaid
        });

        // 初始化连接管理器
        const initialized = await twitchConnectionManager.init();

        if (!initialized) {
            console.warn('[Twitch Fortune] Twitch连接初始化失败 - 用户可能未绑定账号');
        }

        // 保存为全局变量
        window.twitchConnectionManager = twitchConnectionManager;
        window.liveConnectionManager = twitchConnectionManager; // 兼容旧代码

        // 初始化游戏主逻辑（复用抖音版的 2D 游戏引擎）
        if (typeof window.initGame === 'function') {
            await window.initGame();
            console.log('[Twitch Fortune] 游戏初始化完成');
        } else {
            console.error('[Twitch Fortune] 未找到 initGame 函数');
        }

        // 初始化巫女对话框
        if (typeof window.initWitchDialog === 'function') {
            window.initWitchDialog();
            console.log('[Twitch Fortune] 巫女对话框初始化完成');
        }

        // 设置礼物队列管理器
        if (window.giftQueueManager && twitchConnectionManager) {
            twitchConnectionManager.setGiftQueueManager(window.giftQueueManager);
        }

        console.log('[Twitch Fortune] 所有模块初始化完成 ✅');

    } catch (error) {
        console.error('[Twitch Fortune] 初始化失败:', error);
        alert('Failed to initialize game: ' + error.message);
    }
});

/**
 * 处理 Twitch 聊天消息
 */
function handleTwitchChat(data) {
    console.log('[Twitch Chat]', data.username + ':', data.message);

    // 如果消息包含关键词（!fortune 等），自动触发占卜
    const keywords = ['!fortune', '!占卜', 'fortune', 'draw'];
    const lowerMessage = data.message.toLowerCase();

    if (keywords.some(kw => lowerMessage.includes(kw.toLowerCase()))) {
        console.log('[Twitch Fortune] 检测到占卜关键词，触发占卜');

        if (window.giftQueueManager) {
            window.giftQueueManager.addToQueue({
                type: 'chat_trigger',
                user_name: data.username,
                message: data.message,
                fortune_type: 'daily',
                avatar_url: data.avatar_url || ''
            });
        }
    }
}

/**
 * 处理 Twitch 订阅事件
 */
function handleTwitchSubscription(data) {
    console.log('[Twitch Subscription]', data);

    if (window.giftQueueManager) {
        const fortuneType = mapSubscriptionToFortuneType(data.sub_type);

        window.giftQueueManager.addToQueue({
            type: 'subscription',
            user_name: data.username,
            sub_type: data.sub_type,
            months: data.months,
            fortune_type: fortuneType,
            is_gift: data.sub_type === 'subgift',
            recipient: data.recipient
        });
    }
}

/**
 * 处理 Twitch Raid 事件
 */
function handleTwitchRaid(data) {
    console.log('[Twitch Raid]', data.username, 'with', data.viewer_count, 'viewers');

    // Raid 触发特殊奖励 - 抽取多个占卜
    if (window.giftQueueManager) {
        const raidCount = Math.min(Math.ceil(data.viewer_count / 10), 5); // 最多触发5次

        for (let i = 0; i < raidCount; i++) {
            window.giftQueueManager.addToQueue({
                type: 'raid',
                user_name: data.username,
                viewer_count: data.viewer_count,
                fortune_type: 'daily',
                is_special: true
            });
        }
    }
}

/**
 * 将订阅类型映射到运势类型
 */
function mapSubscriptionToFortuneType(subType) {
    const mapping = {
        'sub': 'daily',           // 新订阅 -> 日常运势
        'resub': 'love',          // 续订 -> 爱情运势
        'subgift': 'wealth',      // 礼物订阅 -> 财运
        'submysterygift': 'career' // 神秘礼物订阅 -> 事业运势
    };

    return mapping[subType] || 'daily';
}

// 导出供调试使用
window.TwitchFortune = {
    handleTwitchChat,
    handleTwitchSubscription,
    handleTwitchRaid,
    mapSubscriptionToFortuneType
};

console.log('[Twitch Fortune] 初始化脚本加载完成');
