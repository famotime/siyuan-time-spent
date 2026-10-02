<template>
  <div class="relative w-full h-full flex items-center justify-center">
    <!-- 达成时的能量晶体微光光晕 -->
    <div
      v-if="isComplete"
      class="absolute inset-4 rounded-full pointer-events-none st-pomo-anim"
      :style="bloomStyle"
      aria-hidden="true"
    ></div>

    <svg
      class="relative z-10 w-full h-full"
      viewBox="0 0 120 120"
      style="fill: none !important;"
      aria-hidden="true"
    >
      <!-- 极简沙漏外框 -->
      <path
        d="M38 22 H82 C82 45, 68 55, 62 60 C68 65, 82 75, 82 98 H38 C38 75, 52 65, 58 60 C52 55, 38 45, 38 22 Z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="sand-frame"
      />

      <!-- 上腔：倒计时收缩的沙丘 -->
      <path :d="topSandPath" class="sand-top" />

      <!-- 下腔：积蓄堆叠的知识晶体 -->
      <path :d="bottomSandPath" class="sand-bottom" />

      <!-- 颈部流淌的光子微流 -->
      <line
        v-if="isRunning"
        x1="60"
        y1="58"
        x2="60"
        y2="86"
        :stroke="tint"
        stroke-width="1.5"
        stroke-dasharray="2 3"
        class="sand-stream st-pomo-anim"
      />

      <!-- 凝滞态：沙流悬止的视觉提示 -->
      <line
        v-else-if="frozen"
        x1="56"
        y1="60"
        x2="64"
        y2="60"
        stroke="var(--st-pomo-frozen-text)"
        stroke-width="1.5"
        stroke-linecap="round"
        class="st-pomo-anim"
        style="animation: st-pomo-frozen-frost 2.4s ease-in-out infinite;"
      />

      <!-- 达成涟漪环 -->
      <circle
        v-if="isComplete"
        cx="60"
        cy="80"
        r="12"
        :stroke="tint"
        stroke-width="1.5"
        class="sand-bloom-ring st-pomo-anim"
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
}>();

const tint = 'var(--pomo-tint, var(--b3-theme-primary))';
const isRunning = computed(() => props.uiPhase === 'focus' && !props.frozen);
const isComplete = computed(() => (
  props.progress >= 0.985 && props.uiPhase !== 'idle'
));

/** 上腔沙丘：随进度下降并收拢成漏斗颈 */
const topSandPath = computed(() => {
  const f = 1 - props.progress;
  if (props.uiPhase === 'idle') {
    return 'M42 25 H78 C78 43, 66 51, 60 56 C54 51, 42 43, 42 25 Z';
  }
  if (f <= 0.05) return 'M58 56 H62 Z';
  const yTop = 25 + (1 - f) * 27;
  const half = 18 - (1 - f) * 10;
  return `M${60 - half} ${yTop} H${60 + half} C${60 + half} 48, 64 54, 60 56 C56 54, ${60 - half} 48, ${60 - half} ${yTop} Z`;
});

/** 下腔晶体：随进度堆积增高，收口成锥形结晶 */
const bottomSandPath = computed(() => {
  const f = Math.max(0.04, props.progress);
  if (props.uiPhase === 'idle') return 'M42 95 H78 Z';
  const yTop = 95 - f * 27;
  const half = 18 - (1 - f) * 9;
  return `M${60 - half} ${yTop} Q60 ${yTop - 4} ${60 + half} ${yTop} L${60 + half} 95 H${60 - half} Z`;
});

const bloomStyle = computed(() => ({
  background: 'radial-gradient(circle, color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 20%, transparent) 0%, transparent 72%)',
  filter: 'blur(6px)',
}));
</script>

<style scoped>
.sand-frame {
  color: color-mix(in srgb, var(--b3-theme-on-background) 22%, transparent);
}

.sand-top {
  fill: color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 32%, transparent);
  transition: d 0.5s cubic-bezier(0.4, 0, 0.2, 1), fill 1.2s linear;
}

.sand-bottom {
  fill: var(--pomo-tint, var(--b3-theme-primary));
  filter: drop-shadow(0 -2px 7px color-mix(in srgb, var(--pomo-tint, var(--b3-theme-primary)) 45%, transparent));
  transition: d 0.5s cubic-bezier(0.4, 0, 0.2, 1), fill 1.2s linear;
}

.sand-stream {
  animation: st-pomo-sandfall 0.9s linear infinite;
}

.sand-bloom-ring {
  transform-origin: 60px 80px;
  animation: st-pomo-bloom var(--st-pomo-bloom-duration) cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
</style>
