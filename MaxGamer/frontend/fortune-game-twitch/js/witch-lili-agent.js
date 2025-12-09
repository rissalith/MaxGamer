// 魔女Lili智能体 - 有自我意识的3D角色
class WitchLiliAgent {
    constructor(scene) {
        this.scene = scene;
        this.lili = null;
        this.model3D = null; // 3D模型引用
        this.isAnimating = false;
        this.keyboardMoveSpeed = 0.1;
        
        // 智能体状态
        this.agentState = {
            mood: 'happy',        // 情绪: happy, excited, thinking, tired, surprised
            energy: 100,          // 能量值 0-100
            attention: null,      // 当前关注对象
            lastInteraction: 0,   // 上次交互时间
            personality: {
                friendliness: 0.8,  // 友好度
                curiosity: 0.7,     // 好奇心
                patience: 0.6       // 耐心
            }
        };
        
        // 行为系统
        this.behaviors = {
            idle: this.idleBehavior.bind(this),
            greeting: this.greetingBehavior.bind(this),
            thinking: this.thinkingBehavior.bind(this),
            celebrating: this.celebratingBehavior.bind(this),
            resting: this.restingBehavior.bind(this)
        };
        
        this.currentBehavior = 'idle';
        this.behaviorTimer = 0;
        
        // 对话系统
        this.dialogueQueue = [];
        this.isSpeak = false;
        
        // 自主行为定时器
        this.autonomousTimer = 0;
        this.autonomousInterval = 10000; // 10秒执行一次自主行为
    }

    async init() {
        // 尝试加载3D模型,如果失败则使用几何体
        try {
            await this.load3DModel();
        } catch (error) {
            console.warn('⚠️ 3D模型加载失败,使用几何体模型:', error);
            this.createGeometricModel();
        }
        
        // 从localStorage加载位置
        const savedPosition = this.loadLiliPosition();
        this.lili.position.set(
            savedPosition.x,
            savedPosition.y,
            savedPosition.z
        );
        
        this.scene.add(this.lili);
        
        // 启动智能体系统
        this.startAgentSystem();
        
        console.log('🧙‍♀️ 魔女Lili智能体已初始化');
    }

    // 加载3D模型 (GLTF/GLB格式)
    async load3DModel() {
        return new Promise((resolve, reject) => {
            // 检查是否有GLTFLoader
            if (typeof window.GLTFLoader === 'undefined') {
                reject(new Error('GLTFLoader未加载'));
                return;
            }
            
            const loader = new window.GLTFLoader();
            const modelPath = './models/lili.glb'; // 模型路径
            
            loader.load(
                modelPath,
                (gltf) => {
                    this.model3D = gltf.scene;
                    this.lili = new THREE.Group();
                    this.lili.add(this.model3D);
                    
                    // 设置模型缩放
                    const scale = MIKO_CONFIG.scale;
                    this.model3D.scale.set(scale, scale, scale);
                    
                    // 启用阴影
                    this.model3D.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // 获取动画
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.model3D);
                        this.animations = {};
                        gltf.animations.forEach((clip) => {
                            this.animations[clip.name] = this.mixer.clipAction(clip);
                        });
                    }
                    
                    console.log('✅ 3D模型加载成功');
                    resolve();
                },
                (progress) => {
                    console.log(`📦 模型加载中: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    // 创建几何体模型(备用方案)
    createGeometricModel() {
        this.lili = new THREE.Group();
        const scale = MIKO_CONFIG.scale;

        // 身体（紫色魔法袍）
        const bodyGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 1.2 * scale, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x6a0dad,
            roughness: 0.6,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6 * scale;
        body.castShadow = true;
        this.lili.add(body);

        // 头部
        const headGeometry = new THREE.SphereGeometry(0.3 * scale, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdab9,
            roughness: 0.7,
            metalness: 0.05
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5 * scale;
        head.castShadow = true;
        this.lili.add(head);
        this.lili.userData.head = head;

        // 魔女帽子
        const brimGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 0.05 * scale, 32);
        const hatMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c1a4d,
            roughness: 0.8,
            metalness: 0.2
        });
        const brim = new THREE.Mesh(brimGeometry, hatMaterial);
        brim.position.y = 1.75 * scale;
        brim.castShadow = true;
        this.lili.add(brim);

        const coneGeometry = new THREE.ConeGeometry(0.25 * scale, 0.8 * scale, 32);
        const cone = new THREE.Mesh(coneGeometry, hatMaterial);
        cone.position.y = 2.2 * scale;
        cone.castShadow = true;
        this.lili.add(cone);
        this.lili.userData.hat = cone;

        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.06 * scale, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a0080,
            roughness: 0.2,
            metalness: 0.1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1 * scale, 1.55 * scale, 0.25 * scale);
        this.lili.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1 * scale, 1.55 * scale, 0.25 * scale);
        this.lili.add(rightEye);

        this.lili.userData.leftEye = leftEye;
        this.lili.userData.rightEye = rightEye;
        this.lili.userData.blinkTimer = 0;

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
        this.lili.add(wandGroup);
        this.lili.userData.wand = wandGroup;

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
        this.lili.add(magicRing);
        this.lili.userData.magicRing = magicRing;
    }

    // 启动智能体系统
    startAgentSystem() {
        // 初始化自主行为
        this.scheduleAutonomousBehavior();
        
        // 监听直播事件
        this.setupEventListeners();
    }

    // 设置事件监听
    setupEventListeners() {
        // 监听礼物事件
        if (window.socketManager) {
            window.socketManager.on('gift', (data) => {
                this.onGiftReceived(data);
            });
            
            window.socketManager.on('member', (data) => {
                this.onMemberJoin(data);
            });
        }
    }

    // 礼物接收事件
    async onGiftReceived(data) {
        this.agentState.mood = 'excited';
        this.agentState.energy = Math.min(100, this.agentState.energy + 10);
        this.currentBehavior = 'celebrating';
        this.behaviorTimer = 0;
        
        // 播放庆祝动画
        this.playAnimation('celebrate');
        
        // 通过AI生成感谢消息
        const message = `${data.user_name}送了${data.gift_count}个${data.gift_name}`;
        const response = await this.interactWithAI(message, 'gift', data);
        if (response) {
            this.speak(response);
        }
    }
    
    // 抽签结果播报事件
    async onFortuneResult(username, grade, topic) {
        this.agentState.mood = 'excited';
        this.currentBehavior = 'thinking';
        this.behaviorTimer = 0;
        
        // 播放思考动画
        this.playAnimation('think');
        
        // 通过AI生成抽签解读
        const response = await this.interactWithAI(
            `${username}抽到了${grade}`,
            'fortune',
            { user_name: username, grade: grade, topic: topic }
        );
        
        if (response) {
            this.speak(response, 4000); // 抽签结果显示时间稍长
        }
    }

    // 成员加入事件
    async onMemberJoin(data) {
        // 随机决定是否打招呼(基于友好度)
        if (Math.random() < this.agentState.personality.friendliness * 0.3) {
            this.currentBehavior = 'greeting';
            this.behaviorTimer = 0;
            
            // 通过AI生成问候消息
            const message = `${data.user_name}进入了直播间`;
            const response = await this.interactWithAI(message, 'member', data);
            if (response) {
                this.speak(response);
            }
        }
    }

    // 自主行为调度
    scheduleAutonomousBehavior() {
        setInterval(() => {
            this.executeAutonomousBehavior();
        }, this.autonomousInterval);
    }

    // 执行自主行为
    async executeAutonomousBehavior() {
        // 能量消耗
        this.agentState.energy = Math.max(0, this.agentState.energy - 5);
        
        // 根据能量和情绪决定行为
        if (this.agentState.energy < 30) {
            this.currentBehavior = 'resting';
            this.agentState.mood = 'tired';
        } else if (Math.random() < this.agentState.personality.curiosity * 0.3) {
            // 30%概率说话(基于好奇心)
            this.currentBehavior = 'thinking';
            this.agentState.mood = 'thinking';
            
            // 通过AI生成自主思考内容
            const response = await this.interactWithAI('自主思考', 'autonomous');
            if (response) {
                this.speak(response, 3000);
            }
        }
    }

    // 行为：空闲
    idleBehavior(deltaTime) {
        // 轻微摇摆
        if (this.lili.userData.head) {
            this.lili.userData.head.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
        }
    }

    // 行为：打招呼
    greetingBehavior(deltaTime) {
        this.behaviorTimer += deltaTime;
        
        // 挥手动画
        if (this.lili.userData.wand) {
            this.lili.userData.wand.rotation.z = -Math.PI / 6 + Math.sin(this.behaviorTimer * 5) * 0.3;
        }
        
        // 3秒后回到空闲
        if (this.behaviorTimer > 3) {
            this.currentBehavior = 'idle';
            this.behaviorTimer = 0;
        }
    }

    // 行为：思考
    thinkingBehavior(deltaTime) {
        this.behaviorTimer += deltaTime;
        
        // 头部倾斜
        if (this.lili.userData.head) {
            this.lili.userData.head.rotation.z = Math.sin(this.behaviorTimer * 2) * 0.2;
        }
        
        // 魔杖发光
        if (this.lili.userData.wand) {
            const star = this.lili.userData.wand.children[1];
            if (star && star.material) {
                star.material.emissiveIntensity = 0.8 + Math.sin(this.behaviorTimer * 3) * 0.4;
            }
        }
        
        if (this.behaviorTimer > 5) {
            this.currentBehavior = 'idle';
            this.behaviorTimer = 0;
        }
    }

    // 行为：庆祝
    celebratingBehavior(deltaTime) {
        this.behaviorTimer += deltaTime;
        
        // 跳跃动画
        const jumpHeight = Math.abs(Math.sin(this.behaviorTimer * 4)) * 0.3;
        this.lili.position.y = MIKO_CONFIG.position.y + jumpHeight;
        
        // 魔杖挥舞
        if (this.lili.userData.wand) {
            this.lili.userData.wand.rotation.z = -Math.PI / 6 + Math.sin(this.behaviorTimer * 8) * 0.5;
        }
        
        // 魔法光环旋转加速
        if (this.lili.userData.magicRing) {
            this.lili.userData.magicRing.rotation.z += deltaTime * 3;
        }
        
        if (this.behaviorTimer > 4) {
            this.currentBehavior = 'idle';
            this.behaviorTimer = 0;
            this.agentState.mood = 'happy';
        }
    }

    // 行为：休息
    restingBehavior(deltaTime) {
        this.behaviorTimer += deltaTime;
        
        // 缓慢呼吸动画
        const breathe = Math.sin(this.behaviorTimer * 0.5) * 0.05;
        if (this.lili.userData.head) {
            this.lili.userData.head.position.y = 1.5 * MIKO_CONFIG.scale + breathe;
        }
        
        // 恢复能量
        this.agentState.energy = Math.min(100, this.agentState.energy + deltaTime * 2);
        
        // 能量恢复后回到空闲
        if (this.agentState.energy > 60) {
            this.currentBehavior = 'idle';
            this.behaviorTimer = 0;
            this.agentState.mood = 'happy';
        }
    }

    // 播放动画(如果有3D模型)
    playAnimation(animationName) {
        if (this.mixer && this.animations && this.animations[animationName]) {
            // 停止当前动画
            Object.values(this.animations).forEach(action => action.stop());
            
            // 播放新动画
            const action = this.animations[animationName];
            action.reset();
            action.play();
        }
    }

    // 说话(显示对话气泡)
    speak(text, duration = 3000) {
        this.dialogueQueue.push({ text, duration });
        if (!this.isSpeaking) {
            this.processDialogueQueue();
        }
    }

    // 处理对话队列
    async processDialogueQueue() {
        if (this.dialogueQueue.length === 0) {
            this.isSpeaking = false;
            return;
        }
        
        this.isSpeaking = true;
        const dialogue = this.dialogueQueue.shift();
        
        // 创建3D文字气泡
        this.create3DTextBubble(dialogue.text, dialogue.duration);
        
        // 等待对话结束
        await new Promise(resolve => setTimeout(resolve, dialogue.duration));
        
        // 处理下一条对话
        this.processDialogueQueue();
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
        context.strokeStyle = '#9370db'; // 紫色边框
        context.lineWidth = 4;
        
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

        // 绘制文字
        context.fillStyle = '#6a0dad'; // 紫色文字
        context.font = 'bold 32px Microsoft YaHei, Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
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
        sprite.position.copy(this.lili.position);
        sprite.position.y += MIKO_CONFIG.scale * 3;
        
        this.scene.add(sprite);

        // 动画效果
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                sprite.position.y = this.lili.position.y + MIKO_CONFIG.scale * 3 + Math.sin(elapsed * 0.003) * 0.1;
                
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

    // 更新循环
    update(time) {
        if (!this.lili) return;

        const deltaTime = 0.016; // 约60fps

        // 更新动画混合器
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // 执行当前行为
        if (this.behaviors[this.currentBehavior]) {
            this.behaviors[this.currentBehavior](deltaTime);
        }

        // 基础动画(几何体模型)
        if (!this.model3D) {
            // 眨眼
            if (this.lili.userData.leftEye && this.lili.userData.rightEye) {
                this.lili.userData.blinkTimer += deltaTime;
                
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

            // 魔法光环旋转
            if (this.lili.userData.magicRing && this.currentBehavior === 'idle') {
                this.lili.userData.magicRing.rotation.z = time * 0.5;
            }
        }

        // 整体轻微浮动(空闲状态)
        if (this.currentBehavior === 'idle') {
            this.lili.position.y = MIKO_CONFIG.position.y + Math.sin(time) * 0.05;
        }
    }

    // 键盘移动
    moveWithKeyboard(direction) {
        if (!this.lili) return;

        const speed = this.keyboardMoveSpeed;
        const maxX = 10;
        const maxZ = 10;

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

        this.saveLiliPosition();
    }

    // 保存位置
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

    // 加载位置
    loadLiliPosition() {
        try {
            const saved = localStorage.getItem('liliPosition');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('加载Lili位置失败:', error);
        }
        return {
            x: 3,
            y: MIKO_CONFIG.position.y,
            z: MIKO_CONFIG.position.z
        };
    }

    // 显示消息(兼容接口)
    showMessage(text, duration = 3000) {
        return this.speak(text, duration);
    }

    // 获取智能体状态
    getState() {
        return {
            ...this.agentState,
            currentBehavior: this.currentBehavior,
            isSpeaking: this.isSpeaking
        };
    }

    // 设置情绪
    setMood(mood) {
        this.agentState.mood = mood;
        console.log(`🎭 Lili情绪变化: ${mood}`);
    }

    // 与AI服务交互
    async interactWithAI(message, eventType = 'chat', eventData = null) {
        try {
            const requestBody = {
                message: message,
                username: eventData?.user_name || 'Lili',
                agent_state: this.getState(),
                event_type: eventType
            };
            
            // 添加事件相关数据
            if (eventData) {
                // 抽签事件特殊处理
                if (eventType === 'fortune') {
                    requestBody.grade = eventData.grade;
                    requestBody.topic = eventData.topic;
                    requestBody.username = eventData.user_name;
                } else {
                    requestBody.event_data = {
                        user_name: eventData.user_name,
                        user_id: eventData.user_id,
                        gift_name: eventData.gift_name,
                        gift_count: eventData.gift_count
                    };
                }
            }
            
            const response = await fetch('http://localhost:5000/api/fortune/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.response) {
                    return data.response;
                }
            }
        } catch (error) {
            console.error('❌ AI交互失败:', error);
        }
        return null;
    }
}