import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==================== 配置 ====================
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api'
};

const GIFT_TO_FORTUNE = {
    'love': { id: 'love', name: '爱情运势', emoji: '💖', color: 0xff1493, gift: '小心心' },
    'daily': { id: 'daily', name: '日常运势', emoji: '🍭', color: 0xff69b4, gift: '棒棒糖' },
    'career': { id: 'career', name: '事业运势', emoji: '🕶️', color: 0x4169e1, gift: '墨镜' },
    'health': { id: 'health', name: '健康运势', emoji: '🍺', color: 0x32cd32, gift: '大啤酒' },
    'wealth': { id: 'wealth', name: '财富运势', emoji: '💐', color: 0xffd700, gift: '花束' }
};

const CARD_CONFIG = {
    width: 2.5,
    height: 3.5,
    depth: 0.08,
    position: { x: 0, y: 2.5, z: 0 }
};

const SCENE_CONFIG = {
    backgroundColor: 0x1a1a2e,
    cameraPosition: { x: 0, y: 4, z: 10 },
    cameraFov: 50,
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 0.7,
    directionalLightColor: 0xffffff,
    directionalLightIntensity: 0.9,
    directionalLightPosition: { x: 3, y: 8, z: 5 }
};

const MIKO_CONFIG = {
    position: { x: 0, y: 7, z: -2 },
    scale: 0.6,
    headColor: 0xffdab9,
    hairColor: 0x2c2c2c,
    bodyColor: 0xffffff,
    ribbonColor: 0xff0000,
    hakamaColor: 0xdc143c
};

const ANIMATION_CONFIG = {
    cardFlipDuration: 1000,
    cardResetDelay: 10000,
    particleBurstDuration: 2000,
    mikoShakeDuration: 500,
    hammerSwingDuration: 600
};

// ==================== 场景管理器 ====================
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
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);
        this.scene.fog = new THREE.Fog(SCENE_CONFIG.backgroundColor, 8, 30);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(SCENE_CONFIG.cameraFov || 50, aspect, 0.1, 1000);
        this.camera.position.set(SCENE_CONFIG.cameraPosition.x, SCENE_CONFIG.cameraPosition.y, SCENE_CONFIG.cameraPosition.z);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 15;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minPolarAngle = Math.PI / 6;
        this.controls.enablePan = false;
        this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

        this.addLights();
        this.addGround();
        this.addStars();
        window.addEventListener('resize', () => this.onWindowResize());
        console.log('✅ 场景初始化完成');
    }

    addLights() {
        this.scene.add(new THREE.AmbientLight(SCENE_CONFIG.ambientLightColor, SCENE_CONFIG.ambientLightIntensity));
        
        const directionalLight = new THREE.DirectionalLight(SCENE_CONFIG.directionalLightColor, SCENE_CONFIG.directionalLightIntensity);
        directionalLight.position.set(SCENE_CONFIG.directionalLightPosition.x, SCENE_CONFIG.directionalLightPosition.y, SCENE_CONFIG.directionalLightPosition.z);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xff69b4, 0.5, 20);
        pointLight1.position.set(-5, 3, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x4169e1, 0.5, 20);
        pointLight2.position.set(5, 3, 5);
        this.scene.add(pointLight2);
    }

    addGround() {
        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(10, 64),
            new THREE.MeshStandardMaterial({ color: 0x2a2a4a, roughness: 0.8, metalness: 0.2 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(7, 7.15, 64),
            new THREE.MeshBasicMaterial({ color: 0x667eea, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.scene.add(ring);
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            starsVertices.push((Math.random() - 0.5) * 60, Math.random() * 40 + 8, (Math.random() - 0.5) * 60);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        this.scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.9 })));
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

    checkIntersection(event, objects) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(objects, true);
        return intersects.length > 0 ? intersects[0] : null;
    }
}

// 由于代码太长，请查看下一个文件继续...
console.log('✅ 模块加载完成 - scene');
export { SceneManager, THREE, CARD_CONFIG, MIKO_CONFIG, ANIMATION_CONFIG, GIFT_TO_FORTUNE, API_CONFIG };
