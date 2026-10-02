<template>
  <section class="pomo-ready">
    <template v-if="!isStopwatchMode">
      <div
        class="pomo-presets"
        role="group"
        :aria-label="t('pomodoroCustomDuration')"
      >
        <button
          v-for="preset in quickPresets"
          :key="preset"
          type="button"
          class="st-pomo-button st-pomo-anim-soft"
          :aria-pressed="minutes === preset && !expanded"
          @click="$emit('update:minutes', preset)"
        >
          {{ t('pomodoroMinutesShort', { n: preset }) }}
        </button>
        <button
          ref="customButton"
          type="button"
          class="st-pomo-button st-pomo-anim-soft"
          :aria-expanded="expanded"
          :aria-pressed="expanded || !quickPresets.includes(minutes)"
          @click="toggleCustom"
        >
          {{ t('pomodoroCustom') }}
        </button>
      </div>
      <form
        v-if="expanded"
        class="st-pomo-inset pomo-custom"
        @submit.prevent="applyCustom"
        @keydown.esc.stop.prevent="cancelCustom"
        @wheel="onWheel"
      >
        <label :for="inputId">{{ t('pomodoroCustomDuration') }}</label>
        <div class="pomo-custom__input">
          <button
            type="button"
            class="st-pomo-button st-pomo-button--secondary"
            :aria-label="t('pomodoroDecrease')"
            :disabled="!valid || Number(draft) <= 1"
            @click="step(-1)"
          >
            −
          </button>
          <input
            :id="inputId"
            ref="inputEl"
            v-model="draft"
            class="st-pomo-input"
            type="number"
            inputmode="numeric"
            min="1"
            max="180"
            step="1"
            :aria-invalid="!valid"
            :aria-describedby="`${inputId}-hint`"
          />
          <span>{{ t('pomodoroMinutesUnit') }}</span>
          <button
            type="button"
            class="st-pomo-button st-pomo-button--secondary"
            :aria-label="t('pomodoroIncrease')"
            :disabled="!valid || Number(draft) >= 180"
            @click="step(1)"
          >
            +
          </button>
        </div>
        <p
          :id="`${inputId}-hint`"
          :class="valid ? 'st-pomo-help' : 'st-pomo-error'"
        >
          {{ t('pomodoroDurationRange') }}
        </p>
        <div class="pomo-custom__presets">
          <button
            v-for="preset in presets"
            :key="preset"
            type="button"
            class="st-pomo-button st-pomo-button--quiet"
            @click="draft = String(preset)"
          >
            {{ t('pomodoroMinutesShort', { n: preset }) }}
          </button>
        </div>
        <button
          v-if="smartEnabled && recommendation"
          type="button"
          class="pomo-recommendation st-pomo-button"
          @click="draft = String(recommendation.minutes)"
        >
          <span>{{
            t('pomodoroSmartChip', { min: recommendation.minutes })
          }}</span>
          <span class="st-pomo-help">{{
            t(recommendation.reasonKey, recommendation.params)
          }}</span>
        </button>
        <div class="pomo-custom__actions">
          <button
            type="button"
            class="st-pomo-button st-pomo-button--quiet"
            @click="cancelCustom"
          >
            {{ t('pomodoroCancelEdit') }}
          </button>
          <button
            type="submit"
            class="st-pomo-button st-pomo-button--secondary"
            :disabled="!valid"
          >
            {{ t('pomodoroApplyDuration') }}
          </button>
        </div>
      </form>
    </template>
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
      :disabled="expanded && !valid"
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
  nextTick,
  ref,
  watch,
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
const expanded = ref(false)
const draft = ref(String(props.minutes))
const inputEl = ref<HTMLInputElement | null>(null)
const customButton = ref<HTMLButtonElement | null>(null)
const inputId = `pomo-duration-${Math.random().toString(36).slice(2, 9)}`
const quickPresets = computed(() => props.presets.slice(0, 3))
const valid = computed(
  () =>
    draft.value !== ''
    && Number.isInteger(Number(draft.value))
    && Number(draft.value) >= 1
    && Number(draft.value) <= 180,
)
let wheelDelta = 0

watch(
  () => props.minutes,
  (value) => {
    if (!expanded.value) draft.value = String(value)
  },
)
function cancelCustom() {
  expanded.value = false
  draft.value = String(props.minutes)
  wheelDelta = 0
  void nextTick(() => customButton.value?.focus())
}
function toggleCustom() {
  if (expanded.value) return cancelCustom()
  expanded.value = true
  draft.value = String(props.minutes)
  void nextTick(() => {
    inputEl.value?.focus()
    inputEl.value?.select()
  })
}
function applyCustom() {
  if (!valid.value) return
  emit('update:minutes', Number(draft.value))
  expanded.value = false
  void nextTick(() => customButton.value?.focus())
}
function step(delta: number) {
  if (valid.value) {
    draft.value = String(
      Math.max(1, Math.min(180, Number(draft.value) + delta)),
    )
  }
}
function onWheel(event: WheelEvent) {
  if (
    !props.wheelEnabled
    || !valid.value
    || event.ctrlKey
    || Math.abs(event.deltaX) > Math.abs(event.deltaY)
  ) {
    return
  }
  if (
    !(event.target instanceof Element)
    || !event.target.closest('.pomo-custom__input')
  ) {
    return
  }
  const delta =
    event.deltaY
    * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1)
  const direction = delta < 0 ? 1 : -1
  if (
    (Number(draft.value) <= 1 && direction < 0)
    || (Number(draft.value) >= 180 && direction > 0)
  ) {
    return
  }
  wheelDelta += delta
  if (Math.abs(wheelDelta) < 50) return
  event.preventDefault()
  step(wheelDelta < 0 ? 1 : -1)
  wheelDelta = 0
}
function setMode(stopwatch: boolean) {
  expanded.value = false
  emit('update:isStopwatchMode', stopwatch)
}
function start() {
  if (expanded.value) {
    if (!valid.value) return
    emit('update:minutes', Number(draft.value))
    expanded.value = false
  }
  emit('start')
}
function closeExpanded(): boolean {
  if (!expanded.value) return false
  cancelCustom()
  return true
}
defineExpose({ closeExpanded })
</script>

<style scoped>
.pomo-ready {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pomo-presets {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 4px;
  gap: 2px;
  background: var(--st-pomo-soft);
  border-radius: 14px;
}
.pomo-presets .st-pomo-button {
  padding: 8px 3px;
  font-size: 12px;
  white-space: nowrap;
}
.pomo-presets [aria-pressed='true'] {
  background: var(--st-pomo-surface);
  box-shadow: 0 1px 4px #0000000d;
  color: var(--st-pomo-ink);
}
.pomo-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  color: var(--st-pomo-track);
}
.pomo-mode [aria-pressed='true'] {
  color: var(--st-pomo-ink);
  font-weight: 600;
}
.pomo-custom {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pomo-custom label {
  font-size: 12px;
  font-weight: 600;
}
.pomo-custom__input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pomo-custom__input input {
  text-align: center;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
}
.pomo-custom__input input::-webkit-inner-spin-button {
  appearance: none;
}
.pomo-custom__input span {
  flex-shrink: 0;
  font-size: 12px;
}
.pomo-custom__presets {
  display: flex;
  flex-wrap: wrap;
}
.pomo-custom__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
.pomo-recommendation {
  flex-direction: column;
  align-items: flex-start !important;
  text-align: left;
  gap: 3px !important;
}
.pomo-ready > .st-pomo-button svg {
  width: 17px;
  height: 17px;
}
</style>
