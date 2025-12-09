// 交互管理器
class InteractionManager {
    constructor(sceneManager, cardManager, mikoManager, particleManager) {
        this.sceneManager = sceneManager;
        this.cardManager = cardManager;
        this.mikoManager = mikoManager;
        this.particleManager = particleManager;
        this.selectedGiftType = null;
        this.isDrawing = false; // 防止同时抽签
        this.zoomQueue = []; // 镜头特写队列
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.sceneManager.renderer.domElement;
        
        // 礼物按钮点击（支持触摸）
        document.querySelectorAll('.gift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.onGiftClick(e));
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.onGiftClick(e);
            });
        });
        
        // 3D卡片点击（支持触摸）
        if (canvas) {
            canvas.addEventListener('click', (event) => this.onCardClick(event));
            canvas.addEventListener('touchend', (event) => {
                if (event.touches.length === 0) {
                    this.onCardClick(event.changedTouches[0]);
                }
            });
            
        }

        // 键盘事件监听（方向键控制娃娃移动）
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

    // 键盘按下事件
    onKeyDown(event) {
        if (!this.mikoManager) return;

        // 检查是否按下方向键
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
        
        // 移除所有按钮的active状态
        document.querySelectorAll('.gift-btn').forEach(b => b.classList.remove('active'));
        
        // 添加当前按钮的active状态
        btn.classList.add('active');
        
        console.log(`选择了礼物: ${giftType.gift} -> ${giftType.name}`);
        
        // 直接抽签
        this.handleGiftDrawFortune(giftType);
    }

    async onCardClick(event) {
        // 点击巫女触发互动
        if (!this.mikoManager) return;
        
        const clickableObjects = [this.mikoManager.miko];
        const intersection = this.sceneManager.checkIntersection(event, clickableObjects);
        
        if (intersection) {
            const object = intersection.object;
            const parent = object.parent;
            
            // 点击巫女触发动画
            if (parent === this.mikoManager.miko || parent.parent === this.mikoManager.miko) {
                this.handleMikoClick(parent.position);
            }
        }
    }

    onMouseMove(event) {
        // 移动端不需要鼠标悬停效果
        if ('ontouchstart' in window) return;
        
        if (!this.mikoManager) {
            document.body.style.cursor = 'default';
            return;
        }

        const clickableObjects = [this.mikoManager.miko];
        const intersection = this.sceneManager.checkIntersection(event, clickableObjects);
        
        if (intersection) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    async handleGiftDrawFortune(giftType) {
        // 防止同时抽签导致镜头冲突
        if (this.isDrawing) {
            console.log('正在抽签中，请稍候...');
            return;
        }

        // 检查概率是否有效
        if (window.probabilityManager && !window.probabilityManager.isValid()) {
            alert('⚠️ 概率设置无效！\n\n所有签级的概率总和必须等于100%\n请调整概率面板中的设置');
            return;
        }

        this.isDrawing = true;
        console.log(`抽取${giftType.gift}对应的${giftType.name}`);

        try {
            // 获取用户输入的信息
            const userName = document.getElementById('user-name-input')?.value || '测试用户';
            const avatarPreview = document.getElementById('avatar-preview');
            const userData = {
                userName: userName,
                avatarUrl: avatarPreview?.src || null
            };

            // 直接开始翻转动画和API调用（并行执行）
            const flipPromise = this.cardManager.drawFortune(giftType);
            const apiPromise = this.getRandomFortune(giftType.id);
            
            // 等待两者都完成
            await flipPromise;
            const fortuneData = await apiPromise;

            // 获取卡片位置
            const card = this.cardManager.cards[giftType.id];
            const cardPos = card.position;

            // 根据稀有度创建粒子特效（使用中文levelText）
            const levelText = fortuneData.levelText || fortuneData.level || '未知';
            const orbitEffect = this.particleManager.createRarityEffects(cardPos, levelText, giftType.color);

            // 如果抽到上上签，增加统计并添加到镜头特写队列
            if (levelText === '上上签') {
                const newCount = this.cardManager.incrementGreatFortuneCount(giftType.id);
                console.log(`🌟 ${userData.userName} 抽到上上签！${giftType.name}上上签累计：${newCount}次`);
                
                // 添加到镜头特写队列，记录卡片ID和当前翻转状态
                this.zoomQueue.push({
                    card: card,
                    cardId: giftType.id,
                    giftType: giftType,
                    fortuneData: fortuneData,
                    timestamp: Date.now()  // 记录时间戳
                });
            }

            // 更新卡片显示结果（传入环绕效果和用户数据）- 使用与真实礼物相同的方法
            await this.cardManager.updateCardFrontWithUser(giftType, fortuneData, userData, orbitEffect);

            // 调用占卜Agent进行解读
            this.callFortuneAgent(userData.userName, fortuneData.levelText, giftType.name);

            // 处理镜头特写队列
            this.processZoomQueue();

        } catch (error) {
            console.error('抽签失败:', error);
            alert('抽签失败，请重试！');
        } finally {
            this.isDrawing = false;
        }
    }

    // 处理直播礼物触发的翻牌（带用户信息）
    async handleLiveGiftDrawFortune(giftType, userData) {
        // 防止同时抽签导致镜头冲突
        if (this.isDrawing) {
            console.log('正在抽签中，请稍候...');
            return;
        }

        // 检查概率是否有效（直播礼物也需要验证）
        if (window.probabilityManager && !window.probabilityManager.isValid()) {
            console.warn('⚠️ 概率设置无效，使用默认概率');
            // 直播礼物不弹窗，只在控制台警告
        }

        this.isDrawing = true;
        console.log(`🎁 直播礼物翻牌: ${giftType.gift} - ${userData.userName}`);

        try {
            // 直接开始翻转动画和API调用（并行执行）
            const flipPromise = this.cardManager.drawFortune(giftType);
            const apiPromise = this.getRandomFortune(giftType.id);
            
            // 等待两者都完成
            await flipPromise;
            const fortuneData = await apiPromise;

            // 获取卡片位置
            const card = this.cardManager.cards[giftType.id];
            const cardPos = card.position;

            // 根据稀有度创建粒子特效（使用中文levelText）
            const levelText = fortuneData.levelText || fortuneData.level || '未知';
            const orbitEffect = this.particleManager.createRarityEffects(cardPos, levelText, giftType.color);

            // 如果抽到上上签，增加统计并添加到镜头特写队列
            if (levelText === '上上签') {
                const newCount = this.cardManager.incrementGreatFortuneCount(giftType.id);
                console.log(`🌟 ${userData.userName} 抽到上上签！${giftType.name}上上签累计：${newCount}次`);
                
                // 添加到镜头特写队列，记录卡片ID和当前翻转状态
                this.zoomQueue.push({
                    card: card,
                    cardId: giftType.id,
                    giftType: giftType,
                    fortuneData: fortuneData,
                    timestamp: Date.now()  // 记录时间戳
                });
            }

            // 更新卡片显示结果（传入环绕效果和用户数据）
            await this.cardManager.updateCardFrontWithUser(giftType, fortuneData, userData, orbitEffect);

            // 调用占卜Agent进行解读（直播礼物）- 传入完整用户数据
            this.callFortuneAgentForLive(userData.userName, fortuneData.levelText, giftType.name);

            // 处理镜头特写队列
            this.processZoomQueue();

        } catch (error) {
            console.error('直播礼物翻牌失败:', error);
        } finally {
            this.isDrawing = false;
        }
    }

    // 处理镜头特写队列（避免多张卡片同时触发，并检查卡片状态）
    async processZoomQueue() {
        if (this.zoomQueue.length === 0 || this.sceneManager.cameraAnimation) {
            return;
        }

        // 取出队列中的第一个
        const zoomData = this.zoomQueue.shift();
        
        // 检查卡片是否仍然处于翻转状态（正面朝上）
        const card = this.cardManager.cards[zoomData.cardId];
        if (!card || !card.userData.isFlipped) {
            console.log(`⚠️ 跳过镜头特写：${zoomData.giftType.name} - 卡片已翻回`);
            
            // 继续处理队列中的下一个
            if (this.zoomQueue.length > 0) {
                setTimeout(() => {
                    this.processZoomQueue();
                }, 100);
            }
            return;
        }
        
        console.log(`🎬 开始镜头特写：${zoomData.giftType.name}`);
        
        // 执行镜头特写
        await this.sceneManager.zoomToCard(zoomData.card.position);
        
        console.log(`🎬 镜头特写结束：${zoomData.giftType.name}`);
        
        // 如果队列中还有，继续处理下一个
        if (this.zoomQueue.length > 0) {
            setTimeout(() => {
                this.processZoomQueue();
            }, 500); // 间隔500ms处理下一个
        }
    }

    handleMikoClick(position) {
        console.log('点击了巫女');
        
        // 触发气锤动画
        this.mikoManager.triggerHammerHit();
        
        // 创建特效
        this.particleManager.createBurst(position, 0xffd700);
        this.particleManager.createStarfall(position);
    }


    async getRandomFortune(type) {
        // 直接使用前端的500条数据（不调用后端API）
        return this.getMockFortune(type);
    }

    getMockFortune(type) {
        // 使用独立的数据文件 (每个类型500条内容，每个签型100条)
        const fortuneDataMap = {
            'love': FORTUNE_DATA_LOVE,
            'daily': FORTUNE_DATA_DAILY,
            'career': FORTUNE_DATA_CAREER,
            'health': FORTUNE_DATA_HEALTH,
            'wealth': FORTUNE_DATA_WEALTH
        };
        
        // 直接获取对应类型的数据，如果不存在则使用日常运势
        const typeData = fortuneDataMap[type] || FORTUNE_DATA_DAILY;
        
        // 如果还是没有数据，使用备用数据
        if (!typeData) {
            const fortuneData = {
            love: {
                '上上签': [
                    '桃花朵朵开，真爱即将来临！', '爱情运势极佳，把握机会表白吧！', '今日遇见的人可能就是你的真命天子/天女！',
                    '月老牵红线，姻缘天注定！', '爱神眷顾，浪漫邂逅在今天！', '心有灵犀，真爱就在眼前！',
                    '缘分天定，今日必遇良人！', '爱情如春花绽放，美好无限！', '真心相待，必得佳偶！',
                    '情投意合，白头偕老可期！'
                ],
                '上签': [
                    '爱情运势不错，适合约会哦~', '感情稳定发展，珍惜眼前人', '单身的你今天魅力四射！',
                    '感情甜蜜，幸福满满', '爱情之花悄然绽放', '真诚相待，感情升温',
                    '浪漫时刻即将到来', '心动的感觉越来越强', '爱情运势上扬，把握机会',
                    '感情和谐，相处愉快'
                ],
                '中签': [
                    '爱情平稳，顺其自然就好', '感情需要用心经营', '保持真诚，爱情会慢慢升温',
                    '感情平淡但稳定', '细水长流，感情深厚', '平凡中见真情',
                    '爱情需要耐心培养', '感情稳定，无风无浪', '真心相待，日久生情',
                    '感情平和，相敬如宾'
                ],
                '下签': [
                    '感情可能遇到小波折，需要耐心沟通', '今日不宜表白，再等等吧', '爱情需要时间考验',
                    '感情遇到考验，需要理解', '爱情路上有小坎坷', '感情需要更多沟通',
                    '爱情运势欠佳，保持冷静', '感情出现误会，需要解释', '爱情需要时间沉淀',
                    '感情波动，需要包容'
                ],
                '下下签': [
                    '感情运势欠佳，建议冷静思考', '今日不适合处理感情问题', '给彼此一些空间会更好',
                    '感情陷入低谷，需要反思', '爱情遇到重大考验', '感情问题严重，需要冷静',
                    '爱情运势不佳，避免冲突', '感情危机，需要智慧化解', '爱情需要重新审视',
                    '感情困境，暂时放下为宜'
                ]
            },
            daily: {
                '上上签': [
                    '今日诸事顺遂，万事如意！', '运气爆棚的一天，做什么都顺利！', '好运连连，把握每一个机会！',
                    '吉星高照，大吉大利！', '运势极佳，心想事成！', '福星临门，喜事连连！',
                    '今日运势如虹，无往不利！', '天时地利人和，万事皆宜！', '好运当头，诸事顺心！',
                    '运势亨通，事事如意！'
                ],
                '上签': [
                    '今日运势不错，适合尝试新事物', '心情愉悦，一切都很顺利', '保持积极心态，好事自然来',
                    '运势上扬，诸事顺利', '今日宜行动，必有收获', '运气不错，把握机会',
                    '心情舒畅，万事顺心', '运势良好，适合进取', '今日吉利，诸事可为',
                    '运势平稳上升，前景光明'
                ],
                '中签': [
                    '平稳的一天，按部就班即可', '运势平平，保持平常心', '今日适合休息调整',
                    '运势平和，无大起大落', '平淡是福，知足常乐', '运势稳定，顺其自然',
                    '今日平常，保持常态', '运势中庸，不急不躁', '平稳度日，安心即可',
                    '运势平淡，静待时机'
                ],
                '下签': [
                    '今日运势一般，谨慎行事', '可能遇到小麻烦，保持冷静', '不宜做重大决定',
                    '运势欠佳，小心为上', '今日多有阻碍，需要耐心', '运势不顺，谨慎行事',
                    '诸事不宜，保守为好', '运势低迷，避免冒险', '今日多波折，需要警惕',
                    '运势不佳，低调行事'
                ],
                '下下签': [
                    '今日运势欠佳，低调行事为宜', '诸事不顺，建议在家休息', '避免冲突，静待时机',
                    '运势极差，诸事不宜', '今日凶多吉少，谨慎为上', '运势低谷，避免行动',
                    '诸事不利，静待转机', '运势极差，宜守不宜攻', '今日大凶，避免外出',
                    '运势最差，安心休息为宜'
                ]
            },
            career: {
                '上上签': [
                    '事业运势极佳，升职加薪指日可待！', '工作表现出色，领导赏识有加！', '今日适合提出重要建议或方案！',
                    '事业如日中天，前途无量！', '工作运势极佳，大展宏图！', '事业腾飞，成功在望！',
                    '职场得意，步步高升！', '事业运势爆棚，机遇无限！', '工作顺利，成就非凡！',
                    '事业巅峰，名利双收！'
                ],
                '上签': [
                    '工作顺利，努力会有回报', '事业稳步上升，继续加油', '今日适合展现才华',
                    '事业运势良好，前景光明', '工作得心应手，成果显著', '事业发展顺利，继续努力',
                    '职场运势上扬，把握机会', '工作表现优秀，获得认可', '事业稳中有升，值得期待',
                    '工作顺心，事业有成'
                ],
                '中签': [
                    '工作平稳，按计划进行即可', '事业运势平平，稳扎稳打', '保持专注，机会会来临',
                    '事业平稳发展，无大波动', '工作按部就班，稳定为主', '事业运势中庸，耐心等待',
                    '职场平和，保持现状', '工作稳定，不急不躁', '事业平淡，积累经验',
                    '工作平常，静待机遇'
                ],
                '下签': [
                    '工作可能遇到阻碍，需要耐心', '今日不宜冒进，谨慎为上', '遇到困难不要气馁',
                    '事业遇到瓶颈，需要突破', '工作压力增大，保持冷静', '事业运势欠佳，谨慎行事',
                    '职场多有阻碍，需要努力', '工作不顺，需要调整', '事业遇挫，不要放弃',
                    '工作困难，需要坚持'
                ],
                '下下签': [
                    '事业运势不佳，避免重大决策', '工作压力较大，注意调节', '低调做事，等待转机',
                    '事业陷入低谷，需要反思', '工作危机重重，谨慎应对', '事业运势极差，避免冒险',
                    '职场困境，需要智慧化解', '工作严重受阻，暂缓行动', '事业最低谷，静待时机',
                    '工作极不顺利，保守为上'
                ]
            },
            health: {
                '上上签': [
                    '身体健康，精力充沛！', '健康运势极佳，活力满满！', '今日适合运动锻炼！',
                    '身强体壮，百病不侵！', '健康状况极佳，精神焕发！', '体魄强健，活力四射！',
                    '身心健康，神采奕奕！', '健康运势爆棚，充满活力！', '身体倍儿棒，精力旺盛！',
                    '健康无忧，生龙活虎！'
                ],
                '上签': [
                    '身体状况良好，保持即可', '健康运势不错，注意休息', '精神状态佳，心情愉悦',
                    '健康状况良好，继续保持', '身体健康，精神饱满', '健康运势上扬，注意保养',
                    '身心愉悦，健康无虞', '体质良好，适度锻炼', '健康稳定，心情舒畅',
                    '身体不错，保持习惯'
                ],
                '中签': [
                    '健康平稳，注意作息规律', '身体无大碍，保持良好习惯', '适度运动，均衡饮食',
                    '健康状况平稳，注意保养', '身体平和，规律作息', '健康无大问题，保持即可',
                    '身心平衡，注意调节', '健康稳定，适度锻炼', '身体平常，保持习惯',
                    '健康中庸，注意休息'
                ],
                '下签': [
                    '注意身体，可能有小不适', '健康需要关注，多休息', '避免熬夜，注意饮食',
                    '身体有小恙，需要调理', '健康运势欠佳，注意保养', '身体疲劳，需要休息',
                    '健康需要关注，避免劳累', '身体不适，及时调整', '健康有隐患，注意预防',
                    '身体欠佳，多加休息'
                ],
                '下下签': [
                    '健康运势欠佳，注意保养', '身体可能不适，及时就医', '多休息，避免劳累',
                    '健康严重受损，需要治疗', '身体状况堪忧，及时就医', '健康危机，需要重视',
                    '身体极度疲劳，必须休息', '健康运势极差，谨防疾病', '身体严重不适，立即就医',
                    '健康最差，务必休养'
                ]
            },
            wealth: {
                '上上签': [
                    '财运亨通，财源滚滚来！', '今日偏财运极佳，可小试身手！', '投资理财好时机，把握机会！',
                    '财运爆棚，金银满屋！', '财神眷顾，财源广进！', '财运极佳，横财就手！',
                    '财运亨通，富贵临门！', '财运如虹，钱财不断！', '财运极旺，发财有望！',
                    '财运最佳，财富倍增！'
                ],
                '上签': [
                    '财运不错，收入稳定增长', '今日适合理财规划', '正财运佳，努力工作有回报',
                    '财运良好，收入增加', '财运上扬，理财有道', '财运不错，积累财富',
                    '财运稳定，收益可观', '财运向好，投资有利', '财运顺畅，财源稳定',
                    '财运良好，收入可期'
                ],
                '中签': [
                    '财运平稳，量入为出', '理财需谨慎，稳健为主', '收支平衡，无大起大落',
                    '财运平和，收支平衡', '财运稳定，保守理财', '财运中庸，量力而行',
                    '财运平淡，稳健为主', '财运平常，不急不躁', '财运平稳，细水长流',
                    '财运中等，谨慎理财'
                ],
                '下签': [
                    '财运一般，避免冲动消费', '今日不宜投资，保守为上', '注意开支，避免浪费',
                    '财运欠佳，谨慎理财', '财运不顺，避免投资', '财运低迷，控制开支',
                    '财运不佳，保守为宜', '财运受阻，避免浪费', '财运不利，谨防破财',
                    '财运较差，节约为上'
                ],
                '下下签': [
                    '财运欠佳，谨防破财', '今日不宜投资或借贷', '守住钱包，避免损失',
                    '财运极差，严防破财', '财运最差，切勿投资', '财运危机，谨防损失',
                    '财运极差，避免借贷', '财运最低，守财为上', '财运凶险，严防诈骗',
                    '财运最差，切勿冒险'
                ]
            }
            };
            return this.selectFortuneFromData(fortuneData[type] || fortuneData.daily);
        }
        
        return this.selectFortuneFromData(typeData);
    }
    
    selectFortuneFromData(typeData) {
        if (!typeData) {
            console.error('没有可用的占卜数据');
            return {
                type: 'daily',
                level: '中签',
                levelText: '中签',
                description: '运势平稳，保持平常心'
            };
        }
        
        // 使用概率管理器选择品级
        let selectedLevel;
        if (window.probabilityManager) {
            selectedLevel = window.probabilityManager.selectGrade();
        } else {
            // 如果概率管理器未初始化，使用默认概率
            const randomValue = Math.random() * 100;
            if (randomValue < 5) {
                selectedLevel = '上上签';
            } else if (randomValue < 40) {
                selectedLevel = '上签';
            } else if (randomValue < 80) {
                selectedLevel = '中签';
            } else if (randomValue < 95) {
                selectedLevel = '下签';
            } else {
                selectedLevel = '下下签';
            }
        }
        
        const descriptions = typeData[selectedLevel];
        if (!descriptions || descriptions.length === 0) {
            console.error(`没有找到 ${selectedLevel} 的描述数据`);
            return {
                type: 'unknown',
                level: selectedLevel,
                levelText: selectedLevel,
                description: '暂无描述'
            };
        }
        
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

        return {
            type: 'unknown',
            level: selectedLevel,
            levelText: selectedLevel,
            description: randomDesc
        };
    }

    showResultModal(fortuneData, giftType) {
        const modal = document.getElementById('result-modal');
        document.getElementById('modal-type').textContent = `${giftType.emoji} ${giftType.gift} - ${giftType.name}`;
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        document.getElementById('modal-level').textContent = levelText;
        document.getElementById('modal-desc').textContent = fortuneData.description || '暂无描述';
        
        modal.classList.add('show');

        // 3秒后自动关闭
        setTimeout(() => {
            modal.classList.remove('show');
        }, 3000);
    }

    /**
     * 调用占卜Agent进行运势解读
     * @param {string} username - 用户名
     * @param {string} grade - 签级（上上签、上签等）
     * @param {string} topic - 运势类型（爱情、事业等）
     */
    callFortuneAgent(username, grade, topic) {
        // 优先使用AI Agent,如果不存在则使用占卜对话框管理器
        if (window.witchLiliAgent) {
            console.log(`🔮 调用AI Agent: ${username} - ${grade} - ${topic}`);
            window.witchLiliAgent.handleFortuneResult({
                userName: username,
                grade: grade,
                fortuneType: topic
            });
        } else if (window.fortuneChatManager) {
            console.log(`🔮 调用占卜对话框管理器: ${username} - ${grade} - ${topic}`);
            window.fortuneChatManager.handleFortuneResult(username, grade, topic);
        } else {
            console.warn('⚠️ AI Agent和占卜对话框管理器均未初始化');
        }
    }

    /**
     * 调用占卜Agent进行直播翻牌解读（显示在巫女对话框）
     * @param {string} username - 用户名
     * @param {string} grade - 签级（上上签、上签等）
     * @param {string} topic - 运势类型（爱情、事业等）
     */
    async callFortuneAgentForLive(username, grade, topic) {
        // 优先使用Lili智能体
        if (this.witchLiliAgent && this.witchLiliAgent.onFortuneResult) {
            console.log(`🧙‍♀️ Lili智能体播报(直播): ${username} - ${grade} - ${topic}`);
            this.witchLiliAgent.onFortuneResult(username, grade, topic);
            return;
        }
        
        // 备用方案:使用原有的API调用
        try {
            const displayName = username === '测试用户' ? '测试用户' : username;
            
            console.log(`🔮 直播翻牌Agent调用: ${displayName} - ${grade} - ${topic}`);
            
            const response = await fetch('http://localhost:5000/api/fortune/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: displayName,
                    grade: grade,
                    topic: topic,
                    message: `抽到了${grade}`
                })
            });
            
            if (!response.ok) {
                throw new Error('API调用失败');
            }
            
            const data = await response.json();
            
            if (data.success && data.response) {
                console.log(`💬 Lili原始回应: ${data.response}`);
                
                let finalResponse = data.response;
                if (!finalResponse.includes(displayName)) {
                    console.warn(`⚠️ Agent回应中未包含用户名，前端添加`);
                    finalResponse = `<span class="username-highlight">${displayName}</span>～${finalResponse}`;
                } else {
                    finalResponse = this.highlightUsername(finalResponse, displayName);
                }
                
                console.log(`✨ 处理后的回应: ${finalResponse}`);
                
                if (this.mikoManager) {
                    this.mikoManager.showDialogue(finalResponse);
                }
            }
            
        } catch (error) {
            console.error('❌ 调用占卜Agent失败:', error);
            const fallbackResponse = `恭喜<span class="username-highlight">${username}</span>抽到${grade}～`;
            if (this.mikoManager) {
                this.mikoManager.showDialogue(fallbackResponse);
            }
        }
    }

    /**
     * 在文本中用特殊样式凸显用户名
     * @param {string} text - 原始文本
     * @param {string} username - 用户名
     * @returns {string} 处理后的HTML文本
     */
    highlightUsername(text, username) {
        // 使用span标签包裹用户名，添加特殊样式
        const highlighted = text.replace(
            new RegExp(username, 'g'),
            `<span class="username-highlight">${username}</span>`
        );
        return highlighted;
    }

}
