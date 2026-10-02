<template>
  <section class="pomo-break">
    <div class="pomo-break__controls">
      <p
        class="st-pomo-help pomo-break__hint"
        :class="{ 'pomo-break__hint--breathing': isBreathing }"
      >
        <span
          v-if="isBreathing"
          class="pomo-break__breath-text"
        >
          {{ reduced ? t('pomodoroBreathStatic') : breathLabel }}
        </span>
        <span v-else>
          {{ sessionSummary || t(kind === 'long' ? 'pomodoroRestLongHint' : 'pomodoroRestHint') }}
        </span>
      </p>
      <div class="pomo-break__actions">
        <button
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          @click="$emit('extend', 5)"
        >
          {{ t('pomodoroExtendBreak') }}
        </button>
        <button
          ref="coachButton"
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          :class="{ 'st-pomo-button--active': isBreathing }"
          :aria-pressed="isBreathing"
          @click="toggleBreathing"
        >
          {{ isBreathing ? t('pomodoroBreathStop') : t('pomodoroBreathCoachTitle') }}
        </button>
      </div>
    </div>
    <button
      type="button"
      class="st-pomo-button st-pomo-button--primary st-pomo-anim-soft"
      @click="onSkip"
    >
      {{ t('pomodoroEndBreak') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import type { BreakKind } from '../../../utils/pomodoro'
import {
  computed,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { t } from '../../../i18n'

const props = withDefaults(
  defineProps<{
    kind: BreakKind
    remainingText: string
    cycleSize: number
    reduced: boolean
    sessionSummary?: string
  }>(),
  { sessionSummary: '' },
)

const emit = defineEmits<{
  (e: 'skip'): void
  (e: 'extend', minutes: number): void
  (e: 'update:breathing', value: boolean): void
}>()

const isBreathing = ref(false)
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

function startBreathing() {
  stopCoach()
  step.value = 0
  if (props.reduced) return
  const started = Date.now()
  timer = setInterval(() => {
    const elapsed = (Date.now() - started) % 14000
    step.value = elapsed < 4000 ? 0 : elapsed < 8000 ? 1 : 2
  }, 250)
}

function toggleBreathing() {
  isBreathing.value = !isBreathing.value
  emit('update:breathing', isBreathing.value)
  if (isBreathing.value) {
    startBreathing()
  } else {
    stopCoach()
  }
}

function onSkip() {
  if (isBreathing.value) {
    isBreathing.value = false
    stopCoach()
    emit('update:breathing', false)
  }
  emit('skip')
}

watch(
  () => props.reduced,
  (reduced) => {
    if (reduced) stopCoach()
    else if (isBreathing.value) startBreathing()
  },
)

onUnmounted(() => {
  stopCoach()
  emit('update:breathing', false)
})

function closeExpanded(): boolean {
  if (isBreathing.value) {
    toggleBreathing()
    return true
  }
  return false
}

defineExpose({ closeExpanded })
</script>

<style scoped>
/* 面板根节点撑满 FocusPanel 的定高槽位，上下两端对齐。 */
.pomo-break {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.pomo-break__controls {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}
.pomo-break__hint {
  text-align: center;
  min-height: 20px;
  line-height: 1.4;
  transition: color 0.2s ease;
}
.pomo-break__hint--breathing {
  color: var(--st-pomo-accent, var(--st-pomo-break-text));
  font-weight: 600;
}
.pomo-break__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.pomo-break > .st-pomo-button--primary {
  height: 40px;
  min-height: 40px;
  box-sizing: border-box;
}
.st-pomo-button--active {
  background-color: var(--st-pomo-soft, rgba(16, 185, 129, 0.15)) !important;
  color: var(--st-pomo-accent, var(--st-pomo-break-text)) !important;
  font-weight: 600;
}
</style>
