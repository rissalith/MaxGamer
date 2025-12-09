import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// API 配置
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api'
};

// 礼物到签类型的映射
const GIFT_TO_FORTUNE = {
    'love': { id: 'love', name: '爱情运势', emoji: '💖', color: 0xff1493, gift: '小心心' },
    'daily': { id: 'daily', name: '日常运势', emoji: '🍭', color: 0xff69b4, gift: '棒棒糖' },
    'career': { id: 'career', name: '事业运势', emoji: '🕶️', color: 0x4169e1, gift: '墨镜' },
    'health': { id: 'health', name: '健康运势', emoji: '🍺', color: 0x32cd32, gift: '大啤酒' },
    'wealth': { id: 'wealth', name: '财富运势', emoji: '💐', color: 0xffd700, gift: '花束' }
};

// 卡片配置
const CARD_CONFIG = {
    width: 2.5,
    height: 3.5,
    depth: 0.08,
    position: { x: 0, y: 2.5, z: 0 }
};

// 场景配置
const SCENE_CONFIG = {
    backgroundColor: 0x1a1a2e,
    cameraPosition: { x: 0, y: 4, z: 10 },
    cameraFov: 50,
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 0.7,
    directionalLightColor: 0xffffff,
    directionalLightIntensity: 0.9,
    directionalLightPosition: { x: 3, y: 8, z: 5 },
    aspectRatio: 9 / 16
};

// 巫女配置
const MIKO_CONFIG = {
    position: { x: 0, y: 7, z: -2 },
    scale: 0.6,
    headColor: 0xffdab9,
    hairColor: 0x2c2c2c,
    bodyColor: 0xffffff,
    ribbonColor: 0xff0000,
    hakamaColor: 0xdc143c
};

// 粒子配置
const PARTICLE_CONFIG = {
    count: 1000,
    size: 0.05,
    color: 0xffffff,
    emissionRate: 50
};

// 动画配置
const ANIMATION_CONFIG = {
    cardFlipDuration: 1000,
    cardResetDelay: 10000,
    particleBurstDuration: 2000,
    mikoShakeDuration: 500,
    hammerSwingDuration: 600
};

// 导出配置供其他模块使用
export {
    THREE,
    OrbitControls,
    API_CONFIG,
    GIFT_TO_FORTUNE,
    CARD_CONFIG,
    SCENE_CONFIG,
    MIKO_CONFIG,
    PARTICLE_CONFIG,
    ANIMATION_CONFIG
};

// 场景管理器
class SceneManager {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);
        this.scene.fog = new THREE.Fog(SCENE_CONFIG.backgroundColor, 8, 30);

        // 创建相机（竖屏优化）
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            SCENE_CONFIG.cameraFov || 50,
            aspect,
            0.1,
            1000
        );
        this.camera.position.set(
            SCENE_CONFIG.cameraPosition.x,
            SCENE_CONFIG.cameraPosition.y,
            SCENE_CONFIG.cameraPosition.z
        );

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 创建轨道控制器（移动端优化）
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 15;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minPolarAngle = Math.PI / 6;
        this.controls.enablePan = false;
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        // 添加光源
        this.addLights();

        // 添加地面
        this.addGround();

        // 添加星空背景
        this.addStars();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('✅ 场景初始化完成（竖屏模式）');
    }

    addLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(
            SCENE_CONFIG.ambientLightColor,
            SCENE_CONFIG.ambientLightIntensity
        );
        this.scene.add(ambientLight);

        // 主光源
        const directionalLight = new THREE.DirectionalLight(
            SCENE_CONFIG.directionalLightColor,
            SCENE_CONFIG.directionalLightIntensity
        );
        directionalLight.position.set(
            SCENE_CONFIG.directionalLightPosition.x,
            SCENE_CONFIG.directionalLightPosition.y,
            SCENE_CONFIG.directionalLightPosition.z
        );
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // 点光源（装饰）
        const pointLight1 = new THREE.PointLight(0xff69b4, 0.5, 20);
        pointLight1.position.set(-5, 3, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x4169e1, 0.5, 20);
        pointLight2.position.set(5, 3, 5);
        this.scene.add(pointLight2);
    }

    addGround() {
        const geometry = new THREE.CircleGeometry(10, 64);
        const material = new THREE.MeshStandardMaterial({
            color: 0x2a2a4a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 添加发光圆环
        const ringGeometry = new THREE.RingGeometry(7, 7.15, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x667eea,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.scene.add(ring);
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.08,
            transparent: true,
            opacity: 0.9
        });

        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 60;
            const y = Math.random() * 40 + 8;
            const z = (Math.random() - 0.5) * 60;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starsVertices, 3)
        );

        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // 射线检测
    checkIntersection(event, objects) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(objects, true);
        
        return intersects.length > 0 ? intersects[0] : null;
    }
}
class FortuneGame {
    constructor() {
        this.sceneManager = null;
        this.cardManager = null;
        this.mikoManager = null;
        this.particleManager = null;
        this.interactionManager = null;
    }

    async init() {
        console.log('🎮 开始初始化 WebGL 占卜游戏...');

        try {
            // 初始化场景
            this.sceneManager = new SceneManager();
            this.sceneManager.init();

            // 初始化卡片
            this.cardManager = new CardManager(this.sceneManager.scene);
            this.cardManager.init();

            // 初始化巫女
            this.mikoManager = new MikoManager(this.sceneManager.scene);
            this.mikoManager.init();
            this.mikoManager.startDialogueSystem(); // 启动对话系统

            // 初始化粒子系统
            this.particleManager = new ParticleManager(this.sceneManager.scene);

            // 初始化交互
            this.interactionManager = new InteractionManager(
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
            this.animate();

            console.log('✅ WebGL 占卜游戏初始化完成！');
            console.log('🎯 提示：点击卡片进行占卜，点击巫女触发气锤效果');

        } catch (error) {
            console.error('❌ 初始化失败:', error);
            alert('游戏初始化失败，请刷新页面重试');
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 更新各个管理器
        if (this.cardManager) {
            this.cardManager.update();
        }

        if (this.mikoManager) {
            this.mikoManager.update();
        }

        if (this.particleManager) {
            this.particleManager.update();
        }

        // 渲染场景
        if (this.sceneManager) {
            this.sceneManager.render();
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
            console.warn('⚠️ 后端服务未启动，请运行: cd backend/api && python app.py');
            return false;
        }
    }
}

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', async () => {
    const game = new FortuneGame();
    
    // 检查后端
    const backendOk = await game.checkBackendHealth();
    if (!backendOk) {
        console.warn('后端服务未检测到，部分功能可能无法使用');
    }
    
    // 初始化游戏
    game.init();
});

// 防止页面刷新时的意外关闭
window.addEventListener('beforeunload', (event) => {
    // 可选：添加确认对话框
    // event.preventDefault();
    // event.returnValue = '';
});
