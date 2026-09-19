<template>
  <div class="time-spent-dashboard isolate relative z-0 bg-gray-950 text-gray-100 p-4 sm:p-6 min-h-full flex flex-col gap-4 sm:gap-5">
    
    <!-- ==================== TOP NAVIGATION & HEADER ==================== -->
    <header class="flex flex-col gap-3.5 pb-3.5 border-b border-gray-800/80">
      
      <!-- Top Row: Brand & Close Button -->
      <div class="flex justify-between items-center w-full">
        <!-- Title & Live Status -->
        <div class="flex items-center gap-3.5">
          <!-- 放大图标尺寸，显示原 icon 纯净透明底色 -->
          <div class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 bg-transparent">
            <img :src="iconUrl" alt="源时记" class="w-full h-full object-contain drop-shadow-xl select-none" />
          </div>
          <div class="flex flex-col justify-center">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-xl sm:text-2xl font-black tracking-wide text-white">
                源时记
              </h1>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 font-medium shadow-sm">
                时间分布与专注看板
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              全自动深度工作追踪 · 智能防挂机 · 多维日历复盘
            </p>
          </div>
        </div>

        <!-- Header Right Close Button -->
        <button @click="emit('close')" 
                class="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer" 
                title="关闭看板">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Focus Goal Hero Section (专注目标 Hero 卡片) -->
      <div class="focus-goal-card bg-gray-900/90 border border-gray-800/90 hover:border-gray-700/80 rounded-xl p-3 sm:p-4 transition-all shadow-sm">
        <!-- Mode 1: Display Mode (已设定目标且非编辑态) -->
        <div v-if="focusGoal && !isEditingFocusGoal" class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <!-- Left & Center: Badge + Statement (点击整块可快速进入编辑) -->
          <div 
            @click="startEditingGoal"
            class="flex items-center gap-3.5 cursor-pointer group flex-1 min-w-0"
            title="点击修改专注目标"
          >
            <!-- 40px 精致靶心线框徽章 (深色底，靛蓝强调，纯线框设计) -->
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-800/90 border border-gray-700/80 group-hover:border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner transition-colors">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>

            <!-- 目标标题微标签与显著放大加粗宣言 -->
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  FOCUS GOAL
                </span>
                <span class="text-[11px] text-gray-500">·</span>
                <span class="text-[11px] text-gray-400 font-medium">当前专注目标</span>
              </div>
              <div class="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-indigo-200 transition-colors truncate tracking-wide mt-0.5" :title="focusGoal">
                {{ focusGoal }}
              </div>
            </div>
          </div>

          <!-- Right Action Buttons & Saved Tip -->
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <!-- 保存成功提示 -->
            <span v-if="focusGoalSavedTip" class="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-fadeIn mr-1">
              <svg class="w-3.5 h-3.5 text-emerald-400" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>已保存</span>
            </span>

            <!-- 编辑按钮 (显式线框) -->
            <button 
              @click.stop="startEditingGoal"
              class="h-8.5 px-3 flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 rounded-lg transition-all cursor-pointer shadow-sm"
              title="编辑目标"
            >
              <svg class="w-3.5 h-3.5 text-gray-400" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>编辑</span>
            </button>

            <!-- 清除按钮 (显式线框) -->
            <button 
              @click.stop="clearFocusGoal"
              class="h-8.5 w-8.5 flex items-center justify-center text-gray-400 hover:text-red-400 bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 rounded-lg transition-all cursor-pointer shadow-sm"
              title="清除目标"
            >
              <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mode 2: Edit / Empty Mode (未设定目标或正在编辑) -->
        <div v-else class="flex flex-col gap-2.5 w-full">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
            <!-- 目标标题徽章 (显式线框靶心) -->
            <div class="flex items-center gap-2.5 shrink-0">
              <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-800 border border-gray-700/80 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <svg class="w-5 h-5 text-indigo-400" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </span>
              <div class="flex flex-col">
                <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                  Focus Goal
                </span>
                <span class="text-xs font-bold text-gray-200 tracking-wide">
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
                class="w-full h-10 pl-3.5 pr-8 text-sm sm:text-base bg-gray-950/90 border border-gray-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 rounded-lg text-gray-100 placeholder-gray-500 transition-all outline-none"
              />
              <button 
                v-if="editGoalInput" 
                @click="editGoalInput = ''" 
                class="absolute right-2.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                title="清空输入">
                <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button 
                @click="confirmGoalEdit"
                class="h-10 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                title="保存目标 (Enter)"
              >
                <svg class="w-4 h-4" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>保存</span>
              </button>

              <button 
                v-if="focusGoal"
                @click="cancelGoalEdit"
                class="h-10 px-3.5 text-xs sm:text-sm text-gray-400 hover:text-gray-200 bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 rounded-lg transition-all cursor-pointer"
                title="取消修改 (Esc)"
              >
                取消
              </button>
            </div>
          </div>

          <!-- 目标预设快捷选择标签 (根据当前日历周期智能联动推荐) -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-gray-800/60">
            <span class="text-[11px] text-gray-400 shrink-0 select-none flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-indigo-400 shrink-0" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ calendarMode === 'day' ? '今日推荐：' : calendarMode === 'week' ? '本周推荐：' : '本月推荐：' }}
            </span>
            <button 
              v-for="(candidate, index) in currentGoalCandidates" 
              :key="index"
              @click="selectGoalCandidate(candidate)"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800/70 hover:bg-indigo-950/80 text-gray-300 hover:text-indigo-200 border border-gray-700/50 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center gap-1"
              :class="{ 'bg-indigo-950/90 border-indigo-500/70 text-indigo-300 font-semibold shadow-sm': editGoalInput === candidate }">
              {{ candidate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Date Navigator & Mode Switcher & AI Summary -->
      <div class="flex flex-wrap items-center justify-between gap-3 w-full pt-2.5 border-t border-gray-900">
        <!-- Left: Date Navigator & Period Label -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Date Navigator -->
          <div class="h-9 inline-flex items-center bg-gray-900/90 border border-gray-800 rounded-xl p-1 shadow-inner gap-1 box-border">
            <button @click="navigatePeriod(-1)" 
                    class="w-7 h-[26px] flex items-center justify-center bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="上一周期">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button @click="jumpToToday" 
                    class="px-3 h-[26px] flex items-center justify-center text-xs font-semibold bg-transparent text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border-x border-gray-800/80 cursor-pointer"
                    :title="`跳转至当前${calendarMode === 'day' ? '日期' : calendarMode === 'week' ? '周' : '月份'}`">
              {{ todayButtonLabel }}
            </button>

            <button @click="navigatePeriod(1)" 
                    class="w-7 h-[26px] flex items-center justify-center bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="下一周期">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Period Display Label -->
          <div class="h-9 text-xs font-semibold text-gray-300 bg-gray-900/90 border border-gray-800 px-3.5 rounded-xl flex items-center gap-2 shadow-sm font-mono box-border">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            {{ currentPeriodLabel }}
          </div>
        </div>

        <!-- Right: Mode Tabs: Day / Week / Month & AI Summary Button -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Mode Tabs -->
          <div class="h-9 inline-flex items-center bg-gray-900/90 border border-gray-800 p-1 rounded-xl shadow-inner gap-1 box-border">
            <button @click="switchMode('day')" 
                    class="h-[26px] px-3.5 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
                    :class="calendarMode === 'day' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'">
              日视图
            </button>
            <button @click="switchMode('week')" 
                    class="h-[26px] px-3.5 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
                    :class="calendarMode === 'week' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'">
              周视图
            </button>
            <button @click="switchMode('month')" 
                    class="h-[26px] px-3.5 flex items-center justify-center text-xs rounded-lg transition-all cursor-pointer font-medium"
                    :class="calendarMode === 'month' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30' : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'">
              月视图
            </button>
          </div>

          <!-- AI Summary Button -->
          <button @click="openAiSummaryModal" 
                  class="h-9 px-4 inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer box-border">
            <svg class="w-3.5 h-3.5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI 总结
          </button>
        </div>
      </div>
    </header>


    <!-- ==================== UNIFIED TOP VISUAL OVERVIEW ==================== -->
    <section class="top-visual-overview flex flex-col">
      
      <!-- KPI Metric Cards Grid (显式充足的底部间距，彻底与图表拉开清晰层级) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6 sm:mb-8">
        <!-- KPI 1: Total Focused Time -->
        <div class="kpi-card bg-gray-900/90 border border-gray-800/90 hover:border-indigo-500/50 p-3.5 rounded-xl shadow-md transition-all">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{{ modeName }}总专注</span>
            <span class="text-indigo-400 font-mono">Total</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
            {{ formatDuration(totalFocusSeconds) }}
          </div>
          <div class="text-[11px] text-gray-500 mt-1 truncate">
            {{ scopeFocusSubtitle }}
          </div>
        </div>

        <!-- KPI 2: Daily Average or Pace -->
        <div class="kpi-card bg-gray-900/90 border border-gray-800/90 hover:border-cyan-500/50 p-3.5 rounded-xl shadow-md transition-all">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{{ averageMetricLabel }}</span>
            <span class="text-cyan-400 font-mono">Avg</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-cyan-400">
            {{ formatDuration(averageFocusSeconds) }}
          </div>
          <div class="text-[11px] text-gray-500 mt-1 truncate">
            {{ averageMetricSubtitle }}
          </div>
        </div>

        <!-- KPI 3: Total Sessions -->
        <div class="kpi-card bg-gray-900/90 border border-gray-800/90 hover:border-emerald-500/50 p-3.5 rounded-xl shadow-md transition-all">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>专注会话数</span>
            <span class="text-emerald-400 font-mono">Sessions</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-emerald-400">
            {{ activeLogs.length }} <span class="text-xs font-normal text-gray-400">次</span>
          </div>
          <div class="text-[11px] text-gray-500 mt-1 truncate">
            单会话均长 {{ formatDuration(sessionAverageSeconds) }}
          </div>
        </div>

        <!-- KPI 4: Idle Time Deducted -->
        <div class="kpi-card bg-gray-900/90 border border-gray-800/90 hover:border-amber-500/50 p-3.5 rounded-xl shadow-md transition-all">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>闲置扣除时长</span>
            <span class="text-amber-400 font-mono">Idle Filter</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-amber-400">
            {{ formatDuration(totalIdleSeconds) }}
          </div>
          <div class="text-[11px] text-gray-500 mt-1 truncate">
            精准剥离无操作挂机
          </div>
        </div>

        <!-- KPI 5: Top Focus Target -->
        <div class="kpi-card col-span-2 sm:col-span-1 bg-gray-900/90 border border-gray-800/90 hover:border-purple-500/50 p-3.5 rounded-xl shadow-md transition-all">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>主攻专注重心</span>
            <span class="text-purple-400 font-mono">Top Focus</span>
          </div>
          <div class="text-sm font-bold text-gray-200 truncate mt-0.5" :title="topDocInfo.title">
            {{ topDocInfo.title }}
          </div>
          <div class="text-[11px] text-purple-300 mt-1 font-mono">
            {{ topDocInfo.durationStr }} (占比 {{ topDocInfo.percent }}%)
          </div>
        </div>
      </div>

      <!-- Overview Visual Charts -->
      <div class="charts-container">
        <Charts :logs="activeLogs" 
                :scope-type="calendarMode" 
                :scope-date-title="currentPeriodLabel" 
                :day-map="scopeDayMap"
                :day-labels="scopeDayLabels" />
      </div>
    </section>


    <!-- ==================== MAIN CALENDAR VIEW ==================== -->
    <section class="calendar-main-section flex flex-col gap-3 pt-3 border-t border-gray-800/80">
      <div class="flex justify-between items-center px-1">
        <h2 class="text-sm font-bold text-gray-300 tracking-wide flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
          {{ calendarSectionTitle }}
        </h2>
        <span class="text-xs text-gray-400">
          <template v-if="calendarMode === 'month'">点击任意日期可切换进入该日视图</template>
          <template v-else-if="calendarMode === 'week'">点击表头日期可下钻至日视图</template>
          <template v-else>点击色块可直达思源对应文档</template>
        </span>
      </div>

      <CalendarView :logs="activeLogs" 
                    :day-map="scopeDayMap" 
                    :mode="calendarMode" 
                    :current-date="currentDate" 
                    @select-date="handleSelectDate" 
                    @switch-mode="handleCalendarSwitchMode" />
    </section>

    <!-- Toast Notification -->
    <div v-if="toastMessage" 
         class="fixed bottom-6 right-6 z-50 bg-indigo-600/95 border border-indigo-400/40 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
      <svg class="w-4 h-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
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
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import CalendarView from './CalendarView.vue';
import Charts from './Charts.vue';
import AiSummaryModal from './AiSummaryModal.vue';
import type { TimeLog } from '../models/TimeLog';
import { usePlugin } from '../main';
import { AIExportManager } from '../utils/ai-export';
import { docTitles, fetchDocTitle } from '../utils/title-cache';
import Logger from '../utils/logger';
import iconUrl from '../../icon.png';

const plugin = usePlugin();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// State
const calendarMode = ref<'day' | 'week' | 'month'>('week');
const currentDate = ref<Date>(new Date());
const activeLogs = ref<TimeLog[]>([]);
const scopeDayMap = ref<Record<string, TimeLog[]>>({});
const toastMessage = ref<string>('');

// Focus Goal State (双模式与智能周期候选)
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
  } else {
    return [
      '本月累计深度工作50小时',
      '本月攻克核心学习专题 (30小时)',
      '本月平均每周专注12小时',
      '本月养成每日深度工作习惯'
    ];
  }
});

// 动态输入框占位符
const currentGoalPlaceholder = computed(() => {
  if (calendarMode.value === 'day') {
    return '设定今日专注目标，如：今天专注2小时，深度推进核心课题...';
  } else if (calendarMode.value === 'week') {
    return '设定本周专注目标，如：本周平均每天专注2小时...';
  } else {
    return '设定本月专注目标，如：本月累计深度工作50小时...';
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
  return '月';
});

const todayButtonLabel = computed(() => {
  if (calendarMode.value === 'day') return '今日';
  if (calendarMode.value === 'week') return '本周';
  return '本月';
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
  } else {
    return `${year}年 ${month}月`;
  }
});

// 日历视图区块标题 (日视图体现日期，周视图体现第几周，月视图体现第几个月)
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
  } else {
    return `日历视图 (${year}年 第${month}月)`;
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
  } else {
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
  return '本月度总累计投入时间';
});

const averageMetricLabel = computed(() => {
  if (calendarMode.value === 'day') return '时段专注峰值';
  return '日均专注时长';
});

const averageFocusSeconds = computed(() => {
  if (calendarMode.value === 'day') {
    // Peak hour
    const hourly = Array(24).fill(0);
    activeLogs.value.forEach(l => {
      const h = new Date(l.startTime).getHours();
      hourly[h] += l.duration;
    });
    return Math.max(...hourly, 0);
  } else if (calendarMode.value === 'week') {
    return Math.round(totalFocusSeconds.value / 7);
  } else {
    const d = currentDate.value;
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Math.round(totalFocusSeconds.value / daysInMonth);
  }
});

const averageMetricSubtitle = computed(() => {
  if (calendarMode.value === 'day') return '今日最高单小时专注';
  if (calendarMode.value === 'week') return '周内每日平均产出';
  return '全月每日平均产出';
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
  } else {
    const res = await sm.loadLogsForMonth(year, month + 1);
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

// Mode Switch
const switchMode = (mode: 'day' | 'week' | 'month') => {
  calendarMode.value = mode;
  loadDataForCurrentScope();
};

const handleCalendarSwitchMode = (mode: 'day' | 'week' | 'month') => {
  switchMode(mode);
};

// Period Navigation
const navigatePeriod = (step: number) => {
  const d = new Date(currentDate.value);
  if (calendarMode.value === 'day') {
    d.setDate(d.getDate() + step);
  } else if (calendarMode.value === 'week') {
    d.setDate(d.getDate() + step * 7);
  } else {
    d.setMonth(d.getMonth() + step);
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

// AI Export (保留剪贴板导出备用)
const exportForAI = async () => {
  const md = AIExportManager.generateMarkdownSummary(
    activeLogs.value, 
    currentPeriodLabel.value, 
    calendarMode.value
  );

  try {
    await navigator.clipboard.writeText(md);
    showToast(`✅ ${modeName.value}度 AI 总结已成功复制到剪贴板！`);
  } catch (err) {
    Logger.error('Failed to copy AI summary: ', err);
    showToast('❌ 复制失败，请检查剪贴板权限');
  }
};

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

onMounted(async () => {
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

watch([calendarMode, currentDate], () => {
  loadDataForCurrentScope();
});
</script>

<style scoped>
.time-spent-dashboard {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 确保思源主题样式不会将线框图标的 fill 覆盖为 solid 色块 */
.focus-goal-card svg {
  fill: none !important;
}
</style>
