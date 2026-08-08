<template>
  <div class="time-spent-dashboard bg-gray-950 text-gray-100 p-5 md:p-8 min-h-full flex flex-col gap-8 md:gap-10">
    
    <!-- ==================== TOP NAVIGATION & HEADER ==================== -->
    <header class="flex flex-col gap-6 pb-6 border-b border-gray-800/80">
      
      <!-- Top Row: Brand & Close Button -->
      <div class="flex justify-between items-center w-full">
        <!-- Title & Live Status -->
        <div class="flex items-center gap-4">
          <!-- 放大图标尺寸，显示原 icon 纯净透明底色 -->
          <div class="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 bg-transparent">
            <img :src="iconUrl" alt="源时记" class="w-full h-full object-contain drop-shadow-xl select-none" />
          </div>
          <div class="flex flex-col justify-center">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-black tracking-wide text-white">
                源时记
              </h1>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 font-medium shadow-sm">
                时间分布与专注看板
              </span>
            </div>
            <p class="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              全自动深度工作追踪 · 智能防挂机 · 多维日历复盘
            </p>
          </div>
        </div>

        <!-- Header Right Close Button -->
        <button @click="emit('close')" 
                class="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-xl transition-colors shrink-0" 
                title="关闭看板">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Bottom Row: Date Navigator & Mode Switcher & AI Export (具有充足拉大的垂直距离) -->
      <div class="flex flex-wrap items-center justify-between gap-4 w-full pt-3 border-t border-gray-900">
        <!-- Left: Date Navigator & Period Label -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Date Navigator -->
          <div class="flex items-center bg-gray-900 border border-gray-700/80 rounded-xl p-1 shadow-inner">
            <button @click="navigatePeriod(-1)" 
                    class="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                    title="上一周期">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button @click="jumpToToday" 
                    class="px-3 py-1 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border-x border-gray-800">
              今天
            </button>

            <button @click="navigatePeriod(1)" 
                    class="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                    title="下一周期">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Period Display Label -->
          <div class="text-xs font-semibold text-gray-300 bg-gray-900/90 border border-gray-800 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm font-mono">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            {{ currentPeriodLabel }}
          </div>
        </div>

        <!-- Right: Mode Tabs: Day / Week / Month & AI Export Button -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Mode Tabs -->
          <div class="flex bg-gray-900 border border-gray-700/80 p-1 rounded-xl shadow-inner">
            <button @click="switchMode('day')" 
                    class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all"
                    :class="calendarMode === 'day' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'">
              日视图
            </button>
            <button @click="switchMode('week')" 
                    class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all"
                    :class="calendarMode === 'week' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'">
              周视图
            </button>
            <button @click="switchMode('month')" 
                    class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all"
                    :class="calendarMode === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'">
              月视图
            </button>
          </div>

          <!-- AI Export Button -->
          <button @click="exportForAI" 
                  class="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            导出 {{ modeName }} AI 总结
          </button>
        </div>
      </div>
    </header>


    <!-- ==================== UNIFIED TOP VISUAL OVERVIEW ==================== -->
    <section class="top-visual-overview flex flex-col my-2">
      
      <!-- KPI Metric Cards Grid (底部拉大边距，与图表彻底拉开间距) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 md:mb-10">
        <!-- KPI 1: Total Focused Time -->
        <div class="kpi-card bg-gray-900/90 border border-gray-800 hover:border-indigo-500/50 p-4 rounded-xl shadow-md transition-all">
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
        <div class="kpi-card bg-gray-900/90 border border-gray-800 hover:border-cyan-500/50 p-4 rounded-xl shadow-md transition-all">
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
        <div class="kpi-card bg-gray-900/90 border border-gray-800 hover:border-emerald-500/50 p-4 rounded-xl shadow-md transition-all">
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
        <div class="kpi-card bg-gray-900/90 border border-gray-800 hover:border-amber-500/50 p-4 rounded-xl shadow-md transition-all">
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
        <div class="kpi-card col-span-2 sm:col-span-1 bg-gray-900/90 border border-gray-800 hover:border-purple-500/50 p-4 rounded-xl shadow-md transition-all">
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

      <!-- Overview Visual Charts (顶部显式加上大呼吸间距) -->
      <div class="charts-container mt-2 pt-1">
        <Charts :logs="activeLogs" 
                :scope-type="calendarMode" 
                :scope-date-title="currentPeriodLabel" 
                :day-map="scopeDayMap"
                :day-labels="scopeDayLabels" />
      </div>
    </section>


    <!-- ==================== MAIN CALENDAR VIEW ==================== -->
    <section class="calendar-main-section flex flex-col gap-4 mt-6 pt-3 border-t border-gray-800/80">
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import CalendarView from './CalendarView.vue';
import Charts from './Charts.vue';
import type { TimeLog } from '../models/TimeLog';
import { usePlugin } from '../main';
import { AIExportManager } from '../utils/ai-export';
import { docTitles, fetchDocTitle } from '../utils/title-cache';
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

// AI Export
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
    console.error('Failed to copy AI summary: ', err);
    showToast('❌ 复制失败，请检查剪贴板权限');
  }
};

const showToast = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

onMounted(() => {
  loadDataForCurrentScope();
});

watch([calendarMode, currentDate], () => {
  loadDataForCurrentScope();
});
</script>

<style scoped>
.time-spent-dashboard {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
