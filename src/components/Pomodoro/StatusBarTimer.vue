<template>
  <div class="sy-status-timer-root relative inline-flex items-center text-xs select-none">
    <!-- 常驻状态栏灵动微胶囊 (Ambient Micro-Capsule) -->
    <FocusCapsule
      :ref="(el: any) => (anchorEl = el?.$el ?? el ?? null)"
      :view="view"
      @toggle="togglePopover"
    />

    <!-- 弹出的番茄钟微控制面板 (Focus Popover) -->
    <FocusPanel
      :plugin="plugin"
      :pomodoro="pomodoro"
      :view="view"
      :anchor-el="anchorEl"
      :is-open="isOpen"
      :active-form="currentThemeStyle"
      :intensity="intensity"
      :allow-ambient="allowAmbient"
      :reduced="reduced"
      :wheel-enabled="wheelEnabled"
      :interruption-enabled="interruptionEnabled"
      :smart-enabled="smartEnabled"
      :recommendation="recommendation"
      :note-draft="noteDraft"
      :confirming-discard="isConfirmingDiscard"
      :presets="presets"
      @close="closePopover"
      @switchForm="switchThemeStyle"
      @update:preferredMinutes="onMinutes"
      @update:preferStopwatch="onStopwatchMode"
      @adjustMinutes="adjustMinutes"
      @start="handleStart"
      @pause="onPause"
      @resume="onResume"
      @finish="onFinish"
      @confirmDiscard="doDiscard"
      @update:confirmingDiscard="onConfirmingDiscard"
      @update:noteDraft="onNoteDraft"
      @saveNote="saveNote"
      @skipNote="skipNote"
      @dismissAfk="pomodoro.dismissAfkReturn()"
      @skipBreak="pomodoro.skipBreak()"
      @extendBreak="pomodoro.extendBreak($event)"
      @openDashboard="openDashboard"
    />

    <!-- 达成微时刻：整颗番茄落袋的仪式反馈 -->
    <AchievementMoment
      :visible="momentVisible"
      :minutes="momentMinutes"
      :cycle-completed="pomodoro.cycleCompleted.value"
      :cycle-size="pomodoro.cycleSize.value"
      :cycle-complete="momentCycleComplete"
      :reduced="!allowMoment"
      @done="onMomentDone"
    />
  </div>
</template>

<script setup lang="ts">
import type TimeSpentPlugin from '../../index';
import type { PomodoroManager } from '../../utils/pomodoro';
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import AchievementMoment from './AchievementMoment.vue';
import { usePomodoroPresenter } from './composables/usePomodoroPresenter';
import { usePomodoroShortcuts } from './composables/usePomodoroShortcuts';
import { useReducedMotion } from './composables/useReducedMotion';
import { POMODORO_PRESETS, useSmartDuration } from './composables/useSmartDuration';
import FocusCapsule from './FocusCapsule.vue';
import FocusPanel from './FocusPanel.vue';

const props = defineProps<{
  plugin: TimeSpentPlugin
  pomodoro: PomodoroManager
}>()

const anchorEl = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const isConfirmingDiscard = ref(false);
const noteDraft = ref('');

// 当前交互形态风格：zen | chrono | hourglass（枚举值保持原样，仅展示标签更新）
type FormKey = 'zen' | 'chrono' | 'hourglass';
const currentThemeStyle = ref<FormKey>(props.plugin.settings?.pomodoroThemeStyle || 'zen');

const presets = POMODORO_PRESETS;

/**
 * plugin.settings 是普通对象，写入不会触发响应式。
 * 用版本号强制依赖配置的 computed 在热更新时重算。
 */
const settingsVersion = ref(0);
const settings = () => {
  void settingsVersion.value;
  return props.plugin.settings;
};
const motion = useReducedMotion(settings);
const intensity = motion.intensity;
const allowAmbient = motion.allowAmbient;
const allowMoment = motion.allowMoment;
const reduced = motion.reduced;

const view = usePomodoroPresenter(
  props.pomodoro,
  props.plugin,
  computed(() => props.pomodoro.preferredMinutes.value),
  computed(() => props.pomodoro.preferStopwatch.value),
)

const smartEnabled = computed(() => settings()?.pomodoroSmartDuration !== false);
const interruptionEnabled = computed(() => settings()?.pomodoroInterruptionLog !== false);
const wheelEnabled = computed(() => settings()?.pomodoroWheelAdjust !== false);
const shortcutEnabled = computed(() => settings()?.pomodoroShortcut !== false);

const smart = useSmartDuration(props.pomodoro, () => props.plugin.storageManager?.loadTodayLogs() ?? Promise.resolve([]));
const recommendation = computed(() => (smartEnabled.value ? smart.recommendation.value : null));

// ---- 会话意向：直接读写 Manager，供胶囊、表盘预览与快捷键共用 ----
const onMinutes = (v: number) => {
  props.pomodoro.preferredMinutes.value = Math.max(1, Math.min(180, v))
}

const onStopwatchMode = (v: boolean) => {
  props.pomodoro.preferStopwatch.value = v
}

const adjustMinutes = (delta: number) => {
  const cur = props.pomodoro.preferredMinutes.value || 25
  onMinutes(cur + delta)
}

const switchThemeStyle = async (skin: FormKey) => {
  currentThemeStyle.value = skin
  if (props.plugin.settings) {
    props.plugin.settings.pomodoroThemeStyle = skin
    await props.plugin.saveSettings()
  }
}

// 监听全局设置变更热更新
const onSettingsChanged = (e: Event) => {
  settingsVersion.value += 1
  const detail = (e as CustomEvent).detail
  if (detail?.pomodoroThemeStyle) {
    currentThemeStyle.value = detail.pomodoroThemeStyle
  }
  if (detail?.pomodoroWorkMinutes && props.pomodoro.state.value === 'idle') {
    props.pomodoro.preferredMinutes.value = detail.pomodoroWorkMinutes
  }
  if (detail?.pomodoroCycleSize) {
    props.pomodoro.setCycleSize(detail.pomodoroCycleSize)
  }
}

onMounted(() => {
  window.addEventListener('siyuan-time-spent:pomodoro-config-changed', onSettingsChanged)
  smart.refresh()
})

onUnmounted(() => {
  window.removeEventListener('siyuan-time-spent:pomodoro-config-changed', onSettingsChanged)
})

// ---- 达成微时刻 ----
const momentVisible = ref(false);
const momentMinutes = ref(0);
const momentCycleComplete = ref(false);
const lastSeenCompletion = ref(0);

// 由 lastCompletion 变化驱动一次仪式反馈
function checkCompletion() {
  const c = props.pomodoro.lastCompletion.value
  if (!c || c.at === lastSeenCompletion.value) return
  lastSeenCompletion.value = c.at
  if (!allowMoment.value || settings()?.pomodoroAchievementMoment === false) return
  momentMinutes.value = c.minutes
  momentCycleComplete.value = c.cycleDone
  momentVisible.value = true
}

watch(() => props.pomodoro.lastCompletion.value, checkCompletion);

const onMomentDone = () => {
  momentVisible.value = false
}

// ---- 面板开关 ----
const closePopover = () => {
  isOpen.value = false
  isConfirmingDiscard.value = false
}

const togglePopover = () => {
  if (isOpen.value) {
    closePopover()
    return
  }
  isOpen.value = true
  isConfirmingDiscard.value = false
  // 打开时刷新今日投入，让推荐时长基于最新数据
  void smart.refresh()
  void nextTick()
}

// ---- 操作转发 ----
const handleStart = () => {
  if (props.pomodoro.preferStopwatch.value) {
    props.pomodoro.startStopwatch()
  } else {
    props.pomodoro.start(props.pomodoro.preferredMinutes.value || 25)
  }
}

const onPause = () => props.pomodoro.pause();
const onResume = () => props.pomodoro.resume();
const onFinish = () => props.pomodoro.finishEarly();
const onConfirmingDiscard = (v: boolean) => {
  isConfirmingDiscard.value = v
}
const doDiscard = () => {
  props.pomodoro.discard()
  isConfirmingDiscard.value = false
}

const onNoteDraft = (v: string) => {
  noteDraft.value = v
}
const saveNote = () => {
  if (noteDraft.value.trim()) {
    props.pomodoro.recordInterruption(noteDraft.value)
  }
  noteDraft.value = ''
}
const skipNote = () => {
  noteDraft.value = ''
}

const openDashboard = () => {
  closePopover()
  props.plugin.openDashboard()
}

// ---- 键盘驱动 ----
usePomodoroShortcuts(shortcutEnabled, isOpen, {
  onTogglePanel: togglePopover,
  onClosePanel: closePopover,
  onTogglePause: () => {
    if (props.pomodoro.state.value === 'running') props.pomodoro.pause()
    else if (props.pomodoro.state.value === 'paused') props.pomodoro.resume()
  },
})

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

/* 卡片进出场（关键帧由全局 st-pomo-fade-in 提供）*/
.animate-fadeIn {
  animation: st-pomo-fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
