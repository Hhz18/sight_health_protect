
# VisionGuard AI (Pro Edition)

VisionGuard AI 是一款基于浏览器运行的智能视力保护应用。它利用计算机视觉技术实时监测用户与屏幕的距离，结合 RPG 游戏化（Gamification）元素和 Google Gemini AI 分析，帮助用户以一种有趣、互动的方式养成良好的用眼习惯。

## ✨ 核心功能与特色

### 1. 🛡️ 智能距离防御系统 (IDDS)
*   **实时监测**: 利用 TensorFlow.js (BlazeFace) 在本地实时检测人脸大小，基于三角测量原理推算屏幕距离。
*   **迟滞保护 (Hysteresis)**: 智能识别用户微小晃动，设置缓冲带（如 40cm 报警，需退后至 45cm 才能解锁），彻底告别屏幕闪烁误报。
*   **强制接管**: 当距离过近且持续不调整时，系统会激活“红色警戒”全屏遮罩，强制停止当前工作，直到姿态恢复标准。

### 2. 🎮 游戏化成长系统 (RPG System)
为了让枯燥的健康保持变得有趣，我们引入了完整的 RPG 升级体系：
*   **XP 经验值与等级 (XP & Level)**: 
    *   只有在“人脸被检测到”且“距离安全”的状态下，才会获得 XP。
    *   随着 XP 积累，用户等级（LV）会提升，解锁更高的成就感。
*   **专注连击系统 (Combo System)**: 
    *   **机制**: 连续保持良好姿态不中断，Combo 数值会不断上升（最大 x10）。
    *   **奖励**: Combo 越高，获得的 XP 倍率越高（例如 x10 连击时，经验获取速度翻倍）。一旦姿态不端正，连击数立即归零。

### 3. 🧠 AI 健康预测引擎 (Powered by Gemini)
*   **ErgoCoach 姿态诊断**: 
    *   用户可主动发起诊断，系统截取当前画面（仅单帧），发送给 Google Gemini 2.5 Flash 模型。
    *   AI 会分析光线强度、头部倾斜角度和背景环境，给出专业的中文人体工学建议。
*   **趋势预测 (Health Prediction)**: 
    *   点击“数据核心”中的“AI 健康预测”，模型会读取用户过去 7 天的专注效率数据。
    *   **智能分析**: 识别用户的疲劳周期和习惯退化趋势。
    *   **未来可视化**: 在图表上绘制未来 3 天的预测曲线（虚线），帮助用户未雨绸缪。

### 4. 🔒 隐私优先设计 (Privacy First)
我们深知摄像头权限的敏感性，因此本应用遵循极其严格的隐私原则：
*   **本地运算**: 所有的实时视频流处理、人脸识别、距离计算**完全在用户的浏览器本地（Client-side）完成**。
*   **零视频上传**: 您的实时监控视频流**永远不会**被上传到任何服务器。
*   **按需交互**: 只有在您明确点击“开始扫描”或“AI 预测”按钮时，系统才会发送单张截图或脱敏后的统计数据给 Google Gemini API 进行一次性处理。

## 🛠️ 技术栈架构

*   **UI 框架**: React 19 + TypeScript
*   **样式系统**: Tailwind CSS + Animate.css (打造 Cyberpunk/HUD 风格界面)
*   **视觉引擎**: TensorFlow.js + @tensorflow-models/blazeface
*   **AI 核心**: Google GenAI SDK (Gemini 2.5 Flash)
*   **图标组件**: Lucide React
*   **数据持久化**: LocalStorage (保存等级、XP 和历史记录)

## 📂 项目目录结构

```
/
├── components/          # UI 组件库
│   ├── BlockingOverlay.tsx  # 警戒模式全屏遮罩
│   ├── ErgoCoach.tsx        # AI 姿态诊断面板
│   ├── Header.tsx           # 顶部 HUD 状态栏 (显示等级/XP)
│   └── StatsChart.tsx       # 自研高性能 SVG 交互式图表
├── services/            # 核心业务逻辑
│   ├── geminiService.ts     # Google Gemini API 交互层
│   ├── storageService.ts    # 本地数据存储与管理
│   └── visionService.ts     # TensorFlow.js 视觉模型封装
├── hooks/               # 自定义 React Hooks (逻辑复用)
│   ├── useCamera.ts         # 摄像头流控制、Tab切换处理与检测循环
│   └── useGamification.ts   # 游戏化核心循环、Combo 计算与自动存档
├── App.tsx              # 应用主入口与状态机
├── types.ts             # TypeScript 类型定义
└── index.tsx            # React 根节点挂载
```

---
*VisionGuard Pro - 您的数字化视力守护者*
