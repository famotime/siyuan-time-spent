<template>
  <div class="calendar-component flex flex-col bg-gray-900 border border-gray-700/80 rounded-xl overflow-hidden shadow-2xl">
    
    <!-- ==================== DAY VIEW ==================== -->
    <div v-if="mode === 'day'" class="day-view-container grid grid-cols-1 lg:grid-cols-12 h-[680px]">
      <!-- 24-Hour Vertical Grid Schedule (7 cols on lg) -->
      <div class="lg:col-span-8 flex flex-col border-r border-gray-700/80 bg-gray-850 overflow-hidden">
        <div class="p-3 bg-gray-800/90 border-b border-gray-700 flex justify-between items-center text-sm font-semibold text-gray-200">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            24小时活动时间槽 ({{ formattedSelectedDate }})
          </span>
          <span class="text-xs text-gray-400 font-mono">共 {{ currentDayLogs.length }} 条记录</span>
        </div>
        
        <div class="flex-grow overflow-y-auto relative bg-[#131920]" ref="dayScrollContainer">
          <div class="relative" :style="{ height: `${24 * hourHeight}px` }">
            <!-- Hour Lines & Labels -->
            <div v-for="h in 24" :key="h" 
                 class="absolute w-full border-b border-gray-700/40 flex items-start text-xs text-gray-400 select-none"
                 :style="{ top: `${(h - 1) * hourHeight}px`, height: `${hourHeight}px` }">
              <span class="w-14 text-right pr-3 -mt-2.5 font-mono text-gray-400/80">
                {{ String(h - 1).padStart(2, '0') }}:00
              </span>
              <div class="flex-grow border-t border-gray-800/60 h-full"></div>
            </div>

            <!-- Time Blocks -->
            <div class="absolute left-16 right-4 top-0 bottom-0 pointer-events-none">
              <div v-for="block in dayBlocks" :key="block.log.id"
                   class="absolute rounded-lg shadow-lg overflow-hidden cursor-pointer pointer-events-auto hover:ring-2 hover:ring-white/90 hover:z-40 transition-all group border border-black/30 backdrop-blur-sm"
                   :style="{
                     top: `${block.top}px`,
                     height: `${block.height}px`,
                     left: `calc(${block.leftPercent}% + 2px)`,
                     width: `calc(${block.widthPercent}% - 4px)`,
                     backgroundColor: getDocColor(block.log.docId),
                     zIndex: block.colIndex + (block.height < 32 ? 15 : 10)
                   }"
                   @click="openDoc(block.log.docId)"
                   :title="`${block.title}\n${formatTime(block.log.startTime)} - ${formatTime(block.log.endTime)}\n时长: ${formatDuration(block.log.duration)}\n闲置扣除: ${block.log.idleTime}秒`">
                <div class="px-2.5 py-1 flex items-center justify-between text-white drop-shadow font-semibold text-xs truncate">
                  <span class="truncate">{{ block.title || '加载中...' }}</span>
                  <span class="text-[11px] opacity-90 font-mono ml-2 shrink-0">{{ formatDuration(block.log.duration) }}</span>
                </div>
                <div v-if="block.height >= 38" class="px-2.5 text-[10px] text-white/80 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {{ formatTime(block.log.startTime) }} - {{ formatTime(block.log.endTime) }}
                  <span v-if="block.log.idleTime > 0" class="ml-1 text-yellow-300">(-{{ block.log.idleTime }}s 闲置)</span>
                </div>
              </div>
            </div>

            <!-- Current Time Line (if viewing today) -->
            <div v-if="isToday" class="absolute left-0 right-0 z-20 pointer-events-none"
                 :style="{ top: `${currentTimeTop}px` }">
              <div class="flex items-center">
                <span class="w-14 text-right pr-2 text-[10px] font-bold text-red-400 font-mono -mt-2 bg-[#131920]/90 rounded-sm">
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

      <!-- Right Column: Day Timeline & Doc Ranking (5 cols on lg) -->
      <div class="lg:col-span-4 flex flex-col bg-gray-800/90 overflow-hidden">
        <div class="p-3 bg-gray-800 border-b border-gray-700 text-sm font-semibold text-gray-200 flex justify-between items-center">
          <span>今日活动清单</span>
          <span class="text-xs text-indigo-400 font-mono">当日合计 {{ formatDuration(currentDayTotalSec) }}</span>
        </div>
        <div class="flex-grow overflow-y-auto p-4 space-y-3">
          <div v-if="currentDayLogs.length === 0" class="text-center py-16 text-gray-500 text-sm">
            该日期暂无时间记录
          </div>
          <div v-for="log in sortedCurrentDayLogs" :key="log.id"
               class="p-3 rounded-lg bg-gray-900/80 border border-gray-700/70 hover:border-indigo-500/80 hover:bg-gray-750 transition-all cursor-pointer group"
               @click="openDoc(log.docId)">
            <div class="flex justify-between items-start mb-1">
              <div class="font-medium text-xs text-gray-100 group-hover:text-indigo-300 transition-colors line-clamp-1 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getDocColor(log.docId) }"></span>
                {{ docTitles[log.docId] || log.docId || '未知文档' }}
              </div>
              <span class="text-[11px] text-gray-400 font-mono shrink-0 ml-2">
                {{ formatTime(log.startTime) }} - {{ formatTime(log.endTime) }}
              </span>
            </div>
            <div class="flex justify-between items-center text-xs mt-1.5 text-gray-400">
              <span class="text-indigo-300 font-mono font-medium">专注: {{ formatDuration(log.duration) }}</span>
              <span v-if="log.idleTime > 0" class="text-gray-500 text-[11px]">扣除闲置: {{ log.idleTime }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ==================== WEEK VIEW ==================== -->
    <div v-else-if="mode === 'week'" class="week-view-container flex flex-col h-[680px]">
      <!-- 7 Day Header -->
      <div class="grid grid-cols-8 border-b border-gray-700/80 bg-gray-800/90 text-center text-xs font-semibold text-gray-300 select-none">
        <div class="col-span-1 p-2.5 border-r border-gray-700/80 flex items-center justify-center text-gray-400">
          时刻
        </div>
        <div v-for="day in weekDays" :key="day.dateStr"
             class="col-span-1 p-2 border-r border-gray-700/80 last:border-r-0 cursor-pointer hover:bg-gray-700/50 transition-colors"
             :class="{ 'bg-indigo-950/40 text-indigo-300': day.isToday }"
             @click="emitSelectDate(day.dateObj)">
          <div class="text-[11px] text-gray-400 uppercase tracking-wider">{{ day.dayName }}</div>
          <div class="text-sm font-bold mt-0.5" :class="day.isToday ? 'text-indigo-400' : 'text-gray-200'">{{ day.displayDate }}</div>
          <div class="text-[10px] mt-0.5 font-mono" :class="day.totalDuration > 0 ? 'text-green-400' : 'text-gray-400'">
            {{ day.totalDuration > 0 ? formatDuration(day.totalDuration) : '-' }}
          </div>
        </div>
      </div>

      <!-- 7 Day 24h Grid Body -->
      <div class="flex-grow overflow-y-auto relative bg-[#131920]" ref="weekScrollContainer">
        <div class="grid grid-cols-8 relative" :style="{ height: `${24 * hourHeight}px` }">
          <!-- Time Labels Column -->
          <div class="col-span-1 relative border-r border-gray-700/80 bg-[#161c24] select-none">
            <div v-for="h in 24" :key="h"
                 class="absolute w-full border-b border-gray-700/30 text-right pr-2 text-xs text-gray-400 font-mono font-medium"
                 :style="{ top: `${(h-1) * hourHeight}px`, height: `${hourHeight}px` }">
              <span class="-mt-2.5 inline-block">{{ String(h - 1).padStart(2, '0') }}:00</span>
            </div>
          </div>

          <!-- 7 Columns for Days -->
          <div v-for="(day, dIndex) in weekDays" :key="day.dateStr"
               class="col-span-1 relative border-r border-gray-700/40 last:border-r-0">
            <!-- Hour Lines -->
            <div v-for="h in 24" :key="h"
                 class="absolute w-full border-b border-gray-700/20"
                 :style="{ top: `${(h-1) * hourHeight}px`, height: `${hourHeight}px` }">
            </div>

            <!-- Time Blocks -->
            <div v-for="block in getBlocksForDate(day.dateStr)" :key="block.log.id"
                 class="absolute rounded-md shadow-md overflow-hidden text-xs cursor-pointer hover:ring-2 hover:ring-white/90 hover:z-30 transition-all group border border-black/30"
                 :style="{
                   top: `${block.top}px`,
                   height: `${block.height}px`,
                   left: `calc(${block.leftPercent}% + 1px)`,
                   width: `calc(${block.widthPercent}% - 2px)`,
                   backgroundColor: getDocColor(block.log.docId),
                   zIndex: block.colIndex + (block.height < 28 ? 12 : 6)
                 }"
                 @click="openDoc(block.log.docId)"
                 :title="`${block.title}\n${formatTime(block.log.startTime)} - ${formatTime(block.log.endTime)}\n时长: ${formatDuration(block.log.duration)}`">
              <div class="px-1.5 py-0.5 font-semibold text-white/95 truncate leading-tight drop-shadow-sm text-[11px]">
                {{ block.title || '加载中...' }}
              </div>
              <div v-if="block.height >= 34" class="px-1.5 text-[9px] text-white/80 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {{ formatTime(block.log.startTime) }} ({{ formatDuration(block.log.duration) }})
              </div>
            </div>

            <!-- Red Time Dot for Today -->
            <div v-if="day.isToday" class="absolute left-0 right-0 z-20 pointer-events-none"
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
    <div v-else-if="mode === 'month'" class="month-view-container flex flex-col h-[680px] bg-gray-900">
      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 border-b border-gray-700/80 bg-gray-800/90 text-center py-2 text-xs font-semibold text-gray-400">
        <div v-for="w in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']" :key="w" class="col-span-1">
          {{ w }}
        </div>
      </div>

      <!-- Month Calendar Matrix Grid -->
      <div class="flex-grow grid grid-cols-7 grid-rows-6 gap-1 p-2 bg-[#12161f] overflow-y-auto">
        <div v-for="cell in monthCells" :key="cell.key"
             class="month-cell rounded-lg p-2 flex flex-col justify-between border transition-all duration-150 relative cursor-pointer group select-none"
             :class="getCellClasses(cell)"
             @click="emitSelectDate(cell.dateObj)">
          
          <!-- Top Row: Date Number & Badge -->
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                  :class="cell.isToday ? 'bg-indigo-600 text-white font-black ring-2 ring-indigo-400/50' : (cell.isCurrentMonth ? 'text-gray-200' : 'text-gray-400')">
              {{ cell.dayNum }}
            </span>
            <span v-if="cell.totalDuration > 0" 
                  class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shadow-sm"
                  :class="getDurationBadgeClasses(cell.totalDuration)">
              {{ formatDuration(cell.totalDuration) }}
            </span>
          </div>

          <!-- Middle: Top Doc Tags / Activity Indicators -->
          <div class="my-1 space-y-1 flex-grow overflow-hidden">
            <div v-for="(doc, idx) in cell.topDocs.slice(0, 2)" :key="idx"
                 class="text-[10px] truncate px-1 py-0.5 rounded bg-gray-800/80 text-gray-300 border border-gray-700/40 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: getDocColor(doc.docId) }"></span>
              <span class="truncate">{{ docTitles[doc.docId] || doc.docId || '专注文档' }}</span>
            </div>
            <div v-if="cell.topDocs.length > 2" class="text-[9px] text-gray-500 font-mono pl-1">
              +{{ cell.topDocs.length - 2 }} 更多
            </div>
          </div>

          <!-- Bottom: Session Count / Hint -->
          <div class="flex justify-between items-center text-[10px] text-gray-400 font-mono">
            <span v-if="cell.sessionCount > 0">{{ cell.sessionCount }} 次会话</span>
            <span v-else class="text-transparent group-hover:text-gray-400 text-[9px]">点击查看</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { openTab } from 'siyuan';
import type { TimeLog } from '../models/TimeLog';
import { docTitles, fetchDocTitle } from '../utils/title-cache';
import { usePlugin } from '../main';

const props = withDefaults(defineProps<{
  logs: TimeLog[];
  dayMap: Record<string, TimeLog[]>;
  mode: 'day' | 'week' | 'month';
  currentDate: Date;
}>(), {
  logs: () => [],
  dayMap: () => ({}),
  mode: 'week',
  currentDate: () => new Date()
});

const emit = defineEmits<{
  (e: 'select-date', d: Date): void;
  (e: 'switch-mode', m: 'day' | 'week' | 'month'): void;
}>();

const hourHeight = 56; // 1 hour = 56px
const dayScrollContainer = ref<HTMLElement | null>(null);
const weekScrollContainer = ref<HTMLElement | null>(null);

// Curated modern color palette for documents
const colors = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#475569'  // Slate
];

const getDocColor = (docId: string) => {
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = docId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

watch(() => props.logs, (newLogs) => {
  if (newLogs) {
    newLogs.forEach(log => {
      if (log.docId) {
        fetchDocTitle(log.docId);
      }
    });
  }
}, { immediate: true, deep: true });

// Formatter helpers
const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const plugin = usePlugin();

const openDoc = (docId: string) => {
  if (docId) {
    try {
      if (plugin?.app) {
        openTab({
          app: plugin.app,
          doc: {
            id: docId,
          },
        });
        return;
      }
    } catch {
      // 降级使用 URI Scheme
    }
    window.location.href = `siyuan://blocks/${docId}`;
  }
};

const emitSelectDate = (d: Date) => {
  emit('select-date', d);
  if (props.mode !== 'day') {
    emit('switch-mode', 'day');
  }
};

// ==================== DAY VIEW COMPUTED ====================
const selectedDateKey = computed(() => formatDateKey(props.currentDate));

const formattedSelectedDate = computed(() => {
  const d = props.currentDate;
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

/**
 * 智能重叠并排布局算法 (Google Calendar 风格)
 * 1. 计算所有记录的几何区间 [top, top + height]
 * 2. 识别有交叉重叠的记录聚类为冲突群组 (Clusters)
 * 3. 贪心算法为各记录分配列索引 (colIndex) 并计算最大并发列数 (totalCols)
 * 4. 动态计算 leftPercent 和 widthPercent
 */
const computeLayoutBlocks = (logs: TimeLog[], minHeight = 22): BlockDisplay[] => {
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

  // 1. 基础尺寸与位置计算
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

  // 2. 排序：按 top 升序；若 top 相同，按 height 降序（较长优先排左）；再按 startTime 升序
  rawBlocks.sort((a, b) => {
    if (Math.abs(a.top - b.top) > 0.001) {
      return a.top - b.top;
    }
    if (Math.abs(b.height - a.height) > 0.001) {
      return b.height - a.height;
    }
    return a.log.startTime - b.log.startTime;
  });

  // 3. 聚类分组（连通的重叠时间群组）
  const clusters: TempBlock[][] = [];
  let currentCluster: TempBlock[] = [];
  let clusterEnd = -1;

  for (const block of rawBlocks) {
    if (currentCluster.length === 0) {
      currentCluster.push(block);
      clusterEnd = block.end;
    } else {
      // 若当前块起点在上一个群组的结束位置之前，说明有交叉重叠
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

  // 4. 贪心分配列并计算百分比
  const result: BlockDisplay[] = [];

  for (const cluster of clusters) {
    const columns: number[] = []; // 记录各列当前底部的 y 坐标 (end)

    for (const block of cluster) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        // 如果该列当前空闲
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
  return computeLayoutBlocks(currentDayLogs.value, 24);
});

// ==================== WEEK VIEW COMPUTED ====================
const weekDays = computed(() => {
  const days = [];
  const curr = new Date(props.currentDate);
  // Get Monday of current week
  const dayOfWeek = curr.getDay(); // 0 is Sunday
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
      dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      isToday: dateStr === todayKey,
      dateObj: d,
      totalDuration
    });
  }
  return days;
});

const getBlocksForDate = (dateStr: string): BlockDisplay[] => {
  const logs = props.dayMap[dateStr] || props.logs.filter(log => formatDateKey(new Date(log.startTime)) === dateStr);
  return computeLayoutBlocks(logs, 20);
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
  const month = props.currentDate.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const todayKey = formatDateKey(new Date());

  // Monday = 1, Sunday = 7
  let startDayOfWeek = firstDay.getDay();
  if (startDayOfWeek === 0) startDayOfWeek = 7;
  const paddingBefore = startDayOfWeek - 1;

  // Pre-month padding
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

  // Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDateKey(d);
    const dayLogs = props.dayMap[dateStr] || [];
    const totalDuration = dayLogs.reduce((acc, l) => acc + l.duration, 0);
    
    // Aggregate top docs for this day
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

  // Post-month padding to fill 42 cells (6 rows x 7)
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
    return 'bg-gray-900/40 border-gray-800/40 text-gray-600 hover:bg-gray-800/30';
  }
  if (cell.totalDuration >= 10800) { // >= 3h
    return 'bg-indigo-950/50 border-indigo-700/60 hover:border-indigo-400 hover:bg-indigo-900/50';
  }
  if (cell.totalDuration >= 3600) { // >= 1h
    return 'bg-blue-950/40 border-blue-700/50 hover:border-blue-400 hover:bg-blue-900/40';
  }
  if (cell.totalDuration > 0) {
    return 'bg-gray-800/70 border-gray-700/70 hover:border-gray-500 hover:bg-gray-750';
  }
  return 'bg-gray-850/60 border-gray-800 hover:border-gray-600 hover:bg-gray-800';
};

const getDurationBadgeClasses = (seconds: number) => {
  if (seconds >= 10800) return 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40';
  if (seconds >= 3600) return 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30';
  return 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
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

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 30000);

  setTimeout(() => {
    const h = now.value.getHours();
    if (dayScrollContainer.value) {
      dayScrollContainer.value.scrollTop = Math.max(0, (h - 2) * hourHeight);
    }
    if (weekScrollContainer.value) {
      weekScrollContainer.value.scrollTop = Math.max(0, (h - 2) * hourHeight);
    }
  }, 150);
});

watch(() => props.mode, () => {
  setTimeout(() => {
    const h = now.value.getHours();
    if (dayScrollContainer.value) {
      dayScrollContainer.value.scrollTop = Math.max(0, (h - 2) * hourHeight);
    }
    if (weekScrollContainer.value) {
      weekScrollContainer.value.scrollTop = Math.max(0, (h - 2) * hourHeight);
    }
  }, 100);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.bg-gray-850 {
  background-color: #171f2c;
}
.bg-gray-750 {
  background-color: #283344;
}
</style>
