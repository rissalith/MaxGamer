import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log('🎮 开始加载游戏模块...');

// 等待所有其他模块加载
import('./cards.js').then(() => console.log('✅ cards.js 加载'));
import('./miko.js').then(() => console.log('✅ miko.js 加载'));
import('./particles.js').then(() => console.log('✅ particles.js 加载'));
import('./interactions.js').then(() => console.log('✅ interactions.js 加载'));
import('./scene.js').then(() => console.log('✅ scene.js 加载'));
import('./config.js').then(() => console.log('✅ config.js 加载'));

// 导出 THREE 供其他模块使用
window.THREE = THREE;
window.OrbitControls = OrbitControls;

console.log('✅ 核心模块已导出到 window');
