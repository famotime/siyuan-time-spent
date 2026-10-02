<template>
  <div
    class="aurora-dial"
    aria-hidden="true"
  >
    <div class="aurora-glow"></div>
    <svg
      class="aurora-svg"
      style="fill: none !important;"
      viewBox="0 0 216 216"
      focusable="false"
    >
      <circle
        class="aurora-track"
        cx="108"
        cy="108"
        r="97"
      />
      <circle
        v-if="!stopwatch && fraction > 0"
        class="aurora-arc st-pomo-anim-soft"
        cx="108"
        cy="108"
        r="97"
        pathLength="1"
        transform="rotate(-90 108 108)"
        stroke-dasharray="1 1"
        :stroke-dashoffset="1 - fraction"
      />
      <!-- 页签形游标：唯一强调，位置只由实际进度驱动。 -->
      <g
        v-if="!stopwatch"
        class="aurora-cursor st-pomo-anim-soft"
        :style="{ transform: `rotate(${fraction * 360}deg)` }"
      >
        <path
          class="aurora-tab"
          d="M105 5 H111 Q112 5 112 6 V15 L108 18 L104 15 V6 Q104 5 105 5 Z"
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
</script>

<style scoped>
.aurora-dial {
  position: relative;
  width: 100%;
  height: 100%;
}

.aurora-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 32% 14%,
    color-mix(
      in srgb,
      var(--st-pomo-accent, var(--b3-theme-primary)) 10%,
      transparent
    ),
    transparent 48%
  );
  pointer-events: none;
}

.aurora-svg {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  fill: none !important;
}

.aurora-track,
.aurora-arc {
  fill: none !important;
}

.aurora-track {
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)
  );
  stroke-width: 1.5;
}

.aurora-arc {
  stroke: var(--st-pomo-accent, var(--b3-theme-primary));
  stroke-width: 2.25;
  stroke-linecap: round;
  transition: stroke-dashoffset 240ms linear;
}

.aurora-cursor {
  transform-origin: 108px 108px;
  transition: transform 240ms linear;
}

.aurora-tab {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
  stroke: none;
}

@media (prefers-reduced-motion: reduce) {
  .st-pomo-anim-soft {
    transition: none !important;
  }
}
</style>
