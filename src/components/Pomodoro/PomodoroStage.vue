<template>
  <div
    class="sy-pomo-stage"
    :class="{ 'is-breathing': breathing }"
    :data-pomo-phase="stagePhase"
    :data-pomo-motion="intensity"
    :style="digitStyle"
    role="timer"
    :aria-label="minuteAnnouncement"
  >
    <span
      class="stage-sr-only"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ minuteAnnouncement }}
    </span>

    <AuroraDial
      v-if="form === 'zen'"
      class="stage-dial"
      :elapsed-ms="elapsedMs"
      :motion-live="motionLive"
      :total-ms="totalMs"
      :motion-sweep="motionSweep"
      :smooth-motion="smoothMotion"
    />
    <ChronoDial
      v-else-if="form === 'chrono'"
      class="stage-dial"
      :elapsed-ms="elapsedMs"
      :motion-live="motionLive"
      :total-ms="totalMs"
      :motion-sweep="motionSweep"
      :smooth-motion="smoothMotion"
    />
    <SandfallDial
      v-else
      class="stage-dial"
      :elapsed-ms="elapsedMs"
      :motion-live="motionLive"
      :total-ms="totalMs"
      :motion-sweep="motionSweep"
      :smooth-motion="smoothMotion"
    />

    <!-- 秒级视觉更新不进入读屏；三个载体共用同一数字层。 -->
    <div
      class="stage-face"
      aria-hidden="true"
    >
      <span class="stage-time">{{ displayText }}</span>
      <span class="stage-subtitle">{{ subtitle }}</span>
    </div>

    <div
      v-if="!stopwatch"
      class="stage-sr-only"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="t('pomodoroFocusRingAria')"
    >
      {{ t('pomodoroAriaProgress', { percent }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiPhase } from '../../utils/pomodoro'
import type { PomodoroFormKey } from './composables/forms'
import { computed } from 'vue'
import { t } from '../../i18n'
import AuroraDial from './dials/AuroraDial.vue'
import ChronoDial from './dials/ChronoDial.vue'
import SandfallDial from './dials/SandfallDial.vue'

const props = withDefaults(
  defineProps<{
    form: PomodoroFormKey
    uiPhase: UiPhase
    progress: number
    displayText: string
    subtitle: string
    frozen: boolean
    intensity: 'calm' | 'expressive'
    isStopwatch?: boolean
    breathing?: boolean
    elapsedMs?: number
    motionLive?: boolean
    totalMs?: number
    motionSweep?: boolean
    reduced?: boolean
  }>(),
  {
    isStopwatch: false,
    breathing: false,
    elapsedMs: 0,
    motionLive: false,
    totalMs: 0,
    motionSweep: false,
    reduced: false,
  },
)

const stagePhase = computed(() => (props.frozen ? 'frozen' : props.uiPhase))
const stopwatch = computed(
  () =>
    props.isStopwatch
    && props.uiPhase !== 'short-break'
    && props.uiPhase !== 'long-break',
)
/**
 * 帧插值总开关：系统减弱动效或配置为 calm 时退化为秒级阶跃。
 * 指针的走动本身属于计时信息，两种档位下都保留。
 */
const smoothMotion = computed(
  () => !props.reduced && props.intensity !== 'calm',
)
const percent = computed(() =>
  Math.round(
    (Number.isFinite(props.progress)
      ? Math.max(0, Math.min(1, props.progress))
      : 0) * 100,
  ),
)

/** 所有相位统一分钟粒度；兼容 mm:ss（含 180:00）及 hh:mm:ss。 */
const minuteAnnouncement = computed(() => {
  const parts = props.displayText.trim().split(':').map(Number)
  const seconds =
    parts.length > 1
    && parts.every((value) => Number.isFinite(value) && value >= 0)
      ? parts.reduce((total, part) => total * 60 + part, 0)
      : 0
  const minutes = stopwatch.value
    ? Math.floor(seconds / 60)
    : Math.ceil(seconds / 60)
  return t(
    stopwatch.value
      ? 'pomodoroAriaElapsedMinutes'
      : 'pomodoroAriaRemainingMinutes',
    {
      phase: props.subtitle,
      minutes,
    },
  )
})

/** 常规时间 64px；长分钟串按字符数和表盘可用宽度缩小，不挤压轨道。 */
const digitStyle = computed(() => {
  const length = Math.max(5, props.displayText.length)
  return {
    '--stage-digit-size': `${Math.min(64, 186 / (length * 0.58))}px`,
    '--stage-digit-scale': `${Math.min(29.63, 86 / (length * 0.58))}cqi`,
  }
})
</script>

<style scoped>
.sy-pomo-stage {
  position: relative;
  display: grid;
  place-items: center;
  width: min(216px, 100%);
  aspect-ratio: 1;
  flex-shrink: 0;
  min-width: 0;
  margin-inline: auto;
  container-type: inline-size;
  color: var(--st-pomo-ink, var(--b3-theme-on-background));
  user-select: none;
}

/* 相位色温由 FocusPanel 根节点统一提供，这里只声明消费。 */

.stage-dial {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.stage-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

/* 柔和微光磨砂遮罩：保护中央数字不受底层钟表指针和沙漏流沙穿行干扰 */
.stage-face::before {
  content: '';
  position: absolute;
  width: 154px;
  height: 98px;
  border-radius: 49px;
  background: radial-gradient(
    ellipse 66% 56% at center,
    color-mix(in srgb, var(--st-pomo-surface, #ffffff) 88%, transparent) 0%,
    color-mix(in srgb, var(--st-pomo-surface, #ffffff) 64%, transparent) 55%,
    transparent 100%
  );
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: -1;
  pointer-events: none;
}

.stage-time {
  max-width: 88%;
  font-family: inherit;
  font-size: var(--stage-digit-size);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 1px 3px color-mix(in srgb, var(--st-pomo-surface, #ffffff) 75%, transparent);
}

@supports (font-size: 1cqi) {
  .stage-time {
    font-size: min(var(--stage-digit-size), var(--stage-digit-scale));
  }
}

.stage-subtitle {
  max-width: 76%;
  overflow: hidden;
  color: var(--st-pomo-muted, var(--b3-theme-on-surface));
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sy-pomo-stage[data-pomo-motion='calm'] :deep(.st-pomo-anim-soft) {
  transition: none !important;
}

@keyframes pomo-stage-breathe {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(var(--b3-theme-primary-rgb, 59, 130, 246), 0));
  }
  28.57% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 16px var(--st-pomo-accent, rgba(16, 185, 129, 0.4)));
  }
  57.14% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 16px var(--st-pomo-accent, rgba(16, 185, 129, 0.4)));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(var(--b3-theme-primary-rgb, 59, 130, 246), 0));
  }
}

.sy-pomo-stage.is-breathing {
  animation: pomo-stage-breathe 14s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .sy-pomo-stage :deep(.st-pomo-anim-soft) {
    transition: none !important;
  }
  .sy-pomo-stage.is-breathing {
    animation: none;
  }
}
</style>
