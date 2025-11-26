# VisionGuard Pro - Chrome Extension 开发指南

本指南将教你如何将当前的 Web 应用打包成一个**本地 Chrome 浏览器扩展**。
变成扩展后，它将拥有更高权限，可以在浏览器后台持续运行，即使你切换标签页也能实时监控。

## 🚀 快速开始

### 第一步：准备文件
在你的项目根目录下（即 `index.html` 同级目录），你需要创建两个新文件：`manifest.json` 和 `background.js`。

#### 1. 创建 `manifest.json`
这是扩展的身份证，告诉浏览器它的名称、权限和入口。

```json
{
  "manifest_version": 3,
  "name": "VisionGuard AI Pro",
  "version": "1.0",
  "description": "基于 AI 的视力保护与姿态监控扩展",
  "permissions": [
    "videoCapture",
    "notifications",
    "storage",
    "alarms"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "index.html",
    "default_title": "打开 VisionGuard"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icon16.png", 
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```
*(注意：你需要自己找一张图片命名为 icon128.png 等放在根目录，或者在 manifest 中删除 icons 字段)*

#### 2. 创建 `background.js`
这是扩展的后台进程，用于处理系统级通知和生命周期管理。

```javascript
// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("VisionGuard AI Installed");
});

// 示例：监听来自前端的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ALERT_USER') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png', // 确保你有这个图标，或者留空
      title: '⚠️ 距离过近警告',
      message: request.message || '请立即调整坐姿！',
      priority: 2
    });
  }
});
```

### 第二步：修改 Web 代码以适配扩展 (可选)
目前的 Web 代码已经可以直接作为 Popup 运行。但为了更好的体验，你可以在 `App.tsx` 中检测是否在扩展环境中运行：

```typescript
const isExtension = !!(window.chrome && chrome.runtime && chrome.runtime.id);
```

如果检测到 `isExtension` 为 true，你可以使用 `chrome.runtime.sendMessage` 来替代浏览器原生的 `Notification` API，这样通知体验更原生。

### 第三步：加载到 Chrome

1.  打开 Chrome 浏览器，在地址栏输入：`chrome://extensions/`
2.  开启右上角的 **"开发者模式" (Developer mode)** 开关。
3.  点击左上角的 **"加载已解压的扩展程序" (Load unpacked)**。
4.  选择你的**项目根目录**文件夹。
5.  🎉 成功！你应该能在浏览器右上角看到插件图标了。

## 🌟 进阶功能实现

如果你希望实现**“即便关闭弹窗也能一直监控”**的功能，你需要使用 `Offscreen Documents` API。

因为 Chrome 扩展的 Popup (弹窗) 一旦点击别处就会关闭并销毁，无法在后台持续运行摄像头。

**解决方案：**
1.  在 `manifest.json` 的 `permissions` 中添加 `"offscreen"`。
2.  在 `background.js` 中创建一个隐藏的 HTML 页面来承载摄像头逻辑。

这属于高级开发内容，目前的 Web 版配合**“悬浮窗模式”**已经能覆盖绝大多数使用场景。
