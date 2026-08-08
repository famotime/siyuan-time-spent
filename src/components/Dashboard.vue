<template>
  <div class="time-spent-dashboard bg-gray-900 text-gray-100 p-6 min-h-full">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold tracking-wider text-white">Time Spent</h1>
      <div class="flex gap-4">
        <div class="kpi-box bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <div class="text-sm text-gray-400">Today</div>
          <div class="text-xl font-bold text-green-400">{{ formatDuration(todayTotal) }}</div>
        </div>
        <div class="kpi-box bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <div class="text-sm text-gray-400">This Week</div>
          <div class="text-xl font-bold text-blue-400">{{ formatDuration(weekTotal) }}</div>
        </div>
        <button @click="exportForAI" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200">
          Export for AI
        </button>
      </div>
    </header>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Timeline View -->
      <section class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
        <h2 class="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Activity Timeline</h2>
        <Timeline :logs="todayLogs" />
      </section>
      
      <!-- Charts View -->
      <section class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 flex flex-col gap-8">
        <div>
          <h2 class="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">Distribution</h2>
          <Charts :logs="todayLogs" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Timeline from './Timeline.vue';
import Charts from './Charts.vue';
import type { TimeLog } from '../models/TimeLog';
import { usePlugin } from '../main';
import { AIExportManager } from '../utils/ai-export';

const plugin = usePlugin();
const todayLogs = ref<TimeLog[]>([]);

const todayTotal = computed(() => {
  return todayLogs.value.reduce((acc, log) => acc + log.duration, 0);
});

// Mock week total for now
const weekTotal = computed(() => {
  return todayTotal.value * 5.2; 
});

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const exportForAI = async () => {
  const dateStr = (plugin as any).storageManager.getTodayString();
  const md = AIExportManager.generateMarkdownSummary(todayLogs.value, dateStr);
  try {
    await navigator.clipboard.writeText(md);
    alert('AI summary copied to clipboard! Paste it to ChatGPT or Claude.');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert('Failed to copy to clipboard.');
  }
};

onMounted(async () => {
  if (plugin && (plugin as any).storageManager) {
    todayLogs.value = await (plugin as any).storageManager.loadTodayLogs();
  }
});
</script>

<style scoped>
.time-spent-dashboard {
  font-family: 'Inter', sans-serif;
}
</style>
