<template>
  <section class="pomo-running">
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
      class="st-pomo-inset pomo-confirm"
      role="group"
      :aria-label="t('pomodoroDiscardConfirmTitle')"
    >
      <strong>{{ t('pomodoroDiscardConfirmTitle') }}</strong>
      <p class="st-pomo-help">
        {{ t('pomodoroDiscardConfirmDesc') }}
      </p>
      <div class="pomo-running__actions">
        <button
          ref="cancelButton"
          type="button"
          class="st-pomo-button st-pomo-button--secondary"
          @click="cancelDiscard"
        >
          {{ t('pomodoroCancelDiscard') }}
        </button>
        <button
          type="button"
          class="st-pomo-button st-pomo-button--danger"
          @click="$emit('confirmDiscard')"
        >
          {{ t('pomodoroConfirmDiscard') }}
        </button>
      </div>
    </div>
    <template v-else>
      <button
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
      <div class="pomo-running__actions">
        <button
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          @click="$emit('finish')"
        >
          {{ t('pomodoroFinishSession') }}
        </button>
        <button
          ref="moreButton"
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          :aria-expanded="moreOpen"
          @click="moreOpen = !moreOpen"
        >
          {{ t('pomodoroMore') }}
        </button>
      </div>
      <div
        v-if="moreOpen"
        class="pomo-running__actions"
      >
        <button
          type="button"
          class="st-pomo-button st-pomo-button--danger"
          @click="$emit('update:confirmingDiscard', true)"
        >
          {{ t('pomodoroCancel') }}
        </button>
      </div>
      <template v-if="state === 'paused' && interruptionEnabled">
        <button
          ref="noteButton"
          type="button"
          class="st-pomo-button st-pomo-button--quiet"
          :aria-expanded="noteOpen"
          @click="toggleNote"
        >
          {{ t('pomodoroRecordInterruption')
          }}<span v-if="previousNotes.length">{{ previousNotes.length }}/5</span>
        </button>
        <div
          v-if="noteOpen"
          class="st-pomo-inset pomo-note"
          @keydown.esc.stop.prevent="closeNote"
        >
          <label :for="noteId">{{ t('pomodoroInterruptionTitle') }}</label>
          <textarea
            :id="noteId"
            ref="noteInput"
            class="st-pomo-input"
            :value="noteDraft"
            rows="2"
            maxlength="500"
            :disabled="previousNotes.length >= 5"
            :placeholder="t('pomodoroInterruptionPlaceholder')"
            @input="
              $emit(
                'update:noteDraft',
                ($event.target as HTMLTextAreaElement).value,
              )
            "
            @keydown="onNoteKeydown"
          ></textarea>
          <p class="st-pomo-help">
            {{
              t(
                previousNotes.length >= 5
                  ? 'pomodoroNoteLimit'
                  : 'pomodoroNoteHelp',
              )
            }}
          </p>
          <ul
            v-if="previousNotes.length"
            class="pomo-note__list"
          >
            <li
              v-for="(note, index) in previousNotes"
              :key="index"
            >
              {{ note }}
            </li>
          </ul>
          <div class="pomo-running__actions">
            <button
              type="button"
              class="st-pomo-button st-pomo-button--quiet"
              @click="closeNote"
            >
              {{ t('pomodoroCollapse') }}
            </button>
            <button
              type="button"
              class="st-pomo-button st-pomo-button--secondary"
              :disabled="!noteDraft.trim() || previousNotes.length >= 5"
              @click="saveNote"
            >
              {{ t('pomodoroInterruptionSave') }}
            </button>
          </div>
        </div>
      </template>
    </template>
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
  interruptionEnabled: boolean
  noteDraft: string
  previousNotes: ReadonlyArray<string>
  confirmingDiscard: boolean
}>()
const emit = defineEmits<{
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'finish'): void
  (e: 'confirmDiscard'): void
  (e: 'update:confirmingDiscard', value: boolean): void
  (e: 'update:noteDraft', value: string): void
  (e: 'saveNote'): void
  (e: 'skipNote'): void
  (e: 'dismissAfk'): void
}>()
const moreOpen = ref(false)
const noteOpen = ref(false)
const moreButton = ref<HTMLButtonElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const noteButton = ref<HTMLButtonElement | null>(null)
const noteInput = ref<HTMLTextAreaElement | null>(null)
const noteId = `pomo-note-${Math.random().toString(36).slice(2, 9)}`
watch(
  () => props.confirmingDiscard,
  (value) => {
    if (value) void nextTick(() => cancelButton.value?.focus())
  },
)
watch(
  () => props.state,
  () => {
    noteOpen.value = false
    moreOpen.value = false
  },
)
function cancelDiscard() {
  emit('update:confirmingDiscard', false)
  void nextTick(() => moreButton.value?.focus())
}
function toggleNote() {
  if (noteOpen.value) return closeNote()
  noteOpen.value = true
  void nextTick(() => noteInput.value?.focus())
}
function closeNote() {
  noteOpen.value = false
  void nextTick(() => noteButton.value?.focus())
}
function saveNote() {
  if (!props.noteDraft.trim() || props.previousNotes.length >= 5) return
  emit('saveNote')
  void nextTick(() => noteInput.value?.focus())
}
function onNoteKeydown(event: KeyboardEvent) {
  if (event.isComposing || event.repeat) return
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    event.stopPropagation()
    saveNote()
  }
}
function closeExpanded(): boolean {
  if (props.confirmingDiscard) {
    cancelDiscard()
    return true
  }
  if (noteOpen.value) {
    closeNote()
    return true
  }
  if (moreOpen.value) {
    moreOpen.value = false
    void nextTick(() => moreButton.value?.focus())
    return true
  }
  return false
}
defineExpose({ closeExpanded })
</script>

<style scoped>
.pomo-running,
.pomo-confirm,
.pomo-note {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pomo-running__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
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
.pomo-note label {
  font-weight: 500;
}
.pomo-note textarea {
  resize: vertical;
  min-height: 66px;
}
.pomo-note__list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: var(--st-pomo-muted);
  overflow-wrap: anywhere;
}
</style>
