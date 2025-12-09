import { THREE, OrbitControls, SCENE_CONFIG } from './config-module.js';

// 场景管理器
export class SceneManager {
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
