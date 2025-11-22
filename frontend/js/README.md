# XMFramer 模块化架构文档

## 概述

本项目采用模块化架构，将原来的单一 `app.js` 文件拆分为多个独立的功能模块，提高代码的可维护性和可扩展性。

## 目录结构

```
frontend/js/
├── core/                    # 核心模块
│   ├── state.js            # 全局状态管理
│   └── constants.js        # 常量定义
├── modules/                 # 功能模块
│   ├── imageProcessor.js   # 图像处理（切割、去背景）
│   ├── aiGenerator.js      # AI图像生成
│   ├── gifGenerator.js     # GIF动画生成
│   ├── exporter.js         # 导出功能（GIF、WebP、精灵图）
│   └── uiManager.js        # UI管理和交互
└── main.js                  # 主入口文件
```

## 模块说明

### 核心模块 (core/)

#### state.js - 状态管理
负责管理应用的全局状态，包括：
- 原始图像
- 处理后的帧数组
- 当前GIF Blob

**主要方法：**
- `getOriginalImage()` - 获取原始图像
- `setOriginalImage(image)` - 设置原始图像
- `getProcessedFrames()` - 获取处理后的帧
- `setProcessedFrames(frames)` - 设置处理后的帧
- `getCurrentGifBlob()` - 获取当前GIF Blob
- `setCurrentGifBlob(blob)` - 设置GIF Blob
- `reset()` - 重置所有状态

#### constants.js - 常量定义
定义应用中使用的所有常量，包括：
- AI模型名称映射
- 背景颜色文本映射
- 背景取色模式
- GIF配置
- WebP配置
- API端点

### 功能模块 (modules/)

#### imageProcessor.js - 图像处理
负责图像的切割和背景去除。

**主要方法：**
- `sliceImage(image, rows, cols)` - 将图像切割成多个帧
- `removeBackground(canvas, tolerance, bgMode)` - 去除背景
- `processImage(image, params)` - 完整的图像处理流程

#### aiGenerator.js - AI生成
负责AI图像生成和加载。

**主要方法：**
- `generate(params, onProgress)` - 生成AI图像
- `loadImage(imageUrl)` - 加载生成的图像

#### gifGenerator.js - GIF生成
负责GIF动画的生成。

**主要方法：**
- `generate(frames, frameDelay, onProgress)` - 生成GIF动画

#### exporter.js - 导出功能
负责各种格式的导出。

**主要方法：**
- `downloadGIF(gifBlob)` - 下载GIF
- `exportWebPZip(frames, onProgress)` - 导出WebP帧为ZIP
- `exportProcessedSpriteSheet(frames, rows, cols, onProgress)` - 导出处理后的精灵图

#### uiManager.js - UI管理
负责UI交互和显示控制。

**主要方法：**
- `init()` - 初始化UI管理器
- `showStatus(elementId, status, message)` - 显示状态消息
- `hideStatus(elementId)` - 隐藏状态消息
- `showPreviewWindow()` - 显示预览窗口
- `hidePreviewWindow()` - 隐藏预览窗口
- `displayFrames(frames)` - 显示帧预览
- `displayGIF(gifBlob)` - 显示GIF预览
- `displaySprite(imageUrl)` - 显示精灵图预览
- `getInputParams()` - 获取输入参数
- `getAIParams()` - 获取AI生成参数
- `setRowsCols(rows, cols)` - 设置行列数
- `setButtonEnabled(buttonId, enabled)` - 启用/禁用按钮

### 主入口 (main.js)

整合所有模块，初始化应用，绑定事件处理器。

**主要方法：**
- `init()` - 初始化应用
- `handleAIGeneration()` - 处理AI生成
- `processImage()` - 处理图像
- `generateGIFPreview()` - 生成GIF预览
- `autoProcessIfImageLoaded()` - 自动处理（当参数改变时）
- `handleExportGIF()` - 处理导出GIF
- `handleExportWebP()` - 处理导出WebP
- `handleExportSprite()` - 处理导出精灵图

## 模块依赖关系

```
main.js
├── UIManager (uiManager.js)
├── AIGenerator (aiGenerator.js)
│   └── Constants (constants.js)
├── ImageProcessor (imageProcessor.js)
│   └── Constants (constants.js)
├── GIFGenerator (gifGenerator.js)
│   └── Constants (constants.js)
├── Exporter (exporter.js)
│   └── Constants (constants.js)
└── AppState (state.js)
```

## 加载顺序

HTML中的脚本加载顺序很重要，必须按以下顺序加载：

1. 外部库（JSZip、gif.js）
2. 核心模块（constants.js、state.js）
3. 功能模块（imageProcessor.js、aiGenerator.js等）
4. 主入口（main.js）

## 使用示例

### 处理图像

```javascript
// 获取参数
const params = UIManager.getInputParams();

// 处理图像
const frames = ImageProcessor.processImage(image, params);

// 保存到状态
AppState.setProcessedFrames(frames);

// 显示预览
UIManager.displayFrames(frames);
```

### 生成GIF

```javascript
// 获取帧
const frames = AppState.getProcessedFrames();

// 生成GIF
const gifBlob = await GIFGenerator.generate(frames, frameDelay, (progress) => {
    UIManager.showStatus('exportStatus', progress.status, progress.message);
});

// 保存到状态
AppState.setCurrentGifBlob(gifBlob);

// 显示预览
UIManager.displayGIF(gifBlob);
```

### 导出文件

```javascript
// 导出GIF
const gifBlob = AppState.getCurrentGifBlob();
Exporter.downloadGIF(gifBlob);

// 导出WebP
const frames = AppState.getProcessedFrames();
await Exporter.exportWebPZip(frames, onProgress);

// 导出精灵图
const { rows, cols } = UIManager.getInputParams();
Exporter.exportProcessedSpriteSheet(frames, rows, cols, onProgress);
```

## 扩展指南

### 添加新功能模块

1. 在 `modules/` 目录下创建新的模块文件
2. 定义模块对象和方法
3. 导出到 `window` 对象：`window.YourModule = YourModule;`
4. 在 `index.html` 中引入新模块
5. 在 `main.js` 中集成新功能

### 添加新的常量

在 `constants.js` 中的 `Constants` 对象中添加新的常量定义。

### 添加新的状态

在 `state.js` 中的 `AppState` 对象中添加新的状态属性和相应的 getter/setter 方法。

## 优势

1. **模块化**：每个模块职责单一，易于理解和维护
2. **可测试性**：独立的模块便于单元测试
3. **可扩展性**：添加新功能只需创建新模块
4. **代码复用**：模块可以在不同场景下复用
5. **团队协作**：不同开发者可以并行开发不同模块
6. **降低耦合**：模块间通过明确的接口通信

## 注意事项

1. 所有模块都导出到 `window` 对象，确保全局可访问
2. 模块加载顺序很重要，必须先加载依赖模块
3. 状态管理集中在 `AppState`，避免在模块间直接传递状态
4. UI操作统一通过 `UIManager` 进行，保持UI逻辑的一致性
5. 常量定义集中在 `Constants`，便于统一管理和修改