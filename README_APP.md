# FrameWorker 桌面应用

## 快速开始

### 1. 安装依赖

```powershell
npm install
```

### 2. 运行应用

```powershell
npm start
```

### 3. 打包应用

打包为 Windows 安装程序：

```powershell
npm run build:win
```

打包完成后，安装包会在 `dist` 目录中。

## 项目结构

```
FrameWorker/
├── main.js           # Electron 主进程
├── package.json      # 项目配置和依赖
├── frontend/         # 前端文件
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── gif.js
│   └── gif.worker.js
├── backend/          # 可选的后端（不需要）
└── dist/            # 打包输出目录
```

## 功能特性

- ✅ 独立桌面应用，无需浏览器
- ✅ 快捷键支持（Ctrl+O 打开图片）
- ✅ 原生菜单栏
- ✅ 所有功能完整保留
- ✅ 离线运行

## 系统要求

- Windows 7 或更高版本
- 64位操作系统

## 开发

调试模式运行：

```powershell
npm run dev
```

## 注意事项

1. 首次运行需要安装 Electron（约 100MB）
2. 打包后的应用大小约 150-200MB
3. 不再需要运行后端服务器
4. 所有处理都在本地完成，数据不上传

## 自定义图标

如果需要自定义应用图标：

1. 准备一个 PNG 图标（建议 512x512）
2. 使用在线工具转换为 ICO 格式
3. 放到 `build/icon.ico` 路径
4. 重新打包

## 常见问题

### Q: 应用启动慢？
A: 首次启动需要加载 Electron，后续会更快。

### Q: 可以打包成便携版吗？
A: 可以，修改 `package.json` 中的 `build.win.target` 为 `"portable"`。

### Q: Mac 版本？
A: 添加配置：
```json
"mac": {
  "target": ["dmg"],
  "icon": "build/icon.icns"
}
```
然后运行 `npm run build`。
