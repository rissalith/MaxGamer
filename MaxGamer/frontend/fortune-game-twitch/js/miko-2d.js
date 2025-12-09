// 2D巫女角色管理器 - 使用Canvas绘制替代3D模型
class MikoManager2D {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.miko = null;
        this.hammer = null;
        this.isAnimating = false;
        this.keyboardMoveSpeed = 5;
        this.currentCharacter = 'witch';
        this.dialogueBubble = null;
    }

    init() {
        // 从localStorage加载角色类型
        const savedCharacter = localStorage.getItem('mikoCharacter') || 'witch';
        this.currentCharacter = savedCharacter;
        
        // 从localStorage加载保存的位置
        const savedPosition = this.loadMikoPosition();
        
        this.miko = this.createCharacter(this.currentCharacter, savedPosition);
        this.sceneManager.addObject(this.miko);
        
        console.log(`🎭 当前角色: ${this.currentCharacter === 'prank' ? '整蛊角色' : '魔女Lili'}`);
    }

    loadMikoPosition() {
        try {
            const saved = localStorage.getItem('mikoPosition');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('加载娃娃位置失败:', error);
        }
        return { x: 0, y: -250, z: 0 };
    }

    saveMikoPosition() {
        try {
            const position = {
                x: this.miko.x,
                y: this.miko.y,
                z: 0
            };
            localStorage.setItem('mikoPosition', JSON.stringify(position));
        } catch (error) {
            console.error('保存娃娃位置失败:', error);
        }
    }

    createCharacter(type, position) {
        const character = {
            type: type,
            x: position.x,
            y: position.y,
            baseY: position.y,
            width: 120,
            height: 180,
            scale: 1,
            hoverOffset: 0,
            blinkTimer: 0,
            zIndex: 10,
            visible: false, // 隐藏Canvas上的旧模型，使用HTML对话框代替
            
            // 动画状态
            hairWave: 0,
            wandRotation: 0,
            magicRingRotation: 0,
            
            containsPoint: function(px, py) {
                const dx = px - this.x;
                const dy = py - this.y;
                return Math.abs(dx) < this.width / 2 && Math.abs(dy) < this.height / 2;
            },
            
            render: function(ctx, time) {
                ctx.save();
                ctx.translate(this.x, this.y + this.hoverOffset);
                ctx.scale(this.scale, this.scale);
                
                if (type === 'witch') {
                    this.renderWitch(ctx, time);
                } else {
                    this.renderPrank(ctx, time);
                }
                
                ctx.restore();
            },
            
            renderWitch: function(ctx, time) {
                // 魔法光环
                ctx.strokeStyle = 'rgba(147, 112, 219, 0.7)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 20, 60, 0, Math.PI * 2);
                ctx.stroke();
                
                // 身体（紫色魔法袍）
                ctx.fillStyle = '#6a0dad';
                ctx.beginPath();
                ctx.ellipse(0, 30, 35, 50, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 金色腰带
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 30, 35, 0, Math.PI * 2);
                ctx.stroke();
                
                // 头部
                ctx.fillStyle = '#ffdab9';
                ctx.beginPath();
                ctx.arc(0, -20, 25, 0, Math.PI * 2);
                ctx.fill();
                
                // 魔女帽子
                ctx.fillStyle = '#2c1a4d';
                // 帽檐
                ctx.beginPath();
                ctx.ellipse(0, -40, 35, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                // 帽锥
                ctx.beginPath();
                ctx.moveTo(-20, -40);
                ctx.lineTo(0, -80);
                ctx.lineTo(20, -40);
                ctx.closePath();
                ctx.fill();
                // 金色帽带
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, -40, 20, 0, Math.PI * 2);
                ctx.stroke();
                
                // 长发（带波动）
                const hairWave = Math.sin(time * 2) * 3;
                ctx.fillStyle = '#8b4513';
                // 左侧头发
                ctx.beginPath();
                ctx.ellipse(-18 + hairWave, 0, 8, 40, 0.2, 0, Math.PI * 2);
                ctx.fill();
                // 右侧头发
                ctx.beginPath();
                ctx.ellipse(18 - hairWave, 0, 8, 40, -0.2, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼睛
                ctx.fillStyle = '#4a0080';
                ctx.beginPath();
                ctx.arc(-8, -22, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(8, -22, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼睛高光
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-7, -23, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(9, -23, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 微笑
                ctx.strokeStyle = '#ff6b9d';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -15, 8, 0.2, Math.PI - 0.2);
                ctx.stroke();
                
                // 魔杖
                const wandAngle = Math.sin(time * 3) * 0.1;
                ctx.save();
                ctx.translate(30, 20);
                ctx.rotate(wandAngle - Math.PI / 6);
                ctx.strokeStyle = '#4a2511';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -40);
                ctx.stroke();
                // 星星
                ctx.fillStyle = '#ffff00';
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, -45, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();
                
                // 魔法星星粒子
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + time * 0.3;
                    const radius = 60;
                    const x = Math.cos(angle) * radius;
                    const y = 20 + Math.sin(angle) * radius;
                    const starSize = 3 + Math.sin(time * 2 + i) * 1;
                    
                    ctx.fillStyle = i % 3 === 0 ? '#9370db' : (i % 3 === 1 ? '#ffd700' : '#ff6b9d');
                    ctx.beginPath();
                    ctx.arc(x, y, starSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            
            renderPrank: function(ctx, time) {
                // 身体（黑色西装）
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(0, 30, 35, 50, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 头部
                ctx.fillStyle = '#ffdab9';
                ctx.beginPath();
                ctx.arc(0, -20, 25, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼睛
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(-8, -22, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(8, -22, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // 微笑
                ctx.strokeStyle = '#ff6b9d';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -15, 8, 0.2, Math.PI - 0.2);
                ctx.stroke();
                
                // 额头纸条
                ctx.fillStyle = '#f5f5dc';
                ctx.fillRect(-20, -40, 40, 30);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(-20, -40, 40, 30);
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#ff0000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('整', 0, -25);
                
                // 手部
                ctx.fillStyle = '#ffdab9';
                ctx.beginPath();
                ctx.arc(-30, 40, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(30, 40, 8, 0, Math.PI * 2);
                ctx.fill();
            },
            
            update: function(time) {
                // 眨眼动画
                this.blinkTimer += 0.016;
                if (this.blinkTimer > 3) {
                    const blinkProgress = (this.blinkTimer - 3) / 0.2;
                    if (blinkProgress >= 1) {
                        this.blinkTimer = 0;
                    }
                }
                
                // 轻微浮动
                this.hoverOffset = Math.sin(time) * 3;
            }
        };
        
        return character;
    }

    moveWithKeyboard(direction) {
        if (!this.miko) return;
        
        const speed = this.keyboardMoveSpeed;
        const maxX = 400;
        const maxY = 300;
        
        switch(direction) {
            case 'up':
                this.miko.y = Math.max(-maxY, this.miko.y - speed);
                break;
            case 'down':
                this.miko.y = Math.min(maxY, this.miko.y + speed);
                break;
            case 'left':
                this.miko.x = Math.max(-maxX, this.miko.x - speed);
                break;
            case 'right':
                this.miko.x = Math.min(maxX, this.miko.x + speed);
                break;
        }
        
        this.saveMikoPosition();
    }

    switchCharacter() {
        this.currentCharacter = this.currentCharacter === 'prank' ? 'witch' : 'prank';
        localStorage.setItem('mikoCharacter', this.currentCharacter);
        
        const currentPos = { x: this.miko.x, y: this.miko.y, z: 0 };
        this.sceneManager.removeObject(this.miko);
        this.miko = this.createCharacter(this.currentCharacter, currentPos);
        this.sceneManager.addObject(this.miko);
        
        console.log(`🔄 已切换到${this.currentCharacter === 'prank' ? '整蛊角色' : '魔女Lili'}`);
    }

    update(time) {
        if (this.miko && this.miko.update) {
            this.miko.update(time);
        }
    }

    showMessage(text, duration = 3000) {
        // 使用全局魔女对话框处理器
        if (window.witchDialogHandler) {
            window.witchDialogHandler.show(text, duration);
        } else {
            // 降级方案：直接操作DOM
            const dialogContainer = document.getElementById('witch-dialog-container');
            const dialogText = document.getElementById('witch-dialog-text');
            const characterImage = document.getElementById('witch-character');
            
            if (!dialogContainer || !dialogText) return;
            
            dialogText.innerHTML = text;
            dialogContainer.classList.add('show');
            
            if (characterImage) {
                characterImage.classList.add('talking');
            }
            
            if (duration > 0) {
                setTimeout(() => {
                    if (characterImage) {
                        characterImage.classList.remove('talking');
                    }
                }, duration);
            }
        }
    }
    
    hideMessage() {
        if (window.witchDialogHandler) {
            window.witchDialogHandler.hide();
        } else {
            const dialogContainer = document.getElementById('witch-dialog-container');
            const characterImage = document.getElementById('witch-character');
            
            if (dialogContainer) {
                dialogContainer.classList.remove('show');
            }
            if (characterImage) {
                characterImage.classList.remove('talking');
            }
        }
    }

    playHammerAnimation() {
        // 2D版本的气锤动画可以简化或使用粒子效果
    }
}