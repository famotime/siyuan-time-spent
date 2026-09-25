<template>
  <div class="heatmap-view sy-card rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b sy-divider pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-3 h-3 rounded-full bg-cyan-500 inline-block shadow-[0_0_10px_rgba(6,182,212,0.6)]"></span>
        <h3 class="text-xs sm:text-sm font-bold sy-text-primary tracking-wide">
          {{ year }} 年度笔记专注活跃度 (365天热力图)
        </h3>
        <span class="text-xs px-2.5 py-0.5 rounded-full sy-badge font-mono font-tabular">
          共 {{ activeDaysCount }} 天保持专注
        </span>
      </div>

      <!-- Legend (图例) -->
      <div class="flex items-center gap-1.5 text-xs sy-text-secondary select-none">
        <span>少</span>
        <span class="w-3 h-3 rounded-xs sy-legend-0 inline-block" title="无活动"></span>
        <span class="w-3 h-3 rounded-xs sy-legend-1 inline-block" title="< 30分钟"></span>
        <span class="w-3 h-3 rounded-xs sy-legend-2 inline-block" title="30分钟 - 2小时"></span>
        <span class="w-3 h-3 rounded-xs sy-legend-3 inline-block" title="2 - 4小时"></span>
        <span class="w-3 h-3 rounded-xs sy-legend-4 inline-block shadow-[0_0_6px_rgba(6,182,212,0.5)]" title="> 4小时"></span>
        <span>多</span>
      </div>
    </div>

    <!-- Matrix Scroll Container (仿 GitHub Contribution Graph) -->
    <div class="overflow-x-auto pb-2 custom-scrollbar">
      <div class="min-w-[760px] flex flex-col gap-1.5">
        
        <!-- Month Labels Row -->
        <div class="flex pl-8 text-xs font-mono sy-text-tertiary select-none">
          <div
            v-for="(m, idx) in monthLabels"
            :key="idx"
            class="truncate font-tabular"
            :style="{ width: `${m.colSpan * 15}px` }"
          >
            {{ m.name }}
          </div>
        </div>

        <!-- Heatmap Grid: 7 Rows (周一到周日) x N Columns (周) -->
        <div class="flex gap-1">
          <!-- Weekday Labels Column -->
          <div class="w-7 flex flex-col justify-between text-xs font-mono sy-text-tertiary select-none py-0.5">
            <span>一</span>
            <span>三</span>
            <span>五</span>
            <span>日</span>
          </div>

          <!-- Weeks Columns -->
          <div class="flex gap-1 flex-1">
            <div
              v-for="(week, wIdx) in calendarWeeks"
              :key="wIdx"
              class="flex flex-col gap-1"
            >
              <div
                v-for="(day, dIdx) in week"
                :key="dIdx"
                class="w-3 h-3 rounded-xs transition-all duration-150 cursor-pointer relative group"
                :class="getDayCellClass(day)"
                @click="onDayClick(day)"
                @mouseenter="showTooltip($event, day)"
                @mousemove="updateTooltip($event)"
                @mouseleave="hideTooltip"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Stat Summary -->
    <div class="flex flex-wrap items-center justify-between text-xs sy-text-secondary pt-2 border-t sy-divider">
      <div class="flex items-center gap-3 font-tabular">
        <span>年度累计有效专注: <strong class="text-indigo-500 font-mono font-bold">{{ formatDuration(totalYearSeconds) }}</strong></span>
        <span>·</span>
        <span>最长连续专注: <strong class="text-cyan-500 font-mono font-bold">{{ maxStreakDays }} 天</strong></span>
      </div>
      <div class="text-xs sy-text-tertiary flex items-center gap-1">
        <svg class="w-3.5 h-3.5 text-amber-500 shrink-0 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>点击任意方格可一键下钻至当天的日视图</span>
      </div>
    </div>

    <!-- Glassmorphism Floating Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="fixed pointer-events-none z-[9999] transition-opacity duration-150 backdrop-blur-md sy-floating-tooltip rounded-xl p-2.5 shadow-2xl text-xs max-w-xs flex flex-col gap-1"
        :style="{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }"
      >
        <div class="font-bold text-white flex items-center justify-between gap-3">
          <span>{{ tooltip.dateStr }}</span>
          <span class="text-indigo-300 font-mono text-xs">{{ tooltip.dayName }}</span>
        </div>
        <div class="text-cyan-400 font-bold font-mono text-sm mt-0.5 font-tabular">
          {{ tooltip.durationStr }}
        </div>
        <div class="text-xs text-gray-300 font-tabular">
          共 {{ tooltip.sessionsCount }} 次专注会话
          <span v-if="tooltip.idleSec > 0" class="text-amber-400 ml-1">(-{{ tooltip.idleSec }}s 闲置)</span>
        </div>
        <div class="text-xs text-indigo-300/80 mt-1 select-none">
          点击进入当日详情
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TimeLog } from '../models/TimeLog';

interface DayItem {
  date: Date;
  dateStr: string;
  isCurrentYear: boolean;
  totalDuration: number;
  idleDuration: number;
  sessionCount: number;
  level: number;
}

const props = withDefaults(
  defineProps<{
    year: number;
    dayMap: Record<string, TimeLog[]>;
  }>(),
  {
    year: () => new Date().getFullYear(),
    dayMap: () => ({}),
  }
);

const emit = defineEmits<{
  (e: 'select-date', d: Date): void;
}>();

const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时 ${m}分钟`;
  if (m > 0) return `${m}分钟`;
  return `${seconds}秒`;
};

// Tooltip State
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  dateStr: '',
  dayName: '',
  durationStr: '暂无活动',
  sessionsCount: 0,
  idleSec: 0,
});

const showTooltip = (e: MouseEvent, day: DayItem) => {
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  tooltip.value = {
    visible: true,
    x: e.clientX + 10,
    y: e.clientY + 10,
    dateStr: day.dateStr,
    dayName: weekNames[day.date.getDay()],
    durationStr: day.totalDuration > 0 ? formatDuration(day.totalDuration) : '未记录专注',
    sessionsCount: day.sessionCount,
    idleSec: day.idleDuration,
  };
};

const updateTooltip = (e: MouseEvent) => {
  if (tooltip.value.visible) {
    let x = e.clientX + 12;
    let y = e.clientY + 12;
    if (x + 220 > window.innerWidth) x = e.clientX - 230;
    if (y + 110 > window.innerHeight) y = e.clientY - 120;
    tooltip.value.x = x;
    tooltip.value.y = y;
  }
};

const hideTooltip = () => {
  tooltip.value.visible = false;
};

const onDayClick = (day: DayItem) => {
  emit('select-date', day.date);
};

// 生成 52~53 周日历网格
const calendarWeeks = computed(() => {
  const y = props.year;
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31);

  const startDay = start.getDay();
  const diffToMonday = startDay === 0 ? -6 : 1 - startDay;
  const firstMonday = new Date(start);
  firstMonday.setDate(start.getDate() + diffToMonday);

  const weeks: DayItem[][] = [];
  let currentWeek: DayItem[] = [];
  const curr = new Date(firstMonday);

  while (curr <= end || currentWeek.length > 0) {
    const dateStr = formatDateKey(curr);
    const logs = props.dayMap[dateStr] || [];
    const totalDuration = logs.reduce((acc, l) => acc + l.duration, 0);
    const idleDuration = logs.reduce((acc, l) => acc + l.idleTime, 0);

    let level = 0;
    if (totalDuration > 0) {
      if (totalDuration < 1800) level = 1;
      else if (totalDuration < 7200) level = 2;
      else if (totalDuration < 14400) level = 3;
      else level = 4;
    }

    currentWeek.push({
      date: new Date(curr),
      dateStr,
      isCurrentYear: curr.getFullYear() === y,
      totalDuration,
      idleDuration,
      sessionCount: logs.length,
      level,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      if (curr > end) break;
    }

    curr.setDate(curr.getDate() + 1);
  }

  return weeks;
});

// 计算顶部月份标签位置
const monthLabels = computed(() => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const labels: { name: string; colSpan: number }[] = [];
  let currentMonth = -1;
  let count = 0;

  calendarWeeks.value.forEach((week) => {
    const midDay = week[3] ? week[3].date : week[0].date;
    const m = midDay.getMonth();
    if (m !== currentMonth) {
      if (currentMonth !== -1) {
        labels.push({ name: months[currentMonth], colSpan: count });
      }
      currentMonth = m;
      count = 1;
    } else {
      count++;
    }
  });

  if (currentMonth !== -1) {
    labels.push({ name: months[currentMonth], colSpan: count });
  }

  return labels;
});

const getDayCellClass = (day: DayItem) => {
  if (!day.isCurrentYear) {
    return 'opacity-15 sy-legend-0 pointer-events-none';
  }
  switch (day.level) {
    case 1:
      return 'sy-legend-1 hover:ring-2 hover:ring-indigo-400';
    case 2:
      return 'sy-legend-2 hover:ring-2 hover:ring-indigo-300';
    case 3:
      return 'sy-legend-3 hover:ring-2 hover:ring-white';
    case 4:
      return 'sy-legend-4 hover:ring-2 hover:ring-white';
    default:
      return 'sy-legend-0 hover:border-gray-500';
  }
};

const totalYearSeconds = computed(() => {
  let total = 0;
  Object.values(props.dayMap).forEach((logs) => {
    logs.forEach((l) => (total += l.duration));
  });
  return total;
});

const activeDaysCount = computed(() => {
  let count = 0;
  calendarWeeks.value.forEach((week) => {
    week.forEach((day) => {
      if (day.isCurrentYear && day.totalDuration > 0) count++;
    });
  });
  return count;
});

const maxStreakDays = computed(() => {
  let maxStreak = 0;
  let currentStreak = 0;

  calendarWeeks.value.forEach((week) => {
    week.forEach((day) => {
      if (day.isCurrentYear) {
        if (day.totalDuration > 0) {
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
    });
  });

  return maxStreak;
});
</script>

<style scoped>
.sy-card {
  background-color: var(--st-bg-surface, #161b22);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
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

/* 热力图色阶 */
.sy-legend-0 {
  background-color: var(--st-bg-subtle, rgba(148, 163, 184, 0.12));
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.08));
}

.sy-legend-1 {
  background-color: rgba(99, 102, 241, 0.25);
  border: 1px solid rgba(99, 102, 241, 0.4);
}

.sy-legend-2 {
  background-color: rgba(99, 102, 241, 0.55);
}

.sy-legend-3 {
  background-color: #6366f1;
}

.sy-legend-4 {
  background-color: #06b6d4;
  box-shadow: 0 0 6px rgba(6, 182, 212, 0.6);
}

.sy-floating-tooltip {
  background-color: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

/* 显式线框防御 */
:deep(svg),
svg.sy-wire-icon {
  fill: none !important;
}
</style>
