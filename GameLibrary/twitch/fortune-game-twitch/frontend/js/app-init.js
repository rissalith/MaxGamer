// 应用初始化入口
(function() {
    'use strict';
    
    // 等待 DOM 加载完成
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🚀 应用开始初始化...');
        
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
        console.log('✅ 占卜配置面板已初始化');
        
        // 初始化游戏
        const game = new FortuneGame();
        await game.init();
        window.game = game;
        
        // 初始化礼物队列管理器（游戏初始化完成后）
        const giftQueueManager = new GiftQueueManager(
            game.interactionManager,
            game.cardManager,
            game.sceneManager.camera,
            topQueuePanel
        );
        window.giftQueueManager = giftQueueManager;
        liveConnectionManager.setGiftQueueManager(giftQueueManager);
        
        console.log('✅ 应用初始化完成！');
    });
})();