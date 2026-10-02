<template>
  <div
    class="sandfall-dial"
    aria-hidden="true"
  >
    <svg
      class="sandfall-svg"
      style="fill: none !important;"
      viewBox="0 0 216 216"
      focusable="false"
    >
      <!-- 中段留给时间与副标：轮廓和沙量都不穿过文字。 -->
      <path
        class="sand-frame"
        d="M62 18 H154 L118 64 H98 Z M98 158 H118 L154 204 H62 Z"
      />
      <template v-if="!stopwatch">
        <path
          v-if="fraction < 1"
          class="sand-fill sand-fill--top st-pomo-anim-soft"
          :d="topSand.path"
        />
        <path
          v-if="fraction > 0"
          class="sand-fill sand-fill--bottom st-pomo-anim-soft"
          :d="bottomSandPath"
        />
        <g
          v-if="fraction < 1"
          class="sand-cursor st-pomo-anim-soft"
          :style="{
            transform: `translate(${topSand.left}px, ${topSand.surface}px)`,
          }"
        >
          <path
            class="sand-tab"
            d="M-2 -5 H2 Q3 -5 3 -4 V2 L0 4 L-3 2 V-4 Q-3 -5 -2 -5 Z"
          />
        </g>
      </template>
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

// 两个等容积梯形腔。反解面积求沙面高度，保证上下沙量守恒，而非线性缩放装饰图。
const height = 42
const narrowHalf = 9
const wideHalf = 44
const slope = (wideHalf - narrowHalf) / height
const capacity = (narrowHalf + wideHalf) * height

const topSand = computed(() => {
  const area = capacity * (1 - fraction.value)
  const depth =
    (Math.sqrt((2 * narrowHalf) ** 2 + 4 * slope * area) - 2 * narrowHalf)
    / (2 * slope)
  const half = narrowHalf + slope * depth
  const surface = 62 - depth
  const left = 108 - half
  return {
    left,
    surface,
    path: `M${left} ${surface} H${108 + half} L117 62 H99 Z`,
  }
})

const bottomSandPath = computed(() => {
  const area = capacity * fraction.value
  const depth =
    (2 * wideHalf - Math.sqrt((2 * wideHalf) ** 2 - 4 * slope * area))
    / (2 * slope)
  const half = wideHalf - slope * depth
  const surface = 202 - depth
  return `M${108 - half} ${surface} H${108 + half} L152 202 H64 Z`
})
</script>

<style scoped>
.sandfall-dial,
.sandfall-svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 与光环、刻度一致的氛围层：三个表盘共用同一束相位光。 */
.sandfall-dial::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 12%,
    color-mix(
      in srgb,
      var(--st-pomo-accent, var(--b3-theme-primary)) 9%,
      transparent
    ),
    transparent 52%
  );
  pointer-events: none;
}

.sandfall-svg,
.sand-frame {
  fill: none !important;
}

.sand-frame {
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)
  );
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.sand-fill {
  stroke: none;
  transition: d 240ms linear;
}

.sand-fill--top {
  fill: color-mix(
    in srgb,
    var(--st-pomo-accent, var(--b3-theme-primary)) 24%,
    transparent
  );
}

.sand-fill--bottom {
  fill: color-mix(
    in srgb,
    var(--st-pomo-accent, var(--b3-theme-primary)) 52%,
    transparent
  );
}

.sand-cursor {
  transition: transform 240ms linear;
}

.sand-tab {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
  stroke: none;
}

@media (prefers-reduced-motion: reduce) {
  .st-pomo-anim-soft {
    transition: none !important;
  }
}
</style>
