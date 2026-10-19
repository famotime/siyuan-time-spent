<template>
  <div class="time-spent-dashboard isolate relative z-0 p-4 sm:p-6 min-h-full flex flex-col gap-4 sm:gap-5" :class="{ 'is-mobile-dashboard': isMobileView }" :data-theme-mode="isDarkMode ? 'dark' : 'light'">
    
    <!-- ==================== DESKTOP LAYOUT ==================== -->
    <template v-if="!isMobileView">
      <!-- ==================== TOP NAVIGATION & HEADER ==================== -->
      <header class="flex flex-col gap-3.5 pb-3.5 sy-header-border">
      
      <!-- Top Row: Brand, Tracking Status & Actions -->
      <div class="flex justify-between items-center w-full">
        <!-- Title & Live Status -->
        <div class="flex items-center gap-3.5">
          <!-- 品牌图标 -->
          <div class="w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shrink-0 bg-transparent">
            <img :src="iconUrl" :alt="t('title')" class="w-full h-full object-contain drop-shadow-md select-none" />
          </div>
          <div class="flex flex-col justify-center">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-xl sm:text-2xl font-black tracking-wide sy-text-primary">
                {{ t('title') }}
              </h1>
              <span class="text-xs px-2.5 py-0.5 rounded-full sy-badge font-medium">
                {{ t('brandSubtitle') }}
              </span>
            </div>
            <p class="text-xs sy-text-secondary mt-0.5 leading-relaxed">
              {{ t('brandSlogan') }}
            </p>
          </div>
        </div>

        <!-- Header Right Actions: Settings, Refresh & Close -->
        <div class="flex items-center gap-1.5 shrink-0">
          <!-- 番茄钟快捷入口 -->
          <SyTooltip :content="t('pomodoroTimerTitle')" placement="bottom">
            <SyIconButton 
              ref="pomodoroBtnRef"
              icon="focus-ring" 
              size="md" 
              variant="secondary" 
              :aria-label="t('pomodoroTimerTitle')" 
              @click="handleOpenPomodoro" 
            />
          </SyTooltip>

          <!-- 刷新数据按钮 -->
          <SyTooltip :content="t('refreshDataTooltip')" shortcut="R" placement="bottom">
            <SyIconButton 
              icon="refresh" 
              size="md" 
              variant="secondary" 
              :aria-label="t('refreshDataAria')" 
              @click="handleRefreshData" 
            />
          </SyTooltip>

          <!-- 插件设置按钮 -->
          <SyTooltip :content="t('openSettingTooltip')" shortcut="S" placement="bottom">
            <SyIconButton 
              icon="settings" 
              size="md" 
              variant="secondary" 
              :aria-label="t('openSettingAria')" 
              @click="handleOpenSetting" 
            />
          </SyTooltip>

          <!-- 关闭看板按钮 -->
          <SyTooltip :content="t('closeDashboardTooltip')" shortcut="Esc" placement="bottom">
            <SyIconButton 
              icon="close" 
              size="md" 
              variant="ghost" 
              :aria-label="t('closeDashboardAria')" 
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
            :title="t('focusGoalClickToEdit')"
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
                  {{ t('focusGoalHeroBadge') }}
                </span>
                <span class="text-xs text-indigo-400/60">·</span>
                <span class="text-xs text-indigo-300 font-medium">{{ t('focusGoalCurrent') }}</span>
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
              <span>{{ t('saved') }}</span>
            </span>

            <!-- 编辑按钮 (显式线框) -->
            <SyTooltip :content="t('focusGoalEditing')" placement="top">
              <button 
                @click.stop="startEditingGoal"
                class="sy-btn-goal-action h-8.5 px-3 flex items-center gap-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>{{ t('edit') }}</span>
              </button>
            </SyTooltip>

            <!-- 清除按钮 (显式线框) -->
            <SyTooltip :content="t('clearGoal')" placement="top">
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
                  {{ t('focusGoalHeroBadge') }}
                </span>
                <span class="text-xs font-bold sy-goal-title tracking-wide">
                  {{ t('focusGoalTitle') }}
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
                :title="t('emptyInputHint')">
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
                :title="t('saveGoalHint')"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{{ t('save') }}</span>
              </button>

              <button 
                v-if="focusGoal"
                @click="cancelGoalEdit"
                class="sy-btn-goal-action h-10 px-3.5 text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                :title="t('cancelGoalHint')"
              >
                {{ t('cancel') }}
              </button>
            </div>
          </div>

          <!-- 目标预设快捷选择标签 (根据当前日历周期智能联动推荐) -->
          <div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-500/20">
            <span class="text-xs text-indigo-600 dark:text-indigo-300/80 shrink-0 select-none flex items-center gap-1.5 font-medium">
              <svg class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ calendarMode === 'day' ? t('recommendedDay') : calendarMode === 'week' ? t('recommendedWeek') : t('recommendedMonth') }}
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
            <SyTooltip :content="t('navPrevPeriod')" shortcut="Alt + ←" placement="bottom">
              <button 
                @click="navigatePeriod(-1)" 
                class="w-7 h-7 flex items-center justify-center sy-text-secondary hover:sy-text-primary rounded-lg transition-colors cursor-pointer"
                :aria-label="t('navPrevPeriod')"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </SyTooltip>
            
            <!-- 回到今天/当前周期 -->
            <SyTooltip :content="t('navBackTo', { target: calendarMode === 'day' ? t('targetDate') : calendarMode === 'week' ? t('targetWeek') : calendarMode === 'month' ? t('targetMonth') : t('targetYear') })" shortcut="T" placement="bottom">
              <button 
                @click="jumpToToday" 
                class="px-3 h-7 flex items-center justify-center text-xs font-semibold sy-text-primary hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors border-x sy-divider cursor-pointer"
              >
                {{ todayButtonLabel }}
              </button>
            </SyTooltip>

            <!-- 下一周期 -->
            <SyTooltip :content="t('navNextPeriod')" shortcut="Alt + →" placement="bottom">
              <button 
                @click="navigatePeriod(1)" 
                class="w-7 h-7 flex items-center justify-center sy-text-secondary hover:sy-text-primary rounded-lg transition-colors cursor-pointer"
                :aria-label="t('navNextPeriod')"
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
              {{ t('viewDay') }}
            </button>
            <button 
              @click="switchMode('week')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'week' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              {{ t('viewWeek') }}
            </button>
            <button 
              @click="switchMode('month')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'month' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              {{ t('viewMonth') }}
            </button>
            <button 
              @click="switchMode('year')" 
              class="h-7 px-3 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
              :class="calendarMode === 'year' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'sy-text-secondary hover:sy-text-primary hover:bg-black/5 dark:hover:bg-white/5'">
              {{ t('tabHeatmap') }}
            </button>
          </div>

          <!-- Export Dropdown -->
          <div class="relative">
            <SyTooltip :content="t('exportTooltip')" placement="bottom">
              <button 
                @click="isExportMenuOpen = !isExportMenuOpen" 
                class="h-9 px-3 inline-flex items-center gap-1.5 sy-pill-group hover:bg-black/5 dark:hover:bg-white/10 sy-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer box-border shadow-xs"
              >
                <svg class="w-3.5 h-3.5 sy-wire-icon sy-text-secondary" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{{ t('export') }}</span>
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
                {{ t('exportCurrentScope', { scope: modeName }) }}
              </div>
              <button @click="handleExport('current', 'csv')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>{{ t('exportCurrentCsv') }}</span>
                <span class="text-xs sy-text-tertiary font-mono">.csv</span>
              </button>
              <button @click="handleExport('current', 'json')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>{{ t('exportCurrentJson') }}</span>
                <span class="text-xs sy-text-tertiary font-mono">.json</span>
              </button>

              <div class="px-3.5 py-1 text-xs sy-text-tertiary font-mono border-y sy-divider mt-1">
                {{ t('exportAllHistory') }}
              </div>
              <button @click="handleExport('all', 'csv')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>{{ t('exportAllCsv') }}</span>
                <span class="text-xs sy-text-tertiary font-mono">.csv</span>
              </button>
              <button @click="handleExport('all', 'json')" class="px-3.5 py-2 text-left hover:bg-indigo-500/15 hover:text-indigo-400 flex items-center justify-between cursor-pointer transition-colors">
                <span>{{ t('exportAllJson') }}</span>
                <span class="text-xs sy-text-tertiary font-mono">.json</span>
              </button>
            </div>
          </div>

          <!-- Daily Note 归档按钮 -->
          <SyTooltip :content="t('dailyNoteArchiveTooltip')" placement="bottom">
            <button 
              @click="handleArchiveToDailyNote" 
              :disabled="isArchivingDailyNote"
              class="h-9 px-3 inline-flex items-center gap-1.5 sy-pill-group hover:bg-black/5 dark:hover:bg-white/10 sy-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer box-border shadow-xs disabled:opacity-50"
            >
              <svg class="w-3.5 h-3.5 text-indigo-500 sy-wire-icon" :class="{ 'animate-spin': isArchivingDailyNote }" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{{ isArchivingDailyNote ? t('dailyNoteArchiving') : t('dailyNoteArchiveBtn') }}</span>
            </button>
          </SyTooltip>

          <!-- AI Summary Button -->
          <SyTooltip :content="t('aiSummaryModalTitle')" shortcut="Ctrl + Enter" placement="bottom">
            <button 
              @click="openAiSummaryModal" 
              class="h-9 px-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer box-border"
            >
              <svg class="w-3.5 h-3.5 text-purple-200 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{{ t('aiSummaryBtn') }}</span>
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
          <div class="flex items-center justify-between text-xs sy-text-secondary mb-1">
            <span>{{ modeName }} {{ t('statTotalDuration') }}</span>
            <span class="text-indigo-500 dark:text-indigo-400 font-mono font-medium">Total</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-300">
            {{ formatDuration(totalFocusSeconds) }}
          </div>
          <div class="text-xs sy-text-secondary mt-1 truncate">
            {{ scopeFocusSubtitle }}
          </div>
        </div>

        <!-- KPI 2: Daily Average or Pace -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-cyan-500/60">
          <div class="flex items-center justify-between text-xs sy-text-secondary mb-1">
            <span>{{ averageMetricLabel }}</span>
            <span class="text-cyan-600 dark:text-cyan-400 font-mono font-medium">Avg</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {{ formatDuration(averageFocusSeconds) }}
          </div>
          <div class="text-xs sy-text-secondary mt-1 truncate">
            {{ averageMetricSubtitle }}
          </div>
        </div>

        <!-- KPI 3: Total Sessions -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-emerald-500/60">
          <div class="flex items-center justify-between text-xs sy-text-secondary mb-1">
            <span>{{ t('statSessions') }}</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Sessions</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {{ activeLogs.length }} <span class="text-xs font-normal sy-text-secondary">{{ t('statSessionUnit') }}</span>
          </div>
          <div class="text-xs sy-text-secondary mt-1 truncate">
            {{ t('statAvgSessionPrefix') }}{{ formatDuration(sessionAverageSeconds) }}
          </div>
        </div>

        <!-- KPI 4: Idle Time Deducted -->
        <div class="kpi-card sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-amber-500/60">
          <div class="flex items-center justify-between text-xs sy-text-secondary mb-1">
            <span>{{ t('statIdleDeducted') }}</span>
            <span class="text-amber-600 dark:text-amber-400 font-mono font-medium">Idle Filter</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">
            {{ formatDuration(totalIdleSeconds) }}
          </div>
          <div class="text-xs sy-text-secondary mt-1 truncate">
            {{ t('statIdleDeductedDesc') }}
          </div>
        </div>

        <!-- KPI 5: Top Focus Target -->
        <div class="kpi-card col-span-2 sm:col-span-1 sy-card p-3.5 rounded-xl shadow-sm transition-all hover:border-purple-500/60">
          <div class="flex items-center justify-between text-xs sy-text-secondary mb-1">
            <span>{{ t('statTopFocus') }}</span>
            <span class="text-purple-600 dark:text-purple-400 font-mono font-medium">Top Focus</span>
          </div>
          <div class="text-sm font-bold sy-text-primary truncate mt-0.5" :title="topDocInfo.title">
            {{ topDocInfo.title }}
          </div>
          <div class="text-xs text-purple-600 dark:text-purple-300 mt-1 font-mono font-bold">
            {{ topDocInfo.durationStr }} ({{ t('statTopShare') }} {{ topDocInfo.percent }}%)
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
        <div class="flex items-center gap-2.5">
          <span class="text-xs sy-text-secondary hidden md:inline">
            <template v-if="calendarMode === 'year'">{{ t('hintDrilldownYear') }}</template>
            <template v-else-if="calendarMode === 'month'">{{ t('hintDrilldownMonth') }}</template>
            <template v-else-if="calendarMode === 'week'">{{ t('hintDrilldownWeek') }}</template>
            <template v-else>{{ t('hintClickDoc') }}</template>
          </span>
        </div>
      </div>

      <!-- Year Mode: Heatmap View (365天热力图) -->
      <HeatmapView
        v-if="calendarMode === 'year'"
        :year="currentDate.getFullYear()"
        :day-map="scopeDayMap"
        :is-loading="isScopeLoading"
        @select-date="handleSelectDate"
      />

      <!-- Day / Week / Month Mode: Calendar View -->
      <CalendarView
        v-else
        :logs="activeLogs" 
        :day-map="scopeDayMap" 
        :mode="calendarMode" 
        :current-date="currentDate" 
        :is-loading="isScopeLoading"
        @select-date="handleSelectDate" 
        @switch-mode="handleCalendarSwitchMode"
        @open-manual-log="isManualLogModalVisible = true"
        @delete-log="handleDeleteLog"
      />
    </section>
    </template>

    <!-- ==================== MOBILE LAYOUT ==================== -->
    <template v-else>
      <div class="mobile-layout flex flex-col flex-1 min-h-0 w-full gap-3">
        <!-- 移动端顶部标题与轻量操作栏 -->
        <header class="mobile-header flex items-center justify-between pb-2.5 border-b sy-header-border shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 flex items-center justify-center shrink-0">
              <img :src="iconUrl" :alt="t('title')" class="w-full h-full object-contain drop-shadow-sm select-none" />
            </div>
            <div class="flex flex-col min-w-0">
              <h1 class="text-base font-bold sy-text-primary truncate leading-tight">
                {{ t('title') }}
              </h1>
              <span class="text-[10px] sy-text-secondary truncate">
                {{ t('brandSubtitle') }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <SyIconButton 
              icon="refresh" 
              size="sm" 
              variant="secondary" 
              :aria-label="t('refreshDataAria')" 
              @click="handleRefreshData" 
            />
            <button 
              @click="openAiSummaryModal" 
              class="h-7 px-2.5 inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
            >
              <svg class="w-3 h-3 text-purple-200 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{{ t('aiSummaryBtn') }}</span>
            </button>
            <SyIconButton 
              icon="focus-ring" 
              size="sm" 
              variant="secondary" 
              :aria-label="t('pomodoroTimerTitle')" 
              @click="handleOpenPomodoro" 
            />
            <SyIconButton 
              icon="settings" 
              size="sm" 
              variant="secondary" 
              :aria-label="t('openSettingAria')" 
              @click="handleOpenSetting" 
            />
            <SyIconButton 
              icon="close" 
              size="sm" 
              variant="ghost" 
              :aria-label="t('closeDashboardAria')" 
              @click="emit('close')" 
            />
          </div>
        </header>

        <!-- 移动端 Tab 1: 【今日概览】 -->
        <main v-if="mobileTab === 'today'" class="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <!-- 紧凑番茄钟卡片 -->
          <MobilePomodoroCard />

          <!-- 今日核心 KPI 胶囊卡片 -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="sy-card p-3 rounded-xl shadow-xs">
              <div class="text-[11px] sy-text-secondary mb-0.5 flex items-center justify-between">
                <span>{{ t('statTotalDuration') }}</span>
                <span class="text-indigo-500 font-mono text-[10px]">Today</span>
              </div>
              <div class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
                {{ formatDuration(totalFocusSeconds) }}
              </div>
            </div>

            <div class="sy-card p-3 rounded-xl shadow-xs">
              <div class="text-[11px] sy-text-secondary mb-0.5 flex items-center justify-between">
                <span>{{ t('statSessions') }}</span>
                <span class="text-emerald-500 font-mono text-[10px]">Count</span>
              </div>
              <div class="text-lg font-black text-emerald-500">
                {{ activeLogs.length }} <span class="text-xs font-normal sy-text-secondary">{{ t('statSessionUnit') }}</span>
              </div>
            </div>
          </div>

          <!-- 专注目标简要卡片 (如已设定) -->
          <div v-if="focusGoal" class="focus-goal-hero-card rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs font-bold text-indigo-400 shrink-0">🎯 {{ t('focusGoalHeroBadge') }}:</span>
              <span class="text-xs font-semibold sy-text-primary truncate">{{ focusGoal }}</span>
            </div>
            <button 
              @click="startEditingGoal" 
              class="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium shrink-0 px-2 py-0.5 rounded bg-indigo-500/10 cursor-pointer"
            >
              {{ t('edit') }}
            </button>
          </div>

          <!-- 今日时间明细与时间轴 -->
          <div class="flex-1 flex flex-col min-h-0 pt-1">
            <CalendarView
              :logs="activeLogs" 
              :day-map="scopeDayMap" 
              mode="day" 
              :current-date="currentDate" 
              :is-loading="isScopeLoading"
              @select-date="handleSelectDate" 
              @switch-mode="handleCalendarSwitchMode"
              @open-manual-log="isManualLogModalVisible = true"
              @delete-log="handleDeleteLog"
            />
          </div>
        </main>

        <!-- 移动端 Tab 2: 【周期日历】 -->
        <main v-else-if="mobileTab === 'calendar'" class="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <!-- 周期导航与视图切换 -->
          <div class="flex items-center justify-between gap-2 p-2 rounded-xl sy-pill-group shrink-0">
            <div class="flex items-center gap-1">
              <button 
                @click="navigatePeriod(-1)" 
                class="w-7 h-7 flex items-center justify-center sy-text-secondary hover:sy-text-primary rounded-lg transition-colors cursor-pointer"
                :aria-label="t('navPrevPeriod')"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                @click="jumpToToday" 
                class="px-2 h-7 text-xs font-semibold sy-text-primary hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors border-x sy-divider cursor-pointer"
              >
                {{ todayButtonLabel }}
              </button>

              <button 
                @click="navigatePeriod(1)" 
                class="w-7 h-7 flex items-center justify-center sy-text-secondary hover:sy-text-primary rounded-lg transition-colors cursor-pointer"
                :aria-label="t('navNextPeriod')"
              >
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <span class="text-xs font-mono font-medium sy-text-primary ml-1 truncate max-w-[130px]">
                {{ currentPeriodLabel }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button 
                @click="switchMode('week')" 
                class="h-7 px-2.5 text-xs rounded-lg transition-all font-medium cursor-pointer"
                :class="calendarMode === 'week' ? 'bg-indigo-600 text-white font-bold' : 'sy-text-secondary'"
              >
                {{ t('viewWeek') }}
              </button>
              <button 
                @click="switchMode('month')" 
                class="h-7 px-2.5 text-xs rounded-lg transition-all font-medium cursor-pointer"
                :class="calendarMode === 'month' ? 'bg-indigo-600 text-white font-bold' : 'sy-text-secondary'"
              >
                {{ t('viewMonth') }}
              </button>
            </div>
          </div>

          <!-- CalendarView (周 / 月) -->
          <div class="flex-1 min-h-[380px]">
            <CalendarView
              :logs="activeLogs" 
              :day-map="scopeDayMap" 
              :mode="calendarMode === 'year' ? 'week' : calendarMode" 
              :current-date="currentDate" 
              :is-loading="isScopeLoading"
              @select-date="handleSelectDate" 
              @switch-mode="handleCalendarSwitchMode"
              @open-manual-log="isManualLogModalVisible = true"
              @delete-log="handleDeleteLog"
            />
          </div>
        </main>

        <!-- 移动端 Tab 3: 【统计热力】 -->
        <main v-else class="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <!-- 统计概览指标 -->
          <div class="grid grid-cols-2 gap-2.5 shrink-0">
            <div class="sy-card p-3 rounded-xl shadow-xs">
              <div class="text-[11px] sy-text-secondary mb-0.5">
                {{ modeName }} {{ t('statTotalDuration') }}
              </div>
              <div class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
                {{ formatDuration(totalFocusSeconds) }}
              </div>
              <div class="text-[10px] sy-text-secondary mt-0.5 truncate">
                {{ scopeFocusSubtitle }}
              </div>
            </div>

            <div class="sy-card p-3 rounded-xl shadow-xs">
              <div class="text-[11px] sy-text-secondary mb-0.5">
                {{ averageMetricLabel }}
              </div>
              <div class="text-lg font-black text-cyan-600 dark:text-cyan-400">
                {{ formatDuration(averageFocusSeconds) }}
              </div>
              <div class="text-[10px] sy-text-secondary mt-0.5 truncate">
                {{ averageMetricSubtitle }}
              </div>
            </div>
          </div>

          <!-- Charts 图表 -->
          <div class="charts-container">
            <Charts 
              :logs="activeLogs" 
              :scope-type="calendarMode" 
              :scope-date-title="currentPeriodLabel" 
              :day-map="scopeDayMap" 
              :day-labels="scopeDayLabels" 
            />
          </div>

          <!-- 年度热力图 -->
          <div class="sy-card rounded-xl p-3 shadow-xs flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold sy-text-primary flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                <span>{{ t('tabHeatmap') }} ({{ currentDate.getFullYear() }})</span>
              </h3>
            </div>
            <div class="overflow-x-auto pb-1">
              <HeatmapView
                :year="currentDate.getFullYear()"
                :day-map="scopeDayMap"
                :is-loading="isScopeLoading"
                @select-date="handleSelectDate"
              />
            </div>
          </div>
        </main>

        <!-- 移动端常驻底部 Tab 导航栏 -->
        <nav class="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-1.5 px-3 backdrop-blur-md">
          <button 
            @click="handleMobileTabSwitch('today')" 
            class="flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl transition-colors cursor-pointer"
            :class="mobileTab === 'today' ? 'text-indigo-500 font-bold' : 'sy-text-secondary hover:sy-text-primary'"
          >
            <svg class="w-5 h-5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span class="text-[11px] leading-tight">{{ t('mobileTabToday') }}</span>
          </button>

          <button 
            @click="handleMobileTabSwitch('calendar')" 
            class="flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl transition-colors cursor-pointer"
            :class="mobileTab === 'calendar' ? 'text-indigo-500 font-bold' : 'sy-text-secondary hover:sy-text-primary'"
          >
            <svg class="w-5 h-5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-[11px] leading-tight">{{ t('mobileTabCalendar') }}</span>
          </button>

          <button 
            @click="handleMobileTabSwitch('stats')" 
            class="flex flex-col items-center gap-0.5 flex-1 py-1 rounded-xl transition-colors cursor-pointer"
            :class="mobileTab === 'stats' ? 'text-indigo-500 font-bold' : 'sy-text-secondary hover:sy-text-primary'"
          >
            <svg class="w-5 h-5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span class="text-[11px] leading-tight">{{ t('mobileTabStats') }}</span>
          </button>
        </nav>
      </div>
    </template>

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

    <!-- Manual Log Modal (手动补录时间弹窗) -->
    <ManualLogModal
      :visible="isManualLogModalVisible"
      :date-str="formatDateKey(currentDate)"
      :doc-options="recentDocOptions"
      @save="handleSaveManualLog"
      @close="isManualLogModalVisible = false"
    />

    <!-- AFK Prompt Modal (离桌唤醒归因气泡) -->
    <AfkPromptModal
      :visible="isAfkModalVisible"
      :afk-duration-sec="afkEventData.durationSec"
      :afk-start-time="afkEventData.startTime"
      :afk-end-time="afkEventData.endTime"
      @select-offline="handleAfkOffline"
      @select-break="handleAfkBreak"
      @close="isAfkModalVisible = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import CalendarView from './CalendarView.vue';
import HeatmapView from './HeatmapView.vue';
import Charts from './Charts.vue';
import AiSummaryModal from './AiSummaryModal.vue';
import ManualLogModal from './ManualLogModal.vue';
import AfkPromptModal from './AfkPromptModal.vue';
import MobilePomodoroCard from './Pomodoro/MobilePomodoroCard.vue';
import SyTooltip from './Common/SyTooltip.vue';
import SyIconButton from './Common/SyIconButton.vue';
import type { TimeLog } from '../models/TimeLog';
import { usePlugin } from '../main';
import { AIExportManager } from '../utils/ai-export';
import { Exporter } from '../utils/exporter';
import { docTitles, fetchDocTitle } from '../utils/title-cache';
import Logger from '../utils/logger';
import iconUrl from '../../icon.webp';
import { t, formatDurationI18n, currentLang, getWeekdayNames } from '../i18n';
import { DailyNoteArchiver } from '../utils/daily-note';
import { showMessage } from 'siyuan';

const plugin = usePlugin();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 明暗双模主题感知体系
const isDarkMode = ref(true);

// Manual Log Modal State
const isManualLogModalVisible = ref(false);

// 作用域数据加载状态与竞态请求标识
const isScopeLoading = ref(false);
let scopeRequestId = 0;

const recentDocOptions = computed(() => {
  const map = new Map<string, string>();
  activeLogs.value.forEach(log => {
    if (log.docId && !map.has(log.docId)) {
      map.set(log.docId, docTitles.value[log.docId] || log.docId);
    }
  });
  if (plugin && plugin.timeTracker) {
    const curId = plugin.timeTracker.getCurrentDocId();
    if (curId && !map.has(curId)) {
      map.set(curId, docTitles.value[curId] || curId);
    }
  }
  return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
});

const handleSaveManualLog = async (log: TimeLog) => {
  if (plugin && plugin.timeTracker) {
    await plugin.timeTracker.addManualLog(log);
    showMessage(t('manualLogSuccess'));
    await handleRefreshData();
  }
};

const handleDeleteLog = async (log: TimeLog) => {
  if (plugin && plugin.timeTracker) {
    const dateStr = formatDateKey(new Date(log.startTime));
    const ok = await plugin.timeTracker.deleteLog(dateStr, log.id);
    if (ok) {
      showMessage(t('deleteLogSuccess'));
      await handleRefreshData();
    }
  }
};

// AFK Prompt Modal State
const isAfkModalVisible = ref(false);
const afkEventData = ref<{ durationSec: number; startTime: number; endTime: number }>({ durationSec: 0, startTime: 0, endTime: 0 });

const onAfkDetected = (e: Event) => {
  if (plugin?.settings?.enableAfkPrompt === false) return;
  const detail = (e as CustomEvent).detail;
  if (detail && detail.durationSec > 0) {
    afkEventData.value = detail;
    isAfkModalVisible.value = true;
  }
};

const handleAfkOffline = async (data: { startTime: number; endTime: number; duration: number; note?: string }) => {
  if (plugin && plugin.timeTracker) {
    const activeDocId = plugin.timeTracker.getCurrentDocId() || (activeLogs.value[0]?.docId) || 'offline-study';
    const offlineLog: TimeLog = {
      id: 'offline_' + Math.random().toString(36).substring(2, 12),
      docId: activeDocId,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      idleTime: 0,
      type: 'offline',
      note: data.note || t('afkOptionOffline')
    };
    await plugin.timeTracker.addManualLog(offlineLog);
    showMessage(t('afkRecordedMsg'));
    await handleRefreshData();
  }
};

const handleAfkBreak = () => {
  isAfkModalVisible.value = false;
};

const detectThemeMode = () => {
  // 1. 优先读取思源原生配置
  if ((window as any).siyuan?.config?.appearance?.mode !== undefined) {
    isDarkMode.value = (window as any).siyuan.config.appearance.mode === 1;
    return;
  }
  // 2. 读取 HTML / Body 属性
  const htmlTheme = document.documentElement.getAttribute('data-theme-mode');
  const bodyTheme = document.body.getAttribute('data-theme-mode');
  if (htmlTheme === 'dark' || bodyTheme === 'dark') {
    isDarkMode.value = true;
    return;
  }
  if (htmlTheme === 'light' || bodyTheme === 'light') {
    isDarkMode.value = false;
    return;
  }
  // 3. 兜底系统配色
  isDarkMode.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

let themeObserver: MutationObserver | null = null;

// State
const calendarMode = ref<'day' | 'week' | 'month' | 'year'>('week');
const currentDate = ref<Date>(new Date());
const activeLogs = ref<TimeLog[]>([]);
const scopeDayMap = ref<Record<string, TimeLog[]>>({});
const toastMessage = ref<string>('');

// 移动端多栏导航与自适应
const isMobileView = ref(false);
const mobileTab = ref<'today' | 'calendar' | 'stats'>('today');

const checkMobileView = () => {
  try {
    if (plugin?.isMobile) {
      isMobileView.value = true;
      return;
    }
  } catch {}
  isMobileView.value = window.innerWidth <= 768;
};

const handleMobileTabSwitch = (tab: 'today' | 'calendar' | 'stats') => {
  mobileTab.value = tab;
  if (tab === 'today') {
    if (calendarMode.value !== 'day') {
      scopeDayMap.value = {};
      activeLogs.value = [];
    }
    calendarMode.value = 'day';
    currentDate.value = new Date();
  } else if (tab === 'calendar') {
    if (calendarMode.value === 'day' || calendarMode.value === 'year') {
      scopeDayMap.value = {};
      activeLogs.value = [];
      calendarMode.value = 'week';
    }
  } else if (tab === 'stats') {
    if (calendarMode.value !== 'year') {
      scopeDayMap.value = {};
      activeLogs.value = [];
      calendarMode.value = 'year';
    }
  }
};

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
      t('candidateDay1'),
      t('candidateDay2'),
      t('candidateDay3'),
      t('candidateDay4'),
    ];
  } else if (calendarMode.value === 'week') {
    return [
      t('candidateWeek1'),
      t('candidateWeek2'),
      t('candidateWeek3'),
    ];
  } else if (calendarMode.value === 'month') {
    return [
      t('candidateMonth1'),
      t('candidateMonth2'),
    ];
  } else {
    return [];
  }
});

// 动态输入框占位符
const currentGoalPlaceholder = computed(() => {
  return t('focusGoalPlaceholder');
});

// AI Summary Modal State
const isAiModalVisible = ref(false);

// Daily Note Archiving State
const isArchivingDailyNote = ref(false);

const handleArchiveToDailyNote = async () => {
  if (isArchivingDailyNote.value) return;
  isArchivingDailyNote.value = true;
  try {
    const targetDate = formatDateKey(currentDate.value);
    const success = await DailyNoteArchiver.archiveToDailyNote(activeLogs.value, targetDate);
    if (success) {
      showMessage(t('dailyNoteArchiveSuccess'));
    } else {
      showMessage(t('dailyNoteArchiveFailed'), 6000, 'error');
    }
  } catch (e) {
    Logger.error('Failed to archive to daily note:', e);
    showMessage(t('dailyNoteArchiveFailed'), 6000, 'error');
  } finally {
    isArchivingDailyNote.value = false;
  }
};

// Formatter
const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDuration = (seconds: number) => {
  return formatDurationI18n(seconds, currentLang.value);
};

// Mode metadata
const modeName = computed(() => {
  if (calendarMode.value === 'day') return t('viewDay');
  if (calendarMode.value === 'week') return t('viewWeek');
  if (calendarMode.value === 'month') return t('viewMonth');
  return t('tabHeatmap');
});

const todayButtonLabel = computed(() => {
  const isEn = currentLang.value === 'en_US';
  if (calendarMode.value === 'day') return isEn ? 'Today' : '今日';
  if (calendarMode.value === 'week') return isEn ? 'This Week' : '本周';
  if (calendarMode.value === 'month') return isEn ? 'This Month' : '本月';
  return isEn ? 'This Year' : '本年';
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
  const isEn = currentLang.value === 'en_US';

  if (calendarMode.value === 'day') {
    if (isEn) {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
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
    if (isEn) {
      return `${mStr} - ${sStr}, ${year} (Week ${getWeekNumber(d)})`;
    }
    return `${year}年 (周度 ${mStr} - ${sStr})`;
  } else if (calendarMode.value === 'month') {
    if (isEn) {
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return `${year}年 ${month}月`;
  } else {
    if (isEn) {
      return `${year} (Annual Heatmap)`;
    }
    return `${year}年 (全年度热力)`;
  }
});

// 日历视图区块标题
const calendarSectionTitle = computed(() => {
  const d = currentDate.value;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const isEn = currentLang.value === 'en_US';

  if (calendarMode.value === 'day') {
    if (isEn) {
      return `Calendar View (${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })})`;
    }
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
    if (isEn) {
      return `Calendar View (${year} Week ${weekNum} · ${mStr} - ${sStr})`;
    }
    return `日历视图 (${year}年 第${weekNum}周 · ${mStr} - ${sStr})`;
  } else if (calendarMode.value === 'month') {
    if (isEn) {
      return `Calendar View (${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    }
    return `日历视图 (${year}年 第${month}月)`;
  } else {
    if (isEn) {
      return `Annual Focus Heatmap (${year})`;
    }
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
    const weekNames = getWeekdayNames(currentLang.value);
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
    const monthNames = currentLang.value === 'en_US'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    for (let m = 1; m <= 12; m++) {
      labels.push({
        key: `${year}-${String(m).padStart(2, '0')}`,
        label: monthNames[m - 1]
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
  if (calendarMode.value === 'day') return t('scopeFocusSubtitleDay');
  if (calendarMode.value === 'week') return t('scopeFocusSubtitleWeek');
  if (calendarMode.value === 'month') return t('scopeFocusSubtitleMonth');
  return t('scopeFocusSubtitleYear');
});

const averageMetricLabel = computed(() => {
  if (calendarMode.value === 'day') return t('averageMetricPeakDay');
  return t('averageMetricDailyAvg');
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
  if (calendarMode.value === 'day') return t('averageSubtitlePeak');
  if (calendarMode.value === 'week') return t('averageSubtitleWeek');
  if (calendarMode.value === 'month') return t('averageSubtitleMonth');
  return t('averageSubtitleYear');
});

const sessionAverageSeconds = computed(() => {
  if (activeLogs.value.length === 0) return 0;
  return Math.round(totalFocusSeconds.value / activeLogs.value.length);
});

const topDocInfo = computed(() => {
  const aggregated: Record<string, number> = {};
  activeLogs.value.forEach(l => {
    const title = docTitles.value[l.docId] || l.docId || t('timelineUnknownDoc');
    aggregated[title] = (aggregated[title] || 0) + l.duration;
  });

  const sorted = Object.entries(aggregated).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return { title: t('statNoActivity'), durationStr: '0m', percent: 0 };
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

  const currentReqId = ++scopeRequestId;
  isScopeLoading.value = true;

  const d = currentDate.value;
  const year = d.getFullYear();
  const month = d.getMonth();
  const mode = calendarMode.value;

  try {
    let newLogs: TimeLog[] = [];
    let newDayMap: Record<string, TimeLog[]> = {};

    if (mode === 'day') {
      const dateStr = formatDateKey(d);
      const logs = await sm.loadLogsForDate(dateStr);
      newLogs = logs;
      newDayMap = { [dateStr]: logs };
    } else if (mode === 'week') {
      const dayOfWeek = d.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const res = await sm.loadLogsForWeek(monday);
      newLogs = res.allLogs;
      newDayMap = res.dayMap;
    } else if (mode === 'month') {
      const res = await sm.loadLogsForMonth(year, month + 1);
      newLogs = res.allLogs;
      newDayMap = res.dayMap;
    } else {
      const res = await sm.loadLogsForYear(year);
      newLogs = res.allLogs;
      newDayMap = res.dayMap;
    }

    // 竞态守卫：如果期间用户触发了新的切换或翻页，则丢弃过期的异步响应
    if (currentReqId !== scopeRequestId) {
      return;
    }

    activeLogs.value = newLogs;
    scopeDayMap.value = newDayMap;

    // 智能去重并按需批量预取文档标题（避免海量 SQL 标题风暴）
    const uniqueDocIds = Array.from(new Set(newLogs.map((l) => l.docId).filter(Boolean)));
    for (const docId of uniqueDocIds) {
      if (!docTitles.value[docId]) {
        fetchDocTitle(docId);
      }
    }
  } catch (err) {
    Logger.error('Failed to load data for scope:', err);
    if (currentReqId === scopeRequestId) {
      showToast(t('loadDataFailed') || '加载数据失败，请重试');
    }
  } finally {
    if (currentReqId === scopeRequestId) {
      isScopeLoading.value = false;
    }
  }
};

// 刷新数据
const handleRefreshData = async () => {
  if (plugin && (plugin as any).storageManager) {
    (plugin as any).storageManager.clearCache();
  }
  await loadDataForCurrentScope();
  showToast(t('refreshSuccess'));
};

// 番茄钟入口
const pomodoroBtnRef = ref<any>(null);
const handleOpenPomodoro = (event?: MouseEvent) => {
  try {
    const anchorEl = (pomodoroBtnRef.value?.$el || pomodoroBtnRef.value || event?.currentTarget) as HTMLElement;
    if (plugin && (plugin as any).openPomodoro) {
      (plugin as any).openPomodoro({ anchorEl });
    }
  } catch (err) {
    console.error('Failed to open pomodoro from dashboard:', err);
  }
};

// 打开设置
const handleOpenSetting = () => {
  if (plugin && (plugin as any).openSetting) {
    (plugin as any).openSetting();
  }
};

// Mode Switch
const switchMode = (mode: 'day' | 'week' | 'month' | 'year') => {
  if (calendarMode.value === mode) return;
  // 模式改变时即刻清空旧数据，防止旧视图残留点亮部分格子（如只显示今天或10月）
  scopeDayMap.value = {};
  activeLogs.value = [];
  calendarMode.value = mode;
  // 由 watch([calendarMode, currentDate]) 触发 loadDataForCurrentScope
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
  // 由 watch 自动触发，移除手动重复调用
};

const jumpToToday = () => {
  const today = new Date();
  if (
    currentDate.value.getFullYear() === today.getFullYear() &&
    currentDate.value.getMonth() === today.getMonth() &&
    currentDate.value.getDate() === today.getDate()
  ) {
    // 已经处于今天，无需变更日期，但可执行一次刷新
    loadDataForCurrentScope();
    return;
  }
  currentDate.value = today;
  // 由 watch 自动触发，移除手动重复调用
};

const handleSelectDate = (d: Date) => {
  calendarMode.value = 'day';
  currentDate.value = new Date(d);
  if (isMobileView.value) {
    mobileTab.value = 'today';
  }
  // 由 watch 自动触发，移除手动重复调用
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
    showToast(t('noExportData'));
    return;
  }

  const filename = `${prefix}.${format}`;
  if (format === 'csv') {
    Exporter.exportToCsv(logsToExport, filename);
  } else {
    Exporter.exportToJson(logsToExport, filename);
  }
  showToast(t('exportSuccess', { count: logsToExport.length, format: format.toUpperCase() }));
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
  showToast(t('saveGoalSuccess'));
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
  showToast(t('saveGoalSuccess'));
};

const clearFocusGoal = () => {
  focusGoal.value = '';
  editGoalInput.value = '';
  saveFocusGoal();
  isEditingFocusGoal.value = true;
  showToast(t('clearGoalSuccess'));
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
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
  window.addEventListener('keydown', handleGlobalKeyDown);
  window.addEventListener('siyuan-time-spent:afk-detected', onAfkDetected);
  detectThemeMode();
  themeObserver = new MutationObserver(() => {
    detectThemeMode();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });

  if (isMobileView.value) {
    calendarMode.value = 'day';
    currentDate.value = new Date();
  }

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
  window.removeEventListener('resize', checkMobileView);
  window.removeEventListener('keydown', handleGlobalKeyDown);
  window.removeEventListener('siyuan-time-spent:afk-detected', onAfkDetected);
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
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
  background-color: var(--st-bg-base, var(--b3-theme-background, #0d1117));
  transition: background-color 200ms ease, color 200ms ease;
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
.theme--light .focus-goal-hero-card,
[data-theme-mode="light"] .focus-goal-hero-card {
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  border: 1px solid #c7d2fe;
  box-shadow: 0 4px 15px -2px rgba(99, 102, 241, 0.08), inset 0 1px 0 0 #ffffff;
}

.sy-goal-title {
  color: #ffffff;
}

:root[data-theme-mode="light"] .sy-goal-title,
.theme--light .sy-goal-title,
[data-theme-mode="light"] .sy-goal-title {
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
.theme--light .sy-btn-goal-action,
[data-theme-mode="light"] .sy-btn-goal-action {
  background-color: #e0e7ff;
  border: 1px solid #c7d2fe;
  color: #3730a3;
}

:root[data-theme-mode="light"] .sy-btn-goal-action:hover,
.theme--light .sy-btn-goal-action:hover,
[data-theme-mode="light"] .sy-btn-goal-action:hover {
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
.theme--light .sy-dropdown-card,
[data-theme-mode="light"] .sy-dropdown-card {
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
.theme--light .sy-goal-icon-badge,
[data-theme-mode="light"] .sy-goal-icon-badge {
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
  background-color: var(--st-bg-elevated, #0d1117);
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

/* 移动端专属适配 */
.is-mobile-dashboard {
  padding: 0.75rem 0.75rem calc(4.5rem + env(safe-area-inset-bottom, 0px)) 0.75rem !important;
  max-width: 100vw;
  box-sizing: border-box;
}

.mobile-bottom-nav {
  padding-bottom: calc(0.375rem + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
  background-color: var(--st-bg-surface, var(--b3-theme-background, #161b22));
  border-top: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

:root[data-theme-mode="light"] .mobile-bottom-nav,
.theme--light .mobile-bottom-nav,
[data-theme-mode="light"] .mobile-bottom-nav {
  background-color: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}
</style>
