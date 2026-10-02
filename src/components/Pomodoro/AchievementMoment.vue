<template>
  <div
    v-if="visible"
    class="pomo-completion st-pomo-inset st-pomo-anim-soft"
    role="status"
    aria-live="polite"
  >
    <svg
      viewBox="0 0 24 24"
      style="fill: none !important"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <template v-if="status === 'error'">
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 7v6m0 3v1" />
      </template>
      <template v-else>
        <path d="M6 3h12v18l-6-4-6 4z" />
        <path
          v-if="status === 'saved'"
          d="m9 10 2 2 4-4"
        />
      </template>
    </svg>
    <div>
      <strong>{{
        t(
          status === 'error'
            ? 'pomodoroRecordFailed'
            : 'pomodoroSessionComplete',
        )
      }}</strong>
      <p class="st-pomo-help">
        {{ message }}
      </p>
    </div>
    <button
      type="button"
      class="st-pomo-button st-pomo-button--quiet"
      :aria-label="t('pomodoroDismiss')"
      @click="$emit('done')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  formatDurationI18n,
  t,
} from '../../i18n'

const props = defineProps<{
  visible: boolean
  minutes: number
  status: 'saving' | 'saved' | 'error' | 'ignored' | null
}>()
defineEmits<{ (e: 'done'): void }>()
const message = computed(() => {
  if (props.status === 'error') return t('pomodoroRecordFailedHint')
  if (props.status === 'saving') return t('pomodoroRecordSaving')
  if (props.status === 'saved') {
    return t('pomodoroRecordSaved', {
      time: formatDurationI18n(props.minutes * 60),
    })
  }
  if (props.status === 'ignored') return t('pomodoroRecordTooShort')
  return t('pomodoroRestHint')
})
</script>

<style scoped>
.pomo-completion {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.pomo-completion > svg {
  width: 23px;
  height: 23px;
  flex-shrink: 0;
  color: var(--st-pomo-accent);
}
.pomo-completion > div {
  flex: 1;
  min-width: 0;
}
.pomo-completion strong {
  font-size: 13px;
  font-weight: 600;
}
.pomo-completion p {
  margin-top: 2px;
}
.pomo-completion > button {
  padding: 4px 8px;
  font-size: 20px;
}
</style>
