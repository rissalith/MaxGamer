/**
 * 应用常量定义
 */

const Constants = {
    // AI模型名称映射
    AI_MODELS: {
        'gemini-3-pro-image-preview': 'Gemini 3 Pro Image Preview',
        'gemini-2.5-image': 'Gemini 2.5 Flash Image',
        'gemini-2.5-image-preview': 'Gemini 2.5 Flash Image Preview',
        'dalle': 'DALL-E 3'
    },
    
    // 背景颜色文本映射
    BG_COLORS: {
        'green': '纯绿色背景',
        'blue': '纯蓝色背景',
        'white': '纯白色背景'
    },
    
    // 背景取色模式
    BG_MODES: {
        GREEN: 'green',
        TOP_LEFT: 'topLeft',
        TOP_RIGHT: 'topRight',
        BOTTOM_LEFT: 'bottomLeft',
        BOTTOM_RIGHT: 'bottomRight',
        CENTER: 'center',
        AUTO: 'auto'
    },
    
    // GIF配置
    GIF_CONFIG: {
        WORKERS: 2,
        QUALITY: 10,
        WORKER_SCRIPT: 'lib/gif.worker.js'
    },
    
    // WebP配置
    WEBP_CONFIG: {
        QUALITY: 0.9,
        COMPRESSION_LEVEL: 9
    },
    
    // API端点
    API: {
        GENERATE_SPRITE: '/api/generate-sprite-animation'
    }
};

// 导出常量对象
window.Constants = Constants;