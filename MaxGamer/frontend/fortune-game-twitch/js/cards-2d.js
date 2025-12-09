// 2D卡片管理器 - 使用Canvas绘制替代3D模型
class CardManager2D {
    constructor(sceneManager, particleManager = null) {
        this.sceneManager = sceneManager;
        this.particleManager = particleManager;
        this.cards = {};  // 存储5张卡片，key为礼物类型
        this.cardTimers = {};  // 每张卡片的定时器
        
        // 卡片尺寸和位置配置
        this.cardWidth = 150;
        this.cardHeight = 220;
        this.cardSpacing = 180;
    }

    init() {
        // 为每种礼物类型创建一张卡片
        const types = Object.keys(GIFT_TO_FORTUNE);
        const totalWidth = types.length * this.cardSpacing;
        const startX = -totalWidth / 2 + this.cardSpacing / 2;
        
        types.forEach((type, index) => {
            const giftType = GIFT_TO_FORTUNE[type];
            const card = this.createCard(giftType, startX + index * this.cardSpacing);
            this.cards[type] = card;
            this.sceneManager.addObject(card);
        });
    }

    createCard(giftType, x) {
        const card = {
            type: giftType.id,
            giftType: giftType,
            x: x,
            y: 0,
            baseY: 0,
            width: this.cardWidth,
            height: this.cardHeight,
            rotation: 0,
            targetRotation: 0,
            isFlipped: false,
            flipProgress: 0,
            targetFlipProgress: 0,
            hoverOffset: 0,
            zIndex: 1,
            visible: true,
            greatFortuneCount: 0,
            
            // 前后面的Canvas缓存
            frontCanvas: null,
            backCanvas: null,
            resultCanvas: null,
            
            // 发光效果
            glowAnimation: null,
            
            // 碰撞检测
            containsPoint: function(px, py) {
                const dx = px - this.x;
                const dy = py - this.y;
                return Math.abs(dx) < this.width / 2 && Math.abs(dy) < this.height / 2;
            },
            
            // 渲染方法
            render: function(ctx, time) {
                ctx.save();
                
                // 移动到卡片位置
                ctx.translate(this.x, this.y + this.hoverOffset);
                
                // 应用旋转（翻转效果）
                ctx.rotate(this.rotation);
                
                // 根据翻转进度决定显示哪一面
                const showFront = this.flipProgress > 0.5;
                const scaleX = Math.abs(Math.cos(this.flipProgress * Math.PI));
                
                ctx.scale(scaleX, 1);
                
                // 绘制卡片阴影
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetY = 5;
                
                // 绘制卡片背景
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                ctx.shadowColor = 'transparent';
                
                // 绘制卡片内容
                if (showFront && this.resultCanvas) {
                    // 显示结果面
                    ctx.drawImage(
                        this.resultCanvas,
                        -this.width / 2,
                        -this.height / 2,
                        this.width,
                        this.height
                    );
                } else if (showFront && this.frontCanvas) {
                    // 显示正面
                    ctx.drawImage(
                        this.frontCanvas,
                        -this.width / 2,
                        -this.height / 2,
                        this.width,
                        this.height
                    );
                } else if (this.backCanvas) {
                    // 显示背面
                    ctx.drawImage(
                        this.backCanvas,
                        -this.width / 2,
                        -this.height / 2,
                        this.width,
                        this.height
                    );
                }
                
                // 绘制边框
                const borderColor = `#${this.giftType.color.toString(16).padStart(6, '0')}`;
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                // 发光效果
                if (this.glowAnimation) {
                    const elapsed = (Date.now() - this.glowAnimation.startTime) / 1000;
                    const pulse = Math.sin(elapsed * 3) * 0.3 + 0.7;
                    
                    ctx.strokeStyle = `rgba(${
                        (this.glowAnimation.baseColor >> 16) & 255
                    }, ${
                        (this.glowAnimation.baseColor >> 8) & 255
                    }, ${
                        this.glowAnimation.baseColor & 255
                    }, ${pulse})`;
                    ctx.lineWidth = 5 + pulse * 3;
                    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
                }
                
                // 绘制上上签统计（仅在背面显示）
                if (!showFront && this.greatFortuneCount !== undefined && this.greatFortuneCount > 0) {
                    ctx.save();
                    
                    // 右上角位置
                    const badgeX = this.width / 2 - 25;
                    const badgeY = -this.height / 2 + 15;
                    
                    // 绘制背景圆
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
                    ctx.beginPath();
                    ctx.arc(badgeX, badgeY, 18, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 绘制边框
                    ctx.strokeStyle = '#ff6b00';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // 绘制星星图标
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🌟', badgeX, badgeY - 1);
                    
                    // 绘制数字
                    ctx.fillStyle = '#8b0000';
                    ctx.font = 'bold 11px Arial';
                    ctx.fillText(this.greatFortuneCount.toString(), badgeX, badgeY + 10);
                    
                    ctx.restore();
                }
                
                ctx.restore();
            },
            
            // 更新方法
            update: function(time) {
                // 悬浮动画
                if (!this.isFlipped) {
                    this.hoverOffset = Math.sin(time * 2 + this.x * 0.01) * 8;
                    this.rotation = Math.sin(time * 0.8 + this.x * 0.01) * 0.03;
                }
                
                // 平滑翻转动画
                this.flipProgress += (this.targetFlipProgress - this.flipProgress) * 0.15;
            }
        };
        
        // 创建背面Canvas
        card.backCanvas = this.createBackCanvas(giftType);
        
        // 加载上上签统计
        card.greatFortuneCount = this.getGreatFortuneCount(giftType.id);
        
        return card;
    }

    createBackCanvas(giftType) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 768;
        const ctx = canvas.getContext('2d');
        
        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const colorHex = '#' + giftType.color.toString(16).padStart(6, '0');
        const bgColorHex = '#' + giftType.bgColor.toString(16).padStart(6, '0');
        gradient.addColorStop(0, colorHex);
        gradient.addColorStop(1, bgColorHex);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 装饰图案
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                20 + Math.random() * 40,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        // 礼物emoji（超大）
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(giftType.emoji, canvas.width / 2, canvas.height / 2 - 50);
        ctx.shadowBlur = 0;
        
        // 运势类型文字
        ctx.font = 'bold 80px Microsoft YaHei';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 8;
        ctx.strokeText(giftType.name, canvas.width / 2, canvas.height / 2 + 150);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(giftType.name, canvas.width / 2, canvas.height / 2 + 150);
        
        return canvas;
    }

    async createResultCanvas(fortuneData, giftType, userData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 768;
        const ctx = canvas.getContext('2d');
        
        // 纯白背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 边框
        const colorHex = '#' + giftType.color.toString(16).padStart(6, '0');
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 15;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        let currentY = 70;
        
        // 运势类型标题
        ctx.font = 'bold 55px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillStyle = colorHex;
        ctx.fillText(giftType.name, canvas.width / 2, currentY);
        currentY += 90;
        
        // 运势等级
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        const levelColor = this.getLevelColor(levelText);
        let levelFontSize = 75;
        if (levelText === '上上签') levelFontSize = 90;
        
        ctx.font = `bold ${levelFontSize}px Microsoft YaHei`;
        ctx.fillStyle = levelColor;
        ctx.fillText(levelText, canvas.width / 2, currentY);
        currentY += levelFontSize + 30;
        
        // 用户头像
        if (userData.avatarUrl) {
            try {
                const avatarImg = await this.loadImage(userData.avatarUrl);
                const avatarSize = 220;
                const avatarX = canvas.width / 2 - avatarSize / 2;
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(canvas.width / 2, currentY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, avatarX, currentY, avatarSize, avatarSize);
                ctx.restore();
                
                ctx.strokeStyle = colorHex;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(canvas.width / 2, currentY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.stroke();
                
                currentY += avatarSize + 50;
            } catch (error) {
                console.warn('头像加载失败:', error);
            }
        }
        
        // 用户名称
        if (userData.userName) {
            ctx.font = 'bold 48px Microsoft YaHei';
            ctx.fillStyle = '#000000';
            ctx.fillText(userData.userName, canvas.width / 2, currentY);
            currentY += 90;
        }
        
        // 描述文字
        ctx.font = 'bold 35px Microsoft YaHei';
        ctx.fillStyle = '#666666';
        const maxWidth = canvas.width - 60;
        const lineHeight = 50;
        const lines = this.wrapText(ctx, fortuneData.description, maxWidth);
        
        lines.forEach((line) => {
            ctx.fillText(line, canvas.width / 2, currentY);
            currentY += lineHeight;
        });
        
        return canvas;
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    wrapText(ctx, text, maxWidth) {
        const lines = [];
        let currentLine = '';
        
        for (let char of text) {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    getLevelColor(level) {
        const colors = {
            '上上签': '#ff0000',
            '上签': '#ff6600',
            '中签': '#ffaa00',
            '下签': '#888888',
            '下下签': '#555555'
        };
        return colors[level] || '#000000';
    }

    // 翻转卡片
    async drawFortune(giftType) {
        const card = this.cards[giftType.id];
        if (!card) return null;
        
        // 如果已经翻转，先翻回去
        if (card.isFlipped) {
            card.targetFlipProgress = 0;
            await this.waitForFlip(card);
            card.isFlipped = false;
        }
        
        card.isFlipped = true;
        card.targetFlipProgress = 1;
        
        return new Promise((resolve) => {
            this.waitForFlip(card).then(() => {
                resolve(giftType);
            });
        });
    }

    waitForFlip(card) {
        return new Promise((resolve) => {
            const checkFlip = () => {
                if (Math.abs(card.flipProgress - card.targetFlipProgress) < 0.01) {
                    card.flipProgress = card.targetFlipProgress;
                    resolve();
                } else {
                    requestAnimationFrame(checkFlip);
                }
            };
            checkFlip();
        });
    }

    // 更新卡片正面（显示结果）
    async updateCardFrontWithUser(giftType, fortuneData, userData, orbitEffect = null) {
        const card = this.cards[giftType.id];
        if (!card) return;
        
        card.resultCanvas = await this.createResultCanvas(fortuneData, giftType, userData);
        
        // 添加发光效果
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        this.addCardGlow(card, levelText, giftType.color);
        
        // 设置自动翻回定时器
        this.setResetTimer(giftType.id);
    }

    addCardGlow(card, levelText, baseColor) {
        this.removeCardGlow(card);
        
        const glowConfig = {
            '上上签': { color: 0xffd700, intensity: 2.0 },
            '上签': { color: 0x9370db, intensity: 1.5 },
            '中签': { color: 0xffa500, intensity: 1.0 },
            '下签': { color: 0x808080, intensity: 0.5 },
            '下下签': { color: 0x666666, intensity: 0.3 }
        };
        
        const config = glowConfig[levelText] || { color: baseColor, intensity: 0.5 };
        
        card.glowAnimation = {
            startTime: Date.now(),
            baseColor: config.color,
            intensity: config.intensity
        };
    }

    removeCardGlow(card) {
        if (card.glowAnimation) {
            delete card.glowAnimation;
        }
    }

    setResetTimer(cardType) {
        if (this.cardTimers[cardType]) {
            clearTimeout(this.cardTimers[cardType]);
        }
        
        this.cardTimers[cardType] = setTimeout(() => {
            this.resetCard(cardType);
        }, ANIMATION_CONFIG.cardResetDelay);
    }

    resetCard(cardType) {
        const card = this.cards[cardType];
        if (!card) return;
        
        card.targetFlipProgress = 0;
        card.isFlipped = false;
        card.resultCanvas = null;
        this.removeCardGlow(card);
    }

    // 更新所有卡片
    update(time) {
        Object.values(this.cards).forEach(card => {
            if (card.update) {
                card.update(time);
            }
        });
    }

    // 获取上上签统计数量
    getGreatFortuneCount(cardType) {
        const key = `greatFortune_${cardType}`;
        return parseInt(localStorage.getItem(key) || '0');
    }

    // 增加上上签统计
    incrementGreatFortuneCount(cardType) {
        const key = `greatFortune_${cardType}`;
        const count = this.getGreatFortuneCount(cardType) + 1;
        localStorage.setItem(key, count.toString());
        
        // 更新卡片上的显示
        const card = this.cards[cardType];
        if (card) {
            card.greatFortuneCount = count;
        }
        
        return count;
    }
}