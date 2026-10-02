<template>
  <section class="pomo-running">
    <div class="pomo-running__controls">
      <div
        v-if="afkReturn"
        class="st-pomo-inset pomo-return"
        role="status"
      >
        <p class="st-pomo-help">
          {{
            t('pomodoroAfkWelcomeDesc', { time: formatIdle(afkReturn.idleSec) })
          }}
        </p>
        <button
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          @click="$emit('dismissAfk')"
        >
          {{ t('pomodoroDismiss') }}
        </button>
      </div>
      <p
        v-if="frozen"
        class="st-pomo-help pomo-away"
      >
        {{ t('pomodoroAwayCounting', { time: formatIdle(afkIdleSeconds) }) }}
      </p>

      <div
        v-if="confirmingDiscard"
        class="pomo-running__actions"
        role="group"
        :aria-label="t('pomodoroDiscardConfirmTitle')"
      >
        <button
          ref="cancelButton"
          type="button"
          class="st-pomo-button st-pomo-button--secondary st-pomo-anim-soft"
          @click="cancelDiscard"
        >
          {{ t('pomodoroCancelDiscard') }}
        </button>
        <button
          type="button"
          class="st-pomo-button st-pomo-button--danger st-pomo-anim-soft"
          @click="$emit('confirmDiscard')"
        >
          {{ t('pomodoroConfirmDiscard') }}
        </button>
      </div>
      <div
        v-else
        class="pomo-running__actions"
      >
        <button
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          @click="$emit('finish')"
        >
          {{ t('pomodoroFinishSession') }}
        </button>
        <button
          ref="discardButton"
          type="button"
          class="st-pomo-button st-pomo-button--quiet st-pomo-button--danger-text"
          @click="$emit('update:confirmingDiscard', true)"
        >
          {{ t('pomodoroCancel') }}
        </button>
      </div>
    </div>

    <button
      v-if="!confirmingDiscard"
      type="button"
      class="st-pomo-button st-pomo-button--primary st-pomo-anim-soft"
      @click="state === 'paused' ? $emit('resume') : $emit('pause')"
    >
      <svg
        viewBox="0 0 24 24"
        style="fill: none !important"
        stroke="currentColor"
        stroke-width="1.75"
        aria-hidden="true"
      >
        <path
          v-if="state === 'paused'"
          d="m8 5 11 7-11 7z"
        />
        <path
          v-else
          d="M8 5v14M16 5v14"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
      {{ state === 'paused' ? t('pomodoroResumeFocus') : t('pomodoroPause') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import {
  nextTick,
  ref,
  watch,
} from 'vue'
import { t } from '../../../i18n'
import { formatIdle } from '../composables/usePomodoroPresenter'

const props = defineProps<{
  state: 'running' | 'paused'
  frozen: boolean
  afkIdleSeconds: number
  afkReturn: { idleSec: number, at: number } | null
  confirmingDiscard: boolean
}>()

const emit = defineEmits<{
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'finish'): void
  (e: 'confirmDiscard'): void
  (e: 'update:confirmingDiscard', value: boolean): void
  (e: 'dismissAfk'): void
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)
const discardButton = ref<HTMLButtonElement | null>(null)

watch(
  () => props.confirmingDiscard,
  (value) => {
    if (value) void nextTick(() => cancelButton.value?.focus())
  },
)

function cancelDiscard() {
  emit('update:confirmingDiscard', false)
  void nextTick(() => discardButton.value?.focus())
}

function closeExpanded(): boolean {
  if (props.confirmingDiscard) {
    cancelDiscard()
    return true
  }
  return false
}

defineExpose({ closeExpanded })
</script>

<style scoped>
/* 面板根节点撑满 FocusPanel 的定高槽位，上下两端对齐。 */
.pomo-running {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.pomo-running__controls {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.pomo-running__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pomo-running > .st-pomo-button--primary {
  height: 40px;
  min-height: 40px;
  box-sizing: border-box;
}
.pomo-running > .st-pomo-button svg {
  width: 18px;
  height: 18px;
}
.pomo-return {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pomo-return p {
  flex: 1;
}
.pomo-away {
  text-align: center;
}
.st-pomo-button--danger-text {
  color: var(--st-pomo-danger, #ef4444);
}
.st-pomo-button--danger-text:hover {
  background-color: var(--st-pomo-danger-soft, rgba(239, 68, 68, 0.1));
}
</style>
