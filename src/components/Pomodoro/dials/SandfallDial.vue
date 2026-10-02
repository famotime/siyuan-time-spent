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
      <defs>
        <filter
          id="sf-shadow"
          x="-20%"
          y="-10%"
          width="140%"
          height="120%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            flood-opacity=".08"
          />
        </filter>
      </defs>

      <!-- 沙漏框架：贝塞尔曲线玻璃腔体 -->
      <path
        class="sand-frame"
        d="
          M 74 14
          C 50 14, 36 50, 92 78
          L 124 78
          C 180 50, 166 14, 142 14
          Z
          M 74 202
          C 50 202, 36 166, 92 138
          L 124 138
          C 180 166, 166 202, 142 202
          Z
        "
        filter="url(#sf-shadow)"
      />

      <!-- 沙量填充 -->
      <template v-if="fraction < 1">
        <path
          class="sand-fill sand-fill--top"
          :d="topSand.path"
        />
        <path
          v-if="fraction > 0"
          class="sand-fill sand-fill--bottom"
          :d="bottomSandPath"
        />

        <!-- 中间沙流 -->
        <path
          v-if="fraction > 0.1 && fraction < 0.9"
          class="sand-stream"
          :d="streamPath"
        />

        <!-- 沙面游标 -->
        <g
          class="sand-cursor"
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

      <!-- 玻璃高光 -->
      <path
        class="sand-glare"
        d="
          M 74 14 C 50 14, 36 50, 92 78 L 96 78 C 40 50, 54 14, 78 14 Z
          M 74 202 C 50 202, 36 166, 92 138 L 96 138 C 40 166, 54 202, 78 202 Z
        "
      />
      <path
        class="sand-highlight"
        d="
          M 76 18 C 52 18, 38 52, 94 76 L 96 76 C 42 52, 56 18, 79 18 Z
          M 76 198 C 52 198, 38 154, 94 140 L 96 140 C 42 154, 56 198, 79 198 Z
        "
      />
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

const { fraction } = useDialMotion({
  anchorMs: () => props.elapsedMs,
  live: () => props.motionLive,
  smooth: () => props.smoothMotion,
  totalMs: () => props.totalMs,
  sweep: () => props.motionSweep,
})

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

// 沙流路径：在两个腔体之间出现，模拟沙粒下落
const streamPath = computed(() => {
  if (fraction.value <= 0.1 || fraction.value >= 0.9) return ''
  const t = (fraction.value - 0.1) / 0.8
  const bottom = 78 + 60 * t
  const tw = 2.5
  const bw = 0.7
  return `M${108 - tw} 78 L${108 - bw} ${bottom} L${108 + bw} ${bottom} L${108 + tw} 78 Z`
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

/* 几何形状每帧由 useDialMotion 写入，过渡补间只会让沙面滞后于秒针 */
.sand-fill {
  stroke: none;
}

.sand-fill--top {
  fill: color-mix(
    in srgb,
    var(--st-pomo-accent, var(--b3-theme-primary)) 28%,
    transparent
  );
}

.sand-fill--bottom {
  fill: color-mix(
    in srgb,
    var(--st-pomo-accent, var(--b3-theme-primary)) 58%,
    transparent
  );
}

.sand-stream {
  fill: color-mix(
    in srgb,
    var(--st-pomo-accent, var(--b3-theme-primary)) 42%,
    transparent
  );
  stroke: none;
}

.sand-cursor {
  will-change: transform;
}

.sand-tab {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
  stroke: none;
}

/* 玻璃高光：左侧弧形反光带 */
.sand-glare {
  fill: rgba(255, 255, 255, .07);
  stroke: none;
  pointer-events: none;
}

/* 玻璃高亮：更窄更亮的次级反光 */
.sand-highlight {
  fill: rgba(255, 255, 255, .12);
  stroke: none;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .st-pomo-anim-soft {
    transition: none !important;
  }
}
</style>
