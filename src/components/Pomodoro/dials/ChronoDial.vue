<template>
  <div class="relative w-36 h-36 flex items-center justify-center select-none">
    <!-- SVG 精密 60 格分度表盘 -->
    <svg
      class="w-full h-full relative z-10"
      viewBox="0 0 120 120"
    >
      <!-- 刻度线组 (60 格) -->
      <g transform="translate(60, 60)">
        <line
          v-for="i in 60"
          :key="i"
          :x1="0"
          :y1="-52"
          :x2="0"
          :y2="i % 5 === 0 ? -44 : -47"
          :stroke-width="i % 5 === 0 ? 1.75 : 1"
          :stroke="getTickColor(i)"
          :transform="`rotate(${(i - 1) * 6})`"
          style="transition: stroke 0.25s ease;"
        />
      </g>

      <!-- 4 个主要基准数字 (15, 30, 45, 60) -->
      <text
        x="60"
        y="22"
        font-size="7"
        font-weight="700"
        text-anchor="middle"
        fill="currentColor"
        class="chrono-subtext"
      >60</text>
      <text
        x="102"
        y="62.5"
        font-size="7"
        font-weight="700"
        text-anchor="middle"
        fill="currentColor"
        class="chrono-subtext"
      >15</text>
      <text
        x="60"
        y="104"
        font-size="7"
        font-weight="700"
        text-anchor="middle"
        fill="currentColor"
        class="chrono-subtext"
      >30</text>
      <text
        x="18"
        y="62.5"
        font-size="7"
        font-weight="700"
        text-anchor="middle"
        fill="currentColor"
        class="chrono-subtext"
      >45</text>

      <!-- 动态发条扫视指针 (极简微光指示圆点) -->
      <circle
        v-if="state !== 'idle'"
        :cx="pipPosition.x"
        :cy="pipPosition.y"
        r="2.5"
        fill="var(--b3-theme-primary)"
        class="chrono-pip"
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
        class="text-[10px] uppercase font-mono tracking-wider mt-0.5"
        :style="{
          color: 'var(--b3-theme-primary)', opacity: 0.9,
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

// 计算高亮刻度
const activeTickIndex = computed(() => {
  if (props.state === 'idle') return 0
  return Math.round(props.progress * 60)
})

const getTickColor = (tickIndex: number) => {
  if (props.state === 'idle') {
    return tickIndex % 5 === 0
      ? 'color-mix(in srgb, var(--b3-theme-on-background) 30%, transparent)'
      : 'color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)'
  }

  const isHighlighted = tickIndex <= activeTickIndex.value
  if (isHighlighted) {
    return 'var(--b3-theme-primary)'
  }
  return tickIndex % 5 === 0
    ? 'color-mix(in srgb, var(--b3-theme-on-background) 25%, transparent)'
    : 'color-mix(in srgb, var(--b3-theme-on-background) 10%, transparent)'
}

// 扫视指示点坐标计算 (r = 45.5)
const pipPosition = computed(() => {
  const angleDeg = (props.progress * 360) - 90
  const angleRad = (angleDeg * Math.PI) / 180
  const r = 45.5
  return {
    x: 60 + r * Math.cos(angleRad),
    y: 60 + r * Math.sin(angleRad),
  }
})
</script>

<style scoped>
.chrono-subtext {
  opacity: 0.35;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.chrono-pip {
  filter: drop-shadow(0 0 3px var(--b3-theme-primary));
  transition: cx 0.4s cubic-bezier(0.4, 0, 0.2, 1), cy 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
