// 2D游戏主类 - 替代Three.js的3D游戏
class FortuneGame2D {
    constructor() {
        this.sceneManager = null;
        this.cardManager = null;
        this.mikoManager = null;
        this.particleManager = null;
        this.interactionManager = null;
        this.lastTime = 0;
        this.animationId = null;
    }

    async init() {
        try {
            // 初始化2D场景
            this.sceneManager = new SceneManager2D();
            this.sceneManager.init();

            // 初始化粒子系统
            this.particleManager = new ParticleManager2D(this.sceneManager);

            // 初始化卡片
            this.cardManager = new CardManager2D(this.sceneManager, this.particleManager);
            this.cardManager.init();

            // 初始化巫女
            this.mikoManager = new MikoManager2D(this.sceneManager);
            this.mikoManager.init();

            // 初始化交互（使用2D版本）
            this.interactionManager = new InteractionManager2D(
                this.sceneManager,
                this.cardManager,
                this.mikoManager,
                this.particleManager
            );

            // 隐藏加载画面
            setTimeout(() => {
                document.getElementById('loading').classList.add('hidden');
            }, 1000);

            // 开始渲染循环
            this.animate(0);

        } catch (error) {
            console.error('❌ 初始化失败:', error);
            alert('游戏初始化失败，请刷新页面重试');
        }
    }

    animate(currentTime) {
        this.animationId = requestAnimationFrame((time) => this.animate(time));

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 更新各个管理器
        if (this.cardManager) {
            this.cardManager.update(currentTime * 0.001);
        }

        if (this.mikoManager) {
            this.mikoManager.update(currentTime * 0.001);
        }

        if (this.particleManager) {
            this.particleManager.update(deltaTime * 0.001);
        }

        // 渲染场景
        if (this.sceneManager) {
            this.sceneManager.render(currentTime);
        }
    }

    // 检查后端服务
    async checkBackendHealth() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
            if (response.ok) {
                console.log('✅ 后端服务连接正常');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ 后端服务未启动，请运行: cd backend && python app.py');
            return false;
        }
    }

    // 清理资源
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }
    }
}

// 2D交互管理器 - 适配2D场景
class InteractionManager2D {
    constructor(sceneManager, cardManager, mikoManager, particleManager) {
        this.sceneManager = sceneManager;
        this.cardManager = cardManager;
        this.mikoManager = mikoManager;
        this.particleManager = particleManager;
        this.selectedGiftType = null;
        this.isDrawing = false;
        this.zoomQueue = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.sceneManager.canvas;
        
        // 礼物按钮点击
        document.querySelectorAll('.gift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.onGiftClick(e));
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.onGiftClick(e);
            });
        });
        
        // Canvas点击事件
        if (canvas) {
            canvas.addEventListener('click', (event) => this.onCanvasClick(event));
            canvas.addEventListener('touchend', (event) => {
                if (event.touches.length === 0) {
                    this.onCanvasClick(event.changedTouches[0]);
                }
            });
        }

        // 键盘事件监听
        document.addEventListener('keydown', (event) => this.onKeyDown(event));

        // 结果模态框关闭按钮
        const closeBtn = document.getElementById('close-modal');
        const resultModal = document.getElementById('result-modal');
        if (closeBtn && resultModal) {
            closeBtn.addEventListener('click', () => {
                resultModal.classList.remove('show');
            });
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                resultModal.classList.remove('show');
            });
        }
    }

    onKeyDown(event) {
        if (!this.mikoManager) return;

        switch(event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.mikoManager.moveWithKeyboard('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.mikoManager.moveWithKeyboard('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.mikoManager.moveWithKeyboard('left');
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.mikoManager.moveWithKeyboard('right');
                break;
        }
    }

    onGiftClick(event) {
        const btn = event.currentTarget;
        const type = btn.dataset.type;
        const giftType = GIFT_TO_FORTUNE[type];
        
        document.querySelectorAll('.gift-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.handleGiftDrawFortune(giftType);
    }

    onCanvasClick(event) {
        // 检测点击的对象
        const clickableObjects = [
            ...Object.values(this.cardManager.cards),
            this.mikoManager.miko
        ];
        
        const intersection = this.sceneManager.checkIntersection(event, clickableObjects);
        
        if (intersection) {
            const obj = intersection.object;
            
            // 点击巫女
            if (obj === this.mikoManager.miko) {
                this.handleMikoClick(intersection.point);
            }
        }
    }

    async handleGiftDrawFortune(giftType) {
        if (this.isDrawing) {
            return;
        }

        if (window.probabilityManager && !window.probabilityManager.isValid()) {
            alert('⚠️ 概率设置无效！\n\n所有签级的概率总和必须等于100%\n请调整概率面板中的设置');
            return;
        }

        this.isDrawing = true;

        try{
            const userName = document.getElementById('user-name-input')?.value || '测试用户';
            const avatarPreview = document.getElementById('avatar-preview');
            const userData = {
                userName: userName,
                avatarUrl: avatarPreview?.src || null
            };

            const flipPromise = this.cardManager.drawFortune(giftType);
            const apiPromise = this.getRandomFortune(giftType.id);
            
            await flipPromise;
            const fortuneData = await apiPromise;

            const card = this.cardManager.cards[giftType.id];
            const cardPos = { x: card.x, y: card.y };

            const levelText = fortuneData.levelText || fortuneData.level || '未知';
            const orbitEffect = this.particleManager.createRarityEffects(cardPos, levelText, giftType.color);

            if (levelText === '上上签') {
                const newCount = this.cardManager.incrementGreatFortuneCount(giftType.id);
                
                this.zoomQueue.push({
                    card: card,
                    cardId: giftType.id,
                    giftType: giftType,
                    fortuneData: fortuneData,
                    timestamp: Date.now()
                });
            }

            await this.cardManager.updateCardFrontWithUser(giftType, fortuneData, userData, orbitEffect);

            this.callFortuneAgent(userData.userName, fortuneData.levelText, giftType.name);
            this.processZoomQueue();

        } catch (error) {
            console.error('抽签失败:', error);
            alert('抽签失败，请重试！');
        } finally {
            this.isDrawing = false;
        }
    }

    async handleLiveGiftDrawFortune(giftType, userData) {
        if (this.isDrawing) {
            return;
        }

        this.isDrawing = true;

        try {
            const flipPromise = this.cardManager.drawFortune(giftType);
            const apiPromise = this.getRandomFortune(giftType.id);
            
            await flipPromise;
            const fortuneData = await apiPromise;

            const card = this.cardManager.cards[giftType.id];
            const cardPos = { x: card.x, y: card.y };

            const levelText = fortuneData.levelText || fortuneData.level || '未知';
            const orbitEffect = this.particleManager.createRarityEffects(cardPos, levelText, giftType.color);

            if (levelText === '上上签') {
                const newCount = this.cardManager.incrementGreatFortuneCount(giftType.id);
                
                this.zoomQueue.push({
                    card: card,
                    cardId: giftType.id,
                    giftType: giftType,
                    fortuneData: fortuneData,
                    timestamp: Date.now()
                });
            }

            await this.cardManager.updateCardFrontWithUser(giftType, fortuneData, userData, orbitEffect);
            this.callFortuneAgentForLive(userData.userName, fortuneData.levelText, giftType.name);
            this.processZoomQueue();

        } catch (error) {
            console.error('直播礼物翻牌失败:', error);
        } finally {
            this.isDrawing = false;
        }
    }

    async processZoomQueue() {
        if (this.zoomQueue.length === 0 || this.sceneManager.cameraAnimation) {
            return;
        }

        const zoomData = this.zoomQueue.shift();
        const card = this.cardManager.cards[zoomData.cardId];
        
        if (!card || !card.isFlipped) {
            if (this.zoomQueue.length > 0) {
                setTimeout(() => {
                    this.processZoomQueue();
                }, 100);
            }
            return;
        }
        
        await this.sceneManager.zoomToPosition(card.x, card.y);
        
        if (this.zoomQueue.length > 0) {
            setTimeout(() => {
                this.processZoomQueue();
            }, 500);
        }
    }

    handleMikoClick(position) {
        this.mikoManager.playHammerAnimation();
        this.particleManager.createBurst(position, 0xffd700, 100, 4);
        this.particleManager.createStarfall(position, 1.0, 0xffd700);
    }

    async getRandomFortune(type) {
        return this.getMockFortune(type);
    }

    getMockFortune(type) {
        // 检查运势数据是否已加载
        if (typeof FORTUNE_DATA_DAILY === 'undefined') {
            console.error('运势数据未加载！请确保fortune-data-*.js文件已正确加载');
            return {
                type: type || 'daily',
                level: '中签',
                levelText: '中签',
                description: '运势数据加载中，请稍后重试'
            };
        }
        
        const fortuneDataMap = {
            'love': typeof FORTUNE_DATA_LOVE !== 'undefined' ? FORTUNE_DATA_LOVE : FORTUNE_DATA_DAILY,
            'daily': FORTUNE_DATA_DAILY,
            'career': typeof FORTUNE_DATA_CAREER !== 'undefined' ? FORTUNE_DATA_CAREER : FORTUNE_DATA_DAILY,
            'health': typeof FORTUNE_DATA_HEALTH !== 'undefined' ? FORTUNE_DATA_HEALTH : FORTUNE_DATA_DAILY,
            'wealth': typeof FORTUNE_DATA_WEALTH !== 'undefined' ? FORTUNE_DATA_WEALTH : FORTUNE_DATA_DAILY
        };
        
        const typeData = fortuneDataMap[type] || FORTUNE_DATA_DAILY;
        return this.selectFortuneFromData(typeData);
    }
    
    selectFortuneFromData(typeData) {
        if (!typeData) {
            return {
                type: 'daily',
                level: '中签',
                levelText: '中签',
                description: '运势平稳，保持平常心'
            };
        }
        
        let selectedLevel;
        if (window.probabilityManager) {
            selectedLevel = window.probabilityManager.selectGrade();
        } else {
            const randomValue = Math.random() * 100;
            if (randomValue < 5) selectedLevel = '上上签';
            else if (randomValue < 40) selectedLevel = '上签';
            else if (randomValue < 80) selectedLevel = '中签';
            else if (randomValue < 95) selectedLevel = '下签';
            else selectedLevel = '下下签';
        }
        
        const descriptions = typeData[selectedLevel];
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

        return {
            type: 'unknown',
            level: selectedLevel,
            levelText: selectedLevel,
            description: randomDesc
        };
    }

    callFortuneAgent(username, grade, topic) {
        if (window.witchLiliAgent) {
            window.witchLiliAgent.handleFortuneResult({
                userName: username,
                grade: grade,
                fortuneType: topic
            });
        } else if (window.fortuneChatManager) {
            window.fortuneChatManager.handleFortuneResult(username, grade, topic);
        }
    }

    async callFortuneAgentForLive(username, grade, topic) {
        if (this.mikoManager) {
            const message = `恭喜 ${username} 抽到${grade}～`;
            this.mikoManager.showMessage(message);
        }
    }
}

// 导出初始化函数供 app-init-twitch.js 调用
window.initGame = async function() {
    console.log('[Game] 开始初始化游戏引擎...');
    const game = new FortuneGame2D();
    await game.init();
    window.fortuneGame = game;
    console.log('[Game] 游戏引擎初始化完成 ✅');
};