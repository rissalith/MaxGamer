# Prompt 自定义配置指南

## 概述

FrameWorker 支持通过环境变量自定义 AI 生成精灵图的 Prompt 模板，让你可以根据需求调整生成效果。

## 默认 Prompt 约束位置

默认的 Prompt 约束定义在 [`backend/server.js`](backend/server.js) 第100-110行：

```javascript
const defaultTemplate = `Create a sprite sheet with {rows}x{cols} grid layout showing {frameCount} animation frames. {prompt}. The sprite sheet should have: multiple poses in sequence, consistent character design across all frames, transparent or uniform background, game asset style, pixel-perfect alignment in grid, animation sequence from left to right, top to bottom.`;
```

## 如何自定义 Prompt

### 方法1：通过环境变量（推荐）

1. 在 `backend/.env` 文件中添加 `PROMPT_TEMPLATE` 配置：

```env
PROMPT_TEMPLATE=你的自定义模板内容
```

2. 模板中可以使用以下占位符：
   - `{rows}` - 精灵图的行数
   - `{cols}` - 精灵图的列数
   - `{frameCount}` - 动画帧数
   - `{prompt}` - 用户输入的描述文字

### 方法2：直接修改代码

如果你需要永久修改默认模板，可以直接编辑 [`backend/server.js`](backend/server.js:103) 中的 `defaultTemplate` 变量。

## 示例配置

### 示例1：简化版模板

```env
PROMPT_TEMPLATE=Create a {rows}x{cols} sprite sheet with {frameCount} frames. {prompt}
```

### 示例2：像素风格强化

```env
PROMPT_TEMPLATE=Create a pixel art sprite sheet with {rows}x{cols} grid, {frameCount} animation frames. {prompt}. Style: 16-bit pixel art, retro game aesthetic, clear outlines, limited color palette, transparent background.
```

### 示例3：3D渲染风格

```env
PROMPT_TEMPLATE=Generate a 3D rendered sprite sheet {rows}x{cols} layout with {frameCount} frames. {prompt}. Requirements: high quality 3D render, consistent lighting, smooth animation sequence, professional game asset quality.
```

### 示例4：卡通风格

```env
PROMPT_TEMPLATE=Create an animated sprite sheet {rows}x{cols} with {frameCount} cartoon-style frames. {prompt}. Style: vibrant colors, exaggerated expressions, smooth animation, clean lines, suitable for 2D games.
```

### 示例5：中文模板

```env
PROMPT_TEMPLATE=创建一个 {rows}x{cols} 的精灵图，包含 {frameCount} 帧动画。{prompt}。要求：动作连贯、风格统一、背景透明、适合游戏使用。
```

## 应用配置

修改 `.env` 文件后，需要重启后端服务才能生效：

```bash
# 停止当前服务（Ctrl+C）
# 然后重新启动
cd backend
node server.js
```

## 测试你的模板

1. 修改 `.env` 文件中的 `PROMPT_TEMPLATE`
2. 重启后端服务
3. 在前端输入简单的描述（如"一个跑步的角色"）
4. 观察生成效果是否符合预期
5. 根据结果调整模板

## 注意事项

- 占位符必须使用花括号 `{}` 包裹
- 确保模板中包含 `{prompt}` 占位符，否则用户输入将被忽略
- 模板不要过长，建议控制在500字符以内
- 不同的 AI 模型对 Prompt 的理解可能有差异
- 建议先用默认模板测试，再逐步调整

## 高级技巧

### 条件性约束

你可以在模板中添加多个约束条件，用逗号或句号分隔：

```env
PROMPT_TEMPLATE={prompt}. Create {frameCount} frames in {rows}x{cols} grid. Requirements: 1) consistent character design, 2) smooth animation flow, 3) transparent background, 4) game-ready quality, 5) proper frame alignment.
```

### 风格混合

```env
PROMPT_TEMPLATE=Sprite sheet {rows}x{cols}, {frameCount} frames. {prompt}. Blend of pixel art and hand-drawn style, vibrant colors, dynamic poses, professional game asset.
```

## 故障排除

### 问题1：修改后没有生效
- 确认已重启后端服务
- 检查 `.env` 文件格式是否正确
- 查看终端是否有错误信息

### 问题2：生成效果不理想
- 尝试调整模板的描述方式
- 增加或减少约束条件
- 测试不同的 AI 模型

### 问题3：占位符没有被替换
- 确认占位符使用了正确的花括号 `{}`
- 检查占位符名称是否正确（区分大小写）

## 相关文件

- [`backend/server.js`](backend/server.js) - Prompt 处理逻辑
- [`backend/.env.example`](backend/.env.example) - 环境变量示例
- [`frontend/js/modules/aiGenerator.js`](frontend/js/modules/aiGenerator.js) - 前端 AI 生成模块

## 反馈与建议

如果你发现了好用的 Prompt 模板，欢迎分享！