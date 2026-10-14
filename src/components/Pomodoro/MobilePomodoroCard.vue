<template>
  <div class="mobile-pomodoro-card rounded-2xl p-4 sy-card shadow-sm border sy-divider">
    <!-- Header: Title & State Badge -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" :class="stateColorDot"></span>
        <span class="text-xs font-bold sy-text-primary tracking-wide">
          {{ t('pomodoro') }}
        </span>
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full font-mono font-medium" :class="stateBadgeClass">
        {{ stateLabel }}
      </span>
    </div>

    <!-- Mode 1: Idle (准备开始) -->
    <div v-if="state === 'idle'" class="flex flex-col gap-3">
      <!-- Duration Preset Pills -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs sy-text-secondary">{{ t('pomodoroCustomDuration') }}:</span>
        <div class="flex items-center gap-1.5">
          <button
            v-for="min in [15, 25, 45, 60]"
            :key="min"
            @click="selectedMin = min"
            class="px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition-all cursor-pointer"
            :class="selectedMin === min ? 'bg-indigo-600 text-white shadow-xs' : 'sy-btn-secondary sy-text-secondary hover:sy-text-primary'"
          >
            {{ min }}m
          </button>
        </div>
      </div>

      <!-- Start Button -->
      <button
        @click="handleStart"
        class="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg class="w-4 h-4 sy-wire-icon text-white" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>{{ t('pomodoroStart') }}</span>
      </button>
    </div>

    <!-- Mode 2: Running or Paused (专注进行中 / 暂停) -->
    <div v-else-if="state === 'running' || state === 'paused'" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <!-- Countdown Clock -->
        <div class="flex flex-col">
          <div class="text-2xl font-black font-mono tracking-wider font-tabular sy-text-primary">
            {{ formattedTimer }}
          </div>
          <span class="text-xs sy-text-secondary mt-0.5">
            {{ pomodoro.isStopwatch.value ? t('pomodoroStopwatch') : `${t('focusGoalTitle')} ${pomodoro.targetMinutes.value} ${t('pomodoroMinutesUnit')}` }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1.5">
          <!-- Pause / Resume -->
          <button
            @click="togglePause"
            class="px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1"
            :class="state === 'paused' ? 'bg-emerald-600 text-white shadow-xs' : 'sy-btn-secondary sy-text-primary'"
          >
            <svg v-if="state === 'paused'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            <span>{{ state === 'paused' ? t('pomodoroResume') : t('pomodoroPause') }}</span>
          </button>

          <!-- Finish Early -->
          <button
            @click="handleFinish"
            class="px-2.5 py-1.5 text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-500 rounded-xl transition-all cursor-pointer"
            :title="t('pomodoroFinish')"
          >
            {{ t('pomodoroFinish') }}
          </button>

          <!-- Discard -->
          <button
            @click="handleDiscard"
            class="p-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
            :title="t('pomodoroCancel')"
          >
            <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Linear Progress Bar -->
      <div v-if="!pomodoro.isStopwatch.value" class="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
        <div
          class="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-300 rounded-full"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- Mode 3: Break (休息中) -->
    <div v-else-if="state === 'break'" class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <div class="text-2xl font-black font-mono tracking-wider font-tabular text-emerald-500">
            {{ formattedBreakTimer }}
          </div>
          <span class="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
            {{ t('pomodoroBreakTitle') }}
          </span>
        </div>

        <button
          @click="handleSkipBreak"
          class="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
        >
          {{ t('pomodoroSkipBreak') }}
        </button>
      </div>

      <!-- Break Progress Bar -->
      <div class="w-full bg-emerald-500/15 h-1.5 rounded-full overflow-hidden">
        <div
          class="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          :style="{ width: `${breakProgressPercent}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PomodoroManager } from '../../utils/pomodoro';
import { t } from '../../i18n';

const props = defineProps<{
  pomodoro: PomodoroManager;
}>();

const selectedMin = ref(25);

const state = computed(() => props.pomodoro?.state.value ?? 'idle');

const stateColorDot = computed(() => {
  switch (state.value) {
    case 'running': return 'bg-indigo-500 animate-pulse';
    case 'paused': return 'bg-amber-500';
    case 'break': return 'bg-emerald-500 animate-pulse';
    default: return 'bg-gray-400';
  }
});

const stateBadgeClass = computed(() => {
  switch (state.value) {
    case 'running': return 'bg-indigo-500/15 text-indigo-500';
    case 'paused': return 'bg-amber-500/15 text-amber-500';
    case 'break': return 'bg-emerald-500/15 text-emerald-500';
    default: return 'bg-black/5 dark:bg-white/5 sy-text-tertiary';
  }
});

const stateLabel = computed(() => {
  switch (state.value) {
    case 'running': return t('statusTimerTracking');
    case 'paused': return t('pomodoroStatusPaused');
    case 'break': return t('pomodoroInBreak');
    default: return t('statusTimerIdle');
  }
});

const formattedTimer = computed(() => {
  const sec = props.pomodoro.remainingSeconds.value;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const formattedBreakTimer = computed(() => {
  const sec = props.pomodoro.breakRemainingSeconds.value;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const progressPercent = computed(() => {
  const total = props.pomodoro.totalSeconds.value || 1;
  const remaining = props.pomodoro.remainingSeconds.value;
  const elapsed = Math.max(0, total - remaining);
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

const breakProgressPercent = computed(() => {
  const total = props.pomodoro.breakTotalSeconds.value || 1;
  const remaining = props.pomodoro.breakRemainingSeconds.value;
  const elapsed = Math.max(0, total - remaining);
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

const handleStart = () => {
  props.pomodoro?.start(selectedMin.value);
};

const togglePause = () => {
  if (state.value === 'running') {
    props.pomodoro?.pause();
  } else if (state.value === 'paused') {
    props.pomodoro?.resume();
  }
};

const handleFinish = () => {
  props.pomodoro?.finishEarly();
};

const handleDiscard = () => {
  props.pomodoro?.discard();
};

const handleSkipBreak = () => {
  props.pomodoro?.skipBreak();
};
</script>

<style scoped>
.mobile-pomodoro-card {
  background-color: var(--st-card-bg, var(--b3-theme-surface, rgba(255, 255, 255, 0.05)));
  transition: all 200ms ease;
}
</style>
