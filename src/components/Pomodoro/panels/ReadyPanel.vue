<template>
  <section class="pomo-ready">
    <div
      class="pomo-slider-container"
      role="group"
      :aria-label="t('pomodoroDurationSetting')"
      @wheel="onWheel"
    >
      <div class="pomo-slider-track-wrap">
        <input
          ref="rangeEl"
          type="range"
          min="1"
          max="90"
          step="1"
          :value="minutes"
          class="pomo-slider-range"
          :style="{ '--pomo-slider-fill': `${sliderPercent}%` }"
          :aria-label="t('pomodoroDurationSetting')"
          :aria-valuemin="1"
          :aria-valuemax="90"
          :aria-valuenow="minutes"
          @input="onSliderInput"
        />
        <div
          class="pomo-slider-marks"
          aria-hidden="true"
        >
          <button
            v-for="mark in marks"
            :key="mark"
            type="button"
            class="pomo-slider-mark-btn"
            :class="{ 'pomo-slider-mark-btn--active': minutes === mark }"
            :style="{ left: calcMarkLeft(mark) }"
            :title="`${mark} ${t('pomodoroMinutesUnit')}`"
            @click="selectMark(mark)"
          >
            <span class="pomo-slider-mark-pip" />
            <span class="pomo-slider-mark-label">{{ mark }}</span>
          </button>
        </div>
      </div>
    </div>

    <div
      class="pomo-mode"
      role="group"
      :aria-label="t('pomodoroTimerMode')"
    >
      <button
        type="button"
        class="st-pomo-button st-pomo-button--quiet"
        :aria-pressed="!isStopwatchMode"
        @click="setMode(false)"
      >
        {{ t('pomodoroModeCountdown') }}
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        class="st-pomo-button st-pomo-button--quiet"
        :aria-pressed="isStopwatchMode"
        @click="setMode(true)"
      >
        {{ t('pomodoroCountUp') }}
      </button>
    </div>

    <button
      type="button"
      class="st-pomo-button st-pomo-button--primary st-pomo-anim-soft"
      @click="start"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M8 5.4c0-.8.8-1.2 1.4-.8l10 6.6a1 1 0 0 1 0 1.6l-10 6.6c-.6.4-1.4 0-1.4-.8z"
        />
      </svg>
      {{ t('pomodoroStartFocus') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import type { DurationRecommendation } from '../composables/useSmartDuration'
import {
  computed,
  ref,
} from 'vue'
import { t } from '../../../i18n'

const props = defineProps<{
  isStopwatchMode: boolean
  minutes: number
  presets: ReadonlyArray<number>
  recommendation: DurationRecommendation | null
  smartEnabled: boolean
  wheelEnabled: boolean
}>()
const emit = defineEmits<{
  (e: 'update:isStopwatchMode', value: boolean): void
  (e: 'update:minutes', value: number): void
  (e: 'start'): void
}>()

const marks = [15, 25, 45, 60] as const
const rangeEl = ref<HTMLInputElement | null>(null)
let wheelDelta = 0

const sliderPercent = computed(() => {
  const clamped = Math.max(1, Math.min(90, props.minutes))
  return ((clamped - 1) / 89) * 100
})

function calcMarkLeft(mark: number): string {
  const percent = (mark - 1) / 89
  return `calc(9px + (100% - 18px) * ${percent})`
}

function onSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = Math.max(1, Math.min(90, Math.round(Number(target.value))))
  emit('update:minutes', val)
}

function selectMark(mark: number) {
  emit('update:minutes', mark)
}

function onWheel(event: WheelEvent) {
  if (
    !props.wheelEnabled
    || event.ctrlKey
    || Math.abs(event.deltaX) > Math.abs(event.deltaY)
  ) {
    return
  }
  const delta =
    event.deltaY
    * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1)
  const direction = delta < 0 ? 1 : -1
  if (
    (props.minutes <= 1 && direction < 0)
    || (props.minutes >= 90 && direction > 0)
  ) {
    return
  }
  wheelDelta += delta
  if (Math.abs(wheelDelta) < 40) return
  event.preventDefault()
  const nextVal = Math.max(1, Math.min(90, props.minutes + (wheelDelta < 0 ? 1 : -1)))
  emit('update:minutes', nextVal)
  wheelDelta = 0
}

function setMode(stopwatch: boolean) {
  emit('update:isStopwatchMode', stopwatch)
}

function start() {
  emit('start')
}

function closeExpanded(): boolean {
  return false
}

defineExpose({ closeExpanded })
</script>

<style scoped>
/* 面板根节点撑满 FocusPanel 的定高槽位，上下两端对齐。 */
.pomo-ready {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.pomo-slider-container {
  display: flex;
  flex-direction: column;
  padding: 4px 4px 2px;
  user-select: none;
}

.pomo-slider-track-wrap {
  position: relative;
  width: 100%;
}

.pomo-slider-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 20px;
  background: transparent;
  cursor: pointer;
  margin: 0;
  display: block;
}

.pomo-slider-range::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--st-pomo-accent, var(--b3-theme-primary)) 0%,
    var(--st-pomo-accent, var(--b3-theme-primary)) var(--pomo-slider-fill, 0%),
    var(--st-pomo-track, rgba(125, 125, 125, 0.2)) var(--pomo-slider-fill, 0%),
    var(--st-pomo-track, rgba(125, 125, 125, 0.2)) 100%
  );
  border: none;
}

.pomo-slider-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--st-pomo-surface, #fff);
  border: 2px solid var(--st-pomo-accent, var(--b3-theme-primary));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  margin-top: -6px;
  transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pomo-slider-range:hover::-webkit-slider-thumb,
.pomo-slider-range:active::-webkit-slider-thumb {
  transform: scale(1.15);
}

.pomo-slider-range:focus-visible {
  outline: none;
}

.pomo-slider-range:focus-visible::-webkit-slider-thumb {
  outline: 2px solid var(--st-pomo-accent, var(--b3-theme-primary));
  outline-offset: 2px;
}

.pomo-slider-marks {
  position: relative;
  width: 100%;
  height: 22px;
  margin-top: 4px;
}

.pomo-slider-mark-btn {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--st-pomo-muted, var(--b3-theme-on-surface));
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transition: color 0.15s ease;
}

.pomo-slider-mark-btn:hover {
  color: var(--st-pomo-ink, var(--b3-theme-on-background));
}

.pomo-slider-mark-pip {
  width: 2px;
  height: 5px;
  border-radius: 1px;
  background: var(--st-pomo-track, rgba(125, 125, 125, 0.3));
  transition: background-color 0.15s ease;
}

.pomo-slider-mark-btn--active {
  color: var(--st-pomo-accent, var(--b3-theme-primary));
  font-weight: 600;
}

.pomo-slider-mark-btn--active .pomo-slider-mark-pip {
  background: var(--st-pomo-accent, var(--b3-theme-primary));
  height: 6px;
}

.pomo-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  color: var(--st-pomo-track);
  margin: 2px 0 6px;
}

.pomo-mode [aria-pressed='true'] {
  color: var(--st-pomo-ink);
  font-weight: 600;
}

.pomo-ready > .st-pomo-button--primary {
  height: 40px;
  min-height: 40px;
  box-sizing: border-box;
}

.pomo-ready > .st-pomo-button svg {
  width: 17px;
  height: 17px;
}
</style>
