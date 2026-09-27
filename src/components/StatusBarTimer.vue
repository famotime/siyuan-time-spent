<template>
  <div class="sy-status-timer-root relative inline-flex items-center text-xs select-none">
    <!-- 常驻状态栏胶囊按钮 (清退 Emoji，采用 1.75px 线框矢量图标) -->
    <div 
      ref="capsuleEl"
      @click="togglePopover"
      class="px-2.5 py-1 rounded-full sy-pomo-capsule flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95"
      :class="{
        'is-running': pomodoro.state.value === 'running',
        'is-paused': pomodoro.state.value === 'paused',
        'is-break': pomodoro.state.value === 'break'
      }"
      :title="capsuleTooltip"
    >
      <!-- 状态图标 -->
      <span class="w-3.5 h-3.5 flex items-center justify-center shrink-0">
        <!-- 运行中：极简番茄/靶心线框图标 -->
        <svg 
          v-if="pomodoro.state.value === 'running'" 
          class="w-3.5 h-3.5 sy-wire-icon animate-pulse" 
          style="fill: none !important;" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="1.75"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>

        <!-- 暂停中：双竖线线框图标 -->
        <svg 
          v-else-if="pomodoro.state.value === 'paused'" 
          class="w-3.5 h-3.5 sy-wire-icon" 
          style="fill: none !important;" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="1.75"
        >
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>

        <!-- 休息中：咖啡杯线框图标 -->
        <svg 
          v-else-if="pomodoro.state.value === 'break'" 
          class="w-3.5 h-3.5 sy-wire-icon text-teal-500" 
          style="fill: none !important;" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="1.75"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>

        <!-- 待机态：极简时钟图标 -->
        <svg 
          v-else 
          class="w-3.5 h-3.5 sy-wire-icon opacity-80" 
          style="fill: none !important;" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="1.75"
        >
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
        </svg>
      </span>

      <!-- 时间与状态文本 -->
      <span class="font-mono font-bold tracking-tight font-tabular">
        {{ capsuleDisplayText }}
      </span>
    </div>

    <!-- 弹出的番茄钟微控制面板 (Popover) -->
    <Teleport to="body">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[9990] bg-black/10 dark:bg-black/35 backdrop-blur-[1.5px] transition-opacity" 
        @click="closePopover"
      >
        <div 
          class="fixed rounded-2xl p-4 sy-pomo-card w-80 flex flex-col gap-3.5 z-[9991] border select-none transition-all"
          :style="popoverStyle"
          @click.stop
        >
          <!-- 1. Popover Header -->
          <div class="flex items-center justify-between pb-2 border-b border-subtle">
            <div class="flex items-center gap-2">
              <span class="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <svg class="w-4 h-4 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
              <span class="text-xs font-bold text-primary tracking-wide">{{ t('pomodoroTimerTitle') }}</span>

              <!-- 状态徽章 -->
              <span 
                v-if="pomodoro.state.value !== 'idle'" 
                class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                :class="{
                  'bg-amber-500/15 text-amber-600 dark:text-amber-400': pomodoro.state.value === 'running',
                  'bg-slate-500/15 text-slate-600 dark:text-slate-400': pomodoro.state.value === 'paused',
                  'bg-teal-500/15 text-teal-600 dark:text-teal-400': pomodoro.state.value === 'break'
                }"
              >
                {{ statusBadgeText }}
              </span>
            </div>

            <!-- 关闭按钮 -->
            <button 
              @click="closePopover" 
              class="text-tertiary hover:text-primary transition-colors cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- 2. 当前关联笔记小条 -->
          <div class="flex items-center gap-1.5 text-xs text-secondary px-2 py-1.5 rounded-lg bg-subtle truncate" :title="currentDocName">
            <svg class="w-3.5 h-3.5 shrink-0 opacity-70" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span class="truncate flex-1 font-medium">{{ currentDocName }}</span>
          </div>

          <!-- 3. 核心表盘与环形进度条 (SVG Radial Progress) -->
          <div class="flex flex-col items-center justify-center py-2 relative">
            <div class="relative w-32 h-32 flex items-center justify-center">
              <!-- SVG 环形进度槽 -->
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <!-- 背景圆轨 -->
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke-width="5"
                  stroke="currentColor"
                  class="text-slate-200 dark:text-slate-800/80"
                  style="fill: none !important;"
                />
                <!-- 动态高亮进度弧 (平滑过渡) -->
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke-width="5"
                  stroke-linecap="round"
                  stroke="currentColor"
                  :class="progressArcColorClass"
                  :stroke-dasharray="326.72"
                  :stroke-dashoffset="dashOffset"
                  style="fill: none !important; transition: stroke-dashoffset 0.4s ease;"
                />
              </svg>

              <!-- 表盘中央大字 -->
              <div class="absolute inset-0 flex flex-col items-center justify-center select-text">
                <div 
                  class="text-2xl font-black font-mono font-tabular tracking-wide transition-colors"
                  :class="timerTextColorClass"
                >
                  {{ timerDisplayText }}
                </div>
                <div class="text-[11px] text-tertiary mt-0.5 font-medium">
                  {{ subDisplayText }}
                </div>
              </div>
            </div>
          </div>

          <!-- 4. 交互操作区：Case A: 待机态 (选择模式与设定自定义时间) -->
          <div v-if="pomodoro.state.value === 'idle'" class="flex flex-col gap-3">
            <!-- 模式分段切换胶囊 -->
            <div class="grid grid-cols-2 p-1 rounded-xl bg-subtle text-xs font-semibold">
              <button 
                @click="isStopwatchMode = false"
                class="py-1 rounded-lg transition-all text-center cursor-pointer"
                :class="!isStopwatchMode ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'"
              >
                {{ t('pomodoroModeCountdown') }}
              </button>
              <button 
                @click="isStopwatchMode = true"
                class="py-1 rounded-lg transition-all text-center cursor-pointer"
                :class="isStopwatchMode ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'"
              >
                {{ t('pomodoroStopwatch') }}
              </button>
            </div>

            <!-- 倒计时模式专属配置 -->
            <template v-if="!isStopwatchMode">
              <!-- 快捷步长预设 -->
              <div class="grid grid-cols-4 gap-1.5">
                <button 
                  v-for="min in [15, 25, 45, 60]" 
                  :key="min"
                  @click="selectedMinutes = min"
                  class="py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                  :class="selectedMinutes === min 
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black' 
                    : 'border-subtle bg-surface text-secondary hover:border-slate-400 dark:hover:border-slate-600'"
                >
                  <span>{{ min }}</span>
                  <span class="text-[9px] font-normal opacity-70">m</span>
                </button>
              </div>

              <!-- 精密步进器与自由自定义时间输入 -->
              <div class="p-2 rounded-xl border border-subtle bg-surface flex flex-col gap-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-secondary font-medium">{{ t('pomodoroCustomDuration') }}</span>
                  <div class="flex items-center gap-1 font-mono font-bold">
                    <input 
                      type="number"
                      v-model.number="selectedMinutes"
                      min="1"
                      max="180"
                      class="w-12 text-center text-sm font-bold bg-subtle rounded-md border border-subtle focus:outline-none focus:border-indigo-500"
                    />
                    <span class="text-secondary text-[11px]">{{ t('pomodoroMinutesUnit') }}</span>
                  </div>
                </div>

                <!-- 滑块与步进按钮联动 -->
                <div class="flex items-center gap-2">
                  <button 
                    @click="adjustMinutes(-5)"
                    class="p-1 rounded-lg sy-pomo-stepper-btn border cursor-pointer shrink-0"
                    :title="t('pomodoroDecrease')"
                  >
                    <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <input 
                    type="range"
                    v-model.number="selectedMinutes"
                    min="5"
                    max="120"
                    step="5"
                    class="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-subtle rounded-lg"
                  />

                  <button 
                    @click="adjustMinutes(5)"
                    class="p-1 rounded-lg sy-pomo-stepper-btn border cursor-pointer shrink-0"
                    :title="t('pomodoroIncrease')"
                  >
                    <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>

            <!-- 启动按钮 (克制高级质感，拒绝廉价 AI Slop 渐变) -->
            <button 
              @click="handleStart"
              class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-0.5"
            >
              <svg class="w-3.5 h-3.5 sy-wire-icon text-white" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{{ isStopwatchMode ? t('pomodoroStart') + ' (秒表)' : `${t('pomodoroStart')} (${selectedMinutes}m)` }}</span>
            </button>
          </div>

          <!-- 4. 交互操作区：Case B: 正在专注或已暂停 -->
          <div v-else-if="pomodoro.state.value === 'running' || pomodoro.state.value === 'paused'" class="flex flex-col gap-2.5">
            <!-- 正在确认放弃时显示的防误触安全卡片 -->
            <div v-if="isConfirmingDiscard" class="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col gap-2 animate-fadeIn">
              <div class="text-xs font-bold text-rose-600 dark:text-rose-400">
                {{ t('pomodoroDiscardConfirmTitle') }}
              </div>
              <div class="text-[11px] text-secondary">
                {{ t('pomodoroDiscardConfirmDesc') }}
              </div>
              <div class="flex items-center gap-2 mt-1">
                <button 
                  @click="doDiscard"
                  class="flex-1 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {{ t('pomodoroConfirmDiscard') }}
                </button>
                <button 
                  @click="isConfirmingDiscard = false"
                  class="flex-1 py-1 rounded-lg border border-subtle hover:bg-surface text-secondary text-xs transition-colors cursor-pointer"
                >
                  {{ t('pomodoroCancelDiscard') }}
                </button>
              </div>
            </div>

            <!-- 常规操作行 -->
            <div v-else class="flex flex-col gap-2">
              <div class="flex items-center gap-2 w-full">
                <!-- 暂停 / 继续按钮 -->
                <button 
                  v-if="pomodoro.state.value === 'running'"
                  @click="pomodoro.pause()" 
                  class="flex-1 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  <span>{{ t('pomodoroPause') }}</span>
                </button>
                <button 
                  v-else
                  @click="pomodoro.resume()" 
                  class="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5 sy-wire-icon text-white" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{{ t('pomodoroResume') }}</span>
                </button>

                <!-- 提前达成按钮 -->
                <button 
                  @click="pomodoro.finishEarly()" 
                  class="py-2 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                  :title="t('pomodoroFinish')"
                >
                  <svg class="w-3.5 h-3.5 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{{ t('pomodoroFinish') }}</span>
                </button>
              </div>

              <!-- 放弃按钮 (置于次级操作区，防误触) -->
              <div class="flex justify-end">
                <button 
                  @click="isConfirmingDiscard = true" 
                  class="text-[11px] text-tertiary hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded"
                  :title="t('pomodoroCancel')"
                >
                  <svg class="w-3 h-3 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>{{ t('pomodoroCancel') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 4. 交互操作区：Case C: 短休息阶段 (Break Phase) -->
          <div v-else-if="pomodoro.state.value === 'break'" class="flex flex-col gap-2.5">
            <div class="p-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-xs flex flex-col gap-1">
              <span class="font-bold text-teal-600 dark:text-teal-400">{{ t('pomodoroBreakTitle') }}</span>
              <span class="text-[11px] text-secondary">{{ t('pomodoroBreakMsg') }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="pomodoro.skipBreak()"
                class="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{{ t('pomodoroSkipBreak') }}</span>
              </button>
              <button 
                @click="pomodoro.extendBreak(5)"
                class="py-2 px-3 rounded-xl border border-subtle hover:bg-surface text-secondary font-medium text-xs transition-all cursor-pointer"
                title="再休息 5 分钟"
              >
                <span>+5m</span>
              </button>
            </div>
          </div>

          <!-- 5. Popover Footer -->
          <div class="pt-2 border-t border-subtle flex items-center justify-between text-xs text-secondary">
            <button 
              @click="openDashboard" 
              class="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>{{ t('pomodoroOpenDashboard') }}</span>
              <svg class="w-3 h-3 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <span class="text-tertiary font-mono text-[10px]">SiYuan Time Spent</span>
          </div>

        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type TimeSpentPlugin from '../index';
import { PomodoroManager } from '../utils/pomodoro';
import { docTitles } from '../utils/title-cache';
import { t } from '../i18n';

const props = defineProps<{
  plugin: TimeSpentPlugin;
  pomodoro: PomodoroManager;
}>();

const capsuleEl = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const selectedMinutes = ref(props.plugin.settings?.pomodoroWorkMinutes || 25);
const isStopwatchMode = ref(false);
const isConfirmingDiscard = ref(false);

const popoverStyle = ref({
  right: '16px',
  bottom: '42px'
});

const currentDocName = computed(() => {
  const docId = props.pomodoro.currentDocId.value || props.plugin.timeTracker?.getCurrentDocId();
  if (!docId) return t('pomodoroNoDoc');
  return docTitles.value[docId] || docId;
});

const statusBadgeText = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'running') return props.pomodoro.isStopwatch.value ? t('pomodoroStopwatch') : t('pomodoroWorkSession');
  if (state === 'paused') return t('pomodoroStatusPaused');
  if (state === 'break') return t('pomodoroStatusBreak');
  return '';
});

// 计算大字主时间
const timerDisplayText = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'idle') {
    if (isStopwatchMode.value) return '00:00';
    return `${String(selectedMinutes.value).padStart(2, '0')}:00`;
  }

  if (state === 'break') {
    const s = props.pomodoro.breakRemainingSeconds.value;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

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

// 表盘副标文字
const subDisplayText = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'idle') {
    return isStopwatchMode.value ? t('pomodoroStopwatch') : `${t('pomodoroTarget')} ${selectedMinutes.value}m`;
  }
  if (state === 'break') {
    return t('pomodoroInBreak');
  }
  if (state === 'paused') {
    return t('pomodoroStatusPaused');
  }
  return props.pomodoro.isStopwatch.value ? t('pomodoroStopwatch') : `${t('pomodoroTarget')} ${props.pomodoro.targetMinutes.value}m`;
});

// 状态栏胶囊内文案
const capsuleDisplayText = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'running') {
    return timerDisplayText.value;
  }
  if (state === 'paused') {
    return `${timerDisplayText.value} (${t('pomodoroPause')})`;
  }
  if (state === 'break') {
    return `${t('pomodoroBreakSession')} ${timerDisplayText.value}`;
  }
  return '源时记';
});

// 胶囊悬浮提示
const capsuleTooltip = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'running') {
    return `${t('pomodoroTimerTitle')}: ${timerDisplayText.value} - 点击管理`;
  }
  if (state === 'break') {
    return `${t('pomodoroBreakSession')}: ${timerDisplayText.value} - 点击查看`;
  }
  return `${t('pomodoroTimerTitle')} · 点击开启专注`;
});

// 表盘大字颜色类（严格遵从双模 WCAG 2.2 对比度）
const timerTextColorClass = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'running') {
    return 'text-amber-600 dark:text-amber-400';
  }
  if (state === 'break') {
    return 'text-teal-600 dark:text-teal-400';
  }
  if (state === 'paused') {
    return 'text-slate-500 dark:text-slate-400';
  }
  return 'text-primary';
});

// 表盘圆弧高亮色
const progressArcColorClass = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'running') {
    return 'text-amber-500';
  }
  if (state === 'break') {
    return 'text-teal-500';
  }
  if (state === 'paused') {
    return 'text-slate-400 dark:text-slate-500';
  }
  return 'text-indigo-500/40';
});

// SVG 环形进度偏移量 (周长 2 * PI * 52 ≈ 326.72)
const dashOffset = computed(() => {
  const circumference = 326.72;
  const state = props.pomodoro.state.value;

  if (state === 'idle') {
    return 0; // 满环或底环
  }

  if (state === 'break') {
    const total = props.pomodoro.breakTotalSeconds.value || 300;
    const remaining = props.pomodoro.breakRemainingSeconds.value;
    const progress = Math.max(0, Math.min(1, remaining / total));
    return circumference * (1 - progress);
  }

  if (props.pomodoro.isStopwatch.value) {
    // 秒表按每 60 秒循环一圈
    const s = props.pomodoro.elapsedSeconds.value % 60;
    return circumference * (1 - s / 60);
  }

  const total = props.pomodoro.totalSeconds.value || (props.pomodoro.targetMinutes.value * 60) || 1500;
  const remaining = props.pomodoro.remainingSeconds.value;
  const progress = Math.max(0, Math.min(1, remaining / total));
  return circumference * (1 - progress);
});

// 打开与智能锚定位置
const togglePopover = async () => {
  if (isOpen.value) {
    isOpen.value = false;
    isConfirmingDiscard.value = false;
    return;
  }

  updatePopoverPosition();
  isOpen.value = true;
  isConfirmingDiscard.value = false;

  await nextTick();
  updatePopoverPosition();
};

const updatePopoverPosition = () => {
  if (!capsuleEl.value) return;
  const rect = capsuleEl.value.getBoundingClientRect();
  const popoverWidth = 320;
  const margin = 12;

  const bottom = Math.max(margin, window.innerHeight - rect.top + 8);
  let right = window.innerWidth - rect.right;
  if (right < margin) right = margin;
  if (right + popoverWidth > window.innerWidth - margin) {
    right = Math.max(margin, window.innerWidth - popoverWidth - margin);
  }

  popoverStyle.value = {
    right: `${right}px`,
    bottom: `${bottom}px`
  };
};

const closePopover = () => {
  isOpen.value = false;
  isConfirmingDiscard.value = false;
};

const adjustMinutes = (delta: number) => {
  let val = (selectedMinutes.value || 25) + delta;
  if (val < 1) val = 1;
  if (val > 180) val = 180;
  selectedMinutes.value = val;
};

const handleStart = () => {
  if (isStopwatchMode.value) {
    props.pomodoro.startStopwatch();
  } else {
    props.pomodoro.start(selectedMinutes.value);
  }
};

const doDiscard = () => {
  props.pomodoro.discard();
  isConfirmingDiscard.value = false;
};

const openDashboard = () => {
  closePopover();
  props.plugin.openDashboard();
};
</script>

<style scoped>
/* 语义 Token 辅助映射 */
.text-primary {
  color: var(--st-text-primary, #0f172a);
}
.text-secondary {
  color: var(--st-text-secondary, #475569);
}
.text-tertiary {
  color: var(--st-text-tertiary, #94a3b8);
}
.bg-surface {
  background-color: var(--st-bg-surface, #ffffff);
}
.bg-subtle {
  background-color: var(--st-bg-subtle, rgba(148, 163, 184, 0.08));
}
.border-subtle {
  border-color: var(--st-border-subtle, rgba(148, 163, 184, 0.2));
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
