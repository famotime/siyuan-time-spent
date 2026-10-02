<template>
  <div class="relative w-full h-full flex items-center justify-center">
    <!-- 外层漫射呼吸光晕 -->
    <div
      class="absolute inset-3 rounded-full pointer-events-none st-pomo-anim"
      :class="glowClass"
      :style="glowStyle"
    ></div>

    <svg
      class="relative z-10 w-full h-full"
      viewBox="0 0 120 120"
      style="fill: none !important;"
      aria-hidden="true"
    >
      <!-- 底轨 -->
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke-width="4.5"
        class="aurora-track"
      />

      <!-- 主进度弧 -->
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke-width="5"
        stroke-linecap="round"
        :stroke="tint"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="aurora-arc"
      />

      <!-- 第二条极光带：更长节距，缓慢同向漂移 -->
      <circle
        v-if="showBands"
        cx="60"
        cy="60"
        r="44"
        stroke-width="2"
        stroke-linecap="round"
        :stroke="tint"
        :stroke-dasharray="bandDash"
        :stroke-dashoffset="bandOffsetA"
        class="aurora-band aurora-band--a st-pomo-anim"
      />

      <!-- 第三条极光带：反向漂移，仅灵动档显示 -->
      <circle
        v-if="showBands && expressive"
        cx="60"
        cy="60"
        r="36"
        stroke-width="1.5"
        stroke-linecap="round"
        :stroke="tint"
        :stroke-dasharray="bandDash"
        :stroke-dashoffset="bandOffsetB"
        class="aurora-band aurora-band--b st-pomo-anim"
      />

      <!-- 内核柔光：随进度收缩的能量核 -->
      <circle
        cx="60"
        cy="60"
        :r="coreRadius"
        :fill="coreFill"
        class="aurora-core"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UiPhase } from '../../../utils/pomodoro';

const props = defineProps<{
  progress: number;
  displayText?: string;
  subtitle?: string;
  uiPhase: UiPhase;
  frozen: boolean;
  heat: number;
  expressive?: boolean;
}>();

const circumference = 326.72; // 2 * Math.PI * 52

/** 进度弧跟随色温通道，回落为主机主题色 */
const tint = 'var(--pomo-tint, var(--b3-theme-primary))';

const dashOffset = computed(() => {
  if (props.uiPhase === 'idle') return 0;
  return circumference * (1 - Math.max(0, Math.min(1, props.progress)));
});

const showBands = computed(() => props.uiPhase !== 'idle');

const bandDash = computed(() => {
  // 节距随相位变化：专注时紧凑，休息时舒张
  const isBreak = props.uiPhase === 'short-break' || props.uiPhase === 'long-break';
  return isBreak ? '10 16' : '6 18';
});

const bandOffsetA = computed(() => -props.progress * 120);
const bandOffsetB = computed(() => props.progress * 160);

/** 能量核随进度外扩，凝滞时收缩为一点 */
const coreRadius = computed(() => {
  if (props.frozen) return 6;
  const base = props.uiPhase === 'idle' ? 10 : 12;
  return base + props.progress * 12;
});

const coreFill = computed(() => {
  if (props.frozen) return 'var(--st-pomo-frozen-bg)';
  return 'color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 14%, transparent)';
});

const glowClass = computed(() => {
  if (props.frozen) return 'aurora-glow--frozen';
  if (props.uiPhase === 'short-break' || props.uiPhase === 'long-break') return 'aurora-glow--break';
  if (props.uiPhase === 'idle') return '';
  return 'aurora-glow--focus st-pomo-anim';
});

const glowStyle = computed(() => {
  const phase = props.uiPhase;
  if (props.frozen) {
    return { background: 'radial-gradient(circle, var(--st-pomo-frozen-bg) 0%, transparent 70%)' };
  }
  if (phase === 'short-break' || phase === 'long-break') {
    return { background: 'radial-gradient(circle, var(--st-pomo-break-bg) 0%, transparent 72%)' };
  }
  if (phase === 'idle') {
    return { background: 'radial-gradient(circle, color-mix(in srgb, var(--b3-theme-primary) 12%, transparent) 0%, transparent 72%)' };
  }
  return {
    background: 'radial-gradient(circle, color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 22%, transparent) 0%, transparent 72%)',
    filter: 'blur(10px)',
  };
});
</script>

<style scoped>
.aurora-track {
  stroke: color-mix(in srgb, var(--b3-theme-on-background) 8%, transparent);
}

.aurora-arc {
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 45%, transparent));
  transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.aurora-band {
  opacity: 0.4;
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke-dasharray 1.2s ease;
}

.aurora-band--a {
  animation: st-pomo-aurora-drift 12s linear infinite;
}

.aurora-band--b {
  opacity: 0.26;
  animation: st-pomo-aurora-drift 18s linear infinite reverse;
}

.aurora-core {
  transition: r 0.6s cubic-bezier(0.16, 1, 0.3, 1), fill 1.2s linear;
}

.aurora-glow--focus {
  animation: st-pomo-breath var(--st-pomo-breath-period) ease-in-out infinite;
}

.aurora-glow--break {
  opacity: 0.5;
  animation: st-pomo-breath 18s ease-in-out infinite;
}

.aurora-glow--frozen {
  opacity: 0.35;
  animation: st-pomo-frozen-frost 2.4s ease-in-out infinite;
  filter: grayscale(0.9);
}
</style>
