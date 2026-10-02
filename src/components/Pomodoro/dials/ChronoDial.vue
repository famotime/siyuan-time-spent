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
        class="chrono-tick"
        :class="{
          'chrono-tick--major': tick.major,
          'chrono-tick--lit': fraction > tick.index / 60,
        }"
        :x1="tick.x1"
        :y1="tick.y1"
        :x2="tick.x2"
        :y2="tick.y2"
      />
      <!-- 仿时钟指针：倒计时、正计时、休息三种计时共用同一套走时 -->
      <g class="chrono-hands">
        <!-- 时针：短而粗，锥形；12h/圈 -->
        <g
          class="chrono-hand chrono-hand--hour"
          :style="{ transform: `rotate(${hourAngle}deg)` }"
        >
          <path
            d="M105 108 L108 62 L111 108 Z"
            fill="currentColor"
            opacity=".92"
          />
        </g>
        <!-- 分针：长而细，锥形；60min/圈 -->
        <g
          class="chrono-hand chrono-hand--minute"
          :style="{ transform: `rotate(${minuteAngle}deg)` }"
        >
          <path
            d="M106.5 108 L108 40 L109.5 108 Z"
            fill="currentColor"
            opacity=".78"
          />
        </g>
        <!-- 秒针：最细最长，60s/圈，真实钟表速度扫动 -->
        <g
          class="chrono-hand chrono-hand--second"
          :style="{ transform: `rotate(${secondAngle}deg)` }"
        >
          <line
            x1="108"
            y1="118"
            x2="108"
            y2="36"
            stroke="#e04040"
            stroke-width="1"
            stroke-linecap="round"
          />
          <circle
            cx="108"
            cy="108"
            r="2.5"
            fill="#e04040"
            opacity=".85"
          />
        </g>
        <!-- 中心铆钉 -->
        <circle
          cx="108"
          cy="108"
          r="3.2"
          fill="currentColor"
          opacity=".8"
        />
        <circle
          cx="108"
          cy="108"
          r="1.8"
          fill="var(--st-pomo-surface, #fff)"
          opacity=".6"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const {
  motionMs,
  fraction,
} = useDialMotion({
  anchorMs: () => props.elapsedMs,
  live: () => props.motionLive,
  smooth: () => props.smoothMotion,
  totalMs: () => props.totalMs,
  sweep: () => props.motionSweep,
})

// 仿真钟表的角速度：秒针 6°/s、分针 0.1°/s、时针 1/120°/s
const seconds = computed(() => motionMs.value / 1000)
const hourAngle = computed(() => ((seconds.value / 3600) % 12) / 12 * 360)
const minuteAngle = computed(() => ((seconds.value / 60) % 60) / 60 * 360)
const secondAngle = computed(() => (((seconds.value % 60) / 60) * 360))

// 60 个固定刻度；着色刻度只跟随同一根走时基线，无轮询、无装饰转动。
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
}

.chrono-tick--major {
  stroke: var(--st-pomo-muted, var(--b3-theme-on-surface));
  stroke-width: 1.5;
}

.chrono-tick--lit {
  stroke: var(--st-pomo-accent, var(--b3-theme-primary));
}

/* 角度由 useDialMotion 每帧写入，不靠 CSS 过渡补间 */
.chrono-hand {
  transform-origin: 108px 108px;
}
</style>
