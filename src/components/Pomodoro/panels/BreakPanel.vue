<template>
  <section class="pomo-break">
    <p class="st-pomo-help pomo-break__hint">
      {{ t(kind === 'long' ? 'pomodoroRestLongHint' : 'pomodoroRestHint') }}
    </p>
    <div class="pomo-break__actions">
      <button
        type="button"
        class="st-pomo-button st-pomo-button--secondary"
        @click="$emit('skip')"
      >
        {{ t('pomodoroEndBreak') }}
      </button>
      <button
        type="button"
        class="st-pomo-button st-pomo-button--quiet"
        @click="$emit('extend', 5)"
      >
        {{ t('pomodoroExtendBreak') }}
      </button>
    </div>
    <button
      ref="coachButton"
      type="button"
      class="st-pomo-button st-pomo-button--quiet"
      :aria-expanded="coachOpen"
      @click="coachOpen = !coachOpen"
    >
      {{ t('pomodoroBreathCoachTitle') }}
    </button>
    <div
      v-if="coachOpen"
      class="st-pomo-inset pomo-breath"
      @keydown.esc.stop.prevent="closeExpanded"
    >
      <span
        class="pomo-breath__orb st-pomo-anim"
        :class="{ 'is-breathing': !reduced }"
        aria-hidden="true"
      ></span>
      <span>{{ reduced ? t('pomodoroBreathStatic') : breathLabel }}</span>
      <button
        type="button"
        class="st-pomo-button st-pomo-button--quiet"
        @click="closeExpanded"
      >
        {{ t('pomodoroCollapse') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BreakKind } from '../../../utils/pomodoro'
import {
  computed,
  nextTick,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { t } from '../../../i18n'

const props = defineProps<{
  kind: BreakKind
  remainingText: string
  cycleSize: number
  reduced: boolean
}>()
defineEmits<{ (e: 'skip'): void, (e: 'extend', minutes: number): void }>()
const coachOpen = ref(false)
const coachButton = ref<HTMLButtonElement | null>(null)
const step = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
const breathLabel = computed(() =>
  t(
    ['pomodoroBreathInhale', 'pomodoroBreathHold', 'pomodoroBreathExhale'][
      step.value
    ],
  ),
)
function stopCoach() {
  if (timer) clearInterval(timer)
  timer = undefined
}
watch([coachOpen, () => props.reduced], ([open, reduced]) => {
  stopCoach()
  step.value = 0
  if (!open || reduced) return
  const started = Date.now()
  timer = setInterval(() => {
    const elapsed = (Date.now() - started) % 14000
    step.value = elapsed < 4000 ? 0 : elapsed < 8000 ? 1 : 2
  }, 250)
})
onUnmounted(stopCoach)
function closeExpanded(): boolean {
  if (!coachOpen.value) return false
  coachOpen.value = false
  void nextTick(() => coachButton.value?.focus())
  return true
}
defineExpose({ closeExpanded })
</script>

<style scoped>
.pomo-break {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pomo-break__hint {
  text-align: center;
}
.pomo-break__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.pomo-breath {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.pomo-breath > span:nth-child(2) {
  flex: 1;
}
.pomo-breath__orb {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 1px solid var(--st-pomo-break-text);
  background: var(--st-pomo-break-bg);
  border-radius: 50%;
}
.pomo-breath__orb.is-breathing {
  animation: st-pomo-breath 14s ease-in-out infinite;
}
</style>
