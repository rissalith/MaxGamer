
// 3D 巫女模型管理器
class MikoManager {
    constructor(scene) {
        this.scene = scene;
        this.miko = null;
        this.hammer = null;
        this.isAnimating = false;
        this.keyboardMoveSpeed = 0.1; // 键盘移动速度
        this.currentCharacter = 'witch'; // 当前角色: 'prank'(整蛊) 或 'witch'(魔女)
    }

    init() {
        // 从localStorage加载角色类型
        const savedCharacter = localStorage.getItem('mikoCharacter') || 'witch';
        this.currentCharacter = savedCharacter;
        
        this.miko = this.createCharacter(this.currentCharacter);
        
        // 从localStorage加载保存的位置，如果没有则使用默认位置
        const savedPosition = this.loadMikoPosition();
        this.miko.position.set(
            savedPosition.x,
            savedPosition.y,
            savedPosition.z
        );
        
        this.scene.add(this.miko);

        this.hammer = this.createHammer();
        this.hammer.visible = false;
        this.scene.add(this.hammer);

        // 如果是整蛊角色,创建小木牌并附加到右手上
        if (this.currentCharacter === 'prank') {
            this.signBoard = this.createSignBoard();
            // 将木牌附加到右手上
            if (this.miko.userData.rightHand) {
                this.miko.userData.rightHand.add(this.signBoard);
                // 调整木牌相对于手的位置（在手的右侧）
                this.signBoard.position.set(0.8 * MIKO_CONFIG.scale, 0, 0);
                this.signBoard.rotation.y = Math.PI / 6;  // 稍微旋转让木牌朝外
            }
        }
        
        console.log(`🎭 当前角色: ${this.currentCharacter === 'prank' ? '整蛊角色' : '魔女Lili'}`);
    }

    // 从localStorage加载娃娃位置
    loadMikoPosition() {
        try {
            const saved = localStorage.getItem('mikoPosition');
            if (saved) {
                const position = JSON.parse(saved);
                return position;
            }
        } catch (error) {
            console.warn('加载娃娃位置失败:', error);
        }
        // 返回默认位置
        return {
            x: MIKO_CONFIG.position.x,
            y: MIKO_CONFIG.position.y,
            z: MIKO_CONFIG.position.z
        };
    }

    // 保存娃娃位置到localStorage
    saveMikoPosition() {
        try {
            const position = {
                x: this.miko.position.x,
                y: this.miko.position.y,
                z: this.miko.position.z
            };
            localStorage.setItem('mikoPosition', JSON.stringify(position));
        } catch (error) {
            console.error('保存娃娃位置失败:', error);
        }
    }

    // 键盘移动娃娃
    moveWithKeyboard(direction) {
        if (!this.miko) return;

        const speed = this.keyboardMoveSpeed;
        const maxX = 10;  // 放宽X轴范围到±10
        const maxZ = 10;  // 放宽Z轴范围到±10

        switch(direction) {
            case 'up':
                this.miko.position.z = Math.max(-maxZ, this.miko.position.z - speed);
                break;
            case 'down':
                this.miko.position.z = Math.min(maxZ, this.miko.position.z + speed);
                break;
            case 'left':
                this.miko.position.x = Math.max(-maxX, this.miko.position.x - speed);
                break;
            case 'right':
                this.miko.position.x = Math.min(maxX, this.miko.position.x + speed);
                break;
        }

        // 保存位置
        this.saveMikoPosition();
    }

    // 切换角色
    switchCharacter() {
        // 切换角色类型
        this.currentCharacter = this.currentCharacter === 'prank' ? 'witch' : 'prank';
        
        // 保存到localStorage
        localStorage.setItem('mikoCharacter', this.currentCharacter);
        
        // 保存当前位置
        const currentPos = {
            x: this.miko.position.x,
            y: this.miko.position.y,
            z: this.miko.position.z
        };
        
        // 移除旧角色
        this.scene.remove(this.miko);
        if (this.signBoard && this.signBoard.parent) {
            this.signBoard.parent.remove(this.signBoard);
        }
        
        // 创建新角色
        this.miko = this.createCharacter(this.currentCharacter);
        this.miko.position.set(currentPos.x, currentPos.y, currentPos.z);
        this.scene.add(this.miko);
        
        // 如果切换到整蛊角色,重新创建木牌
        if (this.currentCharacter === 'prank') {
            this.signBoard = this.createSignBoard();
            if (this.miko.userData.rightHand) {
                this.miko.userData.rightHand.add(this.signBoard);
                this.signBoard.position.set(0.8 * MIKO_CONFIG.scale, 0, 0);
                this.signBoard.rotation.y = Math.PI / 6;
            }
        }
        
        console.log(`🔄 已切换到${this.currentCharacter === 'prank' ? '整蛊角色' : '魔女Lili'}`);
    }

    // 创建角色(根据类型)
    createCharacter(type) {
        if (type === 'witch') {
            return this.createWitchLili();
        } else {
            return this.createPrankCharacter();
        }
    }

    // 创建整蛊角色(原来的createMiko,保留原有的整蛊形象)
    createPrankCharacter() {
        const group = new THREE.Group();
        const scale = MIKO_CONFIG.scale;

        // 身体（黑色西装）
        const bodyGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 1.2 * scale, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,  // 黑色西装
            roughness: 0.6,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6 * scale;
        body.castShadow = true;
        group.add(body);

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

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.06 * scale, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.2,
            metalness: 0.1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1 * scale, 1.55 * scale, 0.25 * scale);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1 * scale, 1.55 * scale, 0.25 * scale);
        group.add(rightEye);

        group.userData.leftEye = leftEye;
        group.userData.rightEye = rightEye;
        group.userData.blinkTimer = 0;

        // 嘴巴
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

        // 额头上的纸条
        const paperGeometry = new THREE.PlaneGeometry(0.4 * scale, 0.4 * scale);
        const paperCanvas = document.createElement('canvas');
        paperCanvas.width = 256;
        paperCanvas.height = 256;
        const paperCtx = paperCanvas.getContext('2d');
        paperCtx.fillStyle = '#f5f5dc';
        paperCtx.fillRect(0, 0, 256, 256);
        paperCtx.font = 'bold 80px Arial';
        paperCtx.fillStyle = '#ff0000';
        paperCtx.textAlign = 'center';
        paperCtx.textBaseline = 'middle';
        paperCtx.fillText('整', 128, 128);
        
        const paperTexture = new THREE.CanvasTexture(paperCanvas);
        const paperMaterial = new THREE.MeshBasicMaterial({
            map: paperTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const paper = new THREE.Mesh(paperGeometry, paperMaterial);
        paper.position.set(0, 1.7 * scale, 0.3 * scale);
        paper.rotation.x = -0.2;
        group.add(paper);
        group.userData.paper = paper;
        paper.userData.paperTexture = paperTexture;
        
        return group;
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

    createSignBoard() {
        const group = new THREE.Group();
        const scale = MIKO_CONFIG.scale;

        const boardGeometry = new THREE.BoxGeometry(1.2 * scale, 1.5 * scale, 0.1 * scale);
        const boardMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.castShadow = true;
        board.userData.isSignBoard = true;
        group.add(board);

        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const topBorder = new THREE.Mesh(
            new THREE.BoxGeometry(1.3 * scale, 0.08 * scale, 0.12 * scale),
            borderMaterial
        );
        topBorder.position.y = 0.79 * scale;
        group.add(topBorder);
        
        const bottomBorder = new THREE.Mesh(
            new THREE.BoxGeometry(1.3 * scale, 0.08 * scale, 0.12 * scale),
            borderMaterial
        );
        bottomBorder.position.y = -0.79 * scale;
        group.add(bottomBorder);
        
        const leftBorder = new THREE.Mesh(
            new THREE.BoxGeometry(0.08 * scale, 1.5 * scale, 0.12 * scale),
            borderMaterial
        );
        leftBorder.position.x = -0.64 * scale;
        group.add(leftBorder);
        
        const rightBorder = new THREE.Mesh(
            new THREE.BoxGeometry(0.08 * scale, 1.5 * scale, 0.12 * scale),
            borderMaterial
        );
        rightBorder.position.x = 0.64 * scale;
        group.add(rightBorder);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        
        group.userData.canvas = canvas;
        group.userData.ctx = ctx;
        
        const line1 = '我是高市';
        const line2 = '点赞锤我';
        group.userData.line1 = line1;
        group.userData.line2 = line2;
        
        this.drawSignBoardText(ctx, canvas, line1, line2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const textPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.15 * scale, 1.45 * scale),
            textMaterial
        );
        textPlane.position.z = 0.06 * scale;
        group.add(textPlane);
        
        group.userData.texture = texture;
        group.userData.textPlane = textPlane;

        const poleGeometry = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 1.2 * scale, 16);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9,
            metalness: 0.1
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = -1.35 * scale;
        pole.castShadow = true;
        group.add(pole);

        return group;
    }

    drawSignBoardText(ctx, canvas, line1, line2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = 'bold 100px Arial';
        ctx.fillText('👍', canvas.width / 2, 100);
        
        ctx.font = '80px Microsoft YaHei';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        
        ctx.strokeText(line1, canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText(line1, canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.strokeText(line2, canvas.width / 2, canvas.height / 2 + 80);
        ctx.fillText(line2, canvas.width / 2, canvas.height / 2 + 80);
    }

    updateSignBoardText(line1, line2) {
        if (!this.signBoard || !this.signBoard.userData.canvas) return;
        
        this.signBoard.userData.line1 = line1;
        this.signBoard.userData.line2 = line2;
        
        this.drawSignBoardText(
            this.signBoard.userData.ctx,
            this.signBoard.userData.canvas,
            line1,
            line2
        );
        
        this.signBoard.userData.texture.needsUpdate = true;
        
        console.log(`📝 牌子文字已更新: ${line1} / ${line2}`);
    }

    updatePaperPhoto(imageUrl) {
        if (!this.miko || !this.miko.userData.paper) return;
        
        const paper = this.miko.userData.paper;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const size = Math.min(canvas.width, canvas.height) * 0.8;
            const x = (canvas.width - size) / 2;
            const y = (canvas.height - size) / 2;
            ctx.drawImage(img, x, y, size, size);
            
            const texture = new THREE.CanvasTexture(canvas);
            paper.material.map = texture;
            paper.material.needsUpdate = true;
            paper.userData.paperTexture = texture;
            
            console.log('📸 额头纸条照片已更新');
        };
        img.onerror = () => {
            console.error('❌ 加载照片失败:', imageUrl);
        };
        img.src = imageUrl;
    }

    createHammer() {
        const group = new THREE.Group();
        const scale = MIKO_CONFIG.scale;

        const handleGeometry = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.8 * scale, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.castShadow = true;
        group.add(handle);

        const headGeometry = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.3 * scale);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            roughness: 0.3,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.5 * scale;
        head.castShadow = true;
        group.add(head);

        return group;
    }

    playHammerAnimation() {
        if (this.isAnimating || !this.miko || !this.hammer) return;

        this.isAnimating = true;
        const scale = MIKO_CONFIG.scale;
        
        this.hammer.position.copy(this.miko.position);
        this.hammer.position.y += 2.5 * scale;
        this.hammer.position.z += 0.5 * scale;
        this.hammer.visible = true;
        this.hammer.rotation.x = -Math.PI / 4;

        const startY = this.hammer.position.y;
        const endY = this.miko.position.y + 1.2 * scale;
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            this.hammer.position.y = startY + (endY - startY) * easeProgress;
            this.hammer.rotation.x = -Math.PI / 4 + (Math.PI / 2) * easeProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    this.hammer.visible = false;
                    this.isAnimating = false;
                }, 200);
            }
        };

        animate();
    }

    update(time) {
        if (!this.miko) return;

        // 眨眼动画
        if (this.miko.userData.leftEye && this.miko.userData.rightEye) {
            this.miko.userData.blinkTimer += 0.016;
            
            if (this.miko.userData.blinkTimer > 3) {
                const blinkProgress = (this.miko.userData.blinkTimer - 3) / 0.2;
                if (blinkProgress < 1) {
                    const scale = 1 - Math.sin(blinkProgress * Math.PI) * 0.8;
                    this.miko.userData.leftEye.scale.y = scale;
                    this.miko.userData.rightEye.scale.y = scale;
                } else {
                    this.miko.userData.leftEye.scale.y = 1;
                    this.miko.userData.rightEye.scale.y = 1;
                    this.miko.userData.blinkTimer = 0;
                }
            }
        }

        // 魔女Lili特有的动画
        if (this.currentCharacter === 'witch') {
            // 头发飘动
            if (this.miko.userData.leftHair) {
                this.miko.userData.leftHair.rotation.z = 0.2 + Math.sin(time * 2) * 0.1;
                this.miko.userData.rightHair.rotation.z = -0.2 - Math.sin(time * 2) * 0.1;
                this.miko.userData.backHair.rotation.x = 0.3 + Math.sin(time * 1.5) * 0.05;
            }

            // 魔杖发光
            if (this.miko.userData.wand) {
                this.miko.userData.wand.rotation.z = -Math.PI / 6 + Math.sin(time * 3) * 0.1;
            }

            // 魔法光环旋转
            if (this.miko.userData.magicRing) {
                this.miko.userData.magicRing.rotation.z = time * 0.5;
            }

            // 魔法星星旋转和闪烁
            if (this.miko.userData.stars) {
                this.miko.userData.stars.rotation.y = time * 0.3;
                const positions = this.miko.userData.stars.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += Math.sin(time * 2 + i) * 0.002;
                }
                this.miko.userData.stars.geometry.attributes.position.needsUpdate = true;
            }
        }

        // 整体轻微浮动
        this.miko.position.y = MIKO_CONFIG.position.y + Math.sin(time) * 0.05;
    }

    // 创建3D文字气泡
    create3DTextBubble(text, duration = 3000) {
        if (!this.miko) return null;

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
        sprite.position.copy(this.miko.position);
        sprite.position.y += MIKO_CONFIG.scale * 3;
        
        this.scene.add(sprite);

        // 动画效果
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                // 轻微浮动
                sprite.position.y = this.miko.position.y + MIKO_CONFIG.scale * 3 + Math.sin(elapsed * 0.003) * 0.1;
                
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
