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
        this.cameraAnimation = null; // 镜头动画状态
        this.originalCameraPosition = null; // 原始镜头位置
        this.originalControlsTarget = null; // 原始控制器目标
        
        // 自定义缩放系统
        this.targetDistance = 12; // 目标距离
        this.currentDistance = 12; // 当前距离
        this.minDistance = 6;      // 最小距离
        this.maxDistance = 18;     // 最大距离
        this.zoomSpeed = 0.5;      // 缩放速度
        this.zoomDamping = 0.1;    // 缩放阻尼
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // 改为纯黑色方便看到对象
        // this.scene.fog = new THREE.Fog(SCENE_CONFIG.backgroundColor, 8, 30); // 暂时关闭雾效

        // 创建相机（竖屏优化）
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            SCENE_CONFIG.cameraFov || 65,
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
        this.renderer.setPixelRatio(window.devicePixelRatio); // 使用设备原生像素比率以获得最佳清晰度
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 设置色彩空间，确保纹理颜色正确显示
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;  // 稍微提高亮度
        
        this.container.appendChild(this.renderer.domElement);
        

        // 创建轨道控制器（竖屏优化）
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 2.5, 0); // 对准卡片群中心
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.15;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minPolarAngle = 0;     // 允许完全仰视
        this.controls.enablePan = false;
        this.controls.enableZoom = false;    // 禁用OrbitControls的缩放
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
        
        // 确保相机朝向卡片群中心
        this.camera.lookAt(0, 2.5, 0);
        this.controls.update();
        
        
        // 添加自定义滚轮缩放事件
        this.setupCustomZoom();

        // 添加光源
        this.addLights();

        // 添加地面
        this.addGround();

        // 添加星空背景
        this.addStars();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());

    }
    
    // 设置自定义缩放
    setupCustomZoom() {
        this.renderer.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            // 根据滚轮方向调整目标距离
            const delta = event.deltaY;
            const zoomAmount = delta > 0 ? this.zoomSpeed : -this.zoomSpeed;
            
            // 更新目标距离
            this.targetDistance += zoomAmount;
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        }, { passive: false });
    }
    
    // 更新相机距离（在render中调用）
    updateCameraDistance() {
        // 平滑插值到目标距离
        this.currentDistance += (this.targetDistance - this.currentDistance) * this.zoomDamping;
        
        // 获取当前相机到目标的方向
        const direction = new THREE.Vector3();
        direction.subVectors(this.camera.position, this.controls.target).normalize();
        
        // 设置新的相机位置
        this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(this.currentDistance));
    }

    addLights() {
        // 环境光（适中强度）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // 主光源（适中强度）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(
            SCENE_CONFIG.directionalLightPosition.x,
            SCENE_CONFIG.directionalLightPosition.y,
            SCENE_CONFIG.directionalLightPosition.z
        );
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // 专门照亮卡片区域的聚光灯（适中强度）
        const cardSpotLight1 = new THREE.SpotLight(0xffffff, 1.2, 30, Math.PI / 6, 0.3);
        cardSpotLight1.position.set(0, 8, 8);
        cardSpotLight1.target.position.set(0, 2.5, 0);
        this.scene.add(cardSpotLight1);
        this.scene.add(cardSpotLight1.target);

        // 额外的顶部照明（适中强度）
        const topLight = new THREE.SpotLight(0xffffff, 1.0, 25, Math.PI / 4, 0.4);
        topLight.position.set(0, 10, 3);
        topLight.target.position.set(0, 2.5, 0);
        this.scene.add(topLight);
        this.scene.add(topLight.target);

        // 从左侧打光照亮卡片（适中强度）
        const cardSpotLight2 = new THREE.SpotLight(0xffffff, 0.8, 25, Math.PI / 5, 0.5);
        cardSpotLight2.position.set(-8, 6, 5);
        cardSpotLight2.target.position.set(-2.5, 2.5, 0);
        this.scene.add(cardSpotLight2);
        this.scene.add(cardSpotLight2.target);

        // 从右侧打光照亮卡片（适中强度）
        const cardSpotLight3 = new THREE.SpotLight(0xffffff, 0.8, 25, Math.PI / 5, 0.5);
        cardSpotLight3.position.set(8, 6, 5);
        cardSpotLight3.target.position.set(2.5, 2.5, 0);
        this.scene.add(cardSpotLight3);
        this.scene.add(cardSpotLight3.target);

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
        this.updateCameraDistance(); // 更新自定义缩放
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

    // 镜头特写动画（抽到上上签时 - 聚焦到卡片本身区域）
    async zoomToCard(cardPosition, duration = 2000) {
        // 如果已经有动画在进行，先取消
        if (this.cameraAnimation) {
            return;
        }

        // 保存原始位置
        if (!this.originalCameraPosition) {
            this.originalCameraPosition = this.camera.position.clone();
            this.originalControlsTarget = this.controls.target.clone();
        }

        // 禁用控制器
        this.controls.enabled = false;

        // 计算目标位置 - 聚焦到卡片本身
        // 卡片尺寸约为 1.5 x 2.0，我们需要让镜头足够近以填充画面
        const targetPosition = new THREE.Vector3(
            cardPosition.x,
            cardPosition.y,  // 与卡片同高
            cardPosition.z + 2.5   // 距离卡片2.5单位，正好能看清整张卡片
        );

        // 观察目标直接对准卡牌中心
        const targetLookAt = new THREE.Vector3(
            cardPosition.x,
            cardPosition.y,  // 直接对准卡片中心
            cardPosition.z
        );

        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls.target.clone();
        const startTime = Date.now();

        return new Promise((resolve) => {
            this.cameraAnimation = true;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = this.easeInOutCubic(progress);

                // 插值相机位置
                this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
                
                // 插值观察目标
                const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, easeProgress);
                this.controls.target.copy(currentLookAt);
                this.camera.lookAt(currentLookAt);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 动画完成，等待一段时间后恢复
                    setTimeout(() => {
                        this.resetCamera();
                        resolve();
                    }, 3000); // 停留3秒，让观众看清楚
                }
            };

            animate();
        });
    }

    // 恢复镜头到原始位置
    resetCamera(duration = 1500) {
        if (!this.originalCameraPosition) return;

        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls.target.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeInOutCubic(progress);

            // 插值相机位置
            this.camera.position.lerpVectors(startPosition, this.originalCameraPosition, easeProgress);
            
            // 插值观察目标
            const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, this.originalControlsTarget, easeProgress);
            this.controls.target.copy(currentLookAt);
            this.camera.lookAt(currentLookAt);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 恢复控制器
                this.controls.enabled = true;
                this.cameraAnimation = null;
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
}
