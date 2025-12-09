// 3D 卡片管理器
class CardManager {
    constructor(scene, particleManager = null) {
        this.scene = scene;
        this.particleManager = particleManager;
        this.cards = {};  // 存倨5张卡片，key为礼物类型
        this.cardTimers = {};  // 每张卡片的定时器
    }

    init() {
        // 为每种礼物类型创建一张卡片
        Object.keys(GIFT_TO_FORTUNE).forEach(type => {
            const giftType = GIFT_TO_FORTUNE[type];
            const card = this.createCard(giftType);
            
            card.position.set(
                giftType.position.x,
                giftType.position.y,
                giftType.position.z
            );
            
            card.userData = {
                type: type,
                giftType: giftType,
                isFlipped: false
            };

            this.cards[type] = card;
            this.scene.add(card);
            
        });

    }

    createCard(giftType) {
        const group = new THREE.Group();

        // 卡片几何体
        const geometry = new THREE.BoxGeometry(
            CARD_CONFIG.width,
            CARD_CONFIG.height,
            CARD_CONFIG.depth
        );

        // 背面材质（使用礼物类型的颜色）
        const backMaterial = this.createBackMaterial(giftType);

        // 侧面材质
        const sideMaterial = new THREE.MeshStandardMaterial({
            color: giftType.color,
            roughness: 0.5,
            metalness: 0.3,
            emissive: giftType.color,
            emissiveIntensity: 0.2
        });

        // 组合材质（右、左、上、下、前、后）
        const materials = [
            sideMaterial,  // 右
            sideMaterial,  // 左
            sideMaterial,  // 上
            sideMaterial,  // 下
            backMaterial,  // 前（当前显示背面）
            backMaterial   // 后
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        group.add(mesh);

        // 添加发光边框
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: giftType.color,
            linewidth: 3
        });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        group.add(edges);
        
        return group;
    }

    createFrontMaterial(giftType) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;  // 提高分辨率
        canvas.height = 1536;
        const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
        
        // 启用高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 背景渐变（更亮的白色）
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, `#${giftType.color.toString(16).padStart(6, '0')}`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加高光效果
        const highlightGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 4, 0,
            canvas.width / 2, canvas.height / 4, canvas.width / 2
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 边框（更粗更明显）
        ctx.strokeStyle = `#${giftType.color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 50;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        // 礼物表情符号（更大更明显，使用亮色调）
        ctx.font = 'bold 420px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 添加发光效果
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#000000';
        ctx.fillText(giftType.emoji, canvas.width / 2, canvas.height / 3);
        ctx.shadowBlur = 0;

        // 运势类型文字（更大更粗，纯黑色带白色描边）
        ctx.font = 'bold 130px Microsoft YaHei';
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeText(giftType.name, canvas.width / 2, canvas.height * 2 / 3);
        ctx.fillText(giftType.name, canvas.width / 2, canvas.height * 2 / 3);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4,
            metalness: 0.05,
            color: 0xffffff,  // 改为纯白，不影响纹理颜色
            emissive: 0x000000,
            emissiveIntensity: 0
        });
    }

    createBackMaterial(giftType) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;  // 提高分辨率
        canvas.height = 1536;
        const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
        
        // 启用高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 背景渐变（使用礼物类型的颜色）
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const colorHex = '#' + giftType.color.toString(16).padStart(6, '0');
        const bgColorHex = '#' + giftType.bgColor.toString(16).padStart(6, '0');
        gradient.addColorStop(0, colorHex);
        gradient.addColorStop(1, bgColorHex);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 装饰图案
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 8;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                40 + Math.random() * 80,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }

        // 恢复背面原始布局
        let currentY = 650; // 起始Y坐标，移除上上签统计后从更低位置开始

        // 中心符号（礼物emoji，超大超亮）
        ctx.font = 'bold 380px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 先绘制黑色阴影增强对比
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(giftType.emoji, canvas.width / 2, currentY);
        // 再绘制白色发光
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 50;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(giftType.emoji, canvas.width / 2, currentY);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        currentY += 400;

        // 抽签类型标题（超大超亮，纯白色带超粗黑色描边）
        ctx.font = 'bold 160px Microsoft YaHei';
        // 先绘制黑色描边（超粗）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 16;
        ctx.strokeText(giftType.name, canvas.width / 2, currentY);
        // 再绘制白色填充
        ctx.fillStyle = '#ffffff';
        ctx.fillText(giftType.name, canvas.width / 2, currentY);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.05,
            color: 0xffffff,  // 纯白色，不影响纹理颜色
            emissive: 0x000000,
            emissiveIntensity: 0
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
        return count;
    }

    // 翻转卡片（抽签）- 直接翻指定类型的卡片
    async drawFortune(giftType) {
        const card = this.cards[giftType.id];
        if (!card) return null;
        
        // 如果已经翻转，先翻回去再翻过来
        if (card.userData.isFlipped) {
            card.rotation.y = 0;
            card.userData.isFlipped = false;
        }
        
        card.userData.isFlipped = true;

        // 翻转动画
        const startRotation = card.rotation.y;
        const endRotation = startRotation + Math.PI;
        const duration = ANIMATION_CONFIG.cardFlipDuration;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = this.easeInOutCubic(progress);

                card.rotation.y = startRotation + (endRotation - startRotation) * easeProgress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve(giftType);
                }
            };

            animate();
        });
    }

    // 更新卡片正面（显示结果）
    updateCardFront(giftType, fortuneData, orbitEffect = null) {
        const card = this.cards[giftType.id];
        const mesh = card.children[0];
        const newFrontMaterial = this.createResultMaterial(fortuneData, giftType);
        
        // 更新正面和背面材质，避免翻转时看到黑色
        mesh.material[4] = newFrontMaterial;
        mesh.material[5] = newFrontMaterial;
        
        // 存储环绕粒子效果（仅限上上签）
        if (orbitEffect) {
            card.userData.orbitEffect = orbitEffect;
        }
        
        // 根据levelText添加发光边框
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        this.addCardGlow(card, levelText, giftType.color);
        
        // 设置自动翻回定时器
        this.setResetTimer(giftType.id);
    }

    // 更新卡片正面（显示结果 - 带用户信息）
    async updateCardFrontWithUser(giftType, fortuneData, userData, orbitEffect = null) {
        const card = this.cards[giftType.id];
        const newFrontMaterial = await this.createResultMaterialWithUser(fortuneData, giftType, userData);
        
        // 更新正面和背面材质，避免翻转时看到黑色
        const mesh = card.children[0];
        mesh.material[4] = newFrontMaterial;
        mesh.material[5] = newFrontMaterial;
        
        // 存储环绕粒子效果（仅限上上签）
        if (orbitEffect) {
            card.userData.orbitEffect = orbitEffect;
        }
        
        // 根据levelText添加发光边框
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        this.addCardGlow(card, levelText, giftType.color);
        
        // 设置自动翻回定时器
        this.setResetTimer(giftType.id);
    }

    // 创建结果材质（带用户信息）- 新布局：头像和名称占据大部分牌面
    async createResultMaterialWithUser(fortuneData, giftType, userData) {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 3072;
        const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 纯白背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 边框
        const colorHex = '#' + giftType.color.toString(16).padStart(6, '0');
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 50;
        ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

        let currentY = 300;  // 从200增加到300，增加顶部间距

        // 【1. 运势类型标题 - 顶部，更大字体】
        ctx.font = 'bold 220px Microsoft YaHei';  // 从180增加到220
        ctx.textAlign = 'center';
        ctx.fillStyle = colorHex;
        ctx.fillText(giftType.name, canvas.width / 2, currentY);
        currentY += 400;  // 从300增加到400，增加与品级的间距

        // 【2. 运势等级 - 根据品级设置不同大小和样式】
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        const levelColor = this.getLevelColor(levelText);
        
        // 根据品级设置字体大小（整体缩小）
        let levelFontSize = 240;  // 从280减小到240
        if (levelText === '上上签') {
            levelFontSize = 320;  // 从380减小到320
        } else if (levelText === '上签') {
            levelFontSize = 290;  // 从340减小到290
        } else if (levelText === '中签') {
            levelFontSize = 260;  // 从300减小到260
        } else if (levelText === '下签') {
            levelFontSize = 230;  // 从260减小到230
        } else if (levelText === '下下签') {
            levelFontSize = 210;  // 从240减小到210
        }
        
        ctx.font = `bold ${levelFontSize}px Microsoft YaHei`;
        ctx.fillStyle = levelColor;  // 使用品级颜色
        ctx.fillText(levelText, canvas.width / 2, currentY);
        currentY += levelFontSize * 0.8 + 250;  // 从200增加到250，增加与头像的间距

        // 【3. 用户头像 - 超大尺寸，占据主要位置】
        if (userData.avatarUrl) {
            try {
                const avatarImg = await this.loadImage(userData.avatarUrl);
                const avatarSize = 800;  // 超大头像（从450增加到800）
                const avatarX = canvas.width / 2 - avatarSize / 2;
                const avatarY = currentY;
                
                // 绘制圆形头像
                ctx.save();
                ctx.beginPath();
                ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();
                
                // 添加头像边框
                ctx.strokeStyle = colorHex;
                ctx.lineWidth = 15;
                ctx.beginPath();
                ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.stroke();
                
                currentY += avatarSize + 250;  // 从150增加到250，增加头像和名称的间距
            } catch (error) {
                console.warn('头像加载失败:', error);
            }
        }

        // 【4. 用户名称 - 超大字体】
        if (userData.userName) {
            ctx.font = 'bold 220px Microsoft YaHei';  // 从160增加到220
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(userData.userName, canvas.width / 2, currentY);
            currentY += 300;  // 从200增加到300，增加名称和描述的间距
        }

        // 【5. 描述文字 - 放大字体并往下移】
        ctx.font = 'bold 150px Microsoft YaHei';  // 从80增加到100
        ctx.fillStyle = '#666666';  // 使用灰色，降低视觉权重
        const maxWidth = canvas.width - 300;
        const lineHeight = 140;  // 从120增加到140，增加行间距
        const words = fortuneData.description;
        const lines = this.wrapText(ctx, words, maxWidth);
        
        lines.forEach((line, index) => {
            const y = currentY + index * lineHeight;
            ctx.fillText(line, canvas.width / 2, y);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.scene.renderer ? this.scene.renderer.capabilities.getMaxAnisotropy() : 16;
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.05,
            emissive: 0x000000,
            emissiveIntensity: 0,
            color: 0xffffff
        });
    }
    
    // 辅助方法：加载图片
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    createResultMaterial(fortuneData, giftType) {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;  // 提高分辨率
        canvas.height = 3072;
        const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });
        
        // 启用高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 背景（纯白色）
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加非常淡的彩色光晕（仅在边缘）
        const colorHex = '#' + giftType.color.toString(16).padStart(6, '0');
        const glowGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 1.5
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        glowGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        glowGradient.addColorStop(1, colorHex + '1a');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 边框（使用礼物类型颜色）
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 60;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        // 获取用户信息
        const userName = document.getElementById('user-name-input')?.value || '';
        const avatarPreview = document.getElementById('avatar-preview');
        const hasAvatar = avatarPreview && avatarPreview.classList.contains('show');

        let currentY = 250;

        // 【1. 运势类型标题 - 放在最顶部】
        ctx.font = '120px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 10;
        ctx.strokeText(giftType.name, canvas.width / 2, currentY);
        ctx.fillStyle = colorHex;
        ctx.fillText(giftType.name, canvas.width / 2, currentY);
        currentY += 180;

        // 如果有头像，绘制头像
        if (hasAvatar && avatarPreview.complete) {
            const avatarSize = 240;
            const avatarX = canvas.width / 2 - avatarSize / 2;
            const avatarY = currentY;
            
            // 绘制圆形头像
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarPreview, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
            
            // 头像边框
            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.stroke();
            
            currentY += avatarSize + 120;
        } else {
            currentY += 150;
        }

        // 如果有名字，绘制名字
        if (userName) {
            ctx.font = '110px Microsoft YaHei';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(userName, canvas.width / 2, currentY);
            currentY += 180;
        } else {
            currentY += 120;
        }

        // 添加分隔线（如果有用户信息）
        if (hasAvatar || userName) {
            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 4, currentY);
            ctx.lineTo(canvas.width * 3 / 4, currentY);
            ctx.stroke();
            currentY += 100;
        }

        // 【2. 运势等级】
        ctx.font = '280px Microsoft YaHei';
        const levelText = fortuneData.levelText || fortuneData.level || '未知';
        const levelColor = this.getLevelColor(levelText);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 14;
        ctx.strokeText(levelText, canvas.width / 2, currentY);
        ctx.fillStyle = levelColor;
        ctx.fillText(levelText, canvas.width / 2, currentY);
        currentY += 380;

        // 【3. 描述文字】
        ctx.font = '95px Microsoft YaHei';
        const maxWidth = canvas.width - 300;
        const lineHeight = 160;
        const words = fortuneData.description;
        const lines = this.wrapText(ctx, words, maxWidth);
        
        lines.forEach((line, index) => {
            const y = currentY + index * lineHeight;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 6;
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillStyle = '#333333';
            ctx.fillText(line, canvas.width / 2, y);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 16;  // 最大各向异性过滤
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.3,
            metalness: 0.05,
            emissive: 0x000000,
            emissiveIntensity: 0,
            color: 0xffffff
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
            '上上签': '#ff0000',      // 鲜红色
            '上签': '#ff6600',        // 橙红色
            '中签': '#ffaa00',        // 亮橙色
            '下签': '#888888',        // 中灰色（更亮）
            '下下签': '#555555',      // 深灰色（更亮）
            '大吉': '#ff1493',        // 深粉色
            '中吉': '#ff69b4',        // 粉色
            '小吉': '#ffa500',        // 橙色
            '吉': '#32cd32',          // 绿色
            '凶': '#888888'           // 中灰色（更亮）
        };
        return colors[level] || '#000000';
    }

    setResetTimer(cardType) {
        if (this.cardTimers[cardType]) {
            clearTimeout(this.cardTimers[cardType]);
        }

        this.cardTimers[cardType] = setTimeout(() => {
            this.resetCard(cardType);
        }, ANIMATION_CONFIG.cardResetDelay);
    }

    // 添加卡片发光效果
    addCardGlow(card, levelText, baseColor) {
        // 移除旧的发光效果
        this.removeCardGlow(card);
        
        const glowConfig = {
            '上上签': { color: 0xffd700, intensity: 2.0 },  // 金色
            '上签': { color: 0x9370db, intensity: 1.5 },    // 紫色
            '中签': { color: 0xffa500, intensity: 1.0 },    // 橙色
            '下签': { color: 0x808080, intensity: 0.5 },
            '下下签': { color: 0x666666, intensity: 0.3 }
        };
        
        const config = glowConfig[levelText] || { color: baseColor, intensity: 0.5 };
        
        // 创建发光边框（使用LineBasicMaterial的发光效果）
        const edges = card.children[1];
        if (edges) {
            edges.material.color.setHex(config.color);
            edges.material.opacity = 1.0;
            
            // 添加脉动动画
            card.userData.glowAnimation = {
                startTime: Date.now(),
                baseColor: config.color,
                intensity: config.intensity
            };
        }
    }

    // 移除卡片发光效果
    removeCardGlow(card) {
        if (card.userData.glowAnimation) {
            delete card.userData.glowAnimation;
        }
    }

    resetCard(cardType) {
        const card = this.cards[cardType];
        const giftType = GIFT_TO_FORTUNE[cardType];
        
        const startRotation = card.rotation.y;
        const endRotation = 0;
        const duration = ANIMATION_CONFIG.cardFlipDuration;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeInOutCubic(progress);

            card.rotation.y = startRotation + (endRotation - startRotation) * easeProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                card.userData.isFlipped = false;
                
                // 移除环绕粒子效果（如果存在）
                if (card.userData.orbitEffect && this.particleManager) {
                    this.particleManager.removeParticleSystem(card.userData.orbitEffect);
                    delete card.userData.orbitEffect;
                }
                
                // 恢复背面材质
                const mesh = card.children[0];
                mesh.material[4] = this.createBackMaterial(giftType);
                mesh.material[5] = this.createBackMaterial(giftType);
                
                // 移除发光效果
                this.removeCardGlow(card);
                
                // 重置边框颜色和缩放
                const edges = card.children[1];
                if (edges) {
                    edges.material.color.setHex(giftType.color);
                    edges.material.opacity = 1.0;
                    edges.scale.set(1, 1, 1);
                }
            }
        };

        animate();
    }

    // 缓动函数
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // 更新动画（悬浮效果 + 发光脉动）
    update() {
        const time = Date.now() * 0.001;
        
        Object.keys(this.cards).forEach((type, index) => {
            const card = this.cards[type];
            const giftType = GIFT_TO_FORTUNE[type];
            
            if (!card.userData.isFlipped) {
                // 每张卡片有不同的相位偏移
                const phaseOffset = index * 0.5;
                card.position.y = giftType.position.y + Math.sin(time * 2 + phaseOffset) * 0.12;
                card.rotation.z = Math.sin(time * 0.8 + phaseOffset) * 0.03;
            }
            
            // 发光脉动效果
            if (card.userData.glowAnimation) {
                const edges = card.children[1];
                if (edges) {
                    const elapsed = (Date.now() - card.userData.glowAnimation.startTime) / 1000;
                    const pulse = Math.sin(elapsed * 3) * 0.3 + 0.7; // 快速脉动
                    edges.material.opacity = pulse;
                    
                    // 边框宽度变化（模拟发光强度）
                    const scale = 1 + pulse * 0.05;
                    edges.scale.setScalar(scale);
                }
            }
        });
    }
}
