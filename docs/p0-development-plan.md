# 源时记（SiYuan Time Spent）阶段一 (P0) 核心体验闭环开发实施方案

> **方案版本**：v1.0  
> **制定日期**：2026-09-27  
> **目标发布版本**：`v0.9.0`  
> **关联调研报告**：[`docs/competitor-analysis.md`](file:///d:/MyCodingProjects/siyuan-time-spent/docs/competitor-analysis.md)  
> **核心使命**：补齐当前版本的四大核心体验短板，实现“主动+被动双模专注”、“移动端全端覆盖”、“Daily Note 自动化沉淀”与“离桌归因/补录”四大关键飞跃。

---

## 目录

1. [实施范围与目标拆解](#1-实施范围与目标拆解)
2. [总体架构与模块关系演进](#2-总体架构与模块关系演进)
3. [核心功能特性详细设计](#3-核心功能特性详细设计)
   - 3.1 [特性一：主动专注与状态栏番茄钟双模引擎](#31-特性一主动专注与状态栏番茄钟双模引擎)
   - 3.2 [特性二：思源移动端与平板端全量自适应](#32-特性二思源移动端与平板端全量自适应)
   - 3.3 [特性三：Daily Note 自动化静默沉淀注入服务](#33-特性三daily-note-自动化静默沉淀注入服务)
   - 3.4 [特性四：离桌去水归因与时间轴手动补录](#34-特性四离桌去水归因与时间轴手动补录)
4. [数据模型与接口规范变更](#4-数据模型与接口规范变更)
5. [分步实施与 Git 提交计划](#5-分步实施与-git-提交计划)
6. [质量保证与验证标准](#6-质量保证与验证标准)

---

## 1. 实施范围与目标拆解

根据竞品调研报告的建议，阶段一（P0）聚焦于“核心体验闭环与短板速补”，划定以下 4 大交付目标：

| 模块编码 | 功能特性名称 | 核心解决痛点 | 交付产物 |
| :--- | :--- | :--- | :--- |
| **P0-1** | **主动番茄钟与状态栏双模引擎** | 解决“只有被动底噪、缺乏主动冲刺冲劲”的痛点，给考研备考、刷题和长文攻坚提供倒计时抓手。 | 状态栏胶囊、控制弹窗、Web Audio 轻和弦提示音、时间轴金色番茄徽章。 |
| **P0-2** | **移动端与平板端全量自适应** | 解决 iPad/安卓平板/手机端无法使用插件的痛点，激活图书馆移动学习场景。 | 解锁 `plugin.json` 移动端权限，UI 响应式断点适配，移动端后台挂起生命周期兜底。 |
| **P0-3** | **Daily Note 自动化静默沉淀** | 解决“复盘数据需手动复制粘贴”的痛点，实现每天专注数据一键或定时注入日记折叠块。 | `DailyNoteArchiver` 服务，内核 API 追加/更新折叠块，设置项与看板一键归档。 |
| **P0-4** | **离桌归因弹窗与手动补录** | 解决“离桌背书/纸质刷题被一刀切扣除”的痛点，允许唤醒后补录归因与时间轴微调。 | `AfkPrompt` 气泡，时间轴空白区域点击补录弹窗，日志编辑与删除。 |

---

## 2. 总体架构与模块关系演进

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              源时记 (v0.9.0) 架构演进                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  [UI 表现层]                                                                  │
│  ├─ Dashboard.vue (响应式重构: 桌面端 24h 时间轴 + 移动端抽屉紧凑布局)         │
│  ├─ StatusBarTimer.vue (状态栏双模计时胶囊: 正常被动显示 / 🍅 24:59 倒计时)    │
│  ├─ PomodoroPopover.vue (番茄钟设定、暂停、重置微面板)                        │
│  ├─ AfkPromptModal.vue (离桌唤醒归因引导气泡: 线下学习 / 休息 / 丢弃)          │
│  └─ ManualLogModal.vue (时间轴空隙手动补录与明细编辑)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  [逻辑与控制层]                                                               │
│  ├─ TimeTracker (被动监听切换与会话结算) ──┐ (双引擎协同)                      │
│  ├─ PomodoroEngine (主动倒计时冲刺控制) ──┴──> Unified Session Manager       │
│  ├─ IdleWatcher (键鼠节流 + 触摸手势监听 + AFK 离桌阈值判断)                   │
│  ├─ DailyNoteArchiver (思源日记查询、幂等折叠块生成与追加)                   │
│  └─ MobileLifecycleGuard (visibilitychange 监听，移动端切后台实时落盘防丢)    │
├──────────────────────────────────────────────────────────────────────────────┤
│  [数据与持久层]                                                               │
│  ├─ TimeLog (扩充 type: 'passive'|'pomodoro'|'offline'|'manual', note, 标签)   │
│  ├─ StorageManager (按天分片 JSON 缓存与读写)                                │
│  └─ SettingManager (持久化番茄钟参数、离桌归因阈值与 Daily Note 规则)         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心功能特性详细设计

### 3.1 特性一：主动专注与状态栏番茄钟双模引擎

1. **状态栏常驻胶囊**：
   - 插件加载后，通过思源插件接口 `this.addStatusBar({ element, position: "right" })` 注册状态栏胶囊；
   - **被动模式**：显示当前正在编辑的笔记名称（截断保留前 8 个字符）及当次已专注时长，如 `📝 考研数学 18:20`；
   - **番茄冲刺模式**：显示番茄图标与倒计时，如 `🍅 23:45`，高亮醒目。
2. **交互控制微面板**：
   - 点击状态栏胶囊弹出控制弹窗：
     - 提供标准预设时长切换：`25 分钟（经典）`、`45 分钟（深度）`、`60 分钟（马拉松）` 或 `正向计时（秒表）`；
     - 快捷按钮：【开始专注】、【暂停】、【跳过/提前完成】、【放弃】；
     - 关联文档：默认自动关联当前正在聚焦的思源文档，也可手动输入专注主题。
3. **完成提示与防休眠保证**：
   - 利用 Web Audio API 纯代码合成轻柔的双音节“叮咚”和弦（零 mp3 依赖）；
   - 触发桌面系统通知与思源消息提示；
   - 计时核心基于 `TargetTime - Date.now()` 物理时间差校准，即使电脑休眠或窗口最小化，恢复时毫秒级自动拉齐，杜绝倒计时滞后。
4. **看板专属视觉呈现**：
   - 番茄钟会话在日历 24 小时时间轴以**高亮金色边框与专属 🍅 徽章**标记，与普通被动记录区分；
   - 核心 KPI 增加“完成番茄钟：x 个”小指标。

---

### 3.2 特性二：思源移动端与平板端全量自适应

1. **权限与宿主声明**：
   - 在 `plugin.json` 中的 `frontends` 增加 `"mobile"` 与 `"browser-mobile"`。
2. **移动端后台生命周期兜底**：
   - 移动端 App 切到后台时，JS 定时器会被系统强行冻结，甚至被系统直接回收；
   - 监听 `visibilitychange` 事件：当 `document.visibilityState === 'hidden'` 时，触发紧急落盘，将当前进行中的时间段结算入库，防止丢失；
   - 再次进入前台时重置起始时间戳。
3. **看板响应式界面优化**：
   - 增加针对 `< 640px` 窄屏断点的适配样式；
   - 顶部导航栏自适应收折，核心 KPI 变为 2 列紧凑网格；
   - 日历 24h 时间轴支持在移动端纵向滑动，触摸点击色块直接跳转思源对应文档；
   - 修复弹窗在手机屏幕上的边距与居中定位。

---

### 3.3 特性三：Daily Note 自动化静默沉淀注入服务

1. **沉淀逻辑与幂等性**：
   - 每日结束或用户点击看板顶部的【一键归档至日记】按钮时触发；
   - 通过思源 SQL 查询当天的 Daily Note 文档 ID：
     ```sql
     SELECT id, hpath FROM blocks WHERE type='d' AND hpath LIKE '%/2026-09-27%' LIMIT 1
     ```
   - 若未找到当天日记，则创建或使用系统默认笔记本；
   - 检查该日记中是否已有带有属性 `custom-time-spent="true"` 的块：
     - 若已存在：调用 `/api/block/updateBlock` 原地刷新内容（实现幂等，重复点击不产生重复垃圾数据）；
     - 若不存在：调用 `/api/block/appendBlock` 追加至文档末尾。
2. **沉淀折叠块格式设计**：
   ```markdown
   {{{row
   {: custom-time-spent="true"}
   ### ⏱️ 源时记 · 今日专注与时间复盘
   - **净专注时长**：5 小时 32 分钟 | **离桌去水**：45 分钟 | **番茄钟**：8 个
   - **核心主攻文档**：
     1. 《考研政治1000题整理》 (2h 15m, 40%)
     2. 《专业课数据结构》 (1h 50m, 33%)
   
   > 💡 保持高密度心流，今日主线任务投入占比超 73%，状态优异！
   }}}
   ```
3. **自动化定时器**：
   - 支持在设置中勾选“每天 23:55 自动归档至日记”。

---

### 3.4 特性四：离桌去水归因与时间轴手动补录

1. **离桌唤醒归因气泡 (AFK Reason Modal)**：
   - 当检测到闲置超过预设阈值（默认 10 分钟）且用户重新操作键鼠时：
   - 在思源右下角浮出一个轻量卡片（15 秒倒计时自动淡出）：
     > ☕ **离桌归因提醒**  
     > 检测到您刚刚离开电脑 25 分钟（14:30 - 14:55），这段时间您在进行：  
     > [📖 线下背书/阅读] [📝 纸质做题] [☕ 休息/离开] [❌ 丢弃]
   - 若用户点击“线下背书/做题”，系统将这 25 分钟保留，保存为 `type: 'offline'`，并附加标签；若选择休息或倒计时结束未操作，则按原去水逻辑安全剔除。
2. **时间轴手动补录与编辑 (Manual Adjust)**：
   - 在 24 小时时间轴上，空白无记录的时段支持鼠标单机或双击，弹出【补录时间】弹窗；
   - 支持选择关联文档、起止时间戳、分类备注；
   - 活动清单右侧支持对异常短会话（如误点文档产生 5 秒）进行一键删除。

---

## 4. 数据模型与接口规范变更

### 4.1 `TimeLog` 接口扩展

在 [`src/models/TimeLog.ts`](file:///d:/MyCodingProjects/siyuan-time-spent/src/models/TimeLog.ts) 中升级：

```typescript
export type LogType = 'passive' | 'pomodoro' | 'offline' | 'manual';

export interface TimeLog {
    id: string;          // 唯一标识 UUID
    docId: string;       // 思源文档块 ID
    startTime: number;   // 起始毫秒时间戳
    endTime: number;     // 结束毫秒时间戳
    duration: number;    // 有效专注秒数
    idleTime: number;    // 剔除闲置秒数
    
    // P0 新增扩展属性 (全部可选，完美兼容旧数据)
    type?: LogType;           // 会话类型
    isPomodoro?: boolean;     // 是否番茄钟
    pomodoroTargetMin?: number;// 番茄钟目标时长 (分钟)
    note?: string;            // 归因说明或线下学习备注
    tags?: string[];          // 自定义分类标签
}
```

### 4.2 `PluginSettings` 接口扩展

在 [`src/models/Settings.ts`](file:///d:/MyCodingProjects/siyuan-time-spent/src/models/Settings.ts) 中升级：

```typescript
export interface PluginSettings {
  language?: 'auto' | 'zh_CN' | 'en_US';
  enableLog: boolean;
  openInTab: boolean;
  idleThresholdMinutes?: number;

  // 番茄钟双模引擎设置
  enableStatusBarTimer?: boolean;    // 是否开启状态栏计时显示
  pomodoroWorkMinutes?: number;      // 专注时长 (默认 25)
  pomodoroBreakMinutes?: number;     // 休息时长 (默认 5)
  pomodoroSound?: boolean;           // 完成和弦提示音
  pomodoroNotification?: boolean;    // 系统弹窗通知

  // 离桌归因设置
  enableAfkPrompt?: boolean;         // 是否启用离桌唤醒归因弹窗
  afkPromptThresholdMinutes?: number;// 触发归因弹窗的门槛 (默认 10 分钟)

  // Daily Note 自动归档设置
  enableDailyNoteArchiving?: boolean;// 自动归档至日记开关
  dailyNoteAutoTime?: string;        // 触发时间点 (如 "23:55")

  // AI 相关配置
  aiProvider?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiModels?: string;
  aiRequestTimeoutSeconds?: number;
  aiTemperature?: number;
  aiMaxTokens?: number;
}
```

---

## 5. 分步实施与 Git 提交计划

为确保代码稳健可追溯，按照单一职责原则拆解为 5 个核心提交步骤：

| 步骤 | 提交规范 (Commit Header) | 涉及核心文件与变动要点 |
| :--- | :--- | :--- |
| **Step 1** | `docs(plan): 制定阶段一(P0)核心体验闭环细化实施方案` | 新建 `docs/p0-development-plan.md`，定义接口与落地架构。 |
| **Step 2** | `feat(model): 扩展时间日志与番茄钟离桌归因配置模型` | 更新 `TimeLog.ts`、`Settings.ts`，扩展 `zh_CN.json` 与 `en_US.json` 国际化文案。 |
| **Step 3** | `feat(mobile): 解锁移动端权限并优化响应式布局与后台挂起生命周期` | 更新 `plugin.json`，在 `TimeTracker` 增加 `visibilitychange` 守卫，`Dashboard.vue` 窄屏适配。 |
| **Step 4** | `feat(dailynote): 新增每日专注数据自动归档沉淀至思源日记服务` | 新增 `src/utils/daily-note.ts`，在看板顶栏添加一键归档，支持幂等折叠块追加与更新。 |
| **Step 5** | `feat(afk): 支持离桌唤醒归因引导与时间轴手动补录微调` | 改造 `IdleWatcher`，新增唤醒归因气泡弹窗，日历轴空白点击补录与记录删除支持。 |
| **Step 6** | `feat(pomodoro): 实现状态栏番茄钟双模引擎与专属时间轴徽章` | 新增 `PomodoroEngine`、状态栏常驻胶囊组件与和弦音效，日历 24h 时间轴渲染番茄钟高光。 |
| **Step 7** | `chore(release): 验证全量构建与功能联调，升级版本至 v0.9.0` | 更新 `package.json`、`plugin.json`、`CHANGELOG.md`，打包验证。 |

---

## 6. 质量保证与验证标准

1. **类型安全与代码检查**：每一步修改后，运行 `npm run typecheck` 保证 0 报错；运行 `npm run build` 确保 Vite 打包成功。
2. **数据向后兼容性**：确保旧版本生成的 `YYYY-MM-DD.json` 日志文件在读取、展示和新写入时零异常，不存在 `undefined` 字段导致的白屏崩溃。
3. **宿主防御与性能开销**：
   - 新增组件必须严格遵守 [`docs/design.md`](file:///d:/MyCodingProjects/siyuan-time-spent/docs/design.md) 的抗 CSS 污染规范（`<svg style="fill: none !important;">`）；
   - 状态栏秒级刷新逻辑不得触发全局组件重复渲染，开销控制在 0.5% CPU 以下。
