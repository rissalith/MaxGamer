// 2D应用初始化入口
(function() {
    'use strict';
    
    // 等待 DOM 加载完成
    document.addEventListener('DOMContentLoaded', async function() {
        // 初始化头像处理器
        const avatarHandler = new AvatarHandler();
        window.avatarHandler = avatarHandler;
        
        // 初始化弹幕管理器
        const danmakuManager = new DanmakuManager();
        window.danmakuManager = danmakuManager;
        
        // 初始化飞行弹幕管理器
        const flyingDanmakuManager = new FlyingDanmakuManager();
        window.flyingDanmakuManager = flyingDanmakuManager;
        
        // 初始化顶部队列面板管理器
        const topQueuePanel = new TopQueuePanelManager();
        topQueuePanel.init();
        window.topQueuePanel = topQueuePanel;
        
        // 初始化直播连接管理器
        const liveConnectionManager = new LiveConnectionManager();
        window.liveConnectionManager = liveConnectionManager;
        
        // 初始化占卜配置面板管理器
        const fortuneConfigManager = initFortuneConfigManager();
        
        // 初始化魔女对话框处理器
        const witchDialogHandler = initWitchDialog();
        window.witchDialogHandler = witchDialogHandler;
        
        // 初始化2D游戏
        try {
            const game = new FortuneGame2D();
            await game.init();
            window.game = game;
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            alert('游戏初始化失败: ' + error.message + '\n请刷新页面重试');
            return;
        }
        
        // 初始化礼物队列管理器（游戏初始化完成后）
        const giftQueueManager = new GiftQueueManager(
            window.game.interactionManager,
            window.game.cardManager,
            null, // 2D版本不需要camera参数
            topQueuePanel
        );
        window.giftQueueManager = giftQueueManager;
        liveConnectionManager.setGiftQueueManager(giftQueueManager);
    });
})();