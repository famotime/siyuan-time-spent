import type { TimeLog } from '../../../models/TimeLog';
import type { PomodoroManager } from '../../../utils/pomodoro';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

export interface DurationRecommendation {
  minutes: number;
  /** 推荐语对应的 i18n 键 */
  reasonKey: string;
  /** 推荐语插值参数 */
  params: Record<string, string | number>;
}

const PRESETS = [15, 25, 45, 60];

/** 与面板预设保持一致的候选时长集合 */
function nearestPreset(minutes: number): number {
  return PRESETS.reduce((best, cur) => (
    Math.abs(cur - minutes) < Math.abs(best - minutes) ? cur : best
  ));
}

function formatHours(sec: number): string {
  return `${(sec / 3600).toFixed(1)}h`;
}

/**
 * 智能时长推荐：综合今日已专注量、所处时段与轮次进度给出一个起步时长
 * 只做引导，用户始终可以一键改回任意预设
 */
export function useSmartDuration(
  pomodoro: PomodoroManager,
  loadTodayLogs: (() => Promise<TimeLog[]>) | null,
): {
  recommendation: ComputedRef<DurationRecommendation | null>;
  refresh: () => Promise<void>;
  enabled: Ref<boolean>;
} {
  const enabled = ref(true);
  const todaySec = ref(0);

  const recommendation = computed<DurationRecommendation | null>(() => {
    if (!enabled.value) return null;

    const hour = new Date().getHours();

    // 夜深了：短块更稳妥，避免硬撑
    if (hour >= 22 || hour < 5) {
      return {
        minutes: 15,
        reasonKey: 'pomodoroSmartReasonLateNight',
        params: {},
      };
    }

    // 高效时段（上午 8-11 点）且今日投入还不饱和：拉长冲刺
    if (hour >= 8 && hour < 11 && todaySec.value < 2 * 3600) {
      return {
        minutes: 45,
        reasonKey: 'pomodoroSmartReasonPeak',
        params: {},
      };
    }

    // 今日已投入较多：缩短恢复，保护后续状态
    if (todaySec.value >= 3 * 3600) {
      return {
        minutes: 15,
        reasonKey: 'pomodoroSmartReasonFatigue',
        params: { total: formatHours(todaySec.value) },
      };
    }

    // 本轮已推进：略微减负
    if (pomodoro.cycleCompleted.value > 0) {
      return {
        minutes: 25,
        reasonKey: 'pomodoroSmartReasonCycle',
        params: { n: pomodoro.cycleCompleted.value },
      };
    }

    // 今日专注尚少：给一个完整深度块
    return {
      minutes: nearestPreset(25),
      reasonKey: 'pomodoroSmartReasonFresh',
      params: {},
    };
  });

  const refresh = async () => {
    if (!loadTodayLogs) return;
    try {
      const logs = await loadTodayLogs();
      todaySec.value = (logs || []).reduce((sum, log) => sum + (log.duration || 0), 0);
    } catch {
      todaySec.value = 0;
    }
  };

  return { recommendation, refresh, enabled };
}

export { PRESETS as POMODORO_PRESETS };
