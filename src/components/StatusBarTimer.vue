<template>
  <div class="sy-status-timer-root relative inline-flex items-center text-xs select-none">
    <!-- 常驻状态栏灵动微胶囊 (Ambient Micro-Capsule) -->
    <div 
      ref="capsuleEl"
      @click="togglePopover"
      class="px-2.5 py-1 rounded-full sy-pomo-capsule flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95"
      :class="{
        'is-running': pomodoro.state.value === 'running',
        'is-paused': pomodoro.state.value === 'paused',
        'is-break': pomodoro.state.value === 'break'
      }"
      :style="capsuleStyle"
      :title="capsuleTooltip"
    >
      <!-- 16px 矢量微进度环 (Peripheral Micro-Dial) -->
      <span class="w-4 h-4 flex items-center justify-center shrink-0 relative">
        <svg class="w-4 h-4 transform -rotate-90" viewBox="0 0 24 24">
          <!-- 微底轨 -->
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke-width="2.2"
            stroke="currentColor"
            class="opacity-20"
            style="fill: none !important;"
          />
          <!-- 动态微进度弧 -->
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke="var(--b3-theme-primary)"
            :stroke-dasharray="56.54"
            :stroke-dashoffset="56.54 * (1 - currentProgress)"
            class="transition-all duration-300"
            style="fill: none !important;"
          />
        </svg>

        <!-- 运行中心流呼吸光点 -->
        <span 
          v-if="pomodoro.state.value === 'running'" 
          class="absolute w-1.5 h-1.5 rounded-full bg-primary animate-ping opacity-75"
        ></span>
      </span>

      <!-- 等宽数字与状态文本 -->
      <span class="font-mono font-bold tracking-tight font-tabular">
        {{ capsuleDisplayText }}
      </span>
    </div>

    <!-- 弹出的番茄钟微控制面板 (Popover) -->
    <Teleport to="body">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[9990] bg-black/15 dark:bg-black/40 backdrop-blur-[2px] transition-opacity" 
        @click="closePopover"
      >
        <div 
          class="fixed rounded-2xl p-4 sy-pomo-card w-84 flex flex-col gap-3.5 z-[9991] border select-none transition-all shadow-xl"
          :style="popoverStyle"
          @click.stop
        >
          <!-- 1. Popover Header: 标题、风格切换药丸、关闭按钮 -->
          <div class="flex items-center justify-between pb-2 border-b border-subtle">
            <div class="flex items-center gap-1.5">
              <span class="p-1 rounded-lg bg-primary-subtle text-primary flex items-center justify-center">
                <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
                  'bg-primary-subtle text-primary': pomodoro.state.value === 'running',
                  'bg-subtle text-secondary': pomodoro.state.value === 'paused',
                  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400': pomodoro.state.value === 'break'
                }"
              >
                {{ statusBadgeText }}
              </span>
            </div>

            <!-- 右侧：皮肤形态极简分段器与关闭 -->
            <div class="flex items-center gap-1">
              <!-- 形态切换极简分段开关 -->
              <div class="flex items-center bg-subtle p-0.5 rounded-lg text-[10px] font-medium" :title="t('pomodoroSwitchTheme')">
                <button 
                  v-for="skin in skinList" 
                  :key="skin.key"
                  @click="switchThemeStyle(skin.key)"
                  class="px-1.5 py-0.5 rounded cursor-pointer transition-all"
                  :class="currentThemeStyle === skin.key ? 'bg-surface text-primary font-bold shadow-xs' : 'text-tertiary hover:text-primary'"
                >
                  {{ skin.label }}
                </button>
              </div>

              <!-- 关闭按钮 -->
              <button 
                @click="closePopover" 
                class="text-tertiary hover:text-primary transition-colors cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
              >
                <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 2. 当前关联笔记小条 (知识沉淀隐喻) -->
          <div class="flex items-center gap-1.5 text-xs text-secondary px-2.5 py-1.5 rounded-xl bg-subtle truncate" :title="currentDocName">
            <svg class="w-3.5 h-3.5 shrink-0 opacity-70 text-primary" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span class="truncate flex-1 font-medium">{{ currentDocName }}</span>
          </div>

          <!-- 3. 核心表盘区 (根据当前选中的交互形态动态渲染) -->
          <div class="flex flex-col items-center justify-center py-1 relative">
            <ZenFlowDial
              v-if="currentThemeStyle === 'zen'"
              :progress="currentProgress"
              :timer-display-text="timerDisplayText"
              :sub-display-text="subDisplayText"
              :state="pomodoro.state.value"
            />
            <ChronoDial
              v-else-if="currentThemeStyle === 'chrono'"
              :progress="currentProgress"
              :timer-display-text="timerDisplayText"
              :sub-display-text="subDisplayText"
              :state="pomodoro.state.value"
            />
            <HourglassDial
              v-else
              :progress="currentProgress"
              :timer-display-text="timerDisplayText"
              :sub-display-text="subDisplayText"
              :state="pomodoro.state.value"
            />
          </div>

          <!-- 4. 交互操作区：待机态 (选择模式、时长预设与入定启动) -->
          <div v-if="pomodoro.state.value === 'idle'" class="flex flex-col gap-2.5">
            <!-- 模式分段切换胶囊 -->
            <div class="grid grid-cols-2 p-1 rounded-xl bg-subtle text-xs font-semibold">
              <button 
                @click="isStopwatchMode = false"
                class="py-1 rounded-lg transition-all text-center cursor-pointer"
                :class="!isStopwatchMode ? 'bg-surface text-primary shadow-xs' : 'text-secondary hover:text-primary'"
              >
                {{ t('pomodoroModeCountdown') }}
              </button>
              <button 
                @click="isStopwatchMode = true"
                class="py-1 rounded-lg transition-all text-center cursor-pointer"
                :class="isStopwatchMode ? 'bg-surface text-primary shadow-xs' : 'text-secondary hover:text-primary'"
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
                  class="py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                  :style="selectedMinutes === min ? activePresetStyle : inactivePresetStyle"
                >
                  <span>{{ min }}</span>
                  <span class="text-[9px] font-normal opacity-70">m</span>
                </button>
              </div>

              <!-- 阻尼微调滑块与步进 -->
              <div class="p-2 rounded-xl border border-subtle bg-surface flex flex-col gap-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-secondary font-medium">{{ t('pomodoroCustomDuration') }}</span>
                  <div class="flex items-center gap-1 font-mono font-bold">
                    <input 
                      type="number"
                      v-model.number="selectedMinutes"
                      min="1"
                      max="180"
                      class="w-12 text-center text-sm font-bold bg-subtle rounded-md border border-subtle focus:outline-none"
                    />
                    <span class="text-secondary text-[11px]">{{ t('pomodoroMinutesUnit') }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    @click="adjustMinutes(-5)"
                    class="p-1 rounded-lg border border-subtle hover:bg-subtle cursor-pointer shrink-0"
                    :title="t('pomodoroDecrease')"
                  >
                    <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <input 
                    type="range"
                    v-model.number="selectedMinutes"
                    min="5"
                    max="120"
                    step="5"
                    class="flex-1 cursor-pointer h-1.5 bg-subtle rounded-lg accent-current text-primary"
                  />

                  <button 
                    @click="adjustMinutes(5)"
                    class="p-1 rounded-lg border border-subtle hover:bg-subtle cursor-pointer shrink-0"
                    :title="t('pomodoroIncrease')"
                  >
                    <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </template>

            <!-- 启动入定按钮 (思源原生主题色全宽按钮) -->
            <button 
              @click="handleStart"
              class="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mt-0.5 active:scale-[0.98]"
              :style="primaryBtnStyle"
            >
              <svg class="w-3.5 h-3.5 text-white" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{{ isStopwatchMode ? t('pomodoroStart') + ' (秒表)' : `${t('pomodoroStart')} (${selectedMinutes}m)` }}</span>
            </button>
          </div>

          <!-- 4. 交互操作区：专注运行中或已暂停 -->
          <div v-else-if="pomodoro.state.value === 'running' || pomodoro.state.value === 'paused'" class="flex flex-col gap-2.5">
            <!-- 防误触确认放弃卡片 -->
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
                  class="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {{ t('pomodoroConfirmDiscard') }}
                </button>
                <button 
                  @click="isConfirmingDiscard = false"
                  class="flex-1 py-1.5 rounded-lg border border-subtle hover:bg-surface text-secondary text-xs transition-colors cursor-pointer"
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
                  class="flex-1 py-2 rounded-xl border border-subtle bg-subtle hover:opacity-85 text-primary font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  <span>{{ t('pomodoroPause') }}</span>
                </button>
                <button 
                  v-else
                  @click="pomodoro.resume()" 
                  class="flex-1 py-2 rounded-xl text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  :style="primaryBtnStyle"
                >
                  <svg class="w-3.5 h-3.5 text-white" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
                  <svg class="w-3.5 h-3.5" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{{ t('pomodoroFinish') }}</span>
                </button>
              </div>

              <!-- 放弃按钮 (次级操作，轻量化) -->
              <div class="flex justify-end">
                <button 
                  @click="isConfirmingDiscard = true" 
                  class="text-[11px] text-tertiary hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded"
                  :title="t('pomodoroCancel')"
                >
                  <svg class="w-3 h-3" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>{{ t('pomodoroCancel') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 4. 交互操作区：短休息阶段 (Break Phase) -->
          <div v-else-if="pomodoro.state.value === 'break'" class="flex flex-col gap-2.5">
            <!-- 舒缓节拍微卡片 -->
            <div class="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs flex flex-col gap-1">
              <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ t('pomodoroBreakTitle') }}</span>
              <span class="text-[11px] text-secondary">{{ t('pomodoroBreathIn') }} · {{ t('pomodoroBreathOut') }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="pomodoro.skipBreak()"
                class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
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

          <!-- 5. Popover Footer: 看板跳转与署名 -->
          <div class="pt-2 border-t border-subtle flex items-center justify-between text-xs text-secondary">
            <button 
              @click="openDashboard" 
              class="hover:text-primary transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>{{ t('pomodoroOpenDashboard') }}</span>
              <svg class="w-3 h-3" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import type TimeSpentPlugin from '../index';
import { PomodoroManager } from '../utils/pomodoro';
import { docTitles } from '../utils/title-cache';
import { t } from '../i18n';
import ZenFlowDial from './Pomodoro/ZenFlowDial.vue';
import ChronoDial from './Pomodoro/ChronoDial.vue';
import HourglassDial from './Pomodoro/HourglassDial.vue';

const props = defineProps<{
  plugin: TimeSpentPlugin;
  pomodoro: PomodoroManager;
}>();

const capsuleEl = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const selectedMinutes = ref(props.plugin.settings?.pomodoroWorkMinutes || 25);
const isStopwatchMode = ref(false);
const isConfirmingDiscard = ref(false);

// 当前交互形态风格：zen | chrono | hourglass
const currentThemeStyle = ref<'zen' | 'chrono' | 'hourglass'>(
  props.plugin.settings?.pomodoroThemeStyle || 'zen'
);

const skinList = computed(() => [
  { key: 'zen' as const, label: t('pomodoroThemeZenName') },
  { key: 'chrono' as const, label: t('pomodoroThemeChronoName') },
  { key: 'hourglass' as const, label: t('pomodoroThemeHourglassName') }
]);

const switchThemeStyle = async (skin: 'zen' | 'chrono' | 'hourglass') => {
  currentThemeStyle.value = skin;
  if (props.plugin.settings) {
    props.plugin.settings.pomodoroThemeStyle = skin;
    await props.plugin.saveSettings();
  }
};

// 监听全局设置变更热更新
const onSettingsChanged = (e: Event) => {
  const detail = (e as CustomEvent).detail;
  if (detail?.pomodoroThemeStyle) {
    currentThemeStyle.value = detail.pomodoroThemeStyle;
  }
  if (detail?.pomodoroWorkMinutes && props.pomodoro.state.value === 'idle') {
    selectedMinutes.value = detail.pomodoroWorkMinutes;
  }
};

onMounted(() => {
  window.addEventListener('siyuan-time-spent:pomodoro-config-changed', onSettingsChanged);
});

onUnmounted(() => {
  window.removeEventListener('siyuan-time-spent:pomodoro-config-changed', onSettingsChanged);
});

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

// 计算通用归一化进度 (0 到 1)
const currentProgress = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'idle') return 0;

  if (state === 'break') {
    const total = props.pomodoro.breakTotalSeconds.value || 300;
    const remaining = props.pomodoro.breakRemainingSeconds.value;
    return Math.max(0, Math.min(1, 1 - remaining / total));
  }

  if (props.pomodoro.isStopwatch.value) {
    const s = props.pomodoro.elapsedSeconds.value % 60;
    return s / 60;
  }

  const total = props.pomodoro.totalSeconds.value || (props.pomodoro.targetMinutes.value * 60) || 1500;
  const remaining = props.pomodoro.remainingSeconds.value;
  return Math.max(0, Math.min(1, 1 - remaining / total));
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

// 主题动态样式派生
const capsuleStyle = computed(() => {
  const state = props.pomodoro.state.value;
  if (state === 'running') {
    return {
      background: 'color-mix(in srgb, var(--b3-theme-primary) 12%, var(--b3-theme-surface))',
      border: '1px solid color-mix(in srgb, var(--b3-theme-primary) 35%, transparent)',
      color: 'var(--b3-theme-on-background)'
    };
  }
  if (state === 'break') {
    return {
      background: 'color-mix(in srgb, var(--st-success, #10b981) 12%, var(--b3-theme-surface))',
      border: '1px solid color-mix(in srgb, var(--st-success, #10b981) 35%, transparent)',
      color: 'var(--b3-theme-on-background)'
    };
  }
  return {
    background: 'color-mix(in srgb, var(--b3-theme-surface) 90%, transparent)',
    border: '1px solid color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)',
    color: 'var(--b3-theme-on-background)'
  };
});

const activePresetStyle = computed(() => ({
  borderColor: 'var(--b3-theme-primary)',
  background: 'color-mix(in srgb, var(--b3-theme-primary) 12%, transparent)',
  color: 'var(--b3-theme-primary)'
}));

const inactivePresetStyle = computed(() => ({
  borderColor: 'color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)',
  background: 'var(--b3-theme-surface)',
  color: 'var(--b3-theme-on-surface)'
}));

const primaryBtnStyle = computed(() => ({
  background: 'var(--b3-theme-primary)',
  boxShadow: '0 4px 12px color-mix(in srgb, var(--b3-theme-primary) 35%, transparent)'
}));

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
  const popoverWidth = 336;
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
.text-primary {
  color: var(--b3-theme-primary);
}
.text-secondary {
  color: var(--b3-theme-on-surface);
}
.text-tertiary {
  color: var(--b3-theme-on-surface-light, #94a3b8);
}
.bg-surface {
  background-color: var(--b3-theme-surface);
}
.bg-subtle {
  background-color: color-mix(in srgb, var(--b3-theme-on-background) 6%, transparent);
}
.bg-primary-subtle {
  background-color: color-mix(in srgb, var(--b3-theme-primary) 14%, transparent);
}
.border-subtle {
  border-color: color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent);
}

.sy-pomo-card {
  background-color: color-mix(in srgb, var(--b3-theme-surface) 92%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-color: color-mix(in srgb, var(--b3-theme-on-background) 14%, transparent);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
