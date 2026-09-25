<template>
  <div class="time-spent-dashboard isolate relative z-0 p-4 sm:p-6 min-h-full flex flex-col gap-4 sm:gap-5">
    
    <!-- ==================== TOP NAVIGATION & HEADER ==================== -->
    <header class="flex flex-col gap-3.5 pb-3.5 sy-header-border">
      
      <!-- Top Row: Brand, Tracking Status & Actions -->
      <div class="flex justify-between items-center w-full">
        <!-- Title & Live Status -->
        <div class="flex items-center gap-3.5">
          <!-- 品牌图标 -->
          <div class="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shrink-0 bg-transparent">
            <img :src="iconUrl" alt="源时记" class="w-full h-full object-contain drop-shadow-md select-none" />
          </div>
          <div class="flex flex-col justify-center">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-xl sm:text-2xl font-black tracking-wide sy-text-primary">
                源时记
              </h1>
              <span class="text-xs px-2.5 py-0.5 rounded-full sy-badge font-medium">
                时间记录与专注分析
              </span>
            </div>
            <p class="text-xs sy-text-secondary mt-0.5 leading-relaxed">
              全自动深度工作追踪 · 智能防挂机 · 多维日历复盘
            </p>
          </div>
        </div>

        <!-- Header Right Actions: Settings, Refresh & Close -->
        <div class="flex items-center gap-1.5 shrink-0">
          <!-- 刷新数据按钮 -->
          <SyTooltip content="重新计算并载入最新时间数据" shortcut="R" placement="bottom">
            <SyIconButton 
              icon="refresh" 
              size="md" 
              variant="secondary" 
              aria-label="刷新数据" 
              @click="handleRefreshData" 
            />
          </SyTooltip>

          <!-- 插件设置按钮 -->
          <SyTooltip content="打开源时记设置" shortcut="S" placement="bottom">
            <SyIconButton 
              icon="settings" 
              size="md" 
              variant="secondary" 
              aria-label="打开插件设置" 
              @click="handleOpenSetting" 
            />
          </SyTooltip>

          <!-- 关闭看板按钮 -->
          <SyTooltip content="关闭看板" shortcut="Esc" placement="bottom">
            <SyIconButton 
              icon="close" 
              size="md" 
              variant="ghost" 
              aria-label="关闭看板" 
              @click="emit('close')" 
            />
          </SyTooltip>
        </div>
      </div>

      <!-- Focus Goal Hero Section (专注目标 Hero 卡片：圆角方框、加大顶部间距、独特底色与文字区分) -->
      <div class="focus-goal-hero-card rounded-2xl p-4 sm:p-5 transition-all shadow-md mt-2 sm:mt-3">
        <!-- Mode 1: Display Mode (已设定目标且非编辑态) -->
        <div v-if="focusGoal && !isEditingFocusGoal" class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <!-- Left & Center: Badge + Statement (点击整块可快速进入编辑) -->
          <div 
            @click="startEditingGoal"
            class="flex items-center gap-3.5 cursor-pointer group flex-1 min-w-0"
            title="点击修改专注目标"
          >
            <!-- 44px 精致靶心显式线框徽章 (防思源 CSS 污染) -->
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sy-goal-icon-badge flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105">
              <svg class="w-6 h-6 sm:w-7 sm:h-7 sy-wire-icon text-indigo-400" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>

            <!-- 目标标题微标签与宣言 -->
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  FOCUS GOAL
                </span>
                <span class="text-xs text-indigo-400/60">·</span>
                <span class="text-xs text-indigo-300 font-medium">当前专注目标</span>
              </div>
              <div class="text-base sm:text-lg md:text-xl font-black sy-goal-title group-hover:text-indigo-300 transition-colors truncate tracking-wide mt-0.5" :title="focusGoal">
                {{ focusGoal }}
              </div>
            </div>
          </div>

          <!-- Right Action Buttons & Saved Tip -->
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <!-- 保存成功提示 (纯矢量显式线框) -->
            <span v-if="focusGoalSavedTip" class="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-fadeIn mr-1">
              <svg class="w-4 h-4 text-emerald-400 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>已保存</span>
            </span>

            <!-- 编辑按钮 (显式线框) -->
            <SyTooltip content="编辑当前专注目标" placement="top">
              <button 
                @click.stop="startEditingGoal"
                class="sy-btn-goal-action h-8.5 px-3 flex items-center gap-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>编辑</span>
              </button>
            </SyTooltip>

            <!-- 清除按钮 (显式线框) -->
            <SyTooltip content="清除专注目标" placement="top">
              <button 
                @click.stop="clearFocusGoal"
                class="sy-btn-goal-action h-8.5 w-8.5 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-xs hover:text-red-400"
              >
                <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </SyTooltip>
          </div>
        </div>

        <!-- Mode 2: Edit / Empty Mode (未设定目标或正在编辑) -->
        <div v-else class="flex flex-col gap-2.5 w-full">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <!-- 目标标题徽章 (显式线框靶心) -->
            <div class="flex items-center gap-2.5 shrink-0">
              <span class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sy-goal-icon-badge flex items-center justify-center shrink-0 shadow-inner">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </span>
              <div class="flex flex-col">
                <span class="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Focus Goal
                </span>
                <span class="text-xs font-bold sy-goal-title tracking-wide">
                  设定专注目标
                </span>
              </div>
            </div>

            <!-- 输入框与一键清空 -->
            <div class="relative flex-1 flex items-center">
              <input 
                ref="goalInputRef"
                type="text" 
                v-model="editGoalInput" 
                @keydown.enter="confirmGoalEdit"
                @keydown.esc="cancelGoalEdit"
                :placeholder="currentGoalPlaceholder"
                class="sy-input-field w-full h-10 pl-3.5 pr-8 text-xs sm:text-sm rounded-xl transition-all outline-none"
              />
              <button 
                v-if="editGoalInput" 
                @click="editGoalInput = ''" 
                class="absolute right-2.5 sy-text-tertiary hover:sy-text-primary transition-colors cursor-pointer"
                title="清空输入">
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button 
                @click="confirmGoalEdit"
                class="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                title="保存目标 (Enter)"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>保存</span>
              </button>

              <button 
                v-if="focusGoal"
                @click="cancelGoalEdit"
                class="sy-btn-goal-action h-10 px-3.5 text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                title="取消修改 (Esc)"
              >
                取消
              </button>
            </div>
          </div>

          <!-- 目标预设快捷选择标签 (根据当前日历周期智能联动推荐) -->
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-500/20">
            <span class="text-xs text-indigo-300/80 shrink-0 select-none flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-indigo-400 shrink-0 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ calendarMode === 'day' ? '今日推荐：' : calendarMode === 'week' ? '本周推荐：' : '本月推荐：' }}
            </span>
            <button 
              v-for="(candidate, index) in currentGoalCandidates" 
              :key="index"
              @click="selectGoalCandidate(candidate)"
              class="text-xs px-2.5 py-1 rounded-lg sy-candidate-pill transition-all cursor-pointer flex items-center gap-1"
              :class="{ 'is-selected': editGoalInput === candidate }">
              {{ candidate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Date Navigator & Mode Switcher & Actions -->
      <div class="flex flex-wrap items-center justify-between gap-3 w-full pt-2.5 border-t sy-divider">
        <!-- Left: Date Navigator & Period Label -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Date Navigator Group -->
          <div class="h-9 inline-flex items-center sy-pill-group p-0.5 rounded-xl shadow-xs gap-0.5 box-border">
            <!-- 上一周期 -->
            <SyTooltip content="上一周期" shortcut="Alt + ←" placement="bottom">
              <button 
                @click="navigatePeriod(-1)" 
                class="w-7 h-7 flex items-center justify-center sy-text-secondary hover:sy-text-primary rounded-lg transition-colors cursor-pointer"
                aria-label="上一周期"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </SyTooltip>
            
            <!-- 回到今天/当前周期 -->
            <SyTooltip :content="`回到当前${calendarMode === 'day' ? '日期' : calendarMode === 'week' ? '周' : calendarMode === 'month' ? '月' : '年'}`" shortcut="T" placement="bottom">
              <button 
                @click="jumpToToday" 
                class="px-3 h-7 flex items-center justify-center text-xs font-semibold sy-text-primary hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors border-x sy-divider cursor-pointer"
              >
                {{ todayButtonLabel }}
              </button>
            </SyTooltip>

            <!-- 下一周期 -->
            <SyTooltip content="下一周期" shortcut="Alt + →" placement="bottom">
              <button 
                @click="navigatePeriod(1)" 
                class="w-7 h-7 flex items-center justify-center sy-text-secondary hover:sy-text-primary rounded-lg transition-colors cursor-pointer"
                aria-label="下一周期"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </SyTooltip>
          </div>

          <!-- Period Display Label -->
          <div class="h-9 text-xs font-semibold sy-text-primary sy-pill-group px-3.5 rounded-xl flex items-center gap-2 shadow-xs font-mono box-border">
            <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            {{ currentPeriodLabel }}
          </div>
        </div>

        <!-- Right: Mode Tabs: Day / Week / Month / Year & Actions -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Mode Tabs (Segmented Controls) -->
          <div class="h-9 inline-flex items-center sy-pill-group p-1 rounded-xl shadow-xs gap-1 box-border">
            <button 
              @click="switchMode('day')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'day' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              日视图
            </button>
            <button 
              @click="switchMode('week')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'week' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              周视图
            </button>
            <button 
              @click="switchMode('month')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'month' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              月视图
            </button>
            <button 
              @click="switchMode('year')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'year' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              年热力
            </button>
          </div>

          <!-- Export Dropdown -->
          <div class="relative">
            <SyTooltip content="导出专注统计数据报表 (CSV / JSON)" placement="bottom">
              <button 
                @click="isExportMenuOpen = !isExportMenuOpen" 
                class="h-9 px-3 inline-flex items-center gap-1.5 sy-pill-group hover:bg-black/5 dark:hover:bg-white/10 sy-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer box-border shadow-xs"
              >
                <svg class="w-3.5 h-3.5 sy-wire-icon sy-text-secondary" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>导出</span>
                <svg class="w-3 h-3 sy-wire-icon sy-text-tertiary" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </SyTooltip>

            <!-- Dropdown Menu (坚固不透明实体底色，彻底杜绝背后文字穿透) -->
            <div 
              v-if="isExportMenuOpen" 
              class="absolute right-0 mt-2 w-48 sy-dropdown-card rounded-xl py-1.5 z-[100] flex flex-col text-xs sy-text-primary shadow-2xl"
            >
              <div class="px-3.5 py-1 text-xs sy-text-tertiary font-mono border-b sy-divider">
                当前周期 ({{ modeName }})
              </div>
              <button @click="handleExport('current', 'csv')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>导出 CSV 表格</span>
                <span class="text-xs sy-text-tertiary font-mono">.csv</span>
              </button>
              <button @click="handleExport('current', 'json')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>导出 JSON 数据</span>
                <span class="text-xs sy-text-tertiary font-mono">.json</span>
              </button>

              <div class="px-3.5 py-1 text-xs sy-text-tertiary font-mono border-y sy-divider mt-1">
                全部历史记录
              </div>
              <button @click="handleExport('all', 'csv')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>导出全量 CSV</span>
                <span class="text-xs sy-text-tertiary font-mono">.csv</span>
              </button>
              <button @click="handleExport('all', 'json')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>导出全量 JSON</span>
                <span class="text-xs sy-text-tertiary font-mono">.json</span>
              </button>
            </div>
          </div>

          <!-- AI Summary Button -->
          <SyTooltip content="AI 深度复盘与工作建议" shortcut="Ctrl + Enter" placement="bottom">
            <button 
              @click="openAiSummaryModal" 
              class="h-9 px-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer box-border"
            >
              <svg class="w-3.5 h-3.5 text-purple-200 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>AI 总结</span>
            </button>
          </SyTooltip>
        </div>
      </div>
    </header>


    <!-- ==================== UNIFIED TOP VISUAL OVERVIEW ==================== -->
    <section class="top-visual-overview flex flex-col">
      
      <!-- KPI Metric Cards Grid (恢复原字体粗黑体质感与饱满尺寸) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5 sm:mb-6">
        <!-- KPI 1: Total Focused Time -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-indigo-500/60">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{{ modeName }}总专注</span>
            <span class="text-indigo-400 font-mono font-medium">Total</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
            {{ formatDuration(totalFocusSeconds) }}
          </div>
          <div class="text-xs text-gray-400 mt-1 truncate">
            {{ scopeFocusSubtitle }}
          </div>
        </div>

        <!-- KPI 2: Daily Average or Pace -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-cyan-500/60">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{{ averageMetricLabel }}</span>
            <span class="text-cyan-400 font-mono font-medium">Avg</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-cyan-400">
            {{ formatDuration(averageFocusSeconds) }}
          </div>
          <div class="text-xs text-gray-400 mt-1 truncate">
            {{ averageMetricSubtitle }}
          </div>
        </div>

        <!-- KPI 3: Total Sessions -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-emerald-500/60">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>专注会话数</span>
            <span class="text-emerald-400 font-mono font-medium">Sessions</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-emerald-400">
            {{ activeLogs.length }} <span class="text-xs font-normal text-gray-400">次</span>
          </div>
          <div class="text-xs text-gray-400 mt-1 truncate">
            单会话均长 {{ formatDuration(sessionAverageSeconds) }}
          </div>
        </div>

        <!-- KPI 4: Idle Time Deducted -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-amber-500/60">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>闲置扣除时长</span>
            <span class="text-amber-400 font-mono font-medium">Idle Filter</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-amber-400">
            {{ formatDuration(totalIdleSeconds) }}
          </div>
          <div class="text-xs text-gray-400 mt-1 truncate">
            精准剥离无操作挂机
          </div>
        </div>

        <!-- KPI 5: Top Focus Target -->
        <div class="kpi-card col-span-2 sm:col-span-1 sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-purple-500/60">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>主攻专注重心</span>
            <span class="text-purple-400 font-mono font-medium">Top Focus</span>
          </div>
          <div class="text-sm font-bold text-gray-200 truncate mt-0.5" :title="topDocInfo.title">
            {{ topDocInfo.title }}
          </div>
          <div class="text-xs text-purple-300 mt-1 font-mono font-bold">
            {{ topDocInfo.durationStr }} (占比 {{ topDocInfo.percent }}%)
          </div>
        </div>
      </div>

      <!-- Overview Visual Charts -->
      <div class="charts-container">
        <Charts 
          :logs="activeLogs" 
          :scope-type="calendarMode" 
          :scope-date-title="currentPeriodLabel" 
          :day-map="scopeDayMap"
          :day-labels="scopeDayLabels" 
        />
      </div>
    </section>


    <!-- ==================== MAIN CALENDAR / HEATMAP VIEW ==================== -->
    <section class="calendar-main-section flex flex-col gap-3 pt-3 border-t sy-divider">
      <div class="flex justify-between items-center px-1">
        <h2 class="text-sm font-bold sy-text-primary tracking-wide flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
          {{ calendarSectionTitle }}
        </h2>
        <span class="text-xs sy-text-secondary">
          <template v-if="calendarMode === 'year'">点击任意方格可下钻至当天的日视图</template>
          <template v-else-if="calendarMode === 'month'">点击任意日期可切换进入该日视图</template>
          <template v-else-if="calendarMode === 'week'">点击表头日期可下钻至日视图</template>
          <template v-else>点击色块直达思源对应文档</template>
        </span>
      </div>

      <!-- Year Mode: Heatmap View (365天热力图) -->
      <HeatmapView
        v-if="calendarMode === 'year'"
        :year="currentDate.getFullYear()"
        :day-map="scopeDayMap"
        @select-date="handleSelectDate"
      />

      <!-- Day / Week / Month Mode: Calendar View -->
      <CalendarView
        v-else
        :logs="activeLogs" 
        :day-map="scopeDayMap" 
        :mode="calendarMode" 
        :current-date="currentDate" 
        @select-date="handleSelectDate" 
        @switch-mode="handleCalendarSwitchMode"
      />
    </section>

    <!-- Toast Notification (直观且防污染) -->
    <div 
      v-if="toastMessage" 
      class="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce border border-indigo-400/30"
    >
      <svg class="w-4 h-4 sy-wire-icon text-emerald-300" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {{ toastMessage }}
    </div>

    <!-- AI Summary Modal (AI 深度复盘与建议弹窗) -->
    <AiSummaryModal 
      :visible="isAiModalVisible"
      :plugin="(plugin as any)"
      :logs="activeLogs"
      :scope-title="currentPeriodLabel"
      :scope-type="calendarMode"
      :focus-goal="focusGoal"
      @close="isAiModalVisible = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import CalendarView from './CalendarView.vue';
import HeatmapView from './HeatmapView.vue';
import Charts from './Charts.vue';
import AiSummaryModal from './AiSummaryModal.vue';
import SyTooltip from './Common/SyTooltip.vue';
import SyIconButton from './Common/SyIconButton.vue';
import type { TimeLog } from '../models/TimeLog';
import { usePlugin } from '../main';
import { AIExportManager } from '../utils/ai-export';
import { Exporter } from '../utils/exporter';
import { docTitles, fetchDocTitle } from '../utils/title-cache';
import Logger from '../utils/logger';
import iconUrl from '../../icon.webp';

const plugin = usePlugin();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// State
const calendarMode = ref<'day' | 'week' | 'month' | 'year'>('week');
const currentDate = ref<Date>(new Date());
const activeLogs = ref<TimeLog[]>([]);
const scopeDayMap = ref<Record<string, TimeLog[]>>({});
const toastMessage = ref<string>('');

// 数据导出下拉状态
const isExportMenuOpen = ref<boolean>(false);

// Focus Goal State
const STORAGE_KEY_FOCUS_GOAL = 'siyuan_time_spent_focus_goal';
const focusGoal = ref<string>(localStorage.getItem(STORAGE_KEY_FOCUS_GOAL) || '');
const focusGoalSavedTip = ref<boolean>(false);
const isEditingFocusGoal = ref<boolean>(false);
const editGoalInput = ref<string>('');
const goalInputRef = ref<HTMLInputElement | null>(null);
let focusGoalTipTimer: ReturnType<typeof setTimeout> | null = null;

// 周期动态预设候选
const currentGoalCandidates = computed(() => {
  if (calendarMode.value === 'day') {
    return [
      '今天专注1小时，处理12篇笔记文档',
      '今天专注2小时，深度推进核心课题',
      '今天完成4个番茄钟深度工作',
      '今天专注阅读与提炼1.5小时'
    ];
  } else if (calendarMode.value === 'week') {
    return [
      '本周平均每天专注2小时',
      '本周累计完成20个番茄钟',
      '本周主攻核心知识库重构 (10小时)',
      '最近一周每天保持深度专注'
    ];
  } else if (calendarMode.value === 'month') {
    return [
      '本月累计深度工作50小时',
      '本月攻克核心学习专题 (30小时)',
      '本月平均每周专注12小时',
      '本月养成每日深度工作习惯'
    ];
  } else {
    return [
      '本年累计深度工作500小时',
      '本年构建核心知识体系与长青笔记',
      '本年攻克专业考试与核心技能',
      '保持每日无感专注与深度心流'
    ];
  }
});

// 动态输入框占位符
const currentGoalPlaceholder = computed(() => {
  if (calendarMode.value === 'day') {
    return '设定今日专注目标，如：今天专注2小时，深度推进核心课题...';
  } else if (calendarMode.value === 'week') {
    return '设定本周专注目标，如：本周平均每天专注2小时...';
  } else if (calendarMode.value === 'month') {
    return '设定本月专注目标，如：本月累计深度工作50小时...';
  } else {
    return '设定本年专注目标，如：本年累计深度工作500小时...';
  }
});

// AI Summary Modal State
const isAiModalVisible = ref(false);

// Formatter
const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}小时 ${m}分钟`;
  if (m > 0) return `${m}分钟`;
  if (s > 0) return `${s}秒`;
  return `0分钟`;
};

// Mode metadata
const modeName = computed(() => {
  if (calendarMode.value === 'day') return '日';
  if (calendarMode.value === 'week') return '周';
  if (calendarMode.value === 'month') return '月';
  return '年';
});

const todayButtonLabel = computed(() => {
  if (calendarMode.value === 'day') return '今日';
  if (calendarMode.value === 'week') return '本周';
  if (calendarMode.value === 'month') return '本月';
  return '本年';
});

// 计算指定日期的周序号（ISO/标准周）
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// 顶部周期标签
const currentPeriodLabel = computed(() => {
  const d = currentDate.value;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();

  if (calendarMode.value === 'day') {
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${year}年${month}月${date}日 ${weekNames[d.getDay()]}`;
  } else if (calendarMode.value === 'week') {
    const dayOfWeek = d.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mStr = `${monday.getMonth() + 1}/${monday.getDate()}`;
    const sStr = `${sunday.getMonth() + 1}/${sunday.getDate()}`;
    return `${year}年 (周度 ${mStr} - ${sStr})`;
  } else if (calendarMode.value === 'month') {
    return `${year}年 ${month}月`;
  } else {
    return `${year}年 (全年度热力)`;
  }
});

// 日历视图区块标题
const calendarSectionTitle = computed(() => {
  const d = currentDate.value;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();

  if (calendarMode.value === 'day') {
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `日历视图 (${year}年${month}月${date}日 ${weekNames[d.getDay()]})`;
  } else if (calendarMode.value === 'week') {
    const weekNum = getWeekNumber(d);
    const dayOfWeek = d.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mStr = `${monday.getMonth() + 1}/${monday.getDate()}`;
    const sStr = `${sunday.getMonth() + 1}/${sunday.getDate()}`;
    return `日历视图 (${year}年 第${weekNum}周 · ${mStr} - ${sStr})`;
  } else if (calendarMode.value === 'month') {
    return `日历视图 (${year}年 第${month}月)`;
  } else {
    return `年度专注热力图 (${year}年)`;
  }
});

// Period Day Labels for Charts
const scopeDayLabels = computed(() => {
  const d = currentDate.value;
  const year = d.getFullYear();
  const month = d.getMonth();

  if (calendarMode.value === 'day') {
    return [{ key: formatDateKey(d), label: `${month + 1}/${d.getDate()}` }];
  } else if (calendarMode.value === 'week') {
    const dayOfWeek = d.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const labels = [];
    const weekNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    for (let i = 0; i < 7; i++) {
      const item = new Date(monday);
      item.setDate(monday.getDate() + i);
      labels.push({
        key: formatDateKey(item),
        label: `${weekNames[i]} (${item.getMonth() + 1}/${item.getDate()})`
      });
    }
    return labels;
  } else if (calendarMode.value === 'month') {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const labels = [];
    for (let i = 1; i <= lastDay; i++) {
      const item = new Date(year, month, i);
      labels.push({
        key: formatDateKey(item),
        label: `${i}`
      });
    }
    return labels;
  } else {
    const labels = [];
    for (let m = 1; m <= 12; m++) {
      labels.push({
        key: `${year}-${String(m).padStart(2, '0')}`,
        label: `${m}月`
      });
    }
    return labels;
  }
});

// ==================== KPI COMPUTED ====================
const totalFocusSeconds = computed(() => {
  return activeLogs.value.reduce((acc, log) => acc + log.duration, 0);
});

const totalIdleSeconds = computed(() => {
  return activeLogs.value.reduce((acc, log) => acc + log.idleTime, 0);
});

const scopeFocusSubtitle = computed(() => {
  if (calendarMode.value === 'day') return '今日净深度工作时间';
  if (calendarMode.value === 'week') return '本周7日累计专注总时长';
  if (calendarMode.value === 'month') return '本月度总累计投入时间';
  return '本年度累计有效专注总时长';
});

const averageMetricLabel = computed(() => {
  if (calendarMode.value === 'day') return '时段专注峰值';
  return '日均专注时长';
});

const averageFocusSeconds = computed(() => {
  if (calendarMode.value === 'day') {
    const hourly = Array(24).fill(0);
    activeLogs.value.forEach(l => {
      const h = new Date(l.startTime).getHours();
      hourly[h] += l.duration;
    });
    return Math.max(...hourly, 0);
  } else if (calendarMode.value === 'week') {
    return Math.round(totalFocusSeconds.value / 7);
  } else if (calendarMode.value === 'month') {
    const d = currentDate.value;
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.round(totalFocusSeconds.value / daysInMonth);
  } else {
    return Math.round(totalFocusSeconds.value / 365);
  }
});

const averageMetricSubtitle = computed(() => {
  if (calendarMode.value === 'day') return '今日最高单小时专注';
  if (calendarMode.value === 'week') return '周内每日平均产出';
  if (calendarMode.value === 'month') return '全月每日平均产出';
  return '全年每日平均产出';
});

const sessionAverageSeconds = computed(() => {
  if (activeLogs.value.length === 0) return 0;
  return Math.round(totalFocusSeconds.value / activeLogs.value.length);
});

const topDocInfo = computed(() => {
  const aggregated: Record<string, number> = {};
  activeLogs.value.forEach(l => {
    const title = docTitles.value[l.docId] || l.docId || '未知文档';
    aggregated[title] = (aggregated[title] || 0) + l.duration;
  });

  const sorted = Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return { title: '暂无活动', durationStr: '0m', percent: 0 };
  }

  const [topTitle, dur] = sorted[0];
  const pct = totalFocusSeconds.value > 0 ? Math.round((dur / totalFocusSeconds.value) * 100) : 0;
  return {
    title: topTitle,
    durationStr: formatDuration(dur),
    percent: pct
  };
});

// ==================== DATA LOADING ====================
const loadDataForCurrentScope = async () => {
  if (!plugin || !(plugin as any).storageManager) return;
  const sm = (plugin as any).storageManager;

  const d = currentDate.value;
  const year = d.getFullYear();
  const month = d.getMonth();

  if (calendarMode.value === 'day') {
    const dateStr = formatDateKey(d);
    const logs = await sm.loadLogsForDate(dateStr);
    activeLogs.value = logs;
    scopeDayMap.value = { [dateStr]: logs };
  } else if (calendarMode.value === 'week') {
    const dayOfWeek = d.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const res = await sm.loadLogsForWeek(monday);
    activeLogs.value = res.allLogs;
    scopeDayMap.value = res.dayMap;
  } else if (calendarMode.value === 'month') {
    const res = await sm.loadLogsForMonth(year, month + 1);
    activeLogs.value = res.allLogs;
    scopeDayMap.value = res.dayMap;
  } else {
    const res = await sm.loadLogsForYear(year);
    activeLogs.value = res.allLogs;
    scopeDayMap.value = res.dayMap;
  }

  // Pre-fetch titles
  activeLogs.value.forEach(log => {
    if (log.docId) {
      fetchDocTitle(log.docId);
    }
  });
};

// 刷新数据
const handleRefreshData = async () => {
  if (plugin && (plugin as any).storageManager) {
    (plugin as any).storageManager.clearCache();
  }
  await loadDataForCurrentScope();
  showToast('已重新载入并计算最新时间数据');
};

// 打开设置
const handleOpenSetting = () => {
  if (plugin && (plugin as any).openSetting) {
    (plugin as any).openSetting();
  }
};

// Mode Switch
const switchMode = (mode: 'day' | 'week' | 'month' | 'year') => {
  calendarMode.value = mode;
  loadDataForCurrentScope();
};

const handleCalendarSwitchMode = (mode: 'day' | 'week' | 'month' | 'year') => {
  switchMode(mode);
};

// Period Navigation
const navigatePeriod = (step: number) => {
  const d = new Date(currentDate.value);
  if (calendarMode.value === 'day') {
    d.setDate(d.getDate() + step);
  } else if (calendarMode.value === 'week') {
    d.setDate(d.getDate() + step * 7);
  } else if (calendarMode.value === 'month') {
    d.setMonth(d.getMonth() + step);
  } else {
    d.setFullYear(d.getFullYear() + step);
  }
  currentDate.value = d;
  loadDataForCurrentScope();
};

const jumpToToday = () => {
  currentDate.value = new Date();
  loadDataForCurrentScope();
};

const handleSelectDate = (d: Date) => {
  currentDate.value = new Date(d);
  calendarMode.value = 'day';
  loadDataForCurrentScope();
};

// ==================== DATA EXPORT ====================
const handleExport = (range: 'current' | 'all', format: 'csv' | 'json') => {
  isExportMenuOpen.value = false;
  let logsToExport = activeLogs.value;
  let prefix = `${calendarMode.value}-${currentPeriodLabel.value}`;

  if (range === 'all') {
    if (plugin && (plugin as any).storageManager) {
      const cached = (plugin as any).storageManager.getAllCachedLogs();
      if (cached && cached.length > 0) {
        logsToExport = cached;
      }
    }
    prefix = 'siyuan-time-spent-all';
  }

  if (!logsToExport || logsToExport.length === 0) {
    showToast('⚠️ 当前无任何可导出的数据');
    return;
  }

  const filename = `${prefix}.${format}`;
  if (format === 'csv') {
    Exporter.exportToCsv(logsToExport, filename);
  } else {
    Exporter.exportToJson(logsToExport, filename);
  }
  showToast(`成功导出 ${logsToExport.length} 条记录 (${format.toUpperCase()})`);
};

// Focus Goal Management
const saveFocusGoal = () => {
  const val = focusGoal.value.trim();
  try {
    localStorage.setItem(STORAGE_KEY_FOCUS_GOAL, val);
    if (plugin && (plugin as any).saveData) {
      (plugin as any).saveData('focus_goal.json', { goal: val });
    }
  } catch (e) {
    // 忽略异常
  }
  focusGoalSavedTip.value = true;
  if (focusGoalTipTimer) clearTimeout(focusGoalTipTimer);
  focusGoalTipTimer = setTimeout(() => {
    focusGoalSavedTip.value = false;
  }, 2000);
};

const startEditingGoal = () => {
  editGoalInput.value = focusGoal.value;
  isEditingFocusGoal.value = true;
  nextTick(() => {
    goalInputRef.value?.focus();
    goalInputRef.value?.select();
  });
};

const confirmGoalEdit = () => {
  focusGoal.value = editGoalInput.value.trim();
  saveFocusGoal();
  isEditingFocusGoal.value = false;
};

const cancelGoalEdit = () => {
  isEditingFocusGoal.value = false;
  editGoalInput.value = focusGoal.value;
};

const selectGoalCandidate = (candidate: string) => {
  focusGoal.value = candidate;
  editGoalInput.value = candidate;
  saveFocusGoal();
  isEditingFocusGoal.value = false;
};

const clearFocusGoal = () => {
  focusGoal.value = '';
  editGoalInput.value = '';
  saveFocusGoal();
  isEditingFocusGoal.value = true;
  nextTick(() => {
    goalInputRef.value?.focus();
  });
};

// AI Summary
const openAiSummaryModal = () => {
  isAiModalVisible.value = true;
};

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

// 键盘快捷键监听
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // 如果焦点在输入框中，不触发单键快捷键
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    navigatePeriod(-1);
  } else if (e.altKey && e.key === 'ArrowRight') {
    e.preventDefault();
    navigatePeriod(1);
  } else if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    jumpToToday();
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    handleRefreshData();
  } else if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    handleOpenSetting();
  }
};

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeyDown);
  loadDataForCurrentScope();
  // 载入持久化的专注目标
  if (plugin && (plugin as any).loadData) {
    try {
      const data = await (plugin as any).loadData('focus_goal.json');
      if (data && data.goal && !focusGoal.value) {
        focusGoal.value = data.goal;
      }
    } catch (err) {
      // 忽略异常
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
  if (focusGoalTipTimer) {
    clearTimeout(focusGoalTipTimer);
  }
});

watch([calendarMode, currentDate], () => {
  loadDataForCurrentScope();
});
</script>

<style scoped>
.time-spent-dashboard {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: var(--st-text-primary, #f0f6fc);
}

/* 语义化卡片与背景 */
.sy-card {
  background-color: var(--st-bg-surface, #161b22);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

/* Focus Goal 专属 Hero 独立圆角方框卡片 (鲜明区分于普通卡片) */
.focus-goal-hero-card {
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.75) 100%);
  border: 1px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 4px 20px -2px rgba(99, 102, 241, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
}

:root[data-theme-mode="light"] .focus-goal-hero-card,
.theme--light .focus-goal-hero-card {
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  border: 1px solid #c7d2fe;
  box-shadow: 0 4px 15px -2px rgba(99, 102, 241, 0.08), inset 0 1px 0 0 #ffffff;
}

.sy-goal-title {
  color: #ffffff;
}

:root[data-theme-mode="light"] .sy-goal-title,
.theme--light .sy-goal-title {
  color: #1e1b4b;
}

.sy-btn-goal-action {
  background-color: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #c7d2fe;
}

.sy-btn-goal-action:hover {
  background-color: rgba(99, 102, 241, 0.28);
  color: #ffffff;
  border-color: rgba(99, 102, 241, 0.5);
}

:root[data-theme-mode="light"] .sy-btn-goal-action,
.theme--light .sy-btn-goal-action {
  background-color: #e0e7ff;
  border: 1px solid #c7d2fe;
  color: #3730a3;
}

:root[data-theme-mode="light"] .sy-btn-goal-action:hover,
.theme--light .sy-btn-goal-action:hover {
  background-color: #c7d2fe;
  color: #1e1b4b;
}

.sy-pill-group {
  background-color: var(--st-bg-surface, #161b22);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

/* 导出下拉菜单：强制坚实不透明实体背景，彻底杜绝背后文字重叠穿透 */
.sy-dropdown-card {
  background-color: #1a202c !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.65), 0 10px 10px -5px rgba(0, 0, 0, 0.4) !important;
}

:root[data-theme-mode="light"] .sy-dropdown-card,
.theme--light .sy-dropdown-card {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
}

.sy-header-border {
  border-bottom: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-divider {
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-text-primary {
  color: var(--st-text-primary, #f0f6fc);
}

.sy-text-secondary {
  color: var(--st-text-secondary, #8b949e);
}

.sy-text-tertiary {
  color: var(--st-text-tertiary, #6e7681);
}

.sy-badge {
  background-color: var(--st-primary-subtle, rgba(99, 102, 241, 0.14));
  border: 1px solid var(--st-primary-border, rgba(99, 102, 241, 0.4));
  color: var(--st-primary, #818cf8);
}

.sy-goal-icon-badge {
  background-color: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.35);
}

:root[data-theme-mode="light"] .sy-goal-icon-badge,
.theme--light .sy-goal-icon-badge {
  background-color: #e0e7ff;
  border: 1px solid #c7d2fe;
}

.sy-btn-card-action {
  background-color: var(--st-bg-elevated, #21262d);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.15));
  color: var(--st-text-secondary, #8b949e);
}

.sy-btn-card-action:hover {
  background-color: var(--st-bg-hover, rgba(148, 163, 184, 0.16));
  color: var(--st-text-primary, #ffffff);
}

.sy-input-field {
  background-color: var(--st-bg-base, #0d1117);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.15));
  color: var(--st-text-primary, #f0f6fc);
}

.sy-input-field:focus {
  border-color: var(--st-primary, #6366f1);
  box-shadow: 0 0 0 1px var(--st-primary, #6366f1);
}

.sy-candidate-pill {
  background-color: var(--st-bg-subtle, rgba(148, 163, 184, 0.08));
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
  color: var(--st-text-secondary, #8b949e);
}

.sy-candidate-pill:hover {
  background-color: var(--st-primary-subtle, rgba(99, 102, 241, 0.14));
  color: var(--st-primary, #818cf8);
  border-color: var(--st-primary-border, rgba(99, 102, 241, 0.4));
}

.sy-candidate-pill.is-selected {
  background-color: var(--st-primary-subtle, rgba(99, 102, 241, 0.18));
  border-color: var(--st-primary, #6366f1);
  color: var(--st-primary, #818cf8);
  font-weight: 600;
}

/* 核心线框图标防御：彻底清除思源主题强行注入的 fill */
:deep(svg),
svg.sy-wire-icon {
  fill: none !important;
}
</style>
