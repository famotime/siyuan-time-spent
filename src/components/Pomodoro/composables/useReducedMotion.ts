import type { PluginSettings } from '../../../models/Settings';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

/** 番茄钟动效强度的完整判定结果 */
export interface MotionPolicy {
  /** 系统偏好或配置要求关闭所有循环动画 */
  reduced: ComputedRef<boolean>;
  /** 允许粒尘/相位漂移等纯装饰性氛围 */
  allowAmbient: ComputedRef<boolean>;
  /** 允许全屏达成微时刻这类强仪式反馈 */
  allowMoment: ComputedRef<boolean>;
  /** 当前生效的强度档位 */
  intensity: ComputedRef<'calm' | 'expressive'>;
}

let sharedReduced: Ref<boolean> | null = null;
let listenerBound = false;

function getSystemReduced(): Ref<boolean> {
  if (!sharedReduced) {
    const mql = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    sharedReduced = ref<boolean>(!!mql?.matches);
    if (mql && !listenerBound) {
      listenerBound = true;
      const onChange = (e: MediaQueryListEvent) => {
        if (sharedReduced) sharedReduced.value = e.matches;
      };
      // 新内核用 addEventListener，旧内核回退到已废弃的 addListener
      if (mql.addEventListener) {
        mql.addEventListener('change', onChange);
      } else {
        (mql as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void })
          .addListener(onChange);
      }
    }
  }
  return sharedReduced;
}

/**
 * 合并「系统减少动态效果」与「动效强度配置」两路信号，
 * 产出粒尘 / 微时刻等各层级动效的总开关
 */
export function useReducedMotion(settings: () => PluginSettings | undefined): MotionPolicy {
  const systemReduced = getSystemReduced();
  const intensity = computed<'calm' | 'expressive'>(() => settings()?.pomodoroAnimationIntensity ?? 'expressive');

  const reduced = computed(() => systemReduced.value || intensity.value === 'calm');
  const allowAmbient = computed(() => !reduced.value);
  const allowMoment = computed(() => !systemReduced.value && intensity.value === 'expressive');

  return { reduced, allowAmbient, allowMoment, intensity };
}
