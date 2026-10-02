<template>
  <div
    class="flex items-center justify-center gap-1.5"
    :aria-label="`${t('pomodoroCycleProgress', {
      n: completed, total: size,
    })}`"
  >
    <span
      v-for="i in size"
      :key="i"
      class="relative flex items-center justify-center"
      :class="i === size ? '' : 'after:content-[\'\'] after:w-2 after:h-px after:mx-0.5 after:bg-current after:opacity-20'"
      :style="slotStyle(i)"
      :title="slotTitle(i)"
    >
      <!-- 番茄位：实心=已完成，呼吸光环=下一个，空轨=待完成 -->
      <svg
        class="w-3 h-3"
        style="fill: none !important;"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8.5"
          :fill="i <= completed ? 'currentColor' : 'none'"
        />
        <path
          v-if="i <= completed"
          d="M8.5 12.2l2.4 2.4 4.6-4.8"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="stroke: var(--b3-theme-surface);"
        />
      </svg>
    </span>
    <!-- 语义播报：图形本身 aria-hidden，改由文本承担 -->
    <span
      class="sr-only"
      aria-live="polite"
    >
      {{ t('pomodoroAriaCycle', {
        n: completed, total: size,
      }) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '../../i18n';

const props = defineProps<{
  completed: number
  size: number
  /** 满轮后下一次即为长休息 */
  longBreakNext: boolean
}>()

const slotState = (i: number) => {
  if (i <= props.completed) return 'done' as const
  if (i === props.completed + 1) return 'next' as const
  return 'todo' as const
}

const slotColor = computed(() => {
  if (props.longBreakNext) return 'var(--st-pomo-longbreak-text)'
  return 'var(--st-pomo-active-text)'
})

const slotStyle = (i: number) => {
  const st = slotState(i)
  if (st === 'done') return { color: slotColor.value }
  if (st === 'next') {
    return {
      color: slotColor.value,
      animation: 'st-pomo-frozen-frost 2.4s ease-in-out infinite',
      opacity: '0.9',
    }
  }
  return { color: 'color-mix(in srgb, var(--b3-theme-on-background) 22%, transparent)' }
}

const slotTitle = (i: number) => {
  const st = slotState(i)
  if (st === 'done') return t('pomodoroCycleSlotDone')
  if (st === 'next') return t('pomodoroCycleSlotNext')
  return t('pomodoroCycleSlotTodo')
}

</script>
