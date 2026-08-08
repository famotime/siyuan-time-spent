<template>
  <div class="calendar-view bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[600px]">
    <!-- Header: Days -->
    <div class="calendar-header grid grid-cols-8 border-b border-gray-700 bg-gray-800">
      <div class="col-span-1 border-r border-gray-700 p-2 text-center text-gray-400 text-sm flex items-center justify-center">
        时间
      </div>
      <div v-for="day in weekDays" :key="day.dateStr" 
           class="col-span-1 border-r border-gray-700 p-2 text-center text-sm font-semibold"
           :class="{'text-indigo-400': day.isToday, 'text-gray-300': !day.isToday}">
        <div class="text-xs text-gray-500 uppercase tracking-wider">{{ day.dayName }}</div>
        <div class="text-lg mt-0.5">{{ day.dateNum }}</div>
      </div>
    </div>
    
    <!-- Body: Grid -->
    <div class="calendar-body flex-grow overflow-y-auto relative bg-gray-800" ref="scrollContainer">
      <div class="grid grid-cols-8 relative" :style="{ height: `${24 * hourHeight}px` }">
        <!-- Time Labels & Grid Lines -->
        <div class="col-span-1 relative border-r border-gray-700 bg-[#151b23]">
          <div v-for="h in 24" :key="h" 
               class="absolute w-full border-b border-gray-700/80 text-right pr-2 text-xs text-gray-400 font-medium"
               :style="{ top: `${(h-1) * hourHeight}px`, height: `${hourHeight}px` }">
            <span class="-mt-[10px] inline-block px-1 bg-[#151b23]">{{ String(h - 1).padStart(2, '0') }}:00</span>
          </div>
        </div>
        
        <!-- Day Columns -->
        <div v-for="(day, index) in weekDays" :key="day.dateStr" 
             class="col-span-1 relative border-r border-gray-700/50">
          <div v-for="h in 24" :key="h" 
               class="absolute w-full border-b border-gray-700/30"
               :style="{ top: `${(h-1) * hourHeight}px`, height: `${hourHeight}px` }">
          </div>
          
          <!-- Time Blocks -->
          <div v-for="block in getBlocksForDay(day.dateStr)" :key="block.log.id"
               class="absolute w-[92%] mx-[4%] rounded-md shadow-md overflow-hidden text-xs cursor-pointer hover:ring-2 hover:ring-white/80 hover:z-20 transition-all group border border-black/20"
               :style="{
                 top: `${block.top}px`,
                 height: `${block.height}px`,
                 backgroundColor: getDocColor(block.log.docId),
                 zIndex: block.height < 30 ? 10 : 5
               }"
               @click="openDoc(block.log.docId)"
               :title="`${block.title}\n${formatTime(block.log.startTime)} - ${formatTime(block.log.endTime)}\n时长: ${formatDuration(block.log.duration)}`"
          >
            <div class="px-1.5 py-1 font-semibold text-white/95 truncate leading-tight drop-shadow-sm">
              {{ block.title || '加载中...' }}
            </div>
            <div class="px-1.5 text-[10px] text-white/80 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {{ formatTime(block.log.startTime) }} - {{ formatDuration(block.log.duration) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Current Time Indicator -->
      <div v-if="isTodayInWeek" class="absolute left-0 right-0 z-30 pointer-events-none grid grid-cols-8"
           :style="{ top: `${currentTimeTop}px` }">
        <div class="col-span-1 text-right pr-2">
          <span class="text-[10px] text-red-400 font-bold bg-[#151b23] px-1 rounded-full shadow -mt-[10px] inline-block">{{ currentTimeStr }}</span>
        </div>
        <div class="col-span-7 relative">
          <div class="absolute left-0 right-0 border-t border-red-500/80 -mt-[1px]"></div>
          <div class="absolute w-2 h-2 rounded-full bg-red-500 -mt-[4px] -ml-[4px]"
               :style="{ left: `${(todayIndex * 100 / 7) + (100 / 14)}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { TimeLog } from '../models/TimeLog';
import { docTitles, fetchDocTitle } from '../utils/title-cache';

const props = defineProps<{
  logs: TimeLog[]
}>();

const hourHeight = 60; // 1 hour = 60px
const scrollContainer = ref<HTMLElement | null>(null);

// Curated OpenTickly-like modern palette
const colors = [
  '#5b8def', // Soft Blue
  '#63b3ed', // Light Blue
  '#4fd1c5', // Teal
  '#68d391', // Green
  '#f6ad55', // Orange
  '#fc8181', // Coral
  '#f687b3', // Pink
  '#b794f4', // Purple
  '#805ad5', // Deep Purple
  '#4a5568'  // Gray
];

const getDocColor = (docId: string) => {
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = docId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

watch(() => props.logs, (newLogs) => {
  newLogs.forEach(log => {
    fetchDocTitle(log.docId);
  });
}, { immediate: true, deep: true });

const weekDays = computed(() => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    days.push({
      dateStr,
      dayName: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
      dateNum: d.getDate(),
      isToday: i === 0,
      dateObj: d
    });
  }
  return days;
});

const todayIndex = computed(() => 6); 

interface BlockDisplay {
  log: TimeLog;
  top: number;
  height: number;
  title: string;
}

const getBlocksForDay = (dateStr: string): BlockDisplay[] => {
  return props.logs
    .filter(log => {
      const d = new Date(log.startTime);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}` === dateStr;
    })
    .map(log => {
      const d = new Date(log.startTime);
      const startHour = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
      const durationHours = log.duration / 3600;
      
      let top = startHour * hourHeight;
      let height = durationHours * hourHeight;
      
      if (height < 15) height = 15;
      
      return {
        log,
        top,
        height,
        title: docTitles.value[log.docId] || ''
      };
    });
};

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时 ${m}分钟`;
  return `${m}分钟`;
};

const openDoc = (docId: string) => {
  window.location.href = `siyuan://blocks/${docId}`;
};

const now = ref(new Date());
let timer: any = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 60000);
  
  setTimeout(() => {
    if (scrollContainer.value) {
      const h = now.value.getHours();
      scrollContainer.value.scrollTop = Math.max(0, (h - 2) * hourHeight);
    }
  }, 100);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const isTodayInWeek = true;
const currentTimeTop = computed(() => {
  const d = now.value;
  return (d.getHours() + d.getMinutes() / 60) * hourHeight;
});
const currentTimeStr = computed(() => formatTime(now.value.getTime()));

</script>
