<template>
  <div class="timeline-container relative pl-4 border-l-2 border-gray-700 max-h-96 overflow-y-auto">
    <div v-if="logs.length === 0" class="text-gray-500 italic text-sm py-4">
      No activity recorded today.
    </div>
    
    <div v-for="log in sortedLogs" :key="log.id" class="timeline-item relative mb-6">
      <div class="absolute -left-6 mt-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-gray-900"></div>
      
      <div class="group block p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-indigo-500 hover:bg-gray-750 transition-colors duration-200 cursor-pointer">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-semibold text-gray-200">{{ log.docId || 'Unknown Document' }}</span>
          <span class="text-xs text-gray-400">{{ formatTime(log.startTime) }} - {{ formatTime(log.endTime) }}</span>
        </div>
        <div class="text-xs text-indigo-300 font-medium mt-1">
          Duration: {{ formatDuration(log.duration) }}
        </div>
        <div class="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Idle deducted: {{ log.idleTime }}s
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimeLog } from '../models/TimeLog';

const props = defineProps<{
  logs: TimeLog[]
}>();

const sortedLogs = computed(() => {
  return [...props.logs].sort((a, b) => b.startTime - a.startTime);
});

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};
</script>

<style scoped>
.timeline-item:last-child {
  margin-bottom: 0;
}
.bg-gray-750 {
  background-color: #2d3748; /* slightly lighter than gray-800 */
}
</style>
