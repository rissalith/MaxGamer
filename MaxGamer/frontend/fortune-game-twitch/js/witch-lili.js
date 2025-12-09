// 魔女Lili 3D模型管理器
class WitchLiliManager {
    constructor(scene) {
        this.scene = scene;
        this.lili = null;
        this.isAnimating = false;
        this.keyboardMoveSpeed = 0.1; // 键盘移动速度
    }

    init() {
        // 创建魔女Lili角色
        this.lili = this.createWitchLili();
        
        // 从localStorage加载保存的位置，如果没有则使用默认位置
        const savedPosition = this.loadLiliPosition();
        this.lili.position.set(
            savedPosition.x,
            savedPosition.y,
            savedPosition.z
        );
        
        this.scene.add(this.lili);
        
        console.log('🧙‍♀️ 魔女Lili已初始化');
    }

    // 从localStorage加载Lili位置
    loadLiliPosition() {
        try {
            const saved = localStorage.getItem('liliPosition');
            if (saved) {
                const position = JSON.parse(saved);
                return position;
            }
        } catch (error) {
            console.warn('加载Lili位置失败:', error);
        }
        // 返回默认位置(在右侧)
        return {
            x: 3,  // 在右侧
            y: MIKO_CONFIG.position.y,
            z: MIKO_CONFIG.position.z
        };
    }

    // 保存Lili位置到localStorage
    saveLiliPosition() {
        try {
            const position = {
                x: this.lili.position.x,
                y: this.lili.position.y,
                z: this.lili.position.z
            };
            localStorage.setItem('liliPosition', JSON.stringify(position));
        } catch (error) {
            console.error('保存Lili位置失败:', error);
        }
    }

    // 键盘移动Lili
    moveWithKeyboard(direction) {
        if (!this.lili) return;

        const speed = this.keyboardMoveSpeed;
        const maxX = 10;  // 放宽X轴范围到±10
        const maxZ = 10;  // 放宽Z轴范围到±10

        switch(direction) {
            case 'up':
                this.lili.position.z = Math.max(-maxZ, this.lili.position.z - speed);
                break;
            case 'down':
                this.lili.position.z = Math.min(maxZ, this.lili.position.z + speed);
                break;
            case 'left':
                this.lili.position.x = Math.max(-maxX, this.lili.position.x - speed);
                break;
            case 'right':
                this.lili.position.x = Math.min(maxX, this.lili.position.x + speed);
                break;
        }

        // 保存位置
        this.saveLiliPosition();
    }

    // 创建魔女Lili
    createWitchLili() {
        const group = new THREE.Group();
        const scale = MIKO_CONFIG.scale;

        // 身体（紫色魔法袍）
        const bodyGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 1.2 * scale, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x6a0dad,  // 深紫色魔法袍
            roughness: 0.6,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6 * scale;
        body.castShadow = true;
        group.add(body);

        // 魔法袍装饰带（金色）
        const beltGeometry = new THREE.TorusGeometry(0.52 * scale, 0.05 * scale, 8, 32);
        const beltMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.7
        });
        const belt = new THREE.Mesh(beltGeometry, beltMaterial);
        belt.position.y = 0.8 * scale;
        belt.rotation.x = Math.PI / 2;
        belt.castShadow = true;
        group.add(belt);

        // 头部
        const headGeometry = new THREE.SphereGeometry(0.3 * scale, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdab9,  // 肤色
            roughness: 0.7,
            metalness: 0.05
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5 * scale;
        head.castShadow = true;
        group.add(head);

        // 魔女帽子
        const brimGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 0.05 * scale, 32);
        const hatMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c1a4d,  // 深紫黑色
            roughness: 0.8,
            metalness: 0.2
        });
        const brim = new THREE.Mesh(brimGeometry, hatMaterial);
        brim.position.y = 1.75 * scale;
        brim.castShadow = true;
        group.add(brim);

        const coneGeometry = new THREE.ConeGeometry(0.25 * scale, 0.8 * scale, 32);
        const cone = new THREE.Mesh(coneGeometry, hatMaterial);
        cone.position.y = 2.2 * scale;
        cone.castShadow = true;
        group.add(cone);

        const hatBandGeometry = new THREE.TorusGeometry(0.26 * scale, 0.03 * scale, 8, 32);
        const hatBandMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.7
        });
        const hatBand = new THREE.Mesh(hatBandGeometry, hatBandMaterial);
        hatBand.position.y = 1.8 * scale;
        hatBand.rotation.x = Math.PI / 2;
        group.add(hatBand);

        // 长发
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,  // 棕色长发
            roughness: 0.7,
            metalness: 0.2
        });

        const leftHairGeometry = new THREE.CapsuleGeometry(0.08 * scale, 0.6 * scale, 8, 16);
        const leftHair = new THREE.Mesh(leftHairGeometry, hairMaterial);
        leftHair.position.set(-0.25 * scale, 1.2 * scale, 0);
        leftHair.rotation.z = 0.2;
        leftHair.castShadow = true;
        group.add(leftHair);

        const rightHair = new THREE.Mesh(leftHairGeometry, hairMaterial);
        rightHair.position.set(0.25 * scale, 1.2 * scale, 0);
        rightHair.rotation.z = -0.2;
        rightHair.castShadow = true;
        group.add(rightHair);

        const backHairGeometry = new THREE.CapsuleGeometry(0.12 * scale, 0.8 * scale, 8, 16);
        const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
        backHair.position.set(0, 1.1 * scale, -0.2 * scale);
        backHair.rotation.x = 0.3;
        backHair.castShadow = true;
        group.add(backHair);

        group.userData.leftHair = leftHair;
        group.userData.rightHair = rightHair;
        group.userData.backHair = backHair;

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.06 * scale, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a0080,  // 紫色眼睛
            roughness: 0.2,
            metalness: 0.1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1 * scale, 1.55 * scale, 0.25 * scale);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1 * scale, 1.55 * scale, 0.25 * scale);
        group.add(rightEye);

        const highlightGeometry = new THREE.SphereGeometry(0.02 * scale, 8, 8);
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        leftHighlight.position.set(-0.08 * scale, 1.57 * scale, 0.3 * scale);
        group.add(leftHighlight);

        const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        rightHighlight.position.set(0.12 * scale, 1.57 * scale, 0.3 * scale);
        group.add(rightHighlight);

        group.userData.leftEye = leftEye;
        group.userData.rightEye = rightEye;
        group.userData.blinkTimer = 0;

        // 微笑的嘴巴
        const smileGeometry = new THREE.TorusGeometry(0.08 * scale, 0.02 * scale, 8, 16, Math.PI);
        const smileMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6b9d,
            roughness: 0.5
        });
        const smile = new THREE.Mesh(smileGeometry, smileMaterial);
        smile.position.set(0, 1.42 * scale, 0.28 * scale);
        smile.rotation.x = Math.PI;
        smile.rotation.z = Math.PI;
        group.add(smile);
        group.userData.smile = smile;

        // 魔杖
        const wandGroup = new THREE.Group();
        
        const wandStickGeometry = new THREE.CylinderGeometry(0.02 * scale, 0.025 * scale, 0.8 * scale, 16);
        const wandStickMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2511,
            roughness: 0.9,
            metalness: 0.1
        });
        const wandStick = new THREE.Mesh(wandStickGeometry, wandStickMaterial);
        wandStick.castShadow = true;
        wandGroup.add(wandStick);

        const starGeometry = new THREE.SphereGeometry(0.08 * scale, 8, 8);
        const starMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8,
            roughness: 0.3,
            metalness: 0.5
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.y = 0.45 * scale;
        wandGroup.add(star);

        wandGroup.position.set(0.4 * scale, 0.8 * scale, 0.1 * scale);
        wandGroup.rotation.z = -Math.PI / 6;
        group.add(wandGroup);
        group.userData.wand = wandGroup;

        // 手部
        const handGeometry = new THREE.SphereGeometry(0.08 * scale, 16, 16);
        const handMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdab9,
            roughness: 0.6,
            metalness: 0.05
        });
        
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.45 * scale, 0.7 * scale, 0.2 * scale);
        leftHand.castShadow = true;
        group.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.45 * scale, 0.7 * scale, 0.2 * scale);
        rightHand.castShadow = true;
        group.add(rightHand);
        
        group.userData.rightHand = rightHand;
        group.userData.leftHand = leftHand;

        // 魔法光环
        const ringGeometry = new THREE.TorusGeometry(0.9 * scale, 0.04 * scale, 8, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x9370db,
            emissive: 0x9370db,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.7
        });
        const magicRing = new THREE.Mesh(ringGeometry, ringMaterial);
        magicRing.position.y = 0.8 * scale;
        magicRing.rotation.x = Math.PI / 2;
        group.add(magicRing);
        group.userData.magicRing = magicRing;

        // 魔法星星粒子
        const starsGeometry = new THREE.BufferGeometry();
        const starsPositions = [];
        const starsColors = [];
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const radius = 1.0 * scale;
            const x = Math.cos(angle) * radius;
            const y = 0.8 * scale + (Math.random() - 0.5) * 1.0 * scale;
            const z = Math.sin(angle) * radius;
            starsPositions.push(x, y, z);
            
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                starsColors.push(0.58, 0.44, 0.86);
            } else if (colorChoice < 0.66) {
                starsColors.push(1.0, 0.84, 0.0);
            } else {
                starsColors.push(1.0, 0.42, 0.62);
            }
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 0.1 * scale,
            transparent: true,
            opacity: 0.9,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        group.add(stars);
        group.userData.stars = stars;
        
        return group;
    }

    update(time) {
        if (!this.lili) return;

        // 眨眼动画
        if (this.lili.userData.leftEye && this.lili.userData.rightEye) {
            this.lili.userData.blinkTimer += 0.016;
            
            if (this.lili.userData.blinkTimer > 3) {
                const blinkProgress = (this.lili.userData.blinkTimer - 3) / 0.2;
                if (blinkProgress < 1) {
                    const scale = 1 - Math.sin(blinkProgress * Math.PI) * 0.8;
                    this.lili.userData.leftEye.scale.y = scale;
                    this.lili.userData.rightEye.scale.y = scale;
                } else {
                    this.lili.userData.leftEye.scale.y = 1;
                    this.lili.userData.rightEye.scale.y = 1;
                    this.lili.userData.blinkTimer = 0;
                }
            }
        }

        // 头发飘动
        if (this.lili.userData.leftHair) {
            this.lili.userData.leftHair.rotation.z = 0.2 + Math.sin(time * 2) * 0.1;
            this.lili.userData.rightHair.rotation.z = -0.2 - Math.sin(time * 2) * 0.1;
            this.lili.userData.backHair.rotation.x = 0.3 + Math.sin(time * 1.5) * 0.05;
        }

        // 魔杖发光
        if (this.lili.userData.wand) {
            this.lili.userData.wand.rotation.z = -Math.PI / 6 + Math.sin(time * 3) * 0.1;
        }

        // 魔法光环旋转
        if (this.lili.userData.magicRing) {
            this.lili.userData.magicRing.rotation.z = time * 0.5;
        }

        // 魔法星星旋转和闪烁
        if (this.lili.userData.stars) {
            this.lili.userData.stars.rotation.y = time * 0.3;
            const positions = this.lili.userData.stars.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(time * 2 + i) * 0.002;
            }
            this.lili.userData.stars.geometry.attributes.position.needsUpdate = true;
        }

        // 整体轻微浮动
        this.lili.position.y = MIKO_CONFIG.position.y + Math.sin(time) * 0.05;
    }

    // 创建3D文字气泡
    create3DTextBubble(text, duration = 3000) {
        if (!this.lili) return null;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        // 绘制气泡背景
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        context.strokeStyle = '#333';
        context.lineWidth = 3;
        
        // 圆角矩形
        const radius = 20;
        const x = 10;
        const y = 10;
        const width = canvas.width - 20;
        const height = canvas.height - 40;
        
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fill();
        context.stroke();

        // 绘制小尾巴
        context.beginPath();
        context.moveTo(canvas.width / 2 - 20, canvas.height - 30);
        context.lineTo(canvas.width / 2, canvas.height - 10);
        context.lineTo(canvas.width / 2 + 20, canvas.height - 30);
        context.closePath();
        context.fill();
        context.stroke();

        // 绘制文字
        context.fillStyle = '#333';
        context.font = 'bold 32px Microsoft YaHei, Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 自动换行
        const maxWidth = width - 40;
        const lineHeight = 40;
        const words = text.split('');
        let line = '';
        let lines = [];
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                lines.push(line);
                line = words[i];
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        const startY = (height - (lines.length - 1) * lineHeight) / 2 + y;
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });

        // 创建精灵
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        const scale = MIKO_CONFIG.scale * 2;
        sprite.scale.set(scale * 2, scale, 1);
        
        // 位置在角色头顶上方
        sprite.position.copy(this.lili.position);
        sprite.position.y += MIKO_CONFIG.scale * 3;
        
        this.scene.add(sprite);

        // 动画效果
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                // 轻微浮动
                sprite.position.y = this.lili.position.y + MIKO_CONFIG.scale * 3 + Math.sin(elapsed * 0.003) * 0.1;
                
                // 淡出效果
                if (progress > 0.7) {
                    const fadeProgress = (progress - 0.7) / 0.3;
                    spriteMaterial.opacity = 1 - fadeProgress;
                }
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(sprite);
                texture.dispose();
                spriteMaterial.dispose();
            }
        };

        animate();
        return sprite;
    }

    // 显示文字消息
    showMessage(text, duration = 3000) {
        return this.create3DTextBubble(text, duration);
    }
}