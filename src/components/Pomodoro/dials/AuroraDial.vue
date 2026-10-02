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
        v-if="fraction > 0"
        class="aurora-arc"
        cx="108"
        cy="108"
        r="97"
        pathLength="1"
        transform="rotate(-90 108 108)"
        stroke-dasharray="1 1"
        :stroke-dashoffset="1 - fraction"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useDialMotion } from '../composables/useDialMotion'

const props = withDefaults(
  defineProps<{
    elapsedMs?: number
    motionLive?: boolean
    totalMs?: number
    motionSweep?: boolean
    smoothMotion?: boolean
  }>(),
  {
    elapsedMs: 0,
    motionLive: false,
    totalMs: 0,
    motionSweep: false,
    smoothMotion: false,
  },
)

const { fraction } = useDialMotion({
  anchorMs: () => props.elapsedMs,
  live: () => props.motionLive,
  smooth: () => props.smoothMotion,
  totalMs: () => props.totalMs,
  sweep: () => props.motionSweep,
})
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
}
</style>
