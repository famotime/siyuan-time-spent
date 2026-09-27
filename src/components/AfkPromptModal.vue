<template>
  <div v-if="visible" class="fixed bottom-6 right-6 z-[9999] w-88 max-w-[calc(100vw-3rem)] rounded-2xl sy-afk-card p-4 shadow-2xl border border-indigo-500/30 backdrop-blur-md transition-all duration-300">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b sy-divider">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
          <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 class="text-xs font-bold sy-text-primary tracking-wide">
          {{ t('afkPromptTitle') }}
        </h4>
      </div>

      <!-- 倒计时进度徽章 -->
      <span class="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">
        {{ remainingSeconds }}s
      </span>
    </div>

    <!-- Description -->
    <p class="text-xs sy-text-secondary leading-relaxed mb-3">
      {{ t('afkPromptDesc', { minutes: afkMinutes }) }}
    </p>

    <!-- Options -->
    <div class="flex flex-col gap-1.5">
      <!-- 选项 1: 线下学习 / 纸质阅读 -->
      <button 
        @click="handleSelectOffline" 
        class="w-full px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-between cursor-pointer group"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-200 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>{{ t('afkOptionOffline') }}</span>
        </div>
        <span class="text-xs text-indigo-200/80 group-hover:text-white transition-colors font-mono font-tabular">+{{ afkMinutes }}m</span>
      </button>

      <!-- 选项 2: 离桌休息 -->
      <button 
        @click="handleSelectBreak" 
        class="w-full px-3 py-1.5 rounded-xl sy-btn-secondary hover:bg-black/5 dark:hover:bg-white/5 border sy-divider text-xs sy-text-secondary transition-all flex items-center justify-between cursor-pointer"
      >
        <div class="flex items-center gap-2">
          <svg class="w-3.5 h-3.5 text-amber-500 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.829m-2.829 2.829L3 21m2.828-5.464a5 5 0 010-7.072m0 0l2.829 2.829" />
          </svg>
          <span>{{ t('afkOptionBreak') }}</span>
        </div>
        <span class="text-xs sy-text-tertiary">{{ t('statIdleDeducted') }}</span>
      </button>

      <!-- 选项 3: 忽略 -->
      <button 
        @click="handleClose" 
        class="w-full py-1 text-center text-xs sy-text-tertiary hover:sy-text-secondary transition-colors cursor-pointer"
      >
        {{ t('afkOptionDiscard') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { t } from '../i18n';

const props = defineProps<{
  visible: boolean;
  afkDurationSec: number;
  afkStartTime: number;
  afkEndTime: number;
}>();

const emit = defineEmits<{
  (e: 'select-offline', data: { startTime: number; endTime: number; duration: number }): void;
  (e: 'select-break'): void;
  (e: 'close'): void;
}>();

const remainingSeconds = ref(20);
let timer: ReturnType<typeof setInterval> | null = null;

const afkMinutes = computed(() => {
  return Math.max(1, Math.round(props.afkDurationSec / 60));
});

watch(() => props.visible, (val) => {
  if (val) {
    remainingSeconds.value = 20;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      remainingSeconds.value--;
      if (remainingSeconds.value <= 0) {
        handleSelectBreak();
      }
    }, 1000);
  } else {
    if (timer) clearInterval(timer);
    timer = null;
  }
}, { immediate: true });

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const handleSelectOffline = () => {
  emit('select-offline', {
    startTime: props.afkStartTime,
    endTime: props.afkEndTime,
    duration: props.afkDurationSec
  });
  handleClose();
};

const handleSelectBreak = () => {
  emit('select-break');
  handleClose();
};

const handleClose = () => {
  if (timer) clearInterval(timer);
  timer = null;
  emit('close');
};
</script>

<style scoped>
.sy-afk-card {
  background-color: var(--st-bg-elevated, #ffffff);
  color: var(--st-text-primary, #0f172a);
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
.sy-text-tertiary {
  color: var(--st-text-tertiary, #94a3b8);
}
</style>
