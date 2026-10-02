<template>
  <div class="relative w-36 h-36 flex items-center justify-center select-none">
    <!-- 外层漫射呼吸光晕 -->
    <div
      class="absolute inset-2 rounded-full pointer-events-none transition-all duration-700"
      :class="{
        'zen-glow-breathing': isRunning,
        'opacity-30': isPaused,
        'zen-glow-break': isBreak,
      }"
      :style="glowStyle"
    ></div>

    <!-- SVG 极简平滑环 -->
    <svg
      class="w-full h-full transform -rotate-90 relative z-10"
      viewBox="0 0 120 120"
    >
      <!-- 轨道底环 -->
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke-width="4.5"
        class="zen-track"
        style="fill: none !important;"
      />
      <!-- 动态高光进度弧 -->
      <circle
        cx="60"
        cy="60"
        r="52"
        stroke-width="5"
        stroke-linecap="round"
        class="zen-arc"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        style="fill: none !important; transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);"
      />
    </svg>

    <!-- 中心数字与状态 -->
    <div class="absolute inset-0 flex flex-col items-center justify-center z-20 select-text">
      <span
        class="text-2xl font-black font-mono font-tabular tracking-wide transition-colors"
        :style="{ color: 'var(--b3-theme-on-background)' }"
      >
        {{ timerDisplayText }}
      </span>
      <span
        class="text-[11px] mt-0.5 font-medium transition-opacity"
        :style="{
          color: 'var(--b3-theme-on-surface-light, var(--b3-theme-on-surface))', opacity: 0.8,
        }"
      >
        {{ subDisplayText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  progress: number // 0 到 1
  timerDisplayText: string
  subDisplayText: string
  state: 'idle' | 'running' | 'paused' | 'break'
}>()

const circumference = 326.72 // 2 * Math.PI * 52;

const isRunning = computed(() => props.state === 'running');
const isPaused = computed(() => props.state === 'paused');
const isBreak = computed(() => props.state === 'break');

const dashOffset = computed(() => {
  if (props.state === 'idle') return 0
  return circumference * (1 - Math.max(0, Math.min(1, props.progress)))
})

const glowStyle = computed(() => {
  if (isBreak.value) {
    return {
      background: 'radial-gradient(circle, color-mix(in srgb, var(--st-success, #10b981) 18%, transparent) 0%, transparent 70%)',
      filter: 'blur(10px)',
    }
  }
  return {
    background: 'radial-gradient(circle, color-mix(in srgb, var(--b3-theme-primary) 22%, transparent) 0%, transparent 72%)',
    filter: 'blur(10px)',
  }
})
</script>

<style scoped>
.zen-track {
  stroke: color-mix(in srgb, var(--b3-theme-on-background) 8%, transparent);
}

.zen-arc {
  stroke: var(--b3-theme-primary);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--b3-theme-primary) 40%, transparent));
}

@keyframes zenBreath {
  0%, 100% {
    transform: scale(0.96);
    opacity: 0.35;
  }
  50% {
    transform: scale(1.06);
    opacity: 0.85;
  }
}

.zen-glow-breathing {
  animation: zenBreath 4.5s ease-in-out infinite;
}

.zen-glow-break {
  animation: zenBreath 6s ease-in-out infinite;
}
</style>
