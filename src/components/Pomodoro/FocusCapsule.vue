<template>
  <button
    ref="capsuleEl"
    type="button"
    class="sy-pomo-capsule st-pomo-ui st-pomo-anim-soft"
    :data-pomo-motion="intensity"
    :class="{ 'is-active': view.state.value !== 'idle' }"
    :title="view.capsuleTooltip.value"
    :aria-expanded="isOpen"
    aria-controls="st-focus-panel"
    :aria-label="`${t('pomodoroTimerTitle')}: ${notice || view.capsuleText.value}`"
    @click="$emit('toggle')"
  >
    <svg
      viewBox="0 0 24 24"
      style="fill: none !important"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        stroke-width="1.7"
        opacity=".25"
      />
      <circle
        v-if="view.state.value !== 'idle' && !view.isStopwatch.value"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        :stroke-dasharray="56.55"
        :stroke-dashoffset="56.55 * (1 - view.progress.value)"
        transform="rotate(-90 12 12)"
      />
      <path
        v-if="view.state.value === 'paused'"
        d="M10 9v6m4-6v6"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        v-else
        d="M10 6h4v9l-2-2-2 2z"
        stroke="currentColor"
        stroke-width="1.3"
      />
    </svg>
    <span>{{ notice || view.capsuleText.value }}</span>
  </button>
</template>

<script setup lang="ts">
import type { PomodoroView } from './composables/usePomodoroPresenter'
import { ref } from 'vue'
import { t } from '../../i18n'

withDefaults(
  defineProps<{
    view: PomodoroView
    isOpen?: boolean
    intensity?: 'calm' | 'expressive'
    notice?: string
  }>(),
  {
    isOpen: false,
    intensity: 'calm',
    notice: '',
  },
)
defineEmits<{ (e: 'toggle'): void }>()
const capsuleEl = ref<HTMLButtonElement | null>(null)
defineExpose({ capsuleEl })
</script>

<style scoped>
.sy-pomo-capsule {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 2px 9px 2px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--st-pomo-muted);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.4;
  transition:
    background-color 120ms,
    border-color 120ms;
}
.sy-pomo-capsule:hover,
.sy-pomo-capsule[aria-expanded='true'] {
  background: var(--st-pomo-soft);
  border-color: var(--st-pomo-line);
}
.sy-pomo-capsule.is-active {
  color: var(--st-pomo-ink);
}
.sy-pomo-capsule > svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--st-pomo-accent);
}
.sy-pomo-capsule > span {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  white-space: nowrap;
}
.sy-pomo-capsule:focus-visible {
  outline: 2px solid var(--st-pomo-accent);
  outline-offset: 2px;
}
@media (pointer: coarse) {
  .sy-pomo-capsule {
    min-height: 36px;
  }
}
</style>
