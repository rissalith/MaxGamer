// 游戏主类
class FortuneGame {
    constructor() {
        this.sceneManager = null;
        this.cardManager = null;
        this.witchLiliManager = null;
        this.witchLiliAgent = null; // 新增智能体
        this.particleManager = null;
        this.interactionManager = null;
        this.useAgent = true; // 是否使用智能体模式
    }

    async init() {
        try {
            this.sceneManager = new SceneManager();
            this.sceneManager.init();
            this.particleManager = new ParticleManager(this.sceneManager.scene);
            this.cardManager = new CardManager(this.sceneManager.scene, this.particleManager);
            this.cardManager.init();
            
            // 魔女Lili - 使用智能体版本或传统版本
            if (this.useAgent && typeof WitchLiliAgent !== 'undefined') {
                console.log('🧙‍♀️ 使用智能体模式初始化Lili');
                this.witchLiliAgent = new WitchLiliAgent(this.sceneManager.scene);
                await this.witchLiliAgent.init();
                this.witchLiliManager = this.witchLiliAgent; // 兼容接口
            } else {
                console.log('🧙‍♀️ 使用传统模式初始化Lili');
                this.witchLiliManager = new WitchLiliManager(this.sceneManager.scene);
                this.witchLiliManager.init();
            }
            
            this.interactionManager = new InteractionManager(
                this.sceneManager,
                this.cardManager,
                null, // mikoManager 已删除
                this.particleManager
            );
            
            // 将智能体引用传递给交互管理器
            if (this.witchLiliAgent) {
                this.interactionManager.witchLiliAgent = this.witchLiliAgent;
            }
            
            setTimeout(() => {
                document.getElementById('loading').classList.add('hidden');
            }, 1000);
            this.animate();
        } catch (error) {
            console.error('❌ 初始化失败:', error);
            alert('游戏初始化失败：' + error.message);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        if (this.cardManager) this.cardManager.update();
        if (this.witchLiliManager) this.witchLiliManager.update(time);
        if (this.particleManager) this.particleManager.update();
        if (this.sceneManager) this.sceneManager.render();
    }
    
    // 获取Lili智能体状态
    getLiliState() {
        if (this.witchLiliAgent && this.witchLiliAgent.getState) {
            return this.witchLiliAgent.getState();
        }
        return null;
    }
}

// 导出为全局变量
window.FortuneGame = FortuneGame;