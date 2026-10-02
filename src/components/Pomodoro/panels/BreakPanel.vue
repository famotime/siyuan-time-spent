<template>
  <div class="flex flex-col gap-2.5">
    <!-- 呼吸引导卡：CSS 负责光环缩放，JS 负责文字，双轨同步 -->
    <div
      class="p-2.5 rounded-xl border flex flex-col gap-1"
      :style="accentStyle"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-bold"
          :style="{ color: accentText }"
        >
          {{ kind === 'long' ? t('pomodoroLongBreakTitle') : t('pomodoroBreakTitle') }}
        </span>
        <span
          class="text-[12px] font-mono font-bold font-tabular"
          :style="{ color: accentText }"
        >
          {{ remainingText }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="st-pomo-anim relative w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
          :style="breathOrbStyle"
          aria-hidden="true"
        ></span>
        <span class="flex flex-col min-w-0">
          <span class="text-[12px] font-medium text-secondary">{{ t('pomodoroBreathCoachTitle') }}</span>
          <span
            class="text-xs font-bold"
            :style="{ color: accentText }"
          >{{ breathLabel }}</span>
        </span>
      </div>
      <span
        v-if="kind === 'long'"
        class="text-[12px] text-secondary"
      >
        {{ t('pomodoroLongBreakDesc', { n: cycleSize }) }}
      </span>
      <span
        v-else
        class="text-[12px] text-secondary"
      >
        {{ t('pomodoroBreathIn') }} · {{ t('pomodoroBreathOut') }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex-1 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
        :style="{ background: accentSolid }"
        @click="$emit('skip')"
      >
        <span>{{ t('pomodoroSkipBreak') }}</span>
      </button>
      <button
        type="button"
        class="py-2 px-3 rounded-xl border border-subtle hover:bg-surface text-secondary font-medium text-xs transition-all cursor-pointer"
        :title="t('pomodoroIncrease')"
        @click="$emit('extend', 5)"
      >
        <span>+5m</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BreakKind } from '../../../utils/pomodoro';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { t } from '../../../i18n';

const props = defineProps<{
  kind: BreakKind
  remainingText: string
  cycleSize: number
  reduced: boolean
}>()

defineEmits<{
  (e: 'skip'): void
  (e: 'extend', minutes: number): void
}>()

const isLong = computed(() => props.kind === 'long');

const accentStyle = computed(() => ({
  borderColor: isLong.value ? 'var(--st-pomo-longbreak-border)' : 'var(--st-pomo-break-border)',
  background: isLong.value ? 'var(--st-pomo-longbreak-bg)' : 'var(--st-pomo-break-bg)',
}))

const accentText = computed(() => (
  isLong.value ? 'var(--st-pomo-longbreak-text)' : 'var(--st-pomo-break-text)'
))

const accentSolid = computed(() => (
  isLong.value ? 'var(--st-pomo-longbreak-track-fill)' : 'var(--st-pomo-break-track-fill)'
))

const breathOrbStyle = computed(() => ({
  background: `radial-gradient(circle, ${isLong.value ? 'var(--st-pomo-longbreak-border)' : 'var(--st-pomo-break-border)'} 0%, transparent 72%)`,
  animation: props.reduced ? 'none' : 'st-pomo-breath var(--st-pomo-breath-period) ease-in-out infinite',
}))

/** 呼吸节拍文字：4s 吸气 + 4s 屏息 + 6s 呼气 */
type BreathStep = 'inhale' | 'hold' | 'exhale';
const BREATH_CYCLE_MS = 14_000;
const breathStep = ref<BreathStep>('inhale');
let breathTimer: any = null;

const breathLabel = computed(() => {
  if (breathStep.value === 'inhale') return t('pomodoroBreathInhale')
  if (breathStep.value === 'hold') return t('pomodoroBreathHold')
  return t('pomodoroBreathExhale')
})

onMounted(() => {
  if (props.reduced) return
  const t0 = Date.now()
  breathTimer = setInterval(() => {
    const phase = (Date.now() - t0) % BREATH_CYCLE_MS
    breathStep.value = phase < 4000 ? 'inhale' : phase < 8000 ? 'hold' : 'exhale'
  }, 250)
})

onUnmounted(() => {
  if (breathTimer) {
    clearInterval(breathTimer)
    breathTimer = null
  }
})
</script>
