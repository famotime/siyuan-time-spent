# 技术架构设计 (Architecture)

## 1. 核心技术栈
- **运行环境**：基于思源笔记官方 Plugin API 进行开发，纯本地运行。
- **前端框架 (UI)**：
  - 推荐采用 **Svelte**（思源笔记插件生态常用的轻量级框架，打包体积小，性能优异）或 **React**（更容易复用类似 OpenTickly 的高级日历组件和复杂状态管理）。
  - 样式方案：**Tailwind CSS**，便于快速实现复杂的定制化 UI 与响应式设计。
- **图表与可视化**：
  - 引入 **ECharts** 或 **Chart.js** 处理环形图和热力图。
  - 引入 **FullCalendar** 或自研日历组件实现时间块视图。
- **数据存储**：
  - 思源插件内置的 File System API 或 IndexedDB。
  - 为了方便日后的复杂聚合查询，推荐采用 JSONL (JSON Lines) 格式按天存储，或使用思源支持的本地 SQLite 数据库。

## 2. 数据模型设计 (Data Model)
数据结构需满足快速检索和按天回放的需求。

### 时间日志实体 (TimeLog)
```typescript
interface TimeLog {
    id: string;          // 唯一标识
    docId: string;       // 思源文档块 ID
    startTime: number;   // 记录开始时间戳
    endTime: number;     // 记录结束时间戳
    duration: number;    // 有效持续时间 (秒)，已扣除闲置时间
    idleTime: number;    // 期间被剔除的发呆时间
}
```

### 文档元数据缓存 (DocumentMeta)
```typescript
interface DocumentMeta {
    docId: string;
    title: string;       // 文档标题
    notebook: string;    // 所属笔记本
    path: string;        // 树形路径
    tags: string[];      // 包含的标签
    color?: string;      // 分配的主题色块
}
```

## 3. 核心机制设计

### 3.1 事件监听与焦点追踪 (Event & Focus Tracking)
- 监听 `switch-protyle`（文档切换）、`click`、`keydown` 等思源内置事件。
- 当用户激活某个 Tab 或点击某个 Protyle 编辑器时，更新当前活跃的 `docId`。

### 3.2 心跳与闲置检测机制 (Heartbeat & Idle Watcher)
- 启动一个后台定时器（如每秒触发一次 `tick`）。
- **Tick 逻辑**：
  - 检查距离上次用户交互（按键/鼠标）的时间差 `delta`。
  - 如果 `delta` < 闲置阈值（如 5 分钟），则当前 `docId` 的累计时间 +1 秒。
  - 如果 `delta` >= 闲置阈值，进入 `Idle` 状态，停止计时。
  - 当用户再次操作时，退出 `Idle` 状态，生成上一段 `TimeLog`，并开启新一轮追踪。

### 3.3 数据聚合与性能优化
- 在内存中维护当天的 `TimeLog` 数组，每隔 5 分钟或文档切换时持久化到磁盘，防止数据丢失。
- 仪表板在加载时，仅读取选定日期范围的数据文件，并在 Worker 或后台异步计算聚合结果（总时长、饼图数据等），避免阻塞思源笔记的 UI 线程。
