# 思源笔记时间追踪插件 (SiYuan Time Spent) - 设计指导规范 (Design System Guide)

> **版本**：v1.0 (2026-09-25)  
> **制定角色**：互联网应用 UX 资深设计师 / 桌面生产力系统设计系统架构师  
> **设计哲学**：克制、严谨、沉浸自如、深耕思源生态；坚决拒绝空洞盲目的“AI Slop”堆砌与伪精致  
> **指导对象**：前端工程师、UI 设计师、开源贡献者  
> **规范依据**：WCAG 2.2 AA/AAA 规范、Apple HIG (macOS/Desktop)、思源笔记设计系统体系

---

## 1. 设计愿景与设计哲学 (Design Vision & Philosophy)

本插件“源时记 (SiYuan Time Spent)”旨在为思源笔记用户提供**“无感记录，直观呈现，AI赋能”**的时间追踪与生产力沉淀能力。我们致力于打破机械冰冷的数据统计，将用户的专注轨迹绘制成极具辨识度与成就感的“知识时间画布”。

```
                    ┌─────────────────────────┐
                    │    无感记录 (Passive)    │
                    │ 焦点驱动、自动闲置剥离    │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    直观呈现 (Clarity)    │
                    │ 饱满指标、双模图表、满血日历 │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    生态闭环 (Closed-loop)│
                    │ AI 复盘、思源笔记沉淀    │
                    └─────────────────────────┘
```

### 1.1 核心设计三大准则

1. **专注不被打扰（Zero-Friction & Calm Interface）**
   - 插件界面不应喧宾夺主。以温和、内敛的视觉语汇融入思源笔记宿主，让用户将注意力集中在笔记和知识反思上，而非花哨的动效。
2. **克制严谨，坚决拒绝“AI Slop”**
   - **拒绝机械死板并排**：坚决推翻不合常理的“70%日历 + 30%侧栏”等挤压式布局，保全日历与图表的完整数据密度与可读性；
   - **拒绝神秘肉导航（Mystery Meat Navigation）**：频率极高的视图切换（日/周/月/年）使用分段胶囊控制，常规操作使用直观图标 + 即时 Tooltip；
   - **拒绝指标纤细弱化**：核心 KPI 保持厚重饱满的粗黑体大字，强化视觉锚点与数据冲击力。
3. **原生寄生与宿主防御（Native Integration & Host Defense）**
   - 深度咬合思源笔记官方的深浅主题变量系统，动态适应任何第三方皮肤；
   - 建立高特异性的防御性样式，杜绝宿主全局 CSS 污染造成的图标黑块或文字穿透。

---

## 2. 色彩系统与主题映射 (Color & Theme System)

插件界面严禁写死静态 HEX/RGB 暗色或浅色，必须通过在 [`src/index.css`](file:///d:/MyCodingProjects/siyuan-time-spent/src/index.css) 中定义的 `--st-*` 语义 Token 桥接思源笔记原生 CSS 变量。

### 2.1 基础表面与背景层级 (Surfaces & Backgrounds)

| 语义 Token | 映射宿主变量 / 默认值 | 适用场景 |
| :--- | :--- | :--- |
| `--st-surface-overlay` | `rgba(15, 23, 42, 0.45)` (含模糊) | 弹窗全屏遮罩，浅色柔和深色沉浸 |
| `--st-bg-base` | `var(--b3-theme-background, #ffffff)` | 最底层工作区底色 |
| `--st-bg-surface` | `var(--b3-theme-surface, #f8fafc)` | 容器卡片、图表网格容器表面底色 |
| `--st-bg-elevated` | `var(--b3-theme-surface-lighter, #ffffff)` | **浮层、下拉菜单、Tooltip、模态框实体底色（防穿透）** |
| `--st-bg-subtle` | `rgba(148, 163, 184, 0.12)` | 未选中按钮底色、轻量背景槽 |
| `--st-bg-hover` | `rgba(148, 163, 184, 0.18)` | 交互悬停激活背景 |

### 2.2 文本与可读性防线 (Typography & Contrast)

必须严格遵循 WCAG 2.2 AA 规范，保证不同明暗主题下的清晰可读：

- **主文本 (`--st-text-primary`)**：映射 `var(--b3-theme-on-background)`，对比度 $\ge 7:1$。用于标题、核心数值、高光标签；
- **次级文本 (`--st-text-secondary`)**：映射 `var(--b3-theme-on-surface)`，对比度 $\ge 4.5:1$。用于正文、字段说明、卡片副标题；
- **辅助文本 (`--st-text-tertiary`)**：对比度 $\ge 3.0:1$。用于时间戳、单位标识、快捷键提示；
- **字阶底线**：严禁出现小于 `12px` 的微文字（禁止使用非标的 9px/10px），防止高分屏阅读障碍。

### 2.3 莫兰迪数据可视化色盘 (Morandi Palette)

时间色块与图表分类采用精心调配的莫兰迪低饱和度色彩，确保在深色和浅色背景下均具备柔和自然的辨识度：

```
#6366f1  #06b6d4  #10b981  #f59e0b  #ec4899  #8b5cf6  #14b8a6  #f97316
[靛蓝]    [青碧]    [翠绿]    [琥珀]    [洋红]    [紫晶]    [松石]    [暖橙]
```

- **哈希映射**：根据文档 ID 或笔记本名称生成一致哈希，确保同一文档在日历、图表与清单中颜色始终统一；
- **边框与高亮**：色块具有自适应微边框（`rgba(255,255,255,0.2)` 或 `rgba(0,0,0,0.08)`），在相邻文档密集排列时提供清晰轮廓。

---

## 3. 图标系统与宿主抗污染防御铁律 (Iconography & Anti-Pollution Defense)

### 3.1 宿主 CSS 污染背景与机制

思源笔记官方及社区主题常在顶级 CSS 中写入如下强特异性规则：
```css
/* 思源或主题全局覆盖 */
svg {
  fill: currentColor;
}
```
该规则会导致常规导入的 SVG 线框图标的透明区域被强行涂满，变成**“实心墨团”**，破坏全部细节。

### 3.2 显式线框图标规范 (Explicit Wireframe Defense)

所有组件中渲染线框图标，**必须在 `<svg>` 根节点上显式附加内联样式**：

```html
<svg 
  class="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width="1.75" 
  stroke-linecap="round" 
  stroke-linejoin="round"
  style="fill: none !important;"
>
  <!-- 线框矢量路径 -->
</svg>
```

在全局 [`src/index.css`](file:///d:/MyCodingProjects/siyuan-time-spent/src/index.css) 中设立辅助兜底防护：
```css
svg[fill="none"],
.sy-wireframe-icon svg,
.sy-icon-btn svg {
  fill: none !important;
}
```

### 3.3 图标规格标准
- **栅格基准**：`24 × 24 px`；
- **描边粗细**：统一 `1.75px`（高分屏锐利清晰，避免 1px 虚浮或 2px 笨重）；
- **清退 Emoji**：严禁使用系统 Emoji（如 🎯、✅、📊）作为正式操作按钮与状态标签，一律使用统一风格的线框图标。

---

## 4. 核心控件与操作交互规范 (Controls & Interaction Design)

### 4.1 通用图标按钮组件 [`SyIconButton.vue`](file:///d:/MyCodingProjects/siyuan-time-spent/src/components/Common/SyIconButton.vue)

为了避免界面充斥大量冗长纯文本按钮，并确保各处操作手感一致，封装了专用图标按钮：

```html
<SyIconButton
  tooltip="刷新当前统计数据"
  shortcut="R"
  placement="bottom"
  variant="subtle"
  size="md"
  @click="handleRefresh"
>
  <svg style="fill: none !important;" ...>...</svg>
</SyIconButton>
```

- **尺寸规范**：`sm` (28x28px)、`md` (32x32px)、`lg` (36x36px)；
- **交互态响应**：悬停、聚焦、激活态具有平滑过渡微动效（`transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1)`）。

### 4.2 即时悬浮提示 [`SyTooltip.vue`](file:///d:/MyCodingProjects/siyuan-time-spent/src/components/Common/SyTooltip.vue)

摒弃原生 HTML `title` 属性（原生存在 800~1500ms 迟钝延迟且样式无法定制）：

- **延时策略**：移入延迟仅 `120ms`，兼顾即时反馈与无意滑过的抗抖动；
- **快捷键提示**：支持 `shortcut` 属性，渲染优雅的 `<kbd>` 胶囊徽章（如 `Alt + T`、`R`）；
- **层级保障**：`z-index: 9999`，配合浮动定位逻辑，防止被卡片或父容器的 `overflow: hidden` 裁剪。

### 4.3 浮层与下拉菜单抗穿透设计

下拉菜单（如导出格式选择、设置弹窗）必须遵循：
- **背景实体化**：使用背景色 `--st-bg-elevated`，设置不透明度 `1.0`（禁止半透明模糊导致背景文字重叠穿透）；
- **层次投影**：`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)`，确保与下层卡片明确分离。

---

## 5. 仪表板架构与视觉层次 (Dashboard Architecture & Visual Hierarchy)

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo / 标题]               [分段视图胶囊]       [工具栏图标 + Tooltip] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─ 专注目标 Hero 卡片 (圆角方框，独立底色与边框，专属呼吸间距) ──────┐ │
│  │  🎯 今日专注目标 (已达成 75%)   [进度条]     目标时长: 4h / 剩余: 1h  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─ 核心 KPI 指标区 (饱满粗黑体大字，视觉冲击力) ─────────────────────┐ │
│  │ [今日专注: 03:45:12] [本周累计: 18:30] [活跃天数: 5天] [专注率: 82%]│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─ ECharts 分析双图表 (明暗自适应) ──────────────────────────────────┐ │
│  │ [环形分布: 偏左 30% + 右侧分类标注] │ [柱状趋势/排行: 关闭右侧数字] │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─ 主日历视口 (100% 满血展开，开屏智能对齐活跃时段，双向悬停高亮) ────┐ │
│  │ 08:00  [========= 知识图谱架构设计 =========]                       │ │
│  │ 09:00  [===== 认知心理学笔记 =====]                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 专注目标 Hero 卡片设计规范

- **独立物理结构**：采用独立的圆角方框容器（`rounded-xl border`），外边距加大（`mt-2 mb-3.5`），与上方 Logo 顶栏拉开充足的呼吸距离；
- **专属对比色**：使用微渐变背景（`from-indigo-500/10 via-purple-500/5 to-transparent`）与柔和边框，既与下方普通 KPI 卡片形成鲜明层级，又避免过度艳丽。

### 5.2 KPI 核心指标卡片规范

- **大字冲击力**：指标数值采用饱满的粗黑体（`font-black text-xl md:text-2xl`），字体色使用柔和高对比度色彩（如纯白/深黛蓝）；
- **拒绝滥用纤细等宽字体**：避免全量覆盖细瘦的 Mono 字体导致可读性急剧衰减，仅在微观时间流秒级计时启用 `tabular-nums` 以保证排版稳定。

---

## 6. 数据可视化规范 (Data Visualization Standards)

采用 [Apache ECharts](https://echarts.apache.org/) 实现数据可视化，必须严格遵守以下排版与渲染规则：

### 6.1 动态双模主题感知 (Dark / Light Sensing)

每次渲染或更新图表时，检测思源笔记当前主题状态（通过宿主 Class 或背景色）：
- **坐标轴线与刻度**：浅色模式采用 `rgba(0,0,0,0.12)`，深色模式采用 `rgba(255,255,255,0.12)`；
- **文本颜色**：浅色模式 `#64748b`，深色模式 `#94a3b8`；
- **Tooltip 背景**：跟随 `--st-bg-elevated`，使用实体背景加柔和投影。

### 6.2 投入分布环形图 (Donut Distribution Chart)

- **居左排版**：圆心设为 `center: ['30%', '50%']`，圆环半径 `radius: ['45%', '72%']`；
- **右侧图例 (Legend) 完整展现**：
  - 必须配置 `legend: { orient: 'vertical', right: '5%', top: 'middle', textStyle: { color: isDark ? '#cbd5e1' : '#334155' } }`；
  - 预留 40% 右侧空间展示图例项与百分比，杜绝文字溢出与遮挡；
- **三维透视支持**：提供“按文档 / 按笔记本 / 按标签”平滑切换。

### 6.3 走势与排行柱状图 (Bar Charts & Rankings)

- **关闭柱体右侧数字标注**：设置 `series[i].label: { show: false }`；
- **降噪设计原则**：柱状图主要展示相对比例与趋势，柱体末尾堆砌长文本数字会导致界面严重杂乱、与轴线产生文字重叠；详细精确时长一律在鼠标悬停时的精致 Tooltip 中展现。

### 6.4 年度活跃度热力图 (GitHub-style Annual Heatmap)

- **网格规格**：53 周 × 7 天网格，单元格带 `rounded-sm` 微圆角；
- **分级梯度**：4 级翠绿/薄荷渐变，空状态使用低对比底色；
- **下钻与联动**：支持点击单日单元格，自动切换日历至该日期进行详细复盘。

---

## 7. 人体工学与交互体验规范 (Ergonomics & Experience Loop)

### 7.1 日历开屏智能对齐 (Smart Scroll Anchor)

24 小时时间轴高度通常超过视口高度。用户打开日历时，绝大多数情况下凌晨 0:00~06:00 为空闲睡眠时间：
- **开屏计算逻辑**：页面挂载后，自动扫描当日第一个专注事件的起始时间戳；
- **平滑滚动定位**：
  ```typescript
  // 若早间有记录，滚动至首条记录前 30 分钟；若尚无记录，默认平滑滚动至 08:00
  const targetHour = firstLogHour !== null ? Math.max(0, firstLogHour - 0.5) : 8;
  timelineContainer.scrollTo({ top: targetHour * hourHeight, behavior: 'smooth' });
  ```
- **消除冷启动盲区**：免去用户每次手动向下滚动的重复负担。

### 7.2 视图双向联动高亮 (Bi-directional Hover Linkage)

日历时间槽色块与右侧今日活动清单必须建立响应式关联：
- 悬停在时间槽色块上时，右侧清单对应文档项同步高亮上浮，展示关联指示线；
- 悬停在右侧清单项上时，日历中该文档的所有离散时间块同步产生发光脉冲。

### 7.3 AI 复盘与思源笔记沉淀闭环 (Ecosystem Continuity)

AI 总结与反思功能绝不能止步于一次性对话框：
- **独立复盘文档**：在 AI 弹窗提供【保存为独立笔记】功能，一键调用思源内核 API（`createDocWithMd`），将复盘内容与结构化统计数据归档至指定日记/笔记本；
- **日记折叠块沉淀**：支持一键将复盘内容作为折叠块（Fold Block）插入当天的日常笔记（Daily Note）末尾，实现工作流闭环。

---

## 8. 代码规范与开发 Checklist (Developer Checklist)

在为本项目开发新功能或新增界面时，必须对照以下清单进行自审：

```markdown
- [ ] 1. 颜色与主题
  - [ ] 是否完全使用 `--st-*` 或思源原生 CSS 变量？
  - [ ] 是否在浅色与深色主题下分别验证了文字对比度？
- [ ] 2. 图标与抗污染
  - [ ] 每一个 `<svg>` 标签是否都挂载了 `style="fill: none !important;"`？
  - [ ] 图标是否使用统一的 24x24 视口与 1.75px 描边？
  - [ ] 是否已清退所有硬编码 Emoji？
- [ ] 3. 按钮与操作反馈
  - [ ] 通用动作按钮是否采用 `SyIconButton`？
  - [ ] 是否移除了原生的 HTML `title` 属性，统一接入 `SyTooltip`？
  - [ ] 浮层与下拉菜单底色是否为实体不透明背景（`--st-bg-elevated`）？
- [ ] 4. 图表规范
  - [ ] ECharts 是否监听了主题切换并自适应更新？
  - [ ] 环形图是否预留了右侧图例空间？
  - [ ] 柱状图是否关闭了容易重叠的右侧数值标注？
- [ ] 5. 排版与无障碍
  - [ ] 界面是否杜绝了小于 12px 的文字？
  - [ ] 动态刷新的时间与长数字是否使用了等宽排版？
```

---

## 9. 番茄钟「专注一页」规范（2026-10-02）

本节优先于下方保留的 v1.1 历史设计。番茄钟的主任务是服务笔记工作，不以持续动画争夺注意。

- **组件隔离**：浮层 Teleport 到 body，使用 `.st-pomo-ui` 下的专用 token 和 `.st-pomo-*` 控件样式，不依赖父 SFC 的 scoped 辅助类。
- **视觉**：实体背景、24px 主面板圆角、单层阴影；系统字体和等宽数字特性；表盘最大216px、数字最大64px/600，长时间自适应。主色与背景跟随宿主，文字保持独立高对比。
- **形态**：光环/刻度/沙漏共享 Stage 的数字层与页签游标；保存键仍为 `zen/chrono/hourglass`。进度仅表达有限目标的真实比例，正计时不提供任务百分比。没有默认粒尘、无意义旋转或循环呼吸。
- **交互**：非模态 dialog、不遮罩、不锁定焦点；点击编辑器关闭时不抢焦点，键盘关闭返回胶囊。Esc 优先关闭内层展开区；Space 不劫持原生控件，输入和组合输入由宿主处理。
- **槽位（2026-10-02 增补）**：三个相位面板统一收敛为「控件流 + 主操作」两段，主操作与页脚永远落在同一位置（实测展开位移 ≤4px）；自定义时长、更多、打断记录、呼吸引导改为就地替换控件流，不向后插入。完成提示占用页脚状态槽（与「今日已记录」同槽）。外观子视图只替换舞台与操作区，头部、笔记上下文与页脚不动。
- **相位色温（2026-10-02 增补）**：`data-pomo-phase` 定义在面板根部，表盘、游标、主操作、完成提示与状态栏胶囊同温；胶囊四态（琥珀/青/青蓝/去饱和）互异且与面板一致。色温令牌只出背景与图形，文字另取 `--st-pomo-*-text` 保证对比度。
- **走时（2026-10-02 增补）**：倒计时、正计时、休息三种计时共用一条毫秒级走时基线，表盘按真实钟表速度走：秒针 60s/圈、分针 60min/圈、时针 12h/圈。`PomodoroManager.getTimeBase()` 只返回 `{ elapsedMs, live, totalMs, sweep }` 四个数，`useDialMotion` 在两次 500ms tick 之间用 rAF 线性外推（锚点到达即拉回真值，休眠唤醒不漂移）。暂停与离桌冻结时 `live=false`，指针停在快照处，与 `9.5` 的凝滞语义一致。`calm` 与系统 reduced-motion 下退化为秒级阶跃——指针属计时信息，两种档位都保留走动。
- **时长**：1–180 整数输入，预设可直接选择；只在展开后的数字区域启用可选滚轮调整，其他区域保留页面滚动。
- **状态**：手动暂停与离桌区分；完成提示无全屏覆盖，保存成功与会话结束分开。呼吸引导仅主动展开时运行，组件销毁后清理计时器。
- **播报**：面板可见时由面板内 `role="status"` 播报；面板关闭时由状态栏常驻 `role="status"` 播报区承担（胶囊 aria-label 的后台变化不进读屏）。
- **数据**：今日已记录与本轮进度明确区分，前者只计已保存番茄日志，使用本地开始日口径。读取失败保留同日最后快照并标记未更新，跨日不可继续将昨日标作今日。
- **访问性**：全部状态按分钟播报，区分剩余和已用；操作命中区桌面至少36px、触屏44px（含笔记跳转与统计口径折叠区；常驻宿主状态栏受其高度约束）。calm 和系统 reduced-motion 同时约束动画。小字至少12px，普通文字至少4.5:1；长标题允许换行，不暴露原始文档ID。唯一仪式动效是一次的胶囊脉冲。
- **验证**：除了原有三道门禁，还运行 `test:pomodoro` 与 `test:pomodoro:browser`；`preview:pomodoro` 为隔离预览，不连接真实存储。槽位稳定性、胶囊四态配色、关闭态播报与触屏命中区均有 Playwright 回归。

### 以下为历史 v1.1 规则

番茄钟是本插件唯一"常驻 + 强氛围"的组件，其动效与无障碍规则单独成章，避免散落各处无法自查。

### 9.1 色彩温度迁移通道 `--pomo-heat`

唯一允许的"动态取色"机制。JS 每 500ms 只写入一个 `0..1` 的数字，**所有颜色由 CSS `color-mix` 一次成型**，禁止在脚本里逐帧算色值：

```css
@property --pomo-heat { syntax: '<number>'; inherits: true; initial-value: 0; }
--pomo-heat-from: var(--b3-theme-primary, #6366f1);   /* 起点永远跟着宿主主题色 */
--pomo-heat-to:   var(--st-pomo-*-text);              /* 终点按 data-pomo-phase 覆盖 */
--pomo-tint: color-mix(in srgb, var(--pomo-heat-from), var(--pomo-heat-to) calc(var(--pomo-heat) * 100%));
```

**铁律：色温只用于进度环 / 光晕 / 粒尘，绝不用于文字。** 文字始终单独取 `--st-pomo-*-text`，否则第三方主题下对比度会塌。

### 9.2 动效命名与降级铁律

| 类名 | 用途 | 受降级管控 |
| :--- | :--- | :--- |
| `st-pomo-anim` | 任何循环 / 关键帧动画的宿主 | 是，`animation: none` |
| `st-pomo-anim-soft` | 需要过渡但非核心的元素 | 是，`transition-duration: 120ms` |
| `st-pomo-dust` | 环境粒尘单粒 | 是，`display: none` |
| `st-pomo-heat-channel` | 挂 `--pomo-heat` 过渡的容器 | reduced-motion 下 `--pomo-heat: 0` |

**新增番茄钟动画类必须带 `st-pomo-anim` 或 `st-pomo-anim-soft`**，未标注的类不受降级管控。降级是双通道：

1. **配置级** — 设置项「动效与仪式感强度」切到 `calm`，由 `data-pomo-motion="calm"` 驱动；
2. **系统级** — 用户 OS 开启「减少动态效果」，由 `@media (prefers-reduced-motion: reduce)` 驱动。

### 9.3 表盘形态的可扩展契约

三种形态（极光流体 / 精密机械 / 时空沙漏）共享同一个 props 契约，只替换叙事载体。新增第四形态时：

- 在 `PomodoroFormKey` 加枚举值（**已持久化的旧值不许改，只加**）；
- 在 `composables/forms.ts` 的 `POMODORO_FORM_LABEL_KEYS` 加展示标签键；
- 在 `PomodoroStage.vue` 加一个分发分支。

中心数字与副标由 `PomodoroStage` 统一渲染（56px / 800 / `-0.02em` / `tabular-nums`），dial 只画载体，**不要在 dial 里重复渲染数字**。

三个 dial 的 props 契约就是上面**走时**那一行：`elapsedMs` / `motionLive` / `totalMs` / `motionSweep` / `smoothMotion`（另由 Stage 传 `isStopwatch` 供展示分支取用）。dial 自己接 `useDialMotion`：秒针角度由 `motionMs` 现算，光环弧与沙量由同一根基线推出的 `fraction` 取整段进度；正计时（`motionSweep`）取本分钟内的秒环。dial 不自己起定时器、不读 `PomodoroManager`、不给帧驱动值挂 CSS transition。

### 9.4 无障碍底线

- `role="timer"` 挂在表盘根节点，`aria-label` 给出可读描述；
- **读屏播报收敛到分钟粒度**，绝不做 `aria-live` 挂在计时器根上导致逐秒刷屏；
- 隐形 `role="progressbar"` 节点带 `aria-valuenow`；
- 图标按钮必须有 `aria-label`，最小命中区 ≥ 24px；
- 快捷键必须三重 guard：焦点在 `input/textarea/select`、`[contenteditable]`、`.protyle` 内时一律放行给宿主。

### 9.5 离桌守卫的语义边界

番茄运行期间复用 `TimeTracker` 的 `IdleWatcher`（同一实例、同一阈值，**不为番茄钟单设阈值**）。检测到长期无操作时：

- **表盘凝滞**（进度停在快照、色温去饱和），但**墙钟计时继续跑**，保证休眠恢复对齐；
- 归来时温和提示，`TimeLog.idleTime` **仅作记录**，`duration` 仍是完整墙钟时长。

### 9.6 质量门禁

本项目 `npm run typecheck` **不检查 `.vue` 内部**（`tsc` 只处理 `.ts`），Vite 的 esbuild 也只剥离类型，两者都抓不到 `<script setup>` 里的未定义标识符。因此新增了：

```
npm run check:sfc    # 抽出每个 SFC 的 script setup，用继承 tsconfig 的临时配置统一编译
```

改完番茄钟（或任何 `.vue`）后，三道门禁都要过：`npm run typecheck`、`npm run check:sfc`、`npm run build`。

---

> **结语**：遵循上述设计指导规范，不仅能确保“源时记”在视觉上的纯粹与高级，更能让思源笔记用户在每一次回看自己流淌的时间时，感受到专注与心流的力量。
