// API 配置 - 环境感知
const API_CONFIG = {
    // 根据当前环境自动选择API地址
    BASE_URL: (() => {
        const hostname = window.location.hostname;
        
        // 生产环境：通过域名访问
        if (hostname === 'play-witch.xmframer.com' || hostname === 'witch.xmframer.com') {
            return `${window.location.protocol}//${hostname}/api/fortune`;
        }
        
        // 开发环境：本地访问（抖音版使用端口3000）
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api/fortune';
        }
        
        // 默认：使用相对路径（Docker内部）
        return '/api/fortune';
    })()
};

// 打印当前API配置（调试用）
console.log('🔧 API配置:', API_CONFIG.BASE_URL);

// 礼物到签类型的映射（竖屏布局 - 弧形排列，增加距离感和层次感）
// 弧形参数：半径8，角度范围-50°到50°，中心点在(0, 2.5, -3)
const GIFT_TO_FORTUNE = {
    'daily': {
        id: 'daily',
        name: '日常运势',
        emoji: '❤️',
        color: 0xff69b4,
        bgColor: 0xfff0f5,
        gift: '小心心',
        position: { x: -4.9, y: 4.5, z: 3.1 }  // 左侧 -50°，提高2个单位
    },
    'love': {
        id: 'love',
        name: '爱情运势',
        emoji: '💐',
        color: 0xff1493,
        bgColor: 0xffe4e1,
        gift: '鲜花',
        position: { x: -2.5, y: 4.5, z: 1.8 }  // 左中 -25°，提高2个单位
    },
    'wealth': {
        id: 'wealth',
        name: '财富运势',
        emoji: '🍭',
        color: 0xffd700,
        bgColor: 0xfffacd,
        gift: '棒棒糖',
        position: { x: 0, y: 4.5, z: 1.2 }  // 中央 0°，提高2个单位
    },
    'health': {
        id: 'health',
        name: '健康运势',
        emoji: '🍺',
        color: 0x32cd32,
        bgColor: 0xf0fff0,
        gift: '大啤酒',
        position: { x: 2.5, y: 4.5, z: 1.8 }  // 右中 25°，提高2个单位
    },
    'career': {
        id: 'career',
        name: '事业运势',
        emoji: '🕶️',
        color: 0x4169e1,
        bgColor: 0xe6f2ff,
        gift: 'Thuglife',
        position: { x: 4.9, y: 4.5, z: 3.1 }  // 右侧 50°，提高2个单位
    }
};

// 卡片配置（竖屏优化 - 更大更清晰）
const CARD_CONFIG = {
    width: 1.8,  // 增大宽度
    height: 2.7,  // 增大高度
    depth: 0.08,
    position: { x: 0, y: 4.5, z: 0 }  // 提高2个单位
};

// 场景配置（竖屏优化 - 确保所有5张卡片都可见）
const SCENE_CONFIG = {
    backgroundColor: 0x1a1a2e,
    cameraPosition: { x: 0, y: 8, z: 12 },  // 提高相机高度，更好的俯视角度
    cameraFov: 65,  // 增大FOV以容纳所有5张卡片
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 0.7,
    directionalLightColor: 0xffffff,
    directionalLightIntensity: 0.9,
    directionalLightPosition: { x: 3, y: 8, z: 5 },
    aspectRatio: 9 / 16  // 竖屏比例
};

// 巫女配置（竖屏优化 - 放在左前方,不遮挡卡牌）
const MIKO_CONFIG = {
    position: { x: 0, y: 0.8, z: 3 },  // 中央前方位置
    scale: 0.8,  // 缩小一些
    headColor: 0xffdab9,
    hairColor: 0x2c2c2c,
    bodyColor: 0xffffff,
    ribbonColor: 0xff0000,
    hakamaColor: 0xdc143c,
    // 对话配置
    dialogues: [
        '点击左侧礼物按钮开始抽签吧！',
        '不同的礼物对应不同的运势哦~',
        '抽到上上签会有特别的特效！',
        '卡片5秒后会自动翻回去哦~',
        '来试试你的运气吧！',
        '每个礼物都有独特的含义呀~'
    ],
    dialogInterval: { min: 8000, max: 15000 }  // 8-15秒间隔
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
    cardResetDelay: 5000,  // 改为5秒
    particleBurstDuration: 2000,
    mikoShakeDuration: 500,
    hammerSwingDuration: 600
};

// 稀有度等级配置
const RARITY_CONFIG = {
    '上上签': {
        level: 5,
        color: 0xff0000,
        glowIntensity: 3.0,
        glowColor: 0xff0000,
        particleCount: 200,
        particleSize: 0.25,
        ringCount: 3,
        starfallIntensity: 2.0,
        effects: ['burst', 'ring', 'starfall', 'spiral', 'glow']
    },
    '上签': {
        level: 4,
        color: 0xff6600,
        glowIntensity: 2.0,
        glowColor: 0xff6600,
        particleCount: 150,
        particleSize: 0.2,
        ringCount: 2,
        starfallIntensity: 1.5,
        effects: ['burst', 'ring', 'starfall', 'glow']
    },
    '中签': {
        level: 3,
        color: 0xffd700,
        glowIntensity: 1.5,
        glowColor: 0xffd700,
        particleCount: 100,
        particleSize: 0.15,
        ringCount: 1,
        starfallIntensity: 1.0,
        effects: ['burst', 'ring', 'glow']
    },
    '下签': {
        level: 1,
        color: 0x808080,
        glowIntensity: 0.5,
        glowColor: 0x666666,
        particleCount: 40,
        particleSize: 0.1,
        ringCount: 0,
        starfallIntensity: 0,
        effects: ['burst']
    },
    '下下签': {
        level: 0,
        color: 0x4d4d4d,
        glowIntensity: 0.2,
        glowColor: 0x333333,
        particleCount: 20,
        particleSize: 0.06,
        ringCount: 0,
        starfallIntensity: 0,
        effects: []
    }
};
