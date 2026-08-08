<template>
  <div class="time-spent-dashboard bg-gray-900 text-gray-100 p-6 min-h-full">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold tracking-wider text-white">时间分布</h1>
      <div class="flex gap-4">
        <div class="kpi-box bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <div class="text-sm text-gray-400">今日</div>
          <div class="text-xl font-bold text-green-400">{{ formatDuration(todayTotal) }}</div>
        </div>
        <div class="kpi-box bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <div class="text-sm text-gray-400">本周</div>
          <div class="text-xl font-bold text-blue-400">{{ formatDuration(weekTotal) }}</div>
        </div>
        <button @click="exportForAI" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
          为 AI 导出
        </button>
      </div>
    </header>
    <div class="flex gap-4 mb-6 border-b border-gray-700">
      <button @click="currentTab = 'today'" class="pb-2 px-4 font-semibold transition-colors border-b-2" :class="currentTab === 'today' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'">今日概览</button>
      <button @click="currentTab = 'calendar'" class="pb-2 px-4 font-semibold transition-colors border-b-2" :class="currentTab === 'calendar' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'">日历 (周视图)</button>
    </div>
    
    <div v-if="currentTab === 'today'" class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Timeline View -->
      <section class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
        <h2 class="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">活动时间线</h2>
        <Timeline :logs="todayLogs" />
      </section>
      
      <!-- Charts View -->
      <section class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 flex flex-col gap-8">
        <div>
          <h2 class="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">时间分布图</h2>
          <Charts :logs="todayLogs" />
        </div>
      </section>
    </div>
    
    <div v-else-if="currentTab === 'calendar'" class="w-full">
      <CalendarView :logs="weekLogs" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Timeline from './Timeline.vue';
import Charts from './Charts.vue';
import CalendarView from './CalendarView.vue';
import type { TimeLog } from '../models/TimeLog';
import { usePlugin } from '../main';
import { AIExportManager } from '../utils/ai-export';

const plugin = usePlugin();
const todayLogs = ref<TimeLog[]>([]);
const weekLogs = ref<TimeLog[]>([]);
const currentTab = ref('today');

const todayTotal = computed(() => {
  return todayLogs.value.reduce((acc, log) => acc + log.duration, 0);
});

const weekTotal = computed(() => {
  return weekLogs.value.reduce((acc, log) => acc + log.duration, 0);
});

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时 ${m}分钟`;
  return `${m}分钟`;
};

const exportForAI = async () => {
  const dateStr = (plugin as any).storageManager.getTodayString();
  const md = AIExportManager.generateMarkdownSummary(todayLogs.value, dateStr);
  try {
    await navigator.clipboard.writeText(md);
    alert('AI 总结已复制到剪贴板！请粘贴到 ChatGPT 或 Claude。');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert('无法复制到剪贴板。');
  }
};

onMounted(async () => {
  if (plugin && (plugin as any).storageManager) {
    todayLogs.value = await (plugin as any).storageManager.loadTodayLogs();
    weekLogs.value = await (plugin as any).storageManager.loadWeekLogs();
  }
});
</script>

<style scoped>
.time-spent-dashboard {
  font-family: 'Inter', sans-serif;
}
</style>
