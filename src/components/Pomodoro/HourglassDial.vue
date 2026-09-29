<template>
  <div class="relative w-36 h-36 flex items-center justify-center select-none">
    <!-- SVG 双漏斗现代抽象沙漏 -->
    <svg class="w-full h-full relative z-10" viewBox="0 0 120 120">
      <!-- 极简沙漏外框线条 -->
      <path
        d="M38 24 H82 C82 46, 68 56, 62 60 C68 64, 82 74, 82 96 H38 C38 74, 52 64, 58 60 C52 56, 38 46, 38 24 Z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="hourglass-frame"
        style="fill: none !important;"
      />

      <!-- 上层倒计时收缩液体/粒子沙丘 -->
      <path
        :d="topSandPath"
        class="hourglass-sand-top"
      />

      <!-- 下层能量结晶堆叠沙丘 -->
      <path
        :d="bottomSandPath"
        class="hourglass-sand-bottom"
      />

      <!-- 中间流淌的光子微流细线 (运行中动画) -->
      <line
        v-if="isRunning"
        x1="60"
        y1="58"
        x2="60"
        y2="88"
        stroke="var(--b3-theme-primary)"
        stroke-width="1.5"
        stroke-dasharray="2,3"
        class="hourglass-stream"
      />

      <!-- 达成时的能量晶体微光光晕 -->
      <circle
        v-if="progress >= 0.99 && state !== 'idle'"
        cx="60"
        cy="80"
        r="14"
        class="hourglass-bloom"
      />
    </svg>

    <!-- 中心数字与状态 (以悬浮半透明微层呈现) -->
    <div class="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
      <span 
        class="text-2xl font-black font-mono font-tabular tracking-wide transition-colors drop-shadow-sm"
        :style="{ color: 'var(--b3-theme-on-background)' }"
      >
        {{ timerDisplayText }}
      </span>
      <span 
        class="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full mt-0.5 bg-black/5 dark:bg-white/5"
        :style="{ color: 'var(--b3-theme-on-surface-light, var(--b3-theme-on-surface))' }"
      >
        {{ subDisplayText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  progress: number; // 0 到 1 (0 为刚开始，1 为完成)
  timerDisplayText: string;
  subDisplayText: string;
  state: 'idle' | 'running' | 'paused' | 'break';
}>();

const isRunning = computed(() => props.state === 'running');

// 上层沙堆高度：随 progress 增加而降低 (Y: 26 -> 54)
const topSandPath = computed(() => {
  if (props.state === 'idle') {
    return 'M42 27 H78 C78 44, 66 52, 60 56 C54 52, 42 44, 42 27 Z';
  }
  const factor = 1 - props.progress;
  if (factor <= 0.05) return 'M58 56 H62 Z';
  const yTop = 27 + (1 - factor) * 26;
  const leftX = 42 + (1 - factor) * 12;
  const rightX = 78 - (1 - factor) * 12;
  return `M${leftX} ${yTop} H${rightX} C${rightX} 48, 64 54, 60 56 C56 54, ${leftX} 48, ${leftX} ${yTop} Z`;
});

// 下层沙堆/晶体高度：随 progress 增加而堆积 (Y: 93 -> 66)
const bottomSandPath = computed(() => {
  if (props.state === 'idle') return 'M42 93 H78 Z';
  const factor = Math.max(0.05, props.progress);
  const yTop = 93 - factor * 25;
  const leftX = 42 + (1 - factor) * 8;
  const rightX = 78 - (1 - factor) * 8;
  return `M${leftX} ${yTop} Q60 ${yTop - 3} ${rightX} ${yTop} L80 93 H40 Z`;
});
</script>

<style scoped>
.hourglass-frame {
  color: color-mix(in srgb, var(--b3-theme-on-background) 22%, transparent);
}

.hourglass-sand-top {
  fill: color-mix(in srgb, var(--b3-theme-primary) 30%, transparent);
  transition: all 0.5s ease;
}

.hourglass-sand-bottom {
  fill: var(--b3-theme-primary);
  filter: drop-shadow(0 -2px 6px color-mix(in srgb, var(--b3-theme-primary) 40%, transparent));
  transition: all 0.5s ease;
}

@keyframes streamFlow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 10; }
}

.hourglass-stream {
  animation: streamFlow 0.8s linear infinite;
}

@keyframes bloomPulse {
  0%, 100% { transform: scale(0.9); opacity: 0.4; }
  50% { transform: scale(1.15); opacity: 0.85; }
}

.hourglass-bloom {
  fill: color-mix(in srgb, var(--b3-theme-primary) 25%, transparent);
  animation: bloomPulse 2s ease-in-out infinite;
  transform-origin: 60px 80px;
}
</style>
