import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// API 配置
export const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api'
};

// 礼物到签类型的映射
export const GIFT_TO_FORTUNE = {
    'love': { id: 'love', name: '爱情运势', emoji: '💖', color: 0xff1493, gift: '小心心' },
    'daily': { id: 'daily', name: '日常运势', emoji: '🍭', color: 0xff69b4, gift: '棒棒糖' },
    'career': { id: 'career', name: '事业运势', emoji: '🕶️', color: 0x4169e1, gift: '墨镜' },
    'health': { id: 'health', name: '健康运势', emoji: '🍺', color: 0x32cd32, gift: '大啤酒' },
    'wealth': { id: 'wealth', name: '财富运势', emoji: '💐', color: 0xffd700, gift: '花束' }
};

// 卡片配置
export const CARD_CONFIG = {
    width: 2.5,
    height: 3.5,
    depth: 0.08,
    position: { x: 0, y: 2.5, z: 0 }
};

// 场景配置
export const SCENE_CONFIG = {
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
export const MIKO_CONFIG = {
    position: { x: 0, y: 7, z: -2 },
    scale: 0.6,
    headColor: 0xffdab9,
    hairColor: 0x2c2c2c,
    bodyColor: 0xffffff,
    ribbonColor: 0xff0000,
    hakamaColor: 0xdc143c
};

// 粒子配置
export const PARTICLE_CONFIG = {
    count: 1000,
    size: 0.05,
    color: 0xffffff,
    emissionRate: 50
};

// 动画配置
export const ANIMATION_CONFIG = {
    cardFlipDuration: 1000,
    cardResetDelay: 10000,
    particleBurstDuration: 2000,
    mikoShakeDuration: 500,
    hammerSwingDuration: 600
};

export { THREE, OrbitControls };
