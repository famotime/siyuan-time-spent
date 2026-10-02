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
      <!-- 内圈辅助刻度轨道，增强高级腕表层次感 -->
      <circle
        class="chrono-subtrack"
        cx="108"
        cy="108"
        r="84"
      />
      <!-- 60 分钟主次刻度线 -->
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
      <!-- 12 点位辅助微刻度点 -->
      <circle
        v-for="dot in hourDots"
        :key="dot.index"
        class="chrono-hour-dot"
        :class="{ 'chrono-hour-dot--lit': fraction > dot.index / 12 }"
        :cx="dot.cx"
        :cy="dot.cy"
        r="1.2"
      />

      <!-- 仿时钟指针：高级制表镂空骨架与平衡配重秒针 -->
      <g class="chrono-hands">
        <!-- 时针：雅致镂空骨架梭形，通透内槽避让数字；12h/圈 -->
        <g
          class="chrono-hand chrono-hand--hour"
          :style="{ transform: `rotate(${hourAngle}deg)` }"
        >
          <path
            class="chrono-needle-skeleton chrono-needle--hour"
            d="
              M 108 64
              L 112 86
              L 111 108
              L 105 108
              L 104 86
              Z
              M 108 72
              L 110 86
              L 109.2 101
              L 106.8 101
              L 106 86
              Z
            "
            fill-rule="evenodd"
          />
          <line
            x1="108"
            y1="64"
            x2="108"
            y2="72"
            class="chrono-needle-ridge"
          />
        </g>

        <!-- 分针：长而挺拔的镂空骨架剑形，60min/圈 -->
        <g
          class="chrono-hand chrono-hand--minute"
          :style="{ transform: `rotate(${minuteAngle}deg)` }"
        >
          <path
            class="chrono-needle-skeleton chrono-needle--minute"
            d="
              M 108 34
              L 111.2 74
              L 110.2 108
              L 105.8 108
              L 104.8 74
              Z
              M 108 43
              L 109.8 74
              L 108.8 102
              L 107.2 102
              L 106.2 74
              Z
            "
            fill-rule="evenodd"
          />
          <line
            x1="108"
            y1="34"
            x2="108"
            y2="43"
            class="chrono-needle-ridge"
          />
        </g>

        <!-- 秒针：细长精准扫秒，配经典圆环平衡配重尾翼与先锋红针 -->
        <g
          class="chrono-hand chrono-hand--second"
          :style="{ transform: `rotate(${secondAngle}deg)` }"
        >
          <line
            x1="108"
            y1="108"
            x2="108"
            y2="28"
            class="chrono-second-blade"
          />
          <line
            x1="108"
            y1="108"
            x2="108"
            y2="126"
            class="chrono-second-counterweight-stem"
          />
          <circle
            cx="108"
            cy="119"
            r="3.2"
            class="chrono-second-counterweight-ring"
          />
          <circle
            cx="108"
            cy="125"
            r="0.8"
            class="chrono-second-counterweight-tip"
          />
          <circle
            cx="108"
            cy="108"
            r="2.2"
            class="chrono-second-pivot-cap"
          />
        </g>

        <!-- 表盘中央双层立体金属铆钉轴心 -->
        <circle
          cx="108"
          cy="108"
          r="4.2"
          class="chrono-pivot-collar"
        />
        <circle
          cx="108"
          cy="108"
          r="2.8"
          class="chrono-pivot-ring"
        />
        <circle
          cx="108"
          cy="108"
          r="1.2"
          class="chrono-pivot-core"
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

// 12 个辅助微刻度点（对应 12 个小时位）
const hourDots = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6 - Math.PI / 2
  return {
    index,
    cx: 108 + Math.cos(angle) * 84,
    cy: 108 + Math.sin(angle) * 84,
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

/* 与光环一致的氛围层：只跟相位取色，三个表盘统一 */
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
.chrono-subtrack,
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

.chrono-subtrack {
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 7%, transparent)
  );
  stroke-width: 0.75;
  stroke-dasharray: 2 4;
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

.chrono-hour-dot {
  fill: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 16%, transparent)
  );
  transition: fill 0.2s ease;
}

.chrono-hour-dot--lit {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
}

/* 角度由 useDialMotion 每帧写入，不靠 CSS 过渡补间 */
.chrono-hand {
  transform-origin: 108px 108px;
}

/* 镂空骨架指针样式：通透半透明填充 + 精致立体边框 */
.chrono-needle-skeleton {
  fill: var(--st-pomo-ink, var(--b3-theme-on-background));
  fill-opacity: 0.18;
  stroke: var(--st-pomo-ink, var(--b3-theme-on-background));
  stroke-width: 0.85;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.chrono-needle--hour {
  opacity: 0.95;
}

.chrono-needle--minute {
  opacity: 0.85;
}

.chrono-needle-ridge {
  stroke: var(--st-pomo-ink, var(--b3-theme-on-background));
  stroke-width: 0.85;
  stroke-linecap: round;
  opacity: 0.9;
}

/* 秒针：先锋红针/主题色高质感配重 */
.chrono-second-blade {
  stroke: var(--st-pomo-second-hand, #e04040);
  stroke-width: 1.1;
  stroke-linecap: round;
}

.chrono-second-counterweight-stem {
  stroke: var(--st-pomo-second-hand, #e04040);
  stroke-width: 0.9;
  stroke-linecap: round;
}

.chrono-second-counterweight-ring {
  fill: var(--st-pomo-surface, #ffffff);
  stroke: var(--st-pomo-second-hand, #e04040);
  stroke-width: 1.1;
}

.chrono-second-counterweight-tip {
  fill: var(--st-pomo-second-hand, #e04040);
  stroke: none;
}

.chrono-second-pivot-cap {
  fill: var(--st-pomo-second-hand, #e04040);
  stroke: none;
}

/* 双层同心金属铆钉轴心 */
.chrono-pivot-collar {
  fill: var(--st-pomo-surface, #ffffff);
  stroke: var(
    --st-pomo-line,
    color-mix(in srgb, var(--b3-theme-on-background) 24%, transparent)
  );
  stroke-width: 1;
}

.chrono-pivot-ring {
  fill: var(--st-pomo-muted, var(--b3-theme-on-surface));
  opacity: 0.5;
}

.chrono-pivot-core {
  fill: var(--st-pomo-second-hand, #e04040);
}
</style>
