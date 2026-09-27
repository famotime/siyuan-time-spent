<template>
  <div v-if="visible" 
       class="fixed inset-0 z-50 sy-summary-modal-mask flex items-center justify-center p-4 transition-all duration-300"
       @click.self="handleClose">
    <div class="sy-modal-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-5 py-4 border-b sy-divider flex items-center justify-between sy-header-bg shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 shrink-0">
            <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 class="text-sm sm:text-base font-bold sy-text-primary">
            {{ t('manualLogModalTitle') }}
          </h3>
        </div>
        <button @click="handleClose" class="w-7 h-7 flex items-center justify-center rounded-lg sy-text-secondary hover:sy-text-primary transition-colors cursor-pointer">
          <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Body Form -->
      <div class="p-5 flex flex-col gap-4 sy-body-bg text-xs sm:text-sm">
        <!-- 关联文档选择 -->
        <div>
          <label class="block text-xs font-semibold sy-text-secondary mb-1.5">
            {{ t('manualLogDocLabel') }}
          </label>
          <select v-model="selectedDocId" class="w-full h-10 px-3 rounded-xl border sy-divider bg-transparent sy-text-primary outline-none focus:border-indigo-500 transition-colors">
            <option v-for="doc in availableDocs" :key="doc.id" :value="doc.id" class="sy-option-bg">
              {{ doc.title }}
            </option>
          </select>
        </div>

        <!-- 起止时间 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold sy-text-secondary mb-1.5">
              {{ t('manualLogStartTime') }}
            </label>
            <input type="time" v-model="startTimeStr" class="w-full h-10 px-3 rounded-xl border sy-divider bg-transparent sy-text-primary font-mono outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-semibold sy-text-secondary mb-1.5">
              {{ t('manualLogEndTime') }}
            </label>
            <input type="time" v-model="endTimeStr" class="w-full h-10 px-3 rounded-xl border sy-divider bg-transparent sy-text-primary font-mono outline-none focus:border-indigo-500 transition-colors" />
          </div>
        </div>

        <!-- 备注说明 -->
        <div>
          <label class="block text-xs font-semibold sy-text-secondary mb-1.5">
            {{ t('manualLogNote') }}
          </label>
          <input 
            type="text" 
            v-model="noteStr" 
            :placeholder="t('manualLogNotePlaceholder')" 
            class="w-full h-10 px-3 rounded-xl border sy-divider bg-transparent sy-text-primary outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <!-- 时长预览 -->
        <div v-if="calculatedDurationSec > 0" class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-300 flex items-center justify-between">
          <span>预计有效专注时长：</span>
          <span class="font-bold font-mono">{{ Math.floor(calculatedDurationSec / 60) }} 分钟</span>
        </div>
        <div v-else-if="startTimeStr && endTimeStr && calculatedDurationSec <= 0" class="text-xs text-rose-500">
          {{ t('manualLogInvalidTime') }}
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-5 py-3.5 border-t sy-divider flex items-center justify-end gap-2.5 sy-header-bg shrink-0">
        <button @click="handleClose" class="px-4 py-2 rounded-xl sy-btn-secondary text-xs font-medium border transition-colors cursor-pointer">
          {{ t('cancel') }}
        </button>
        <button 
          @click="handleSubmit" 
          :disabled="calculatedDurationSec <= 0 || !selectedDocId"
          class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          {{ t('save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { t } from '../i18n';
import type { TimeLog } from '../models/TimeLog';

const props = defineProps<{
  visible: boolean;
  dateStr: string;
  docOptions: Array<{ id: string; title: string }>;
}>();

const emit = defineEmits<{
  (e: 'save', log: TimeLog): void;
  (e: 'close'): void;
}>();

const selectedDocId = ref('');
const startTimeStr = ref('09:00');
const endTimeStr = ref('10:00');
const noteStr = ref('');

const availableDocs = computed(() => {
  if (props.docOptions && props.docOptions.length > 0) {
    return props.docOptions;
  }
  return [{ id: 'manual-note', title: '通用学习 / 离线任务' }];
});

watch(() => props.visible, (val) => {
  if (val) {
    if (availableDocs.value.length > 0) {
      selectedDocId.value = availableDocs.value[0].id;
    }
    // 默认起始时间设为上一个小时整点
    const now = new Date();
    const curH = now.getHours();
    startTimeStr.value = `${String(Math.max(0, curH - 1)).padStart(2, '0')}:00`;
    endTimeStr.value = `${String(curH).padStart(2, '0')}:00`;
    noteStr.value = '';
  }
}, { immediate: true });

const calculatedDurationSec = computed(() => {
  if (!startTimeStr.value || !endTimeStr.value) return 0;
  const [sh, sm] = startTimeStr.value.split(':').map(Number);
  const [eh, em] = endTimeStr.value.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const diffMins = endMins - startMins;
  return diffMins > 0 ? diffMins * 60 : 0;
});

const handleSubmit = () => {
  if (calculatedDurationSec.value <= 0 || !selectedDocId.value) return;

  const baseDate = new Date(props.dateStr);
  const [sh, sm] = startTimeStr.value.split(':').map(Number);
  const [eh, em] = endTimeStr.value.split(':').map(Number);

  const startTimestamp = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sh, sm).getTime();
  const endTimestamp = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eh, em).getTime();

  const newLog: TimeLog = {
    id: 'manual_' + Math.random().toString(36).substring(2, 12),
    docId: selectedDocId.value,
    startTime: startTimestamp,
    endTime: endTimestamp,
    duration: calculatedDurationSec.value,
    idleTime: 0,
    type: 'manual',
    note: noteStr.value.trim() || undefined
  };

  emit('save', newLog);
  handleClose();
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.sy-summary-modal-mask {
  background-color: var(--st-surface-overlay, rgba(15, 23, 42, 0.45));
  backdrop-filter: blur(4px);
}
.sy-modal-card {
  background-color: var(--st-bg-elevated, #ffffff);
  border: 1px solid var(--st-border-subtle, rgba(226, 232, 240, 0.8));
}
.sy-header-bg {
  background-color: var(--st-bg-surface, #f8fafc);
}
.sy-body-bg {
  background-color: var(--st-bg-base, #ffffff);
}
.sy-divider {
  border-color: var(--st-border-subtle, rgba(226, 232, 240, 0.8));
}
.sy-text-primary {
  color: var(--st-text-primary, #0f172a);
}
.sy-text-secondary {
  color: var(--st-text-secondary, #475569);
}
.sy-option-bg {
  background-color: var(--st-bg-elevated, #ffffff);
  color: var(--st-text-primary, #0f172a);
}
</style>
