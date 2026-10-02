<template>
  <div class="cycle-rail">
    <div
      class="cycle-row"
      aria-hidden="true"
    >
      <span class="cycle-summary">{{ summary }}</span>
      <span class="cycle-dots">
        <span
          v-for="i in total"
          :key="i"
          class="cycle-dot"
          :class="{
            'cycle-dot--done': i <= done,
            'cycle-dot--active': active && i === done + 1,
          }"
        ></span>
      </span>
      <span
        v-if="hint"
        class="cycle-hint"
      >{{ hint }}</span>
    </div>
    <span
      class="cycle-sr-only"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ announcement }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../../i18n'

const props = withDefaults(
  defineProps<{
    completed: number
    size: number
    /** 满轮后下一次即为长休息。 */
    longBreakNext: boolean
    /** 仅实际专注中传 true；待机、暂停和休息不暗示轮次正在运行。 */
    active?: boolean
  }>(),
  { active: false },
)

const total = computed(() =>
  Number.isFinite(props.size) ? Math.max(0, Math.floor(props.size)) : 0,
)
const done = computed(() =>
  Number.isFinite(props.completed)
    ? Math.max(0, Math.min(total.value, Math.floor(props.completed)))
    : 0,
)
const summary = computed(() =>
  t('pomodoroCycleCompletedSummary', {
    n: done.value,
    total: total.value,
  }),
)
const hint = computed(() => {
  if (props.active && done.value < total.value) {
    return t('pomodoroCycleRunning', { n: done.value + 1 })
  }
  if (props.longBreakNext) return t('pomodoroCycleLongBreakNext')
  if (done.value < total.value)
    return t('pomodoroCycleUpNext', { n: done.value + 1 })
  return ''
})
const announcement = computed(() =>
  [summary.value, hint.value].filter(Boolean).join(' · '),
)
</script>

<style scoped>
.cycle-rail {
  position: relative;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
}

.cycle-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 0;
  min-height: 20px;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
}

.cycle-summary {
  flex-shrink: 0;
  color: var(--st-pomo-ink, var(--b3-theme-on-background));
  font-variant-numeric: tabular-nums;
}

.cycle-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 3px;
  overflow: hidden;
}

.cycle-dot {
  box-sizing: border-box;
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border: 1px solid
    var(
      --st-pomo-track,
      color-mix(in srgb, var(--b3-theme-on-background) 18%, transparent)
    );
  border-radius: 50%;
}

.cycle-dot--done {
  border-color: var(--st-pomo-accent, var(--b3-theme-primary));
  background: var(--st-pomo-accent, var(--b3-theme-primary));
}

.cycle-dot--active {
  border-color: var(--st-pomo-accent, var(--b3-theme-primary));
  outline: 1px solid var(--st-pomo-accent, var(--b3-theme-primary));
  outline-offset: 2px;
}

.cycle-hint {
  min-width: 0;
  overflow: hidden;
  color: var(--st-pomo-muted, var(--b3-theme-on-surface));
  text-overflow: ellipsis;
}

@container (max-width: 300px) {
  .cycle-hint {
    display: none;
  }
}

.cycle-sr-only {
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
</style>
