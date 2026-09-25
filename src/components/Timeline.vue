<template>
  <div class="timeline-container relative pl-4 border-l-2 sy-divider max-h-96 overflow-y-auto">
    <div v-if="logs.length === 0" class="sy-text-tertiary italic text-sm py-4">
      今日无活动记录。
    </div>
    
    <div v-for="log in sortedLogs" :key="log.id" class="timeline-item relative mb-6">
      <div class="absolute -left-6 mt-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-transparent"></div>
      
      <div class="group block p-3 rounded-lg sy-timeline-card border sy-divider hover:border-indigo-500 transition-colors duration-200 cursor-pointer">
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm font-semibold sy-text-primary truncate pr-2">{{ docTitles[log.docId] || log.docId || '未知文档' }}</span>
          <span class="text-xs sy-text-secondary whitespace-nowrap">{{ formatTime(log.startTime) }} - {{ formatTime(log.endTime) }}</span>
        </div>
        <div class="text-xs text-indigo-600 dark:text-indigo-300 font-medium mt-1">
          专注时长: {{ formatDuration(log.duration) }}
        </div>
        <div class="text-xs sy-text-tertiary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          扣除闲置: {{ log.idleTime }}s
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { TimeLog } from '../models/TimeLog';
import { docTitles, fetchDocTitle } from '../utils/title-cache';

const props = defineProps<{
  logs: TimeLog[]
}>();

watch(() => props.logs, (newLogs) => {
  newLogs.forEach(log => {
    fetchDocTitle(log.docId);
  });
}, { immediate: true, deep: true });

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
  return `${m}分 ${s}秒`;
};
</script>

<style scoped>
.timeline-item:last-child {
  margin-bottom: 0;
}
.sy-timeline-card {
  background-color: var(--st-bg-surface, #161b22);
}
.sy-timeline-card:hover {
  background-color: var(--st-bg-hover, rgba(148, 163, 184, 0.1));
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
</style>
