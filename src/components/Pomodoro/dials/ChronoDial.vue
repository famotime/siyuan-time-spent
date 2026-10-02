<template>
  <div
    class="chrono-dial"
    aria-hidden="true"
  >
    <svg
      class="chrono-svg"
      style="fill: none !important;"
      viewBox="0 0 216 216"
      focusable="false"
    >
      <circle
        class="chrono-track"
        cx="108"
        cy="108"
        r="103"
      />
      <line
        v-for="tick in ticks"
        :key="tick.index"
        class="chrono-tick st-pomo-anim-soft"
        :class="{
          'chrono-tick--major': tick.major,
          'chrono-tick--lit': !stopwatch && fraction > tick.index / 60,
        }"
        :x1="tick.x1"
        :y1="tick.y1"
        :x2="tick.x2"
        :y2="tick.y2"
      />
      <!-- 不穿过中心数字的页签游标，不再制造第二个旋转表圈。 -->
      <g
        v-if="!stopwatch"
        class="chrono-cursor st-pomo-anim-soft"
        :style="{ transform: `rotate(${fraction * 360}deg)` }"
      >
        <path
          class="chrono-tab"
          d="M105 1 H111 Q112 1 112 2 V11 L108 14 L104 11 V2 Q104 1 105 1 Z"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { UiPhase } from '../../../utils/pomodoro'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    progress: number
    uiPhase: UiPhase
    isStopwatch?: boolean
  }>(),
  { isStopwatch: false },
)

const stopwatch = computed(
  () =>
    props.isStopwatch
    && props.uiPhase !== 'short-break'
    && props.uiPhase !== 'long-break',
)
const fraction = computed(() =>
  props.uiPhase === 'idle' || !Number.isFinite(props.progress)
    ? 0
    : Math.max(0, Math.min(1, props.progress)),
)

// 60 个固定刻度；仅目标进度改变时着色，无时钟、轮询或装饰转动。
const ticks = Array.from({ length: 60 }, (_, index) => {
  const angle = (index * Math.PI) / 30 - Math.PI / 2
  const major = index % 5 === 0
  const inner = major ? 88 : 93
  return {
    index,
    major,
    x1: 108 + Math.cos(angle) * inner,
    y1: 108 + Math.sin(angle) * inner,
    x2: 108 + Math.cos(angle) * 98,
    y2: 108 + Math.sin(angle) * 98,
  }
})
</script>

<style scoped>
.chrono-dial,
.chrono-svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 与光环一致的氛围层：只跟相位取色，三个表盘 therefore 是一家。 */
.chrono-dial::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 16%,
    color-mix(
      in srgb,
      var(--st-pomo-accent, var(--b3-theme-primary)) 8%,
      transparent
    ),
    transparent 52%
  );
  pointer-events: none;
}

.chrono-svg,
.chrono-track,
.chrono-tick {
  fill: none !important;
}

.chrono-track {
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)
  );
  stroke-width: 1;
}

.chrono-tick {
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)
  );
  stroke-width: 1;
  stroke-linecap: round;
  transition: stroke 180ms ease;
}

.chrono-tick--major {
  stroke: var(--st-pomo-muted, var(--b3-theme-on-surface));
  stroke-width: 1.5;
}

.chrono-tick--lit {
  stroke: var(--st-pomo-accent, var(--b3-theme-primary));
}

.chrono-cursor {
  transform-origin: 108px 108px;
  transition: transform 240ms linear;
}

.chrono-tab {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
  stroke: none;
}

@media (prefers-reduced-motion: reduce) {
  .st-pomo-anim-soft {
    transition: none !important;
  }
}
</style>
