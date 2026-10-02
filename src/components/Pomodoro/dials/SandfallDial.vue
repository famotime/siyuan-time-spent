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
        <!-- 玻璃体与沙漏外部柔和投影 -->
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
            flood-opacity=".1"
          />
        </filter>

        <!-- 水晶玻璃内腔剪裁路径：杜绝任何流沙与粒子超出玻璃内腔底座 -->
        <clipPath id="sf-inner-cavity">
          <path
            d="
              M 78 27
              C 55 35, 52 70, 101 105
              C 103 106.5, 103 109.5, 101 111
              C 52 146, 55 181, 78 188.5
              L 138 188.5
              C 161 181, 164 146, 115 111
              C 113 109.5, 113 106.5, 115 105
              C 164 70, 161 35, 138 27
              Z
            "
          />
        </clipPath>

        <!-- 上室沙粒渐变：表层稍亮，漏斗底部深沉浓郁 -->
        <linearGradient
          id="sf-sand-top-grad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.32"
          />
          <stop
            offset="100%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.55"
          />
        </linearGradient>

        <!-- 下室沙粒渐变：沙丘顶点受光高亮，底层稳固沉淀 -->
        <linearGradient
          id="sf-sand-bot-grad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.48"
          />
          <stop
            offset="100%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.75"
          />
        </linearGradient>

        <!-- 咽喉流沙渐变 -->
        <linearGradient
          id="sf-stream-grad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.65"
          />
          <stop
            offset="50%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.50"
          />
          <stop
            offset="100%"
            stop-color="var(--st-pomo-accent, var(--b3-theme-primary))"
            stop-opacity="0.70"
          />
        </linearGradient>
      </defs>

      <!-- 沙漏上下端盖支架（金属拉丝或圆润底座） -->
      <g class="sand-caps">
        <path
          class="sand-cap"
          d="M 72 17 h 72 a 3 3 0 0 1 3 3 v 1 a 1 1 0 0 1 -1 1 h -76 a 1 1 0 0 1 -1 -1 v -1 a 3 3 0 0 1 3 -3 z"
        />
        <path
          class="sand-cap"
          d="M 72 194 h 76 a 1 1 0 0 1 1 1 v 1 a 3 3 0 0 1 -3 3 h -72 a 3 3 0 0 1 -3 -3 v -1 a 1 1 0 0 1 1 -1 z"
        />
      </g>

      <!-- 吹制水晶玻璃外廓（无缝双弧体与雅致细颈） -->
      <path
        class="sand-frame-outer"
        d="
          M 76 21
          C 52 30, 48 70, 99 104
          C 101.5 106, 101.5 110, 99 112
          C 48 146, 52 186, 76 195
          L 140 195
          C 164 186, 168 146, 117 112
          C 114.5 110, 114.5 106, 117 104
          C 168 70, 164 30, 140 21
          Z
        "
        filter="url(#sf-shadow)"
      />

      <!-- 水晶玻璃内腔壁（厚壁水晶折射质感） -->
      <path
        class="sand-frame-inner"
        d="
          M 78 27
          C 55 35, 52 70, 101 105
          C 103 106.5, 103 109.5, 101 111
          C 52 146, 55 181, 78 188.5
          L 138 188.5
          C 161 181, 164 146, 115 111
          C 113 109.5, 113 106.5, 115 105
          C 164 70, 161 35, 138 27
          Z
        "
      />

      <!-- 沙量填充与流沙：通过内腔 clipPath 严格限制在玻璃内腔底座内部 -->
      <g
        class="sand-enclosure"
        clip-path="url(#sf-inner-cavity)"
      >
        <!-- 上室漏斗沙量 -->
        <path
          v-if="topSandPath"
          class="sand-fill sand-fill--top"
          :d="topSandPath"
        />

        <!-- 下室堆积沙丘 -->
        <path
          v-if="botSandPath"
          class="sand-fill sand-fill--bottom"
          :d="botSandPath"
        />

        <!-- 细颈流沙瀑布与动态粒子 -->
        <g
          v-if="isStreaming"
          class="sand-stream-group"
        >
          <!-- 主流沙束 -->
          <path
            class="sand-stream"
            :d="streamPath"
          />

          <!-- 动态落沙粒子（走时运行中下泻） -->
          <g
            v-if="motionLive && smoothMotion"
            class="sand-particles"
          >
            <circle
              v-for="p in streamParticles"
              :key="p.id"
              class="sand-particle"
              :cx="p.cx"
              :cy="p.cy"
              :r="p.r"
              :style="{
                animationDelay: p.delay,
              }"
            />
          </g>

          <!-- 沙丘受击落点微波冲击圈（落地后呈现） -->
          <ellipse
            v-if="isStreamLanded"
            class="sand-impact"
            :class="{ 'is-pulsing': motionLive && smoothMotion }"
            cx="108"
            :cy="streamTouchdownY"
            rx="3.2"
            ry="1.1"
          />
        </g>
      </g>

      <!-- 优雅玻璃曲面高光带（双弧反光条） -->
      <g class="sand-speculars">
        <!-- 左侧肩部流线高光 -->
        <path
          class="sand-specular sand-specular--left"
          d="
            M 77 28
            C 57 37, 54 68, 96 102
            L 94 102
            C 51 68, 54 37, 75 28
            Z
            M 75 186
            C 54 177, 51 148, 94 114
            L 96 114
            C 54 148, 57 177, 77 186
            Z
          "
        />
        <!-- 右侧次级曲面边缘微反光 -->
        <path
          class="sand-specular sand-specular--rim"
          d="
            M 139 29
            C 159 38, 163 68, 120 102
            L 121.5 102
            C 165 68, 161 38, 140.5 29
            Z
            M 140.5 185
            C 161 176, 165 148, 121.5 114
            L 120 114
            C 163 148, 159 176, 139 185
            Z
          "
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

const { fraction } = useDialMotion({
  anchorMs: () => props.elapsedMs,
  live: () => props.motionLive,
  smooth: () => props.smoothMotion,
  totalMs: () => props.totalMs,
  sweep: () => props.motionSweep,
})

/**
 * 拟真沙漏内壁半宽函数：根据玻璃腔体精确反算任意高度 y 的内壁半径
 * y=108 处为咽喉（半宽 5px）；y=58 与 y=158 处为双腔腹部（半宽 47px）；上下内底口半宽 30px
 */
function getGlassHalfWidth(y: number): number {
  const dy = Math.abs(y - 108)
  if (dy <= 50) {
    const t = dy / 50
    return 5 + 42 * (3 * t * t - 2 * t * t * t)
  }
  const t = Math.min(1, (dy - 50) / 31)
  return 47 - 17 * (3 * t * t - 2 * t * t * t)
}

// 预计算上腔从 y=105 至 y=28 的离散切片面积累加表
const topSlices: Array<{ y: number, cum: number }> = []
let topTotalArea = 0
for (let y = 105; y >= 28; y--) {
  const w = getGlassHalfWidth(y)
  topTotalArea += w
  topSlices.push({ y, cum: topTotalArea })
}

// 预计算下腔从 y=188 至 y=111 的离散切片面积累加表
const botSlices: Array<{ y: number, cum: number }> = []
let botTotalArea = 0
for (let y = 188; y >= 111; y--) {
  const w = getGlassHalfWidth(y)
  botTotalArea += w
  botSlices.push({ y, cum: botTotalArea })
}

/** 上室沙面边缘高度反算（严格限制在 28..105 之间） */
function calcTopSurfaceY(f: number): number {
  if (f >= 0.999) return 105
  if (f <= 0.001) return 28
  const target = (1 - f) * topTotalArea
  for (let i = 0; i < topSlices.length; i++) {
    if (topSlices[i].cum >= target) {
      const prevCum = i > 0 ? topSlices[i - 1].cum : 0
      const prevY = i > 0 ? topSlices[i - 1].y : 105
      const ratio = (target - prevCum) / (topSlices[i].cum - prevCum)
      return prevY - ratio
    }
  }
  return 28
}

/** 下室沙面壁面高度反算（严格限制在 111..188 之间） */
function calcBotWallY(f: number): number {
  if (f <= 0.001) return 188
  if (f >= 0.999) return 111
  const target = f * botTotalArea
  for (let i = 0; i < botSlices.length; i++) {
    if (botSlices[i].cum >= target) {
      const prevCum = i > 0 ? botSlices[i - 1].cum : 0
      const prevY = i > 0 ? botSlices[i - 1].y : 188
      const ratio = (target - prevCum) / (botSlices[i].cum - prevCum)
      return prevY - ratio
    }
  }
  return 111
}

/**
 * 上室漏斗凹陷沙面路径：
 * 倾泻时，中心因重力下泄形成凹陷漏斗涡旋（crater），两翼依附内壁滑落
 */
const topSandPath = computed(() => {
  const f = Math.max(0, Math.min(1, fraction.value))
  if (f >= 0.996) return ''

  const yTop = Math.min(105, Math.max(28, calcTopSurfaceY(f)))
  const wTop = getGlassHalfWidth(yTop)

  // 漏斗凹陷深度：沙量流走时最深，快漏空时随腔体收窄收敛
  const maxCrater = Math.min(8.5, wTop * 0.28)
  const craterFactor = Math.sin(Math.PI * Math.min(1, f * 1.3))
  const craterDepth = yTop < 98 ? maxCrater * craterFactor : 0

  let path = `M ${(108 - wTop).toFixed(1)} ${yTop.toFixed(1)}`
  path += ` Q 108 ${(yTop + craterDepth).toFixed(1)} ${(108 + wTop).toFixed(1)} ${yTop.toFixed(1)}`

  // 顺玻璃右壁向下延伸至喉部 105
  const steps = 4
  const targetY = 105
  for (let i = 1; i <= steps; i++) {
    const y = yTop + (targetY - yTop) * (i / steps)
    const w = getGlassHalfWidth(y)
    path += ` L ${(108 + w).toFixed(1)} ${y.toFixed(1)}`
  }

  // 喉部横切
  path += ` L ${(108 - getGlassHalfWidth(targetY)).toFixed(1)} ${targetY.toFixed(1)}`

  // 顺玻璃左壁向上闭合
  for (let i = steps - 1; i >= 1; i--) {
    const y = yTop + (targetY - yTop) * (i / steps)
    const w = getGlassHalfWidth(y)
    path += ` L ${(108 - w).toFixed(1)} ${y.toFixed(1)}`
  }
  path += ' Z'
  return path
})

/**
 * 下室堆积沙丘路径：
 * 落沙在底部形成天然安息角锥形沙丘，中心顶点最高，向两边倾斜铺开，基底平稳落在 188 处
 */
const botSandCalc = computed(() => {
  const f = Math.max(0, Math.min(1, fraction.value))
  if (f <= 0.002) return null

  const yWall = Math.min(188, Math.max(111, calcBotWallY(f)))
  const wWall = getGlassHalfWidth(yWall)

  // 锥形隆起高度
  const maxMound = Math.min(10, wWall * 0.32)
  const moundFactor = Math.min(1, f * 3.5)
  const moundHeight = yWall > 118 ? maxMound * moundFactor : Math.max(1.5, (yWall - 110) * 0.35)
  const yPeak = Math.min(188, Math.max(111, yWall - moundHeight))

  return { yWall, wWall, yPeak }
})

const botSandPath = computed(() => {
  if (!botSandCalc.value) return ''
  const { yWall, wWall, yPeak } = botSandCalc.value

  let path = `M ${(108 - wWall).toFixed(1)} ${yWall.toFixed(1)}`
  path += ` Q 108 ${yPeak.toFixed(1)} ${(108 + wWall).toFixed(1)} ${yWall.toFixed(1)}`

  // 顺玻璃右壁向下至内腔底座 188
  const steps = 4
  const baseY = 188
  for (let i = 1; i <= steps; i++) {
    const y = yWall + (baseY - yWall) * (i / steps)
    const w = getGlassHalfWidth(y)
    path += ` L ${(108 + w).toFixed(1)} ${y.toFixed(1)}`
  }

  // 底部横切
  path += ` L ${(108 - getGlassHalfWidth(baseY)).toFixed(1)} ${baseY.toFixed(1)}`

  // 顺玻璃左壁向上闭合
  for (let i = steps - 1; i >= 1; i--) {
    const y = yWall + (baseY - yWall) * (i / steps)
    const w = getGlassHalfWidth(y)
    path += ` L ${(108 - w).toFixed(1)} ${y.toFixed(1)}`
  }
  path += ' Z'
  return path
})

/** 流沙状态判定：只有在开始计时且未流尽时出现流沙 */
const isStreaming = computed(() => {
  const f = fraction.value
  return f > 0.002 && f < 0.998
})

/** 沙丘落点 Y 坐标（沙流接触下沙丘的尖顶位置，绝对不超过 188 底座） */
const streamTouchdownY = computed(() => {
  if (botSandCalc.value) {
    return botSandCalc.value.yPeak
  }
  return 188
})

/** 流沙是否已触达底部沙丘 */
const isStreamLanded = computed(() => {
  return fraction.value >= 0.008
})

/** 细腻流沙束路径：自咽喉 106 优雅下泻至沙丘顶点，初期平稳降落不穿透底座 */
const streamPath = computed(() => {
  if (!isStreaming.value) return ''
  const f = fraction.value
  const topY = 106
  const targetY = streamTouchdownY.value

  // 前 0.002 ~ 0.008 期间，流沙前锋从 106 降至 targetY，避免瞬时穿底
  const landingProgress = f < 0.008 ? Math.max(0, (f - 0.002) / 0.006) : 1
  const botY = Math.min(188, topY + (targetY - topY) * landingProgress)

  const topW = 2.2
  const midW = 1.3
  const midY = 108 + (botY - 108) * 0.4
  const botW = landingProgress < 1 ? 1.4 : 2.2

  return `
    M ${(108 - topW).toFixed(1)} ${topY}
    Q ${(108 - midW).toFixed(1)} ${midY.toFixed(1)} ${(108 - botW).toFixed(1)} ${botY.toFixed(1)}
    L ${(108 + botW).toFixed(1)} ${botY.toFixed(1)}
    Q ${(108 + midW).toFixed(1)} ${midY.toFixed(1)} ${(108 + topW).toFixed(1)} ${topY}
    Z
  `
})

/** 3 颗细微飘逸的流动粒子数据 */
const streamParticles = [
  { id: 1, cx: 107.7, cy: 108, r: 0.9, delay: '0s' },
  { id: 2, cx: 108.2, cy: 114, r: 0.8, delay: '0.28s' },
  { id: 3, cx: 107.9, cy: 120, r: 0.85, delay: '0.56s' },
]
</script>

<style scoped>
.sandfall-dial,
.sandfall-svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 与光环、刻度一致的氛围层：三个表盘统一 */
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

.sandfall-svg {
  fill: none !important;
}

/* 端盖与支架 */
.sand-cap {
  fill: var(--st-pomo-muted, var(--b3-theme-on-surface));
  opacity: 0.45;
}

/* 水晶玻璃外轮廓与内腔轮廓 */
.sand-frame-outer {
  fill: none !important;
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 14%, transparent)
  );
  stroke-width: 1.4;
  stroke-linejoin: round;
}

.sand-frame-inner {
  fill: color-mix(
    in srgb,
    var(--st-pomo-surface, #ffffff) 24%,
    transparent
  ) !important;
  stroke: var(
    --st-pomo-track,
    color-mix(in srgb, var(--b3-theme-on-background) 8%, transparent)
  );
  stroke-width: 0.8;
  stroke-linejoin: round;
}

/* 沙量填充 */
.sand-fill {
  stroke: none;
  stroke-width: 0;
}

.sand-fill--top {
  fill: url(#sf-sand-top-grad);
}

.sand-fill--bottom {
  fill: url(#sf-sand-bot-grad);
}

/* 流沙瀑布 */
.sand-stream {
  fill: url(#sf-stream-grad);
  stroke: none;
  opacity: 0.9;
}

/* 沙粒流动微粒子 */
.sand-particle {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
  opacity: 0.75;
  animation: sand-particle-flow 0.85s linear infinite;
}

@keyframes sand-particle-flow {
  0% {
    transform: translateY(0);
    opacity: 0.2;
  }
  30% {
    opacity: 0.9;
  }
  75% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(22px);
    opacity: 0;
  }
}

/* 沙丘受击微波光斑 */
.sand-impact {
  fill: var(--st-pomo-accent, var(--b3-theme-primary));
  opacity: 0.4;
}

.sand-impact.is-pulsing {
  animation: sand-impact-wave 1.2s ease-in-out infinite;
}

@keyframes sand-impact-wave {
  0%, 100% {
    transform-origin: 108px center;
    transform: scale(0.9);
    opacity: 0.35;
  }
  50% {
    transform-origin: 108px center;
    transform: scale(1.15);
    opacity: 0.7;
  }
}

/* 玻璃反光与高光带 */
.sand-specular {
  stroke: none;
  pointer-events: none;
}

.sand-specular--left {
  fill: rgba(255, 255, 255, 0.18);
}

.sand-specular--rim {
  fill: rgba(255, 255, 255, 0.09);
}

@media (prefers-reduced-motion: reduce) {
  .sand-particle,
  .sand-impact.is-pulsing {
    animation: none !important;
  }
}
</style>
