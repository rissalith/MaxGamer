// 2D粒子特效管理器 - 使用Canvas绘制替代Three.js粒子
class ParticleManager2D {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.particleSystems = [];
    }

    // 根据稀有度创建所有特效
    createRarityEffects(position, level, giftColor) {
        const levelText = level || '未知';
        const rarityConfig = RARITY_CONFIG[levelText];
        
        if (!rarityConfig) {
            console.warn(`未找到等级配置: ${levelText}，使用默认效果`);
            this.createBurst(position, giftColor, 50, 3);
            return;
        }

        console.log(`创建 ${levelText} 特效，稀有度: ${rarityConfig.level}`);

        if (levelText === '上上签') {
            // 上上签：金色粒子爆炸 + 多层光环 + 环绕效果 + 星雨
            this.createBurst(position, 0xffd700, 200, 5);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.createMagicRing(position, 0xffd700);
                }, i * 300);
            }
            const orbitEffect = this.createOrbitEffect(position, 0xffd700);
            this.createStarfall(position, 2.0, 0xffd700);
            return orbitEffect;
        } else if (levelText === '上签') {
            // 上签：紫色粒子爆炸 + 双层光环 + 星雨
            this.createBurst(position, 0x9370db, 150, 4);
            for (let i = 0; i < 2; i++) {
                setTimeout(() => {
                    this.createMagicRing(position, 0x9370db);
                }, i * 300);
            }
            this.createStarfall(position, 1.5, 0x9370db);
        } else if (levelText === '中签') {
            // 中签：橙色粒子 + 单层光环
            this.createBurst(position, 0xffa500, 100, 3);
            this.createMagicRing(position, 0xffa500);
        } else {
            // 下签和下下签：简单粒子效果
            this.createBurst(position, giftColor, 50, 2);
        }
        
        return null;
    }

    // 创建粒子爆发效果
    createBurst(position, color, particleCount = 100, particleSize = 3) {
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const speed = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI;
            
            particles.push({
                x: position.x,
                y: position.y,
                vx: Math.cos(angle) * Math.sin(elevation) * speed,
                vy: Math.sin(angle) * Math.sin(elevation) * speed - 2,
                size: particleSize * (0.5 + Math.random() * 0.5),
                life: 1,
                maxLife: 1 + Math.random()
            });
        }

        const particleSystem = {
            particles: particles,
            color: color,
            startTime: Date.now(),
            duration: 2000,
            zIndex: 15,
            visible: true,
            
            render: function(ctx, time) {
                ctx.save();
                
                const r = (this.color >> 16) & 255;
                const g = (this.color >> 8) & 255;
                const b = this.color & 255;
                
                this.particles.forEach(p => {
                    if (p.life > 0) {
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life})`;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                
                ctx.restore();
            },
            
            update: function(deltaTime) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                const progress = Math.min(elapsed / (this.duration / 1000), 1);
                
                if (progress >= 1) {
                    return false;
                }
                
                this.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.3; // 重力
                    p.life = 1 - (elapsed / p.maxLife);
                });
                
                return true;
            }
        };

        this.sceneManager.addObject(particleSystem);
        this.particleSystems.push(particleSystem);
    }

    // 创建魔法光环效果
    createMagicRing(position, color = 0x667eea) {
        const ring = {
            x: position.x,
            y: position.y,
            radius: 30,
            maxRadius: 150,
            color: color,
            startTime: Date.now(),
            duration: 1000,
            zIndex: 14,
            visible: true,
            
            render: function(ctx, time) {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(elapsed / this.duration, 1);
                
                const currentRadius = this.radius + (this.maxRadius - this.radius) * progress;
                const opacity = 0.8 * (1 - progress);
                
                const r = (this.color >> 16) & 255;
                const g = (this.color >> 8) & 255;
                const b = this.color & 255;
                
                ctx.save();
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            },
            
            update: function(deltaTime) {
                const elapsed = Date.now() - this.startTime;
                return elapsed < this.duration;
            }
        };

        this.sceneManager.addObject(ring);
        this.particleSystems.push(ring);
    }

    // 创建星星飘落效果
    createStarfall(position, intensity = 1.0, color = 0xffd700) {
        const starCount = Math.floor(20 * intensity);
        if (starCount === 0) return;
        
        const stars = [];
        
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: position.x + (Math.random() - 0.5) * 100,
                y: position.y - 100,
                vx: (Math.random() - 0.5) * 2,
                vy: -1 - Math.random() * 2,
                size: 3 * intensity + Math.random() * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }

        const starSystem = {
            stars: stars,
            color: color,
            startTime: Date.now(),
            duration: 2000,
            zIndex: 15,
            visible: true,
            
            render: function(ctx, time) {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(elapsed / this.duration, 1);
                const opacity = 1 - progress;
                
                const r = (this.color >> 16) & 255;
                const g = (this.color >> 8) & 255;
                const b = this.color & 255;
                
                ctx.save();
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                
                this.stars.forEach(star => {
                    ctx.save();
                    ctx.translate(star.x, star.y);
                    ctx.rotate(star.rotation);
                    
                    // 绘制五角星
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                        const x = Math.cos(angle) * star.size;
                        const y = Math.sin(angle) * star.size;
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                });
                
                ctx.restore();
            },
            
            update: function(deltaTime) {
                const elapsed = Date.now() - this.startTime;
                
                if (elapsed >= this.duration) {
                    return false;
                }
                
                this.stars.forEach(star => {
                    star.x += star.vx;
                    star.y += star.vy;
                    star.vy += 0.1; // 重力
                    star.rotation += star.rotationSpeed;
                });
                
                return true;
            }
        };

        this.sceneManager.addObject(starSystem);
        this.particleSystems.push(starSystem);
    }

    // 创建环绕卡片效果（上上签专属，持续显示）
    createOrbitEffect(position, color = 0xffd700) {
        const particleCount = 30;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                angle: (i / particleCount) * Math.PI * 2,
                radius: 100,
                height: Math.random() * 100 - 50,
                size: 4 + Math.random() * 2
            });
        }

        const orbitSystem = {
            particles: particles,
            basePosition: { x: position.x, y: position.y },
            color: color,
            startTime: Date.now(),
            isPersistent: true,
            zIndex: 16,
            visible: true,
            
            render: function(ctx, time) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                const opacity = 0.7 + Math.sin(elapsed * 4) * 0.2;
                
                const r = (this.color >> 16) & 255;
                const g = (this.color >> 8) & 255;
                const b = this.color & 255;
                
                ctx.save();
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                ctx.shadowBlur = 10;
                
                this.particles.forEach(p => {
                    const angle = p.angle + elapsed * 0.8;
                    const radiusWave = Math.sin(elapsed * 2 + p.angle) * 10;
                    const radius = p.radius + radiusWave;
                    
                    const x = this.basePosition.x + Math.cos(angle) * radius;
                    const y = this.basePosition.y + Math.sin(angle) * radius * 0.5 + p.height + Math.sin(elapsed * 3 + p.angle) * 5;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                ctx.restore();
            },
            
            update: function(deltaTime) {
                return true; // 持续更新
            }
        };

        this.sceneManager.addObject(orbitSystem);
        this.particleSystems.push(orbitSystem);
        return orbitSystem;
    }

    // 移除指定的粒子系统
    removeParticleSystem(system) {
        if (!system) return;
        
        const index = this.particleSystems.indexOf(system);
        if (index > -1) {
            this.particleSystems.splice(index, 1);
            this.sceneManager.removeObject(system);
        }
    }

    update(deltaTime) {
        // 更新所有粒子系统，移除已完成的
        this.particleSystems = this.particleSystems.filter(system => {
            if (system.update) {
                const shouldKeep = system.update(deltaTime);
                
                if (!shouldKeep && !system.isPersistent) {
                    this.sceneManager.removeObject(system);
                    return false;
                }
                
                return true;
            }
            return true;
        });
    }
}