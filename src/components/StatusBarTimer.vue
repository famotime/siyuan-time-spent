<template>
  <div class="sy-status-timer-root relative inline-flex items-center text-xs select-none">
    <!-- 常驻状态栏胶囊按钮 -->
    <div 
      @click="togglePopover"
      class="px-2 py-0.5 rounded-full sy-status-capsule flex items-center gap-1.5 cursor-pointer transition-all hover:brightness-110 active:scale-95"
      :class="{
        'is-running': pomodoro.state.value === 'running',
        'is-paused': pomodoro.state.value === 'paused'
      }"
      :title="capsuleTooltip"
    >
      <span class="text-xs shrink-0 select-none">
        <template v-if="pomodoro.state.value === 'running'">🍅</template>
        <template v-else-if="pomodoro.state.value === 'paused'">⏸️</template>
        <template v-else>⏱️</template>
      </span>
      <span class="font-mono font-bold tracking-tight font-tabular">
        {{ displayText }}
      </span>
    </div>

    <!-- 弹出的番茄钟微控制面板 (Popover) -->
    <Teleport to="body">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[9990]" 
        @click="isOpen = false"
      >
        <div 
          class="fixed rounded-2xl p-4 shadow-2xl border sy-divider sy-popover-card w-72 flex flex-col gap-3.5 z-[9991]"
          :style="popoverStyle"
          @click.stop
        >
          <!-- Popover Header -->
          <div class="flex items-center justify-between pb-2 border-b sy-divider">
            <div class="flex items-center gap-2">
              <span class="text-sm">🍅</span>
              <span class="text-xs font-bold sy-text-primary tracking-wide">{{ t('pomodoroTimerTitle') }}</span>
            </div>
            <button @click="isOpen = false" class="sy-text-tertiary hover:sy-text-primary transition-colors cursor-pointer">
              <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Case 1: 正在运行或已暂停 -->
          <div v-if="pomodoro.state.value === 'running' || pomodoro.state.value === 'paused'" class="flex flex-col items-center gap-3">
            <div class="text-3xl font-black font-mono font-tabular tracking-wider" :class="pomodoro.state.value === 'running' ? 'text-amber-500 animate-pulse' : 'text-slate-400'">
              {{ timerDisplayText }}
            </div>
            <div class="text-xs sy-text-secondary truncate max-w-full px-2 text-center">
              {{ currentDocName }}
            </div>

            <div class="flex items-center gap-2 w-full mt-1">
              <button 
                v-if="pomodoro.state.value === 'running'"
                @click="pomodoro.pause()" 
                class="flex-1 py-1.5 rounded-xl bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 font-semibold text-xs transition-colors cursor-pointer"
              >
                {{ t('pomodoroPause') }}
              </button>
              <button 
                v-else
                @click="pomodoro.resume()" 
                class="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
              >
                {{ t('pomodoroResume') }}
              </button>

              <button 
                @click="pomodoro.finishEarly()" 
                class="py-1.5 px-3 rounded-xl border sy-divider hover:border-emerald-500 hover:text-emerald-500 text-xs transition-colors cursor-pointer"
                :title="t('pomodoroFinish')"
              >
                {{ t('pomodoroFinish') }}
              </button>
              <button 
                @click="pomodoro.discard()" 
                class="py-1.5 px-2.5 rounded-xl sy-text-tertiary hover:text-rose-500 text-xs transition-colors cursor-pointer"
                :title="t('pomodoroCancel')"
              >
                {{ t('pomodoroCancel') }}
              </button>
            </div>
          </div>

          <!-- Case 2: 空闲态 (选择冲刺时长) -->
          <div v-else class="flex flex-col gap-3">
            <div class="text-xs sy-text-secondary">
              选择专注冲刺目标：
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <button 
                v-for="min in [25, 45, 60]" 
                :key="min"
                @click="selectedMinutes = min; isStopwatchMode = false"
                class="py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                :class="!isStopwatchMode && selectedMinutes === min ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'sy-btn-secondary hover:border-indigo-500'"
              >
                <span>{{ min }}</span>
                <span class="text-[10px] font-normal opacity-80">min</span>
              </button>
              <button 
                @click="isStopwatchMode = true"
                class="py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                :class="isStopwatchMode ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'sy-btn-secondary hover:border-indigo-500'"
              >
                <span>秒表</span>
                <span class="text-[10px] font-normal opacity-80">正向</span>
              </button>
            </div>

            <button 
              @click="handleStart"
              class="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
            >
              <span>{{ t('pomodoroStart') }}</span>
              <span class="font-mono text-[10px] opacity-90">({{ isStopwatchMode ? '正计时' : `${selectedMinutes}m` }})</span>
            </button>
          </div>

          <!-- Popover Footer -->
          <div class="pt-2 border-t sy-divider flex items-center justify-between text-xs sy-text-secondary">
            <button @click="openDashboard" class="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1">
              <span>打开看板</span>
              <svg class="w-3 h-3 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <span class="text-slate-400/80 font-mono text-[10px]">源时记 v0.9.0</span>
          </div>

        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type TimeSpentPlugin from '../index';
import { PomodoroManager } from '../utils/pomodoro';
import { docTitles } from '../utils/title-cache';
import { t } from '../i18n';

const props = defineProps<{
  plugin: TimeSpentPlugin;
  pomodoro: PomodoroManager;
}>();

const isOpen = ref(false);
const selectedMinutes = ref(25);
const isStopwatchMode = ref(false);
const popoverX = ref(window.innerWidth - 300);
const popoverY = ref(window.innerHeight - 240);

const popoverStyle = computed(() => {
  return {
    right: '16px',
    bottom: '40px'
  };
});

const currentDocName = computed(() => {
  const docId = props.pomodoro.currentDocId.value || props.plugin.timeTracker?.getCurrentDocId();
  if (!docId) return '未指定笔记';
  return docTitles.value[docId] || docId;
});

const timerDisplayText = computed(() => {
  if (props.pomodoro.isStopwatch.value) {
    const s = props.pomodoro.elapsedSeconds.value;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  } else {
    const s = props.pomodoro.remainingSeconds.value;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
});

const displayText = computed(() => {
  if (props.pomodoro.state.value === 'running') {
    return timerDisplayText.value;
  }
  if (props.pomodoro.state.value === 'paused') {
    return `${timerDisplayText.value} (暂停)`;
  }
  return '源时记';
});

const capsuleTooltip = computed(() => {
  if (props.pomodoro.state.value === 'running') {
    return `番茄钟冲刺中：${timerDisplayText.value} - 点击管理`;
  }
  return '源时记 · 点击开启专注番茄钟';
});

const togglePopover = () => {
  isOpen.value = !isOpen.value;
};

const handleStart = () => {
  if (isStopwatchMode.value) {
    props.pomodoro.startStopwatch();
  } else {
    props.pomodoro.start(selectedMinutes.value);
  }
};

const openDashboard = () => {
  isOpen.value = false;
  props.plugin.openDashboard();
};
</script>

<style scoped>
.sy-status-capsule {
  background-color: var(--st-bg-surface, rgba(148, 163, 184, 0.1));
  color: var(--st-text-primary, #475569);
  border: 1px solid var(--st-border-subtle, rgba(148, 163, 184, 0.2));
}
.sy-status-capsule.is-running {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2));
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}
.sy-status-capsule.is-paused {
  background-color: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}
.sy-popover-card {
  background-color: var(--st-bg-elevated, #ffffff);
  border-color: var(--st-border-subtle, rgba(226, 232, 240, 0.8));
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
.sy-btn-secondary {
  background-color: var(--st-bg-surface, #f8fafc);
  color: var(--st-text-secondary, #475569);
  border-color: var(--st-border-subtle, rgba(226, 232, 240, 0.8));
}
</style>
