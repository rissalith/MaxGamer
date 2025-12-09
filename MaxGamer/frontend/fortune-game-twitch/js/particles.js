// 粒子特效管理器
class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];
    }

    // 根据稀有度创建所有特效
    createRarityEffects(position, level, giftColor) {
        // 支持levelText（中文）或level（英文）
        const levelText = level || '未知';
        const rarityConfig = RARITY_CONFIG[levelText];
        
        if (!rarityConfig) {
            console.warn(`未找到等级配置: ${levelText}，使用默认效果`);
            // 使用基础效果
            this.createBurst(position, giftColor, 50, 0.1);
            return;
        }

        console.log(`创建 ${levelText} 特效，稀有度: ${rarityConfig.level}`);

        // 只为上上签和上签添加庆祝粒子效果
        if (levelText === '上上签') {
            // 上上签：金色粒子爆炸 + 多层光环 + 环绕效果 + 星雨
            this.createBurst(position, 0xffd700, 200, 0.25);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.createMagicRing(position, 0xffd700);
                }, i * 300);
            }
            // 创建持续环绕效果
            const orbitEffect = this.createOrbitEffect(position, 0xffd700);
            return orbitEffect;  // 返回环绕效果供卡片管理
            this.createStarfall(position, 2.0, 0xffd700);
        } else if (levelText === '上签') {
            // 上签：紫色粒子爆炸 + 双层光环 + 星雨
            this.createBurst(position, 0x9370db, 150, 0.2);
            for (let i = 0; i < 2; i++) {
                setTimeout(() => {
                    this.createMagicRing(position, 0x9370db);
                }, i * 300);
            }
            this.createStarfall(position, 1.5, 0x9370db);
        } else if (levelText === '中签') {
            // 中签：橙色粒子 + 单层光环
            this.createBurst(position, 0xffa500, 100, 0.15);
            this.createMagicRing(position, 0xffa500);
        } else {
            // 下签和下下签：简单粒子效果
            this.createBurst(position, giftColor, 50, 0.1);
        }
        
        return null;  // 其他等级不返回持续效果
    }

    // 创建粒子爆发效果（支持自定义数量和大小）
    createBurst(position, color = 0xffffff, particleCount = 100, particleSize = 0.15) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const lifetimes = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
            
            // 随机速度
            const speed = 2 + Math.random() * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 2,
                Math.cos(phi) * speed
            );
            
            lifetimes.push(1 + Math.random());
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));

        const material = new THREE.PointsMaterial({
            color: color,
            size: particleSize,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        const startTime = Date.now();
        const duration = ANIMATION_CONFIG.particleBurstDuration;

        const particleSystem = {
            particles: particles,
            startTime: startTime,
            duration: duration,
            update: () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / (duration / 1000), 1);

                if (progress >= 1) {
                    return false; // 移除此粒子系统
                }

                const positions = particles.geometry.attributes.position.array;
                const velocities = particles.geometry.attributes.velocity.array;
                const lifetimes = particles.geometry.attributes.lifetime.array;

                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    
                    // 更新位置
                    positions[i3] += velocities[i3] * 0.016;
                    positions[i3 + 1] += velocities[i3 + 1] * 0.016;
                    positions[i3 + 2] += velocities[i3 + 2] * 0.016;
                    
                    // 重力
                    velocities[i3 + 1] -= 9.8 * 0.016;
                }

                particles.geometry.attributes.position.needsUpdate = true;
                material.opacity = 1 - progress;

                return true;
            }
        };

        this.particleSystems.push(particleSystem);
    }

    // 创建魔法光环效果
    createMagicRing(position, color = 0x667eea) {
        const geometry = new THREE.RingGeometry(0.5, 0.6, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);

        const startTime = Date.now();
        const duration = 1000;

        const ringSystem = {
            particles: ring,
            startTime: startTime,
            duration: duration,
            update: () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                if (progress >= 1) {
                    return false;
                }

                ring.scale.setScalar(1 + progress * 2);
                material.opacity = 0.8 * (1 - progress);

                return true;
            }
        };

        this.particleSystems.push(ringSystem);
    }

    // 创建星星飘落效果
    createStarfall(position, intensity = 1.0, color = 0xffd700) {
        const starCount = Math.floor(20 * intensity);
        if (starCount === 0) return;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < starCount; i++) {
            const offsetX = (Math.random() - 0.5) * 2;
            const offsetZ = (Math.random() - 0.5) * 2;
            
            positions.push(
                position.x + offsetX,
                position.y + 2,
                position.z + offsetZ
            );
            
            velocities.push(
                (Math.random() - 0.5) * 0.5,
                -1 - Math.random() * 2,
                (Math.random() - 0.5) * 0.5
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

        // 使用星形纹理
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.2 * intensity,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);

        const startTime = Date.now();
        const duration = 2000;

        const starSystem = {
            particles: stars,
            startTime: startTime,
            duration: duration,
            update: () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                if (progress >= 1) {
                    return false;
                }

                const positions = stars.geometry.attributes.position.array;
                const velocities = stars.geometry.attributes.velocity.array;

                for (let i = 0; i < starCount; i++) {
                    const i3 = i * 3;
                    positions[i3] += velocities[i3] * 0.016;
                    positions[i3 + 1] += velocities[i3 + 1] * 0.016;
                    positions[i3 + 2] += velocities[i3 + 2] * 0.016;
                }

                stars.geometry.attributes.position.needsUpdate = true;
                material.opacity = 1 - progress;

                return true;
            }
        };

        this.particleSystems.push(starSystem);
    }

    // 创建环绕卡片效果（上上签专属，持续显示）
    createOrbitEffect(position, color = 0xffd700) {
        const particleCount = 60;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const angles = [];
        const heights = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
            angles.push((i / particleCount) * Math.PI * 2);
            heights.push(Math.random() * 2.5 - 1.25);  // 在卡片上下范围内
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('angle', new THREE.Float32BufferAttribute(angles, 1));
        geometry.setAttribute('height', new THREE.Float32BufferAttribute(heights, 1));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.25,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const orbit = new THREE.Points(geometry, material);
        this.scene.add(orbit);

        const startTime = Date.now();

        const orbitSystem = {
            particles: orbit,
            startTime: startTime,
            basePosition: position.clone(),
            isPersistent: true,  // 标记为持续效果
            update: () => {
                const elapsed = Date.now() - startTime;
                const time = elapsed * 0.001;  // 转换为秒

                const positions = orbit.geometry.attributes.position.array;
                const angles = orbit.geometry.attributes.angle.array;
                const heights = orbit.geometry.attributes.height.array;

                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const baseRadius = 2.0;  // 环绕半径
                    const angle = angles[i] + time * 0.8;  // 缓慢旋转
                    
                    // 添加波动效果
                    const radiusWave = Math.sin(time * 2 + i * 0.1) * 0.3;
                    const radius = baseRadius + radiusWave;

                    positions[i3] = orbitSystem.basePosition.x + Math.cos(angle) * radius;
                    positions[i3 + 1] = orbitSystem.basePosition.y + heights[i] + Math.sin(time * 3 + i * 0.2) * 0.1;
                    positions[i3 + 2] = orbitSystem.basePosition.z + Math.sin(angle) * radius;
                }

                orbit.geometry.attributes.position.needsUpdate = true;
                
                // 闪烁效果
                material.opacity = 0.7 + Math.sin(time * 4) * 0.2;

                return true;  // 持续更新，不会自动消失
            }
        };

        this.particleSystems.push(orbitSystem);
        return orbitSystem;  // 返回系统引用供外部控制
    }

    // 移除指定的粒子系统
    removeParticleSystem(system) {
        if (!system) return;
        
        const index = this.particleSystems.indexOf(system);
        if (index > -1) {
            this.particleSystems.splice(index, 1);
            this.scene.remove(system.particles);
            if (system.particles.geometry) system.particles.geometry.dispose();
            if (system.particles.material) system.particles.material.dispose();
        }
    }

    update() {
        // 更新所有粒子系统，移除已完成的
        this.particleSystems = this.particleSystems.filter(system => {
            const shouldKeep = system.update();
            
            if (!shouldKeep) {
                this.scene.remove(system.particles);
                if (system.particles.geometry) system.particles.geometry.dispose();
                if (system.particles.material) system.particles.material.dispose();
            }
            
            return shouldKeep;
        });
    }
}
