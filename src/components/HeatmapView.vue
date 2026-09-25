<template>
  <div class="heatmap-view bg-gray-900 border border-gray-700/80 rounded-xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/90 pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_10px_rgba(34,211,238,0.7)]"></span>
        <h3 class="text-sm sm:text-base font-bold text-white tracking-wide">
          {{ year }} 年度笔记专注活跃度 (365天热力图)
        </h3>
        <span class="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 font-mono">
          共 {{ activeDaysCount }} 天保持专注
        </span>
      </div>

      <!-- Legend (图例) -->
      <div class="flex items-center gap-1.5 text-[11px] text-gray-400 select-none">
        <span>少</span>
        <span class="w-3 h-3 rounded-sm bg-gray-800/90 border border-gray-700/60 inline-block" title="无活动"></span>
        <span class="w-3 h-3 rounded-sm bg-indigo-950 border border-indigo-800/50 inline-block" title="< 30分钟"></span>
        <span class="w-3 h-3 rounded-sm bg-indigo-800 inline-block" title="30分钟 - 2小时"></span>
        <span class="w-3 h-3 rounded-sm bg-indigo-600 inline-block" title="2 - 4小时"></span>
        <span class="w-3 h-3 rounded-sm bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] inline-block" title="> 4小时"></span>
        <span>多</span>
      </div>
    </div>

    <!-- Matrix Scroll Container (仿 GitHub Contribution Graph) -->
    <div class="overflow-x-auto pb-2 custom-scrollbar">
      <div class="min-w-[760px] flex flex-col gap-1.5">
        
        <!-- Month Labels Row -->
        <div class="flex pl-8 text-[11px] font-mono text-gray-400 select-none">
          <div
            v-for="(m, idx) in monthLabels"
            :key="idx"
            class="truncate"
            :style="{ width: `${m.colSpan * 15}px` }"
          >
            {{ m.name }}
          </div>
        </div>

        <!-- Heatmap Grid: 7 Rows (周一到周日) x N Columns (周) -->
        <div class="flex gap-1">
          <!-- Weekday Labels Column -->
          <div class="w-7 flex flex-col justify-between text-[10px] font-mono text-gray-500 select-none py-0.5">
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
                class="w-3 h-3 rounded-sm transition-all duration-150 cursor-pointer relative group"
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
    <div class="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/80">
      <div class="flex items-center gap-3">
        <span>年度累计有效专注: <strong class="text-indigo-300 font-mono font-bold">{{ formatDuration(totalYearSeconds) }}</strong></span>
        <span>·</span>
        <span>最长连续专注: <strong class="text-cyan-400 font-mono font-bold">{{ maxStreakDays }} 天</strong></span>
      </div>
      <div class="text-[11px] text-gray-500">
        💡 点击任意方格可一键下钻至当天的日视图
      </div>
    </div>

    <!-- Glassmorphism Floating Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="fixed pointer-events-none z-[9999] transition-opacity duration-150 backdrop-blur-md bg-gray-950/95 border border-gray-700/90 rounded-xl p-2.5 shadow-2xl text-xs text-gray-100 max-w-xs flex flex-col gap-1"
        :style="{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }"
      >
        <div class="font-bold text-white flex items-center justify-between gap-3">
          <span>{{ tooltip.dateStr }}</span>
          <span class="text-indigo-400 font-mono text-[11px]">{{ tooltip.dayName }}</span>
        </div>
        <div class="text-cyan-300 font-bold font-mono text-sm mt-0.5">
          {{ tooltip.durationStr }}
        </div>
        <div class="text-[11px] text-gray-400">
          共 {{ tooltip.sessionsCount }} 次专注会话
          <span v-if="tooltip.idleSec > 0" class="text-amber-400 ml-1">(-{{ tooltip.idleSec }}s 闲置)</span>
        </div>
        <div class="text-[10px] text-indigo-300/80 mt-1 select-none">
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
  level: number; // 0 to 4
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

  // 对齐到周一
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
      if (totalDuration < 1800) level = 1; // < 30m
      else if (totalDuration < 7200) level = 2; // < 2h
      else if (totalDuration < 14400) level = 3; // < 4h
      else level = 4; // >= 4h
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
    // 取该周周四所在的月份作为代表月
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
    return 'opacity-20 bg-gray-900 border border-gray-800/40 pointer-events-none';
  }
  switch (day.level) {
    case 1:
      return 'bg-indigo-950 border border-indigo-800/60 hover:ring-2 hover:ring-indigo-400';
    case 2:
      return 'bg-indigo-800 hover:ring-2 hover:ring-indigo-300';
    case 3:
      return 'bg-indigo-600 hover:ring-2 hover:ring-white';
    case 4:
      return 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)] hover:ring-2 hover:ring-white';
    default:
      return 'bg-gray-800/90 border border-gray-700/50 hover:border-gray-500';
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

// 计算年度最长连续专注天数 (Streak)
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
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.4);
  border-radius: 9999px;
}
</style>
