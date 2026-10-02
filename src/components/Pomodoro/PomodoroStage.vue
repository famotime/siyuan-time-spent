<template>
  <div
    class="sy-pomo-stage st-pomo-heat-channel relative w-44 h-44 flex items-center justify-center select-none"
    :data-pomo-phase="stagePhase"
    :data-pomo-motion="intensity"
    :style="stageStyle"
    role="timer"
    :aria-label="t('pomodoroAriaTimer', { time: displayText })"
    aria-live="polite"
    aria-atomic="true"
    @wheel.prevent="onWheel"
  >
    <!-- 环境粒尘（仅运行态，且尊重动效强度与系统偏好） -->
    <div
      v-if="dustCount > 0 && active"
      class="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <span
        v-for="dust in dusts"
        :key="dust.i"
        class="st-pomo-anim st-pomo-dust absolute rounded-full"
        :style="dust.style"
      ></span>
    </div>

    <!-- 叙事载体：三种形态彻底差异化 -->
    <AuroraDial
      v-if="form === 'zen'"
      class="relative z-10 w-full h-full"
      :progress="progress"
      :ui-phase="uiPhase"
      :frozen="frozen"
      :heat="heat"
    />
    <ChronoDial
      v-else-if="form === 'chrono'"
      class="relative z-10 w-full h-full"
      :progress="progress"
      :ui-phase="uiPhase"
      :frozen="frozen"
      :heat="heat"
    />
    <SandfallDial
      v-else
      class="relative z-10 w-full h-full"
      :progress="progress"
      :ui-phase="uiPhase"
      :frozen="frozen"
      :heat="heat"
    />

    <!-- 中心数字与副标：三种形态共用同一套升维排版 -->
    <div class="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none select-text">
      <span
        class="font-tabular font-black leading-none tracking-[-0.02em] transition-colors"
        :style="{
          fontSize: '56px', color: textColor,
        }"
      >
        {{ displayText }}
      </span>
      <span
        class="text-xs mt-1.5 font-medium transition-opacity"
        :style="{ color: subColor }"
      >
        {{ subtitle }}
      </span>
    </div>

    <!-- 无障碍：不可见的进度条语义节点 -->
    <div
      class="sr-only"
      role="progressbar"
      :aria-valuenow="Math.round(progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="t('pomodoroFocusRingAria')"
    >
      {{ t('pomodoroAriaProgress', { percent: Math.round(progress * 100) }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiPhase } from '../../utils/pomodoro';
import type { PomodoroFormKey } from './FocusPanelHeader.vue';
import { computed } from 'vue';
import { t } from '../../i18n';
import AuroraDial from './dials/AuroraDial.vue';
import ChronoDial from './dials/ChronoDial.vue';
import SandfallDial from './dials/SandfallDial.vue';

const props = defineProps<{
  form: PomodoroFormKey
  uiPhase: UiPhase
  progress: number
  displayText: string
  subtitle: string
  heat: number
  frozen: boolean
  intensity: 'calm' | 'expressive'
  allowAmbient: boolean
  wheelEnabled: boolean
}>()

const emit = defineEmits<{ (e: 'wheelAdjust', delta: number): void }>();

/** 冻结态对外改用独立相位，走凝滞配色 */
const stagePhase = computed(() => (props.frozen ? 'frozen' : props.uiPhase));

const active = computed(() => (
  props.uiPhase === 'focus' || props.uiPhase === 'short-break' || props.uiPhase === 'long-break'
))

/** 主时间数字始终取语义文本色，绝不使用色温值，保证第三方主题下对比度 */
const textColor = computed(() => {
  if (props.frozen) return 'var(--st-pomo-frozen-text)'
  return 'var(--b3-theme-on-background)'
})

const subColor = computed(() => {
  if (props.frozen) return 'var(--st-pomo-frozen-text)'
  if (props.uiPhase === 'short-break') return 'var(--st-pomo-break-text)'
  if (props.uiPhase === 'long-break') return 'var(--st-pomo-longbreak-text)'
  return 'var(--b3-theme-on-surface-light, var(--b3-theme-on-surface))'
})

const stageStyle = computed(() => ({
  '--pomo-heat': String(props.heat),
}))

// ---- 环境粒尘：构造时算一次随机量，避免每次 render 抖动 ----
interface Dust {
  i: number
  style: Record<string, string>
}

const DUST_SEED: ReadonlyArray<{ x: number, dx: number, delay: number, dur: number, size: number }> = [
  {
    x: 18,
    dx: 10,
    delay: -2.0,
    dur: 24,
    size: 1.9,
  },
  {
    x: 34,
    dx: -8,
    delay: -8.5,
    dur: 29,
    size: 2.4,
  },
  {
    x: 52,
    dx: 12,
    delay: -14.0,
    dur: 22,
    size: 1.6,
  },
  {
    x: 68,
    dx: -14,
    delay: -5.5,
    dur: 31,
    size: 2.7,
  },
  {
    x: 84,
    dx: 7,
    delay: -19.5,
    dur: 26,
    size: 2.1,
  },
  {
    x: 26,
    dx: 16,
    delay: -11.0,
    dur: 34,
    size: 1.5,
  },
  {
    x: 44,
    dx: -6,
    delay: -23.0,
    dur: 25,
    size: 2.3,
  },
  {
    x: 60,
    dx: 9,
    delay: -16.5,
    dur: 28,
    size: 1.8,
  },
  {
    x: 76,
    dx: -11,
    delay: -3.5,
    dur: 32,
    size: 2.5,
  },
  {
    x: 12,
    dx: 13,
    delay: -27.0,
    dur: 23,
    size: 1.7,
  },
  {
    x: 92,
    dx: -9,
    delay: -9.0,
    dur: 30,
    size: 2.2,
  },
  {
    x: 38,
    dx: 15,
    delay: -21.5,
    dur: 27,
    size: 1.4,
  },
  {
    x: 56,
    dx: -13,
    delay: -6.0,
    dur: 33,
    size: 2.6,
  },
  {
    x: 72,
    dx: 8,
    delay: -25.5,
    dur: 24,
    size: 1.9,
  },
]

const dustCount = computed(() => (props.allowAmbient && props.intensity === 'expressive' ? DUST_SEED.length : 0));

const dusts = computed<Dust[]>(() => {
  if (dustCount.value === 0) return [];
  return DUST_SEED.map((d, i) => ({
    i,
    style: {
      "left": `${d.x}%`,
      "bottom": '10%',
      "width": 'var(--st-pomo-dust-size)',
      "height": 'var(--st-pomo-dust-size)',
      "background": 'var(--pomo-tint, var(--b3-theme-primary))',
      '--pomo-dx': `${d.dx}px`,
      "animation": `st-pomo-dust-rise ${d.dur}s linear ${d.delay}s infinite`,
    } as Record<string, string>,
  }));
});

// ---- 滚轮微调：仅待机态生效 ----
const onWheel = (e: WheelEvent) => {
  if (!props.wheelEnabled) return
  if (props.uiPhase !== 'idle') return
  emit('wheelAdjust', e.deltaY < 0 ? -1 : 1)
}
</script>
