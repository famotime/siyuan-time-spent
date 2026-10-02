import type {
  ComputedRef,
  Ref,
} from 'vue'
import type TimeSpentPlugin from '../../../index'
import type {
  PomodoroManager,
  UiPhase,
} from '../../../utils/pomodoro'
import { computed } from 'vue'
import {
  formatDurationI18n,
  t,
} from '../../../i18n'
import { docTitles } from '../../../utils/title-cache'

export interface PomodoroView {
  /** 原始状态机，决定按钮等行为分支 */
  state: ComputedRef<'idle' | 'running' | 'paused' | 'break'>
  /** 派生视图相位，决定色温与氛围；冻结态对外表现为 paused */
  uiPhase: ComputedRef<UiPhase>
  /** 表盘主时间 */
  displayText: ComputedRef<string>
  /** 表盘副标 */
  subtitle: ComputedRef<string>
  /** 归一化进度，冻结时返回冻结快照 */
  progress: ComputedRef<number>
  /** 未冻结的原始进度 */
  rawProgress: ComputedRef<number>
  isStopwatch: ComputedRef<boolean>
  isFrozen: ComputedRef<boolean>
  elapsedSeconds: ComputedRef<number>
  /** 表盘走时基线：毫秒精度已过时长 */
  motionElapsedMs: ComputedRef<number>
  /** 表盘是否按墙钟推进；暂停与冻结时停在快照处 */
  motionLive: ComputedRef<boolean>
  /** 表盘一整圈对应的毫秒数 */
  motionTotalMs: ComputedRef<number>
  /** 正计时走秒环（一圈一分钟），倒计时与休息走整段进度 */
  motionSweep: ComputedRef<boolean>
  afkIdleSeconds: ComputedRef<number>
  afkReturn: ComputedRef<{ idleSec: number, at: number } | null>
  capsuleText: ComputedRef<string>
  capsuleTooltip: ComputedRef<string>
  docName: ComputedRef<string>
  docId: ComputedRef<string | null>
  cycleCompleted: ComputedRef<number>
  cycleSize: ComputedRef<number>
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toMmSs(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${pad(m)}:${pad(s)}`
}

/**
 * 番茄钟视图模型：所有子组件唯一的数据入口
 * 子组件只接收这里的字段与事件回调，永不直接 import PomodoroManager
 */
export function usePomodoroPresenter(
  pomodoro: PomodoroManager,
  plugin: TimeSpentPlugin,
  preferredMinutes: Ref<number>,
  preferStopwatch: Ref<boolean>,
  upcomingDocId?: Ref<string | null>,
): PomodoroView {
  const state = computed(() => pomodoro.state.value)
  const uiPhase = computed(() => pomodoro.uiPhase.value)
  const isStopwatch = computed(() => pomodoro.isStopwatch.value)
  const isFrozen = computed(() => pomodoro.afkFrozen.value)
  const elapsedSeconds = computed(() => pomodoro.elapsedSeconds.value)
  const afkIdleSeconds = computed(() => pomodoro.afkIdleSeconds.value)
  const afkReturn = computed(() => pomodoro.afkReturn.value)

  /**
   * 走时基线集中在一个 computed 里取：每次 tick 只算一次墙钟采样，
   * 三个表盘复用同一锚点，避免彼此错位。
   */
  const timeBase = computed(() => pomodoro.getTimeBase())
  const motionElapsedMs = computed(() => timeBase.value.elapsedMs)
  const motionLive = computed(() => timeBase.value.live)
  const motionTotalMs = computed(() => timeBase.value.totalMs)
  const motionSweep = computed(() => timeBase.value.sweep)

  const rawProgress = computed(() => pomodoro.computeRawProgress())

  /** 冻结时进度原地凝滞在快照值 */
  const progress = computed(() =>
    isFrozen.value ? pomodoro.getFrozenProgress() : rawProgress.value,
  )

  const displayText = computed(() => {
    const s = state.value
    if (s === 'idle') {
      if (preferStopwatch.value) return '00:00'
      return `${pad(preferredMinutes.value)}:00`
    }
    if (s === 'break') {
      return toMmSs(pomodoro.breakRemainingSeconds.value)
    }
    if (isStopwatch.value) {
      return toMmSs(pomodoro.elapsedSeconds.value)
    }
    return toMmSs(pomodoro.remainingSeconds.value)
  })

  const subtitle = computed(() => {
    const s = state.value
    if (s === 'idle') {
      return preferStopwatch.value
        ? t('pomodoroCountUp')
        : t('pomodoroReadyHint')
    }
    if (s === 'break') {
      return pomodoro.breakKind.value === 'long'
        ? t('pomodoroLongBreakTitle')
        : t('pomodoroInBreak')
    }
    if (s === 'paused') {
      return t('pomodoroStatusPaused')
    }
    return isStopwatch.value
      ? t('pomodoroStopwatch')
      : t('pomodoroFocusTarget', { n: pomodoro.targetMinutes.value })
  })

  /**
   * 色彩温度：专注中升温、休息中降温、暂停收敛、冻结去饱和
   * 只输出 0..1，颜色合成全部交给 CSS color-mix
   */
  const capsuleText = computed(() => {
    const s = state.value
    if (isFrozen.value)
      return `${t('pomodoroAfkFrozenBadge')} ${displayText.value}`
    if (s === 'running') {
      return displayText.value
    }
    if (s === 'paused') {
      return `${displayText.value} (${t('pomodoroPause')})`
    }
    if (s === 'break') {
      const label =
        pomodoro.breakKind.value === 'long'
          ? t('pomodoroLongBreakTitle')
          : t('pomodoroBreakSession')
      return `${label} ${displayText.value}`
    }
    return '源时记'
  })

  const capsuleTooltip = computed(() => {
    const s = state.value
    if (isFrozen.value) {
      return `${t('pomodoroTimerTitle')}: ${t('pomodoroAfkAway', { time: formatIdle(afkIdleSeconds.value) })} · 点击管理`
    }
    if (s === 'running') {
      return `${t('pomodoroTimerTitle')}: ${displayText.value} · 点击管理`
    }
    if (s === 'break') {
      return `${t('pomodoroBreakSession')}: ${displayText.value} · 点击查看`
    }
    return `${t('pomodoroTimerTitle')} · 点击开启专注`
  })

  const docId = computed(() => {
    if (state.value === 'idle') {
      return upcomingDocId
        ? upcomingDocId.value
        : plugin.timeTracker?.getCurrentDocId() || null
    }
    return pomodoro.currentDocId.value || null
  })

  const docName = computed(() => {
    const id = docId.value
    if (!id) return t('pomodoroFreeFocus')
    return docTitles.value[id] || t('pomodoroUntitledNote')
  })

  return {
    state,
    uiPhase,
    displayText,
    subtitle,
    progress,
    rawProgress,
    isStopwatch,
    isFrozen,
    elapsedSeconds,
    motionElapsedMs,
    motionLive,
    motionTotalMs,
    motionSweep,
    afkIdleSeconds,
    afkReturn,
    capsuleText,
    capsuleTooltip,
    docName,
    docId,
    cycleCompleted: computed(() => pomodoro.cycleCompleted.value),
    cycleSize: computed(() => pomodoro.cycleSize.value),
  }
}

/** 离桌时长的可读表述，跟随当前语言 */
export function formatIdle(sec: number): string {
  return formatDurationI18n(sec)
}
