# 魔女Lili智能体系统使用说明

## 概述

魔女Lili已经从简单的3D几何模型升级为具有自我意识的智能体角色。她现在拥有情感状态、自主行为和与观众互动的能力。**所有对话内容完全由AI模型生成,无任何预设文本。**

## 核心特性

### 1. 智能体状态系统

Lili拥有完整的内部状态管理:

- **情绪状态** (mood): happy, excited, thinking, tired, surprised
- **能量值** (energy): 0-100,影响行为活跃度
- **个性特征**:
  - 友好度 (friendliness): 0.8
  - 好奇心 (curiosity): 0.7
  - 耐心 (patience): 0.6

### 2. 自主行为系统

Lili会根据状态自动执行不同行为:

#### 空闲行为 (idle)
- 轻微摇摆头部
- 魔法光环缓慢旋转
- 轻微浮动

#### 打招呼行为 (greeting)
- 挥动魔杖
- 显示欢迎消息
- 持续3秒

#### 思考行为 (thinking)
- 头部倾斜
- 魔杖发光增强
- 随机说出占卜相关的话
- 持续5秒

#### 庆祝行为 (celebrating)
- 跳跃动画
- 魔杖快速挥舞
- 魔法光环加速旋转
- 持续4秒

#### 休息行为 (resting)
- 缓慢呼吸动画
- 能量恢复
- 能量恢复到60%后回到空闲状态

### 3. 事件响应系统

Lili会对直播间事件做出反应:

#### 礼物接收
```javascript
// 收到礼物时
- 情绪变为excited
- 能量+10
- 切换到celebrating行为
- 通过AI生成个性化感谢消息
  * 传递事件类型: 'gift'
  * 传递用户和礼物信息
  * AI根据上下文生成自然回复
```

#### 观众进场
```javascript
// 有观众进入直播间时
- 30%概率打招呼(基于友好度)
- 切换到greeting行为
- 通过AI生成个性化欢迎消息
  * 传递事件类型: 'member'
  * 传递用户信息
  * AI根据上下文生成自然回复
```

#### 抽签结果播报 ⭐新功能
```javascript
// 当观众抽签后
- 情绪变为excited
- 切换到thinking行为
- 通过AI生成个性化占卜解读
  * 传递事件类型: 'fortune'
  * 传递用户名、签文等级(上上签/上签/中签/下签/下下签)和运势类型
  * AI根据签文内容生成专属解读
  * 显示时长4秒
- 示例调用:
  witchLiliAgent.onFortuneResult('张三', '上上签', 'love')
```

### 4. 自主对话系统

Lili每10秒会执行一次自主行为:

- 能量消耗-5
- 能量<30时自动休息
- 21%概率随机说话(基于好奇心0.7 × 0.3)
- **通过AI生成自主思考内容**
  * 传递事件类型: 'autonomous'
  * AI根据当前状态生成思考内容
  * 内容可能包括占卜、魔法、观察等话题
  * 显示时长3秒

### 5. 3D模型支持

系统支持两种渲染模式:

#### GLTF/GLB模型模式
```javascript
// 如果提供了3D模型文件
- 自动加载 ./models/lili.glb
- 支持骨骼动画
- 支持多个动画片段
- 自动启用阴影
```

#### 几何体备用模式
```javascript
// 如果模型加载失败
- 使用Three.js几何体构建
- 紫色魔法袍
- 魔女帽
- 魔杖和魔法光环
- 眨眼动画
```

## 使用方法

### 基础使用

系统会自动初始化智能体模式:

```javascript
// 在game-main.js中
const game = new FortuneGame();
await game.init(); // 自动使用智能体模式
```

### 获取智能体状态

```javascript
// 获取当前状态
const state = game.getLiliState();
console.log(state);
// 输出:
// {
//   mood: 'happy',
//   energy: 85,
//   attention: null,
//   lastInteraction: 1234567890,
//   personality: { friendliness: 0.8, curiosity: 0.7, patience: 0.6 },
//   currentBehavior: 'idle',
//   isSpeaking: false
// }
```

### 手动触发行为

```javascript
// 让Lili说话
game.witchLiliAgent.speak('你好呀～', 3000);

// 改变情绪
game.witchLiliAgent.setMood('excited');

// 与AI交互
await game.witchLiliAgent.interactWithAI('今天运势如何?');

// 播报抽签结果(新功能)
game.witchLiliAgent.onFortuneResult('用户名', '上上签', 'love');
```

### 键盘控制

可以使用键盘移动Lili:

```javascript
// 在interactions.js中已集成
// 方向键控制移动
// 位置会自动保存到localStorage
```

## 技术架构

### 文件结构

```
webgl/js/
├── witch-lili-agent.js    # 智能体核心类
├── witch-lili.js          # 传统版本(备用)
├── game-main.js           # 游戏主类(已集成智能体)
└── interactions.js        # 交互管理器
```

### 类结构

```javascript
class WitchLiliAgent {
    constructor(scene)
    
    // 初始化
    async init()
    async load3DModel()
    createGeometricModel()
    
    // 智能体系统
    startAgentSystem()
    setupEventListeners()
    scheduleAutonomousBehavior()
    executeAutonomousBehavior()
    
    // 行为系统
    idleBehavior(deltaTime)
    greetingBehavior(deltaTime)
    thinkingBehavior(deltaTime)
    celebratingBehavior(deltaTime)
    restingBehavior(deltaTime)
    
    // 交互系统
    onGiftReceived(data)
    onMemberJoin(data)
    onFortuneResult(username, grade, topic)  // 新增
    speak(text, duration)
    create3DTextBubble(text, duration)
    
    // AI集成
    async interactWithAI(message, eventType, eventData)
    
    // 工具方法
    update(time)
    moveWithKeyboard(direction)
    getState()
    setMood(mood)
}
```

## 配置选项

### 在game-main.js中切换模式

```javascript
class FortuneGame {
    constructor() {
        this.useAgent = true; // 设为false使用传统模式
    }
}
```

### 调整智能体参数

在witch-lili-agent.js中修改:

```javascript
// 自主行为间隔
this.autonomousInterval = 10000; // 毫秒

// 个性特征
this.agentState.personality = {
    friendliness: 0.8,  // 友好度
    curiosity: 0.7,     // 好奇心
    patience: 0.6       // 耐心
};
```

## 后端AI集成

### API接口

```javascript
// POST /api/fortune/chat
{
    "message": "用户消息或事件描述",
    "username": "Lili",
    "agent_state": {
        "mood": "happy",
        "energy": 85,
        "currentBehavior": "idle",
        "personality": {
            "friendliness": 0.8,
            "curiosity": 0.7,
            "patience": 0.6
        }
    },
    "event_type": "gift|member|autonomous|chat|fortune",
    "event_data": {
        "user_name": "用户名",
        "user_id": "用户ID",
        "gift_name": "礼物名称",
        "gift_count": 1,
        "grade": "上上签",      // fortune事件专用
        "topic": "love"         // fortune事件专用
    }
}
```

### 响应格式

```javascript
{
    "success": true,
    "response": "AI生成的个性化回复"
}
```

### AI特性

- **完全AI驱动**: 所有对话由DeepSeek模型生成,无预设文本
- **上下文感知**: 传递智能体状态和事件信息
- **事件类型识别**: 根据不同事件生成相应内容
- **个性化**: 基于Lili的性格特征生成回复
- **异步处理**: 不阻塞主线程

## 调试技巧

### 查看智能体状态

```javascript
// 在浏览器控制台
window.game.getLiliState()
```

### 监听事件

```javascript
// 监听礼物事件
window.socketManager.on('gift', (data) => {
    console.log('收到礼物:', data);
});
```

### 强制触发行为

```javascript
// 强制进入庆祝状态
const agent = window.game.witchLiliAgent;
agent.currentBehavior = 'celebrating';
agent.behaviorTimer = 0;
```

## 性能优化

1. **动画混合器**: 仅在使用3D模型时启用
2. **对话队列**: 避免对话重叠
3. **能量管理**: 自动调节活跃度
4. **事件节流**: 避免频繁触发

## 功能特性总结

### 已实现功能 ✅

1. **智能体状态系统**: 情绪、能量、个性特征
2. **自主行为系统**: 空闲、打招呼、思考、庆祝、休息
3. **事件响应系统**: 礼物、进场、抽签结果
4. **自主对话系统**: 定时随机说话
5. **AI完全驱动**: 所有对话由DeepSeek生成
6. **3D模型支持**: GLTF/GLB或几何体备用
7. **抽签结果播报**: 个性化占卜解读 ⭐新增

### 使用场景示例

#### 场景1: 观众抽签
```javascript
// 用户"小明"抽到了爱情运势的上上签
game.witchLiliAgent.onFortuneResult('小明', '上上签', 'love');
// Lili会说: "恭喜小明抽到了上上签!爱情运势大吉,桃花朵朵开..."
```

#### 场景2: 直播间礼物
```javascript
// 用户"小红"送了礼物
game.witchLiliAgent.onGiftReceived({
    user_name: '小红',
    gift_name: '玫瑰',
    gift_count: 1
});
// Lili会说: "谢谢小红送的玫瑰!愿你的心愿都能实现~"
```

#### 场景3: 自主思考
```javascript
// 每10秒自动触发,21%概率说话
// Lili可能会说: "今天的星象很特别呢,适合许愿哦~"
```

## 未来扩展

### 计划功能

1. **更多情绪状态**: 添加angry, sad, confused等
2. **记忆系统**: 记住常客和互动历史
3. **学习能力**: 根据互动调整行为
4. **多语言支持**: 支持英文等其他语言
5. **表情动画**: 更丰富的面部表情
6. **手势识别**: 识别观众手势并响应
7. **连续对话**: 支持多轮对话上下文

### 3D模型要求

如果要使用自定义3D模型:

1. 格式: GLTF/GLB
2. 位置: `webgl/models/lili.glb`
3. 建议动画:
   - idle (空闲)
   - wave (挥手)
   - celebrate (庆祝)
   - think (思考)
   - rest (休息)

## 常见问题

### Q: 为什么Lili不说话?
A: 检查socketManager是否正确初始化,确保直播间已连接。

### Q: 如何禁用智能体模式?
A: 在game-main.js中设置 `this.useAgent = false`

### Q: 能量耗尽会怎样?
A: Lili会自动进入休息状态,能量恢复到60%后继续活动。

### Q: 如何添加新的行为?
A: 在witch-lili-agent.js的behaviors对象中添加新方法。

### Q: 抽签结果如何触发Lili播报?
A: 在抽签完成后调用 `witchLiliAgent.onFortuneResult(username, grade, topic)`,Lili会自动生成个性化解读。

### Q: 如何调整Lili说话的频率?
A: 修改witch-lili-agent.js中的 `this.autonomousInterval`(默认10000ms)和好奇心参数(默认0.7)。

## 技术支持

如有问题,请查看:
- 浏览器控制台日志
- 后端服务器日志
- 网络请求状态

---

**版本**: 1.1.0
**更新日期**: 2025-11-21
**作者**: Kilo Code
**新增功能**: 抽签结果AI播报、自主对话优化