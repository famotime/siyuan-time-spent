import type TimeSpentPlugin from '../../../index';
import type { PomodoroManager, UiPhase } from '../../../utils/pomodoro';
import { formatDurationI18n, t } from '../../../i18n';
import { docTitles } from '../../../utils/title-cache';
import { computed, type ComputedRef, type Ref } from 'vue';

export interface PomodoroView {
  /** 原始状态机，决定按钮等行为分支 */
  state: ComputedRef<'idle' | 'running' | 'paused' | 'break'>;
  /** 派生视图相位，决定色温与氛围；冻结态对外表现为 paused */
  uiPhase: ComputedRef<UiPhase>;
  /** 表盘主时间 */
  displayText: ComputedRef<string>;
  /** 表盘副标 */
  subtitle: ComputedRef<string>;
  /** 归一化进度，冻结时返回冻结快照 */
  progress: ComputedRef<number>;
  /** 未冻结的原始进度 */
  rawProgress: ComputedRef<number>;
  /** 色彩温度迁移 0..1，只产数字不产色值 */
  heat: ComputedRef<number>;
  isStopwatch: ComputedRef<boolean>;
  isFrozen: ComputedRef<boolean>;
  afkIdleSeconds: ComputedRef<number>;
  afkReturn: ComputedRef<{ idleSec: number; at: number } | null>;
  capsuleText: ComputedRef<string>;
  capsuleTooltip: ComputedRef<string>;
  capsuleStyle: ComputedRef<Record<string, string>>;
  statusBadge: ComputedRef<string>;
  docName: ComputedRef<string>;
  docId: ComputedRef<string | null>;
  cycleCompleted: ComputedRef<number>;
  cycleSize: ComputedRef<number>;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
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
): PomodoroView {
  const state = computed(() => pomodoro.state.value);
  const uiPhase = computed(() => pomodoro.uiPhase.value);
  const isStopwatch = computed(() => pomodoro.isStopwatch.value);
  const isFrozen = computed(() => pomodoro.afkFrozen.value);
  const afkIdleSeconds = computed(() => pomodoro.afkIdleSeconds.value);
  const afkReturn = computed(() => pomodoro.afkReturn.value);

  const rawProgress = computed(() => pomodoro.computeRawProgress());

  /** 冻结时进度原地凝滞在快照值 */
  const progress = computed(() => (isFrozen.value ? pomodoro.getFrozenProgress() : rawProgress.value));

  const displayText = computed(() => {
    const s = state.value;
    if (s === 'idle') {
      if (preferStopwatch.value) return '00:00';
      return `${pad(preferredMinutes.value)}:00`;
    }
    if (s === 'break') {
      return toMmSs(pomodoro.breakRemainingSeconds.value);
    }
    if (isStopwatch.value) {
      return toMmSs(pomodoro.elapsedSeconds.value);
    }
    return toMmSs(pomodoro.remainingSeconds.value);
  });

  const subtitle = computed(() => {
    const s = state.value;
    if (s === 'idle') {
      return preferStopwatch.value ? t('pomodoroStopwatch') : `${t('pomodoroTarget')} ${preferredMinutes.value}m`;
    }
    if (s === 'break') {
      return pomodoro.breakKind.value === 'long' ? t('pomodoroLongBreakTitle') : t('pomodoroInBreak');
    }
    if (s === 'paused') {
      return t('pomodoroStatusPaused');
    }
    return isStopwatch.value ? t('pomodoroStopwatch') : `${t('pomodoroTarget')} ${pomodoro.targetMinutes.value}m`;
  });

  /**
   * 色彩温度：专注中升温、休息中降温、暂停收敛、冻结去饱和
   * 只输出 0..1，颜色合成全部交给 CSS color-mix
   */
  const heat = computed(() => {
    const phase = uiPhase.value;
    if (phase === 'idle') return 0;
    if (phase === 'focus') return progress.value;
    if (phase === 'short-break' || phase === 'long-break') {
      const total = pomodoro.breakTotalSeconds.value || 300;
      return Math.max(0, Math.min(1, 1 - pomodoro.breakRemainingSeconds.value / total));
    }
    // paused / 冻结
    return Math.min(progress.value, 0.25);
  });

  const statusBadge = computed(() => {
    const s = state.value;
    if (isFrozen.value) return t('pomodoroStatusFrozen');
    if (s === 'running') return isStopwatch.value ? t('pomodoroStopwatch') : t('pomodoroWorkSession');
    if (s === 'paused') return t('pomodoroStatusPaused');
    if (s === 'break') {
      return pomodoro.breakKind.value === 'long' ? t('pomodoroStatusLongBreak') : t('pomodoroStatusBreak');
    }
    return '';
  });

  const capsuleText = computed(() => {
    const s = state.value;
    if (isFrozen.value) return `${t('pomodoroAfkFrozenBadge')} ${displayText.value}`;
    if (s === 'running') {
      return displayText.value;
    }
    if (s === 'paused') {
      return `${displayText.value} (${t('pomodoroPause')})`;
    }
    if (s === 'break') {
      const label = pomodoro.breakKind.value === 'long' ? t('pomodoroLongBreakTitle') : t('pomodoroBreakSession');
      return `${label} ${displayText.value}`;
    }
    return '源时记';
  });

  const capsuleTooltip = computed(() => {
    const s = state.value;
    if (isFrozen.value) {
      return `${t('pomodoroTimerTitle')}: ${t('pomodoroAfkAway', { time: formatIdle(afkIdleSeconds.value) })} · 点击管理`;
    }
    if (s === 'running') {
      return `${t('pomodoroTimerTitle')}: ${displayText.value} · 点击管理`;
    }
    if (s === 'break') {
      return `${t('pomodoroBreakSession')}: ${displayText.value} · 点击查看`;
    }
    return `${t('pomodoroTimerTitle')} · 点击开启专注`;
  });

  const capsuleStyle = computed(() => {
    const s = state.value;
    if (isFrozen.value) {
      return {
        background: 'var(--st-pomo-frozen-bg)',
        border: '1px solid var(--st-pomo-frozen-border)',
        color: 'var(--st-pomo-frozen-text)',
      };
    }
    if (s === 'running') {
      return {
        background: 'color-mix(in srgb, var(--b3-theme-primary) 12%, var(--b3-theme-surface))',
        border: '1px solid color-mix(in srgb, var(--b3-theme-primary) 35%, transparent)',
        color: 'var(--b3-theme-on-background)',
      };
    }
    if (s === 'break') {
      const isLong = pomodoro.breakKind.value === 'long';
      return {
        background: isLong ? 'var(--st-pomo-longbreak-bg)' : 'var(--st-pomo-break-bg)',
        border: `1px solid ${isLong ? 'var(--st-pomo-longbreak-border)' : 'var(--st-pomo-break-border)'}`,
        color: 'var(--b3-theme-on-background)',
      };
    }
    return {
      background: 'color-mix(in srgb, var(--b3-theme-surface) 90%, transparent)',
      border: '1px solid color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)',
      color: 'var(--b3-theme-on-background)',
    };
  });

  const docId = computed(() => (
    pomodoro.currentDocId.value || plugin.timeTracker?.getCurrentDocId() || null
  ));

  const docName = computed(() => {
    const id = docId.value;
    if (!id) return t('pomodoroNoDoc');
    return docTitles.value[id] || id;
  });

  return {
    state,
    uiPhase,
    displayText,
    subtitle,
    progress,
    rawProgress,
    heat,
    isStopwatch,
    isFrozen,
    afkIdleSeconds,
    afkReturn,
    capsuleText,
    capsuleTooltip,
    capsuleStyle,
    statusBadge,
    docName,
    docId,
    cycleCompleted: computed(() => pomodoro.cycleCompleted.value),
    cycleSize: computed(() => pomodoro.cycleSize.value),
  };
}

/** 离桌时长的可读表述，跟随当前语言 */
export function formatIdle(sec: number): string {
  return formatDurationI18n(sec);
}
