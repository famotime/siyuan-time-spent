<template>
  <div class="calendar-component isolate relative z-0 flex flex-col sy-calendar-container rounded-xl overflow-hidden shadow-xl">
    
    <!-- ==================== DAY VIEW ==================== -->
    <div v-if="mode === 'day'" class="day-view-container grid grid-cols-1 lg:grid-cols-12 h-[680px]">
      <!-- 24-Hour Vertical Grid Schedule (7-8 cols on lg) -->
      <div class="lg:col-span-8 flex flex-col border-r sy-divider sy-grid-bg overflow-hidden">
        <div class="p-3 sy-section-header border-b sy-divider flex justify-between items-center text-xs sm:text-sm font-semibold sy-text-primary">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            {{ t('calendarActivitySlots', { date: formattedSelectedDate }) }}
          </span>
          <span class="text-xs sy-text-secondary font-mono font-tabular">{{ t('calendarTotalRecords', { count: currentDayLogs.length }) }}</span>
        </div>
        
        <div class="flex-grow overflow-y-auto relative isolate sy-timeline-canvas" ref="dayScrollContainer">
          <div class="relative" :style="{ height: `${24 * hourHeight}px` }">
            <!-- Hour Lines & Labels -->
            <div v-for="h in 24" :key="h" 
                 class="absolute w-full border-b sy-hour-border flex items-start text-xs sy-text-tertiary select-none"
                 :style="{ top: `${(h - 1) * hourHeight}px`, height: `${hourHeight}px` }">
              <span class="w-14 text-right pr-3 -mt-2.5 font-mono font-medium font-tabular sy-text-tertiary">
                {{ String(h - 1).padStart(2, '0') }}:00
              </span>
              <div class="flex-grow border-t sy-hour-sub-border h-full"></div>
            </div>

            <!-- Time Blocks (支持双向高亮联动与防污染线框) -->
            <div class="absolute left-16 right-4 top-0 bottom-0 pointer-events-none">
              <div v-for="block in dayBlocks" :key="block.log.id"
                   class="absolute rounded-lg shadow-md overflow-hidden cursor-pointer pointer-events-auto transition-all duration-150 group border border-black/20 backdrop-blur-xs select-none"
                   :class="[
                     hoveredDocId === block.log.docId ? 'ring-2 ring-indigo-400 scale-[1.02] shadow-xl z-20 brightness-110' : '',
                     hoveredDocId && hoveredDocId !== block.log.docId ? 'opacity-35 transition-opacity' : 'hover:ring-2 hover:ring-white/90 hover:z-10'
                   ]"
                   :style="{
                     top: `${block.top}px`,
                     height: `${block.height}px`,
                     left: `calc(${block.leftPercent}% + 2px)`,
                     width: `calc(${block.widthPercent}% - 4px)`,
                     backgroundColor: getDocColor(block.log.docId),
                     zIndex: block.colIndex + (block.height < 32 ? 4 : 2)
                   }"
                   @click="openDoc(block.log.docId)"
                   @mouseenter="handleBlockMouseEnter($event, block.log)"
                   @mousemove="updateBlockTooltip($event)"
                   @mouseleave="handleBlockMouseLeave">
                <div class="px-2.5 py-1 flex items-center justify-between text-white drop-shadow font-semibold text-xs truncate">
                  <span class="truncate">{{ block.title || t('calendarLoading') }}</span>
                  <span class="text-xs opacity-90 font-mono ml-2 shrink-0 font-tabular">{{ formatDuration(block.log.duration) }}</span>
                </div>
                <div v-if="block.height >= 38" class="px-2.5 text-xs text-white/90 truncate opacity-0 group-hover:opacity-100 transition-opacity font-tabular">
                  {{ formatTime(block.log.startTime) }} - {{ formatTime(block.log.endTime) }}
                  <span v-if="block.log.idleTime > 0" class="ml-1 text-amber-300 font-normal">(-{{ block.log.idleTime }}s {{ t('idleDeducted') }})</span>
                </div>
              </div>
            </div>

            <!-- Current Time Line (if viewing today) -->
            <div v-if="isToday" class="absolute left-0 right-0 z-[5] pointer-events-none"
                 :style="{ top: `${currentTimeTop}px` }">
              <div class="flex items-center">
                <span class="w-14 text-right pr-2 text-xs font-bold text-red-500 font-mono font-tabular -mt-2.5 bg-inherit rounded-sm">
                  {{ currentTimeStr }}
                </span>
                <div class="flex-grow border-t-2 border-red-500 relative">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-[5px] -left-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Day Timeline & Doc Ranking (4-5 cols on lg) -->
      <div class="lg:col-span-4 flex flex-col sy-card-bg overflow-hidden">
        <div class="p-3 sy-section-header border-b sy-divider text-xs sm:text-sm font-semibold sy-text-primary flex justify-between items-center">
          <span>{{ t('calendarTodayList') }}</span>
          <span class="text-xs text-indigo-500 font-mono font-semibold font-tabular">{{ t('calendarDayTotal', { duration: formatDuration(currentDayTotalSec) }) }}</span>
        </div>
        <div class="flex-grow overflow-y-auto p-3.5 space-y-2.5">
          <div v-if="currentDayLogs.length === 0" class="text-center py-16 sy-text-tertiary text-xs">
            {{ t('calendarNoRecords') }}
          </div>
          <div v-for="log in sortedCurrentDayLogs" :key="log.id"
               class="p-3 rounded-xl sy-list-item-card transition-all cursor-pointer group"
               :class="[
                 hoveredDocId === log.docId ? 'is-hovered' : '',
                 hoveredDocId && hoveredDocId !== log.docId ? 'opacity-40 transition-opacity' : ''
               ]"
               @click="openDoc(log.docId)"
               @mouseenter="handleListMouseEnter($event, log)"
               @mousemove="updateBlockTooltip($event)"
               @mouseleave="handleListMouseLeave">
            <div class="flex justify-between items-start mb-1">
              <div class="font-semibold text-xs sy-text-primary group-hover:text-indigo-400 transition-colors line-clamp-1 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" :style="{ backgroundColor: getDocColor(log.docId) }"></span>
                <span class="truncate">{{ docTitles[log.docId] || log.docId || t('timelineUnknownDoc') }}</span>
              </div>
              <span class="text-xs sy-text-secondary font-mono font-tabular shrink-0 ml-2">
                {{ formatTime(log.startTime) }} - {{ formatTime(log.endTime) }}
              </span>
            </div>
            <div class="flex justify-between items-center text-xs mt-1 sy-text-secondary">
              <span class="text-indigo-500 font-mono font-semibold font-tabular">{{ t('calendarFocus') }}: {{ formatDuration(log.duration) }}</span>
              <span v-if="log.idleTime > 0" class="sy-text-tertiary text-xs font-tabular">{{ t('calendarIdleDeducted', { seconds: log.idleTime }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ==================== WEEK VIEW ==================== -->
    <div v-else-if="mode === 'week'" class="week-view-container flex flex-col h-[680px]">
      <!-- 7 Day Header -->
      <div class="grid grid-cols-8 border-b sy-divider sy-section-header text-center text-xs font-semibold sy-text-secondary select-none">
        <div class="col-span-1 p-2.5 border-r sy-divider flex items-center justify-center sy-text-tertiary">
          {{ t('calendarTime') }}
        </div>
        <div v-for="day in weekDays" :key="day.dateStr"
             class="col-span-1 p-2 border-r sy-divider last:border-r-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
             :class="{ 'sy-header-today': day.isToday }"
             @click="emitSelectDate(day.dateObj)">
          <div class="text-xs sy-text-secondary uppercase tracking-wider font-medium">{{ day.dayName }}</div>
          <div class="text-xs sm:text-sm font-bold mt-0.5" :class="day.isToday ? 'text-indigo-500 font-black' : 'sy-text-primary'">{{ day.displayDate }}</div>
          <div class="text-xs mt-0.5 font-mono font-tabular" :class="day.totalDuration > 0 ? 'text-emerald-500 font-semibold' : 'sy-text-tertiary'">
            {{ day.totalDuration > 0 ? formatDuration(day.totalDuration) : '-' }}
          </div>
        </div>
      </div>

      <!-- 7 Day 24h Grid Body -->
      <div class="flex-grow overflow-y-auto relative isolate sy-timeline-canvas" ref="weekScrollContainer">
        <div class="grid grid-cols-8 relative" :style="{ height: `${24 * hourHeight}px` }">
          <!-- Time Labels Column -->
          <div class="col-span-1 relative border-r sy-divider sy-time-col-bg select-none">
            <div v-for="h in 24" :key="h"
                 class="absolute w-full border-b sy-hour-border text-right pr-2 text-xs sy-text-tertiary font-mono font-medium font-tabular"
                 :style="{ top: `${(h-1) * hourHeight}px`, height: `${hourHeight}px` }">
              <span class="-mt-2.5 inline-block">{{ String(h - 1).padStart(2, '0') }}:00</span>
            </div>
          </div>

          <!-- 7 Columns for Days -->
          <div v-for="day in weekDays" :key="day.dateStr"
               class="col-span-1 relative border-r sy-hour-sub-border last:border-r-0">
            <!-- Hour Lines -->
            <div v-for="h in 24" :key="h"
                 class="absolute w-full border-b sy-hour-sub-border"
                 :style="{ top: `${(h-1) * hourHeight}px`, height: `${hourHeight}px` }">
            </div>

            <!-- Time Blocks -->
            <div v-for="block in getBlocksForDate(day.dateStr)" :key="block.log.id"
                 class="absolute rounded-md shadow-xs overflow-hidden text-xs cursor-pointer transition-all duration-150 group border border-black/20"
                 :class="[
                   hoveredDocId === block.log.docId ? 'ring-2 ring-indigo-400 scale-[1.02] shadow-xl z-20 brightness-110' : '',
                   hoveredDocId && hoveredDocId !== block.log.docId ? 'opacity-35 transition-opacity' : 'hover:ring-2 hover:ring-white/90 hover:z-10'
                 ]"
                 :style="{
                   top: `${block.top}px`,
                   height: `${block.height}px`,
                   left: `calc(${block.leftPercent}% + 1px)`,
                   width: `calc(${block.widthPercent}% - 2px)`,
                   backgroundColor: getDocColor(block.log.docId),
                   zIndex: block.colIndex + (block.height < 28 ? 3 : 1)
                 }"
                 @click="openDoc(block.log.docId)"
                 @mouseenter="handleBlockMouseEnter($event, block.log)"
                 @mousemove="updateBlockTooltip($event)"
                 @mouseleave="handleBlockMouseLeave">
              <div class="px-1.5 py-0.5 font-semibold text-white/95 truncate leading-tight drop-shadow-xs text-xs">
                {{ block.title || t('calendarLoading') }}
              </div>
              <div v-if="block.height >= 34" class="px-1.5 text-xs text-white/80 truncate opacity-0 group-hover:opacity-100 transition-opacity font-tabular">
                {{ formatTime(block.log.startTime) }} ({{ formatDuration(block.log.duration) }})
              </div>
            </div>

            <!-- Red Time Dot for Today -->
            <div v-if="day.isToday" class="absolute left-0 right-0 z-[5] pointer-events-none"
                 :style="{ top: `${currentTimeTop}px` }">
              <div class="border-t-2 border-red-500 relative">
                <div class="w-2 h-2 rounded-full bg-red-500 absolute -top-[4px] -left-1 shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ==================== MONTH VIEW ==================== -->
    <div v-else-if="mode === 'month'" class="month-view-container flex flex-col h-[680px] sy-card-bg">
      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 border-b sy-divider sy-section-header text-center py-2 text-xs font-semibold sy-text-secondary">
        <div v-for="w in getWeekdayNames(currentLang)" :key="w" class="col-span-1">
          {{ w }}
        </div>
      </div>

      <!-- Month Calendar Matrix Grid -->
      <div class="flex-grow grid grid-cols-7 grid-rows-6 gap-1 p-2 sy-month-matrix overflow-y-auto">
        <div v-for="cell in monthCells" :key="cell.key"
             class="month-cell rounded-lg p-2 flex flex-col justify-between border transition-all duration-150 relative cursor-pointer group select-none"
             :class="getCellClasses(cell)"
             @click="emitSelectDate(cell.dateObj)">
          
          <!-- Top Row: Date Number & Badge -->
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                  :class="cell.isToday ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400/50' : (cell.isCurrentMonth ? 'sy-text-primary' : 'sy-text-tertiary')">
              {{ cell.dayNum }}
            </span>
            <span v-if="cell.totalDuration > 0" 
                  class="text-xs font-mono px-1.5 py-0.5 rounded font-semibold shadow-xs font-tabular"
                  :class="getDurationBadgeClasses(cell.totalDuration)">
              {{ formatDuration(cell.totalDuration) }}
            </span>
          </div>

          <!-- Middle: Top Doc Tags / Activity Indicators -->
          <div class="my-1 space-y-1 flex-grow overflow-hidden">
            <div v-for="(doc, idx) in cell.topDocs.slice(0, 2)" :key="idx"
                 class="text-xs truncate px-1.5 py-0.5 rounded sy-doc-tag flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getDocColor(doc.docId) }"></span>
              <span class="truncate">{{ docTitles[doc.docId] || doc.docId || t('calendarFocusDoc') }}</span>
            </div>
            <div v-if="cell.topDocs.length > 2" class="text-xs sy-text-tertiary font-mono pl-1">
              {{ t('calendarMore', { count: cell.topDocs.length - 2 }) }}
            </div>
          </div>

          <!-- Bottom: Session Count / Hint -->
          <div class="flex justify-between items-center text-xs sy-text-tertiary font-mono font-tabular">
            <span v-if="cell.sessionCount > 0">{{ cell.sessionCount }} {{ t('sessionCount') }}</span>
            <span v-else class="text-transparent group-hover:sy-text-tertiary">{{ t('calendarViewAction') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Glassmorphism Floating Tooltip (显式线框与主题自适应) -->
    <Teleport to="body">
      <div
        v-if="hoverTooltip.visible"
        class="fixed pointer-events-none z-[9999] transition-opacity duration-150 backdrop-blur-md sy-floating-tooltip rounded-xl p-3 shadow-2xl text-xs max-w-xs flex flex-col gap-1.5"
        :style="{
          top: `${hoverTooltip.y}px`,
          left: `${hoverTooltip.x}px`,
        }"
      >
        <div class="font-bold text-xs sm:text-sm text-white line-clamp-2">
          {{ hoverTooltip.title }}
        </div>
        <div v-if="hoverTooltip.notebook || hoverTooltip.path" class="text-xs text-gray-300 flex items-center gap-1.5 truncate">
          <svg class="w-3.5 h-3.5 text-indigo-400 shrink-0 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="text-indigo-300 font-medium truncate">{{ hoverTooltip.notebook }}</span>
          <span v-if="hoverTooltip.path" class="text-gray-400 truncate">> {{ hoverTooltip.path }}</span>
        </div>
        <div v-if="hoverTooltip.tags && hoverTooltip.tags.length > 0" class="flex flex-wrap gap-1 mt-0.5">
          <span v-for="t in hoverTooltip.tags" :key="t" class="px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50 text-xs text-indigo-300 font-mono">
            #{{ t }}
          </span>
        </div>
        <div class="border-t border-white/10 pt-1.5 mt-0.5 flex justify-between items-center text-xs text-gray-300 font-mono font-tabular">
          <span>{{ hoverTooltip.timeRange }}</span>
          <span class="font-bold text-indigo-300">{{ hoverTooltip.durationStr }}</span>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import type { TimeLog } from '../models/TimeLog';
import { docTitles, fetchDocTitle } from '../utils/title-cache';
import { sql } from '../api';
import { t, formatDurationI18n, currentLang, getWeekdayNames } from '../i18n';

const props = defineProps<{
  logs: TimeLog[];
  dayMap: Record<string, TimeLog[]>;
  mode: 'day' | 'week' | 'month';
  currentDate: Date;
}>();

const emit = defineEmits<{
  (e: 'select-date', d: Date): void;
  (e: 'switch-mode', mode: 'day' | 'week' | 'month' | 'year'): void;
}>();

// ==================== CONFIG & CONSTANTS ====================
const hourHeight = 56; // 每小时高度像素

// 莫兰迪 8 色柔和彩盘 (抗眩光且保证白色文字对比度)
const MORANDI_COLORS = [
  '#6366f1', // Indigo
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#16a34a', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#475569', // Slate
];

// 双向高亮联动状态
const hoveredDocId = ref<string | null>(null);

const dayScrollContainer = ref<HTMLElement | null>(null);
const weekScrollContainer = ref<HTMLElement | null>(null);

// Hover Tooltip State
const hoverTooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  notebook: '',
  path: '',
  tags: [] as string[],
  timeRange: '',
  durationStr: ''
});

// Formatters
const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatDuration = (seconds: number) => {
  return formatDurationI18n(seconds, currentLang.value);
};

// 莫兰迪色彩分配
const getDocColor = (docId: string): string => {
  if (!docId) return MORANDI_COLORS[0];
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = (hash << 5) - hash + docId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % MORANDI_COLORS.length;
  return MORANDI_COLORS[idx];
};

// 打开思源笔记对应文档
const openDoc = (docId: string) => {
  if (!docId) return;
  const url = `siyuan://blocks/${docId}`;
  window.open(url);
};

// ==================== TOOLTIP & HOVER LINKING ====================
const handleBlockMouseEnter = (event: MouseEvent, log: TimeLog) => {
  hoveredDocId.value = log.docId;
  showBlockTooltip(event, log);
};

const handleBlockMouseLeave = () => {
  hoveredDocId.value = null;
  hideBlockTooltip();
};

const handleListMouseEnter = (event: MouseEvent, log: TimeLog) => {
  hoveredDocId.value = log.docId;
  showBlockTooltip(event, log);
};

const handleListMouseLeave = () => {
  hoveredDocId.value = null;
  hideBlockTooltip();
};

const showBlockTooltip = async (event: MouseEvent, log: TimeLog) => {
  hoverTooltip.value.visible = true;
  hoverTooltip.value.title = docTitles.value[log.docId] || log.docId || t('unknownDoc');
  hoverTooltip.value.timeRange = `${formatTime(log.startTime)} - ${formatTime(log.endTime)}`;
  const idleStr = log.idleTime > 0 ? ` (${t('calendarIdleDeducted', { seconds: log.idleTime })})` : '';
  hoverTooltip.value.durationStr = `${t('calendarFocus')}: ${formatDuration(log.duration)}${idleStr}`;
  updateBlockTooltip(event);

  // 异步获取文档路径与属性
  try {
    const res = await sql(`SELECT root_id, hpath FROM blocks WHERE id = '${log.docId}' LIMIT 1`);
    if (res && res.length > 0) {
      hoverTooltip.value.path = res[0].hpath || '';
    }
  } catch (err) {
    // 忽略异常
  }
};

const updateBlockTooltip = (event: MouseEvent) => {
  const padding = 16;
  let x = event.clientX + padding;
  let y = event.clientY + padding;

  if (x + 280 > window.innerWidth) {
    x = event.clientX - 280 - padding;
  }
  if (y + 140 > window.innerHeight) {
    y = event.clientY - 140 - padding;
  }

  hoverTooltip.value.x = x;
  hoverTooltip.value.y = y;
};

const hideBlockTooltip = () => {
  hoverTooltip.value.visible = false;
};

// ==================== DAY VIEW COMPUTED ====================
const selectedDateKey = computed(() => formatDateKey(props.currentDate));

const formattedSelectedDate = computed(() => {
  const d = props.currentDate;
  if (currentLang.value === 'en_US') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
});

const currentDayLogs = computed(() => {
  return props.dayMap[selectedDateKey.value] || props.logs.filter(log => {
    return formatDateKey(new Date(log.startTime)) === selectedDateKey.value;
  });
});

const currentDayTotalSec = computed(() => {
  return currentDayLogs.value.reduce((acc, log) => acc + log.duration, 0);
});

const sortedCurrentDayLogs = computed(() => {
  return [...currentDayLogs.value].sort((a, b) => b.startTime - a.startTime);
});

interface BlockDisplay {
  log: TimeLog;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  colIndex: number;
  totalCols: number;
  title: string;
}

const computeLayoutBlocks = (logs: TimeLog[], minHeight = 24): BlockDisplay[] => {
  if (!logs || logs.length === 0) return [];

  interface TempBlock {
    log: TimeLog;
    top: number;
    height: number;
    end: number;
    title: string;
    colIndex: number;
    totalCols: number;
  }

  const rawBlocks: TempBlock[] = logs.map(log => {
    const d = new Date(log.startTime);
    const startHour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    const durationHours = Math.max(log.duration / 3600, 0.1);
    
    const top = startHour * hourHeight;
    let height = durationHours * hourHeight;
    if (height < minHeight) height = minHeight;

    return {
      log,
      top,
      height,
      end: top + height,
      title: docTitles.value[log.docId] || '',
      colIndex: 0,
      totalCols: 1
    };
  });

  rawBlocks.sort((a, b) => {
    if (Math.abs(a.top - b.top) > 0.001) {
      return a.top - b.top;
    }
    if (Math.abs(b.height - a.height) > 0.001) {
      return b.height - a.height;
    }
    return a.log.startTime - b.log.startTime;
  });

  const clusters: TempBlock[][] = [];
  let currentCluster: TempBlock[] = [];
  let clusterEnd = -1;

  for (const block of rawBlocks) {
    if (currentCluster.length === 0) {
      currentCluster.push(block);
      clusterEnd = block.end;
    } else {
      if (block.top < clusterEnd) {
        currentCluster.push(block);
        clusterEnd = Math.max(clusterEnd, block.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [block];
        clusterEnd = block.end;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: BlockDisplay[] = [];

  for (const cluster of clusters) {
    const columns: number[] = [];

    for (const block of cluster) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= block.top) {
          block.colIndex = c;
          columns[c] = block.end;
          placed = true;
          break;
        }
      }
      if (!placed) {
        block.colIndex = columns.length;
        columns.push(block.end);
      }
    }

    const totalCols = columns.length;
    for (const block of cluster) {
      block.totalCols = totalCols;
      result.push({
        log: block.log,
        top: block.top,
        height: block.height,
        leftPercent: (block.colIndex / totalCols) * 100,
        widthPercent: (1 / totalCols) * 100,
        colIndex: block.colIndex,
        totalCols,
        title: block.title
      });
    }
  }

  return result;
};

const dayBlocks = computed<BlockDisplay[]>(() => {
  return computeLayoutBlocks(currentDayLogs.value, 26);
});

// ==================== WEEK VIEW COMPUTED ====================
const weekDays = computed(() => {
  const days = [];
  const curr = new Date(props.currentDate);
  const dayOfWeek = curr.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayKey = formatDateKey(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateKey(d);
    const dayLogs = props.dayMap[dateStr] || [];
    const totalDuration = dayLogs.reduce((acc, log) => acc + log.duration, 0);

    days.push({
      dateStr,
      displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
      dayName: getWeekdayNames(currentLang.value)[i],
      isToday: dateStr === todayKey,
      dateObj: d,
      totalDuration
    });
  }
  return days;
});

const getBlocksForDate = (dateStr: string): BlockDisplay[] => {
  const logs = props.dayMap[dateStr] || props.logs.filter(log => formatDateKey(new Date(log.startTime)) === dateStr);
  return computeLayoutBlocks(logs, 22);
};

// ==================== MONTH VIEW COMPUTED ====================
interface MonthCell {
  key: string;
  dayNum: number;
  dateObj: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  totalDuration: number;
  sessionCount: number;
  topDocs: { docId: string; duration: number }[];
}

const monthCells = computed<MonthCell[]>(() => {
  const cells: MonthCell[] = [];
  const year = props.currentDate.getFullYear();
  const month = props.currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const todayKey = formatDateKey(new Date());

  let startDayOfWeek = firstDay.getDay();
  if (startDayOfWeek === 0) startDayOfWeek = 7;
  const paddingBefore = startDayOfWeek - 1;

  for (let i = paddingBefore; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const dateStr = formatDateKey(d);
    const dayLogs = props.dayMap[dateStr] || [];
    const totalDuration = dayLogs.reduce((acc, l) => acc + l.duration, 0);
    cells.push({
      key: dateStr,
      dayNum: d.getDate(),
      dateObj: d,
      isCurrentMonth: false,
      isToday: dateStr === todayKey,
      totalDuration,
      sessionCount: dayLogs.length,
      topDocs: []
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDateKey(d);
    const dayLogs = props.dayMap[dateStr] || [];
    const totalDuration = dayLogs.reduce((acc, l) => acc + l.duration, 0);
    
    const docMap: Record<string, number> = {};
    dayLogs.forEach(l => {
      docMap[l.docId] = (docMap[l.docId] || 0) + l.duration;
    });
    const topDocs = Object.keys(docMap)
      .map(id => ({ docId: id, duration: docMap[id] }))
      .sort((a, b) => b.duration - a.duration);

    cells.push({
      key: dateStr,
      dayNum: day,
      dateObj: d,
      isCurrentMonth: true,
      isToday: dateStr === todayKey,
      totalDuration,
      sessionCount: dayLogs.length,
      topDocs
    });
  }

  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = formatDateKey(d);
    const dayLogs = props.dayMap[dateStr] || [];
    const totalDuration = dayLogs.reduce((acc, l) => acc + l.duration, 0);
    cells.push({
      key: dateStr,
      dayNum: d.getDate(),
      dateObj: d,
      isCurrentMonth: false,
      isToday: dateStr === todayKey,
      totalDuration,
      sessionCount: dayLogs.length,
      topDocs: []
    });
  }

  return cells;
});

const getCellClasses = (cell: MonthCell) => {
  if (!cell.isCurrentMonth) {
    return 'sy-month-cell-muted';
  }
  if (cell.totalDuration >= 10800) {
    return 'sy-month-cell-high';
  }
  if (cell.totalDuration >= 3600) {
    return 'sy-month-cell-med';
  }
  if (cell.totalDuration > 0) {
    return 'sy-month-cell-active';
  }
  return 'sy-month-cell-default';
};

const getDurationBadgeClasses = (seconds: number) => {
  if (seconds >= 10800) return 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/40';
  if (seconds >= 3600) return 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40';
  return 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40';
};

const emitSelectDate = (d: Date) => {
  emit('select-date', d);
};

// ==================== LIVE TIME TICKER ====================
const now = ref(new Date());
let timer: any = null;

const isToday = computed(() => selectedDateKey.value === formatDateKey(now.value));

const currentTimeTop = computed(() => {
  const d = now.value;
  return (d.getHours() + d.getMinutes() / 60) * hourHeight;
});

const currentTimeStr = computed(() => formatTime(now.value.getTime()));

// ==================== 智能对齐活跃时段算法 (AUTO-SCROLL) ====================
const autoScrollToActiveTime = () => {
  nextTick(() => {
    const container = props.mode === 'day' ? dayScrollContainer.value : weekScrollContainer.value;
    if (!container) return;

    let targetMinute = 8.5 * 60; // 默认 08:30
    const nowMinutes = now.value.getHours() * 60 + now.value.getMinutes();

    let earliestLogMinute: number | null = null;
    if (currentDayLogs.value.length > 0) {
      currentDayLogs.value.forEach(l => {
        const d = new Date(l.startTime);
        const m = d.getHours() * 60 + d.getMinutes();
        if (earliestLogMinute === null || m < earliestLogMinute) {
          earliestLogMinute = m;
        }
      });
    }

    if (earliestLogMinute !== null) {
      // 当日有记录：平滑对齐至最早记录前 30 分钟
      targetMinute = Math.max(0, earliestLogMinute - 30);
    } else if (isToday.value) {
      // 正在查看今天且尚无记录：平滑对齐至当前时间前 45 分钟，让红线处于视觉黄金区
      targetMinute = Math.max(0, nowMinutes - 45);
    } else {
      // 历史空白日期：对齐至早上 08:00
      targetMinute = 8 * 60;
    }

    const targetTop = (targetMinute / 60) * hourHeight;
    container.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });
  });
};

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 30000);

  setTimeout(() => {
    autoScrollToActiveTime();
  }, 120);
});

watch([() => props.mode, () => props.currentDate], () => {
  setTimeout(() => {
    autoScrollToActiveTime();
  }, 100);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.sy-calendar-container {
  background-color: var(--st-bg-surface, #161b22);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-card-bg {
  background-color: var(--st-bg-surface, #161b22);
}

.sy-grid-bg {
  background-color: var(--st-bg-surface, #161b22);
}

.sy-timeline-canvas {
  background-color: var(--st-bg-base, #0d1117);
}

.sy-section-header {
  background-color: var(--st-bg-surface, #161b22);
}

.sy-time-col-bg {
  background-color: var(--st-bg-surface, #161b22);
}

.sy-divider {
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-hour-border {
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-hour-sub-border {
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.06));
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

.sy-header-today {
  background-color: var(--st-primary-subtle, rgba(99, 102, 241, 0.12));
  color: var(--st-primary, #818cf8);
}

.sy-list-item-card {
  background-color: var(--st-bg-elevated, #21262d);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-list-item-card:hover,
.sy-list-item-card.is-hovered {
  border-color: var(--st-primary, #6366f1);
  background-color: var(--st-bg-hover, rgba(148, 163, 184, 0.16));
}

.sy-month-matrix {
  background-color: var(--st-bg-base, #0d1117);
}

.sy-month-cell-muted {
  background-color: var(--st-bg-base, #0d1117);
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.05));
  opacity: 0.5;
}

.sy-month-cell-default {
  background-color: var(--st-bg-surface, #161b22);
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-month-cell-default:hover {
  border-color: var(--st-border-strong, rgba(255, 255, 255, 0.25));
  background-color: var(--st-bg-hover, rgba(148, 163, 184, 0.1));
}

.sy-month-cell-active {
  background-color: var(--st-bg-elevated, #21262d);
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.15));
}

.sy-month-cell-active:hover {
  border-color: var(--st-primary, #6366f1);
}

.sy-month-cell-med {
  background-color: rgba(2, 132, 199, 0.12);
  border-color: rgba(2, 132, 199, 0.4);
}

.sy-month-cell-high {
  background-color: rgba(99, 102, 241, 0.16);
  border-color: rgba(99, 102, 241, 0.5);
}

.sy-doc-tag {
  background-color: var(--st-bg-subtle, rgba(148, 163, 184, 0.1));
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.08));
  color: var(--st-text-secondary, #8b949e);
}

.sy-floating-tooltip {
  background-color: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
}

/* 核心线框防御 */
:deep(svg),
svg.sy-wire-icon {
  fill: none !important;
}
</style>
