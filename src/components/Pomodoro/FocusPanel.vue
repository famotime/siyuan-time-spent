<template>
  <Teleport to="body">
    <Transition name="pomo-panel">
      <section
        v-if="isOpen"
        id="st-focus-panel"
        ref="cardEl"
        class="sy-pomo-card st-pomo-ui st-pomo-anim-soft"
        :style="positionStyle"
        :data-pomo-motion="intensity"
        :data-pomo-phase="view.uiPhase.value"
        role="dialog"
        :aria-label="t('pomodoroTimerTitle')"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <FocusPanelHeader
          :appearance-open="appearanceOpen"
          :can-customize="view.state.value === 'idle'"
          @appearance="toggleAppearance"
          @close="$emit('close', true)"
        />
        <div
          v-if="appearanceOpen"
          class="pomo-appearance"
        >
          <h2>{{ t('pomodoroAppearance') }}</h2>
          <p class="st-pomo-help">
            {{ t('pomodoroAppearanceHint') }}
          </p>
          <div
            class="pomo-appearance__forms"
            role="group"
            :aria-label="t('pomodoroSwitchTheme')"
          >
            <button
              v-for="form in forms"
              :key="form.key"
              type="button"
              class="pomo-appearance__form st-pomo-button st-pomo-anim-soft"
              :aria-pressed="activeForm === form.key"
              @click="$emit('switchForm', form.key)"
            >
              <svg
                viewBox="0 0 64 64"
                style="fill: none !important"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <template v-if="form.key !== 'hourglass'">
                  <circle
                    cx="32"
                    cy="32"
                    r="23"
                    opacity=".25"
                  />
                  <path
                    d="M32 9a23 23 0 0 1 23 23"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                  <path
                    v-if="form.key === 'chrono'"
                    d="M32 14v4m18 14h-4M32 50v-4M14 32h4"
                  />
                  <path
                    v-else
                    d="M29 7h6v9l-3-2-3 2z"
                  />
                </template>
                <template v-else>
                  <path
                    d="M20 10h24M20 54h24M22 10c0 17 20 27 20 44M42 10c0 17-20 27-20 44"
                  />
                  <path d="m26 49 6-10 6 10z" />
                </template>
              </svg>
              <span>{{ t(form.label) }}</span>
            </button>
          </div>
          <p
            v-if="appearanceError"
            class="st-pomo-error"
            role="status"
          >
            {{ appearanceError }}
          </p>
          <button
            type="button"
            class="st-pomo-button st-pomo-button--secondary"
            @click="toggleAppearance"
          >
            {{ t('pomodoroBackToTimer') }}
          </button>
        </div>
        <template v-else>
          <button
            class="pomo-document"
            type="button"
            :disabled="!view.docId.value"
            :aria-label="`${t('pomodoroOpenDoc')}: ${view.docName.value}`"
            @click="openDoc"
          >
            <svg
              viewBox="0 0 24 24"
              style="fill: none !important"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <path
                d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"
              />
            </svg>
            <span>{{ view.docName.value }}</span>
            <svg
              v-if="view.docId.value"
              class="pomo-document__open"
              viewBox="0 0 24 24"
              style="fill: none !important"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </button>
          <div class="pomo-stage-wrap">
            <PomodoroStage
              :form="activeForm"
              :ui-phase="view.uiPhase.value"
              :progress="view.progress.value"
              :display-text="view.displayText.value"
              :subtitle="view.subtitle.value"
              :heat="view.heat.value"
              :frozen="view.isFrozen.value"
              :intensity="intensity"
              :allow-ambient="allowAmbient"
              :wheel-enabled="false"
              :is-stopwatch="
                view.state.value === 'idle'
                  ? pomodoro.preferStopwatch.value
                  : view.isStopwatch.value
              "
            />
          </div>
          <AchievementMoment
            :visible="completionVisible"
            :status="recordStatus"
            :minutes="completionMinutes"
            @done="$emit('dismissCompletion')"
          />
          <ReadyPanel
            v-if="view.uiPhase.value === 'idle'"
            ref="readyPanel"
            :is-stopwatch-mode="pomodoro.preferStopwatch.value"
            :minutes="pomodoro.preferredMinutes.value"
            :presets="presets"
            :recommendation="recommendation"
            :smart-enabled="smartEnabled"
            :wheel-enabled="wheelEnabled"
            @update:isStopwatchMode="$emit('update:preferStopwatch', $event)"
            @update:minutes="$emit('update:preferredMinutes', $event)"
            @start="$emit('start')"
          />
          <RunningPanel
            v-else-if="
              view.state.value === 'running' || view.state.value === 'paused'
            "
            ref="runningPanel"
            :state="view.state.value"
            :frozen="view.isFrozen.value"
            :afk-idle-seconds="view.afkIdleSeconds.value"
            :afk-return="view.afkReturn.value"
            :interruption-enabled="interruptionEnabled"
            :note-draft="noteDraft"
            :previous-notes="pomodoro.sessionNotes.value"
            :confirming-discard="confirmingDiscard"
            @pause="$emit('pause')"
            @resume="$emit('resume')"
            @finish="$emit('finish')"
            @confirmDiscard="$emit('confirmDiscard')"
            @update:confirmingDiscard="
              $emit('update:confirmingDiscard', $event)
            "
            @update:noteDraft="$emit('update:noteDraft', $event)"
            @saveNote="$emit('saveNote')"
            @skipNote="$emit('skipNote')"
            @dismissAfk="$emit('dismissAfk')"
          />
          <BreakPanel
            v-else
            ref="breakPanel"
            :kind="pomodoro.breakKind.value"
            :remaining-text="view.displayText.value"
            :cycle-size="view.cycleSize.value"
            :reduced="reduced"
            @skip="$emit('skipBreak')"
            @extend="$emit('extendBreak', $event)"
          />
          <footer class="pomo-footer">
            <div class="pomo-footer__cycle">
              <CycleRail
                :completed="view.cycleCompleted.value"
                :size="view.cycleSize.value"
                :long-break-next="
                  view.cycleCompleted.value >= view.cycleSize.value
                "
                :active="view.state.value === 'running' && !view.isFrozen.value"
              />
              <button
                type="button"
                class="st-pomo-button st-pomo-button--quiet"
                @click="$emit('openDashboard')"
              >
                {{ t('pomodoroViewRecords') }}
              </button>
            </div>
            <div
              class="pomo-today"
              role="status"
              aria-live="polite"
            >
              <template v-if="today.status === 'error'">
                <span>{{
                  today.stale
                    ? t('pomodoroTodayStale', {
                      time: formatDurationI18n(today.durationSeconds),
                      n: today.count,
                    })
                    : t('pomodoroTodayError')
                }}</span>
                <button
                  type="button"
                  class="st-pomo-button st-pomo-button--quiet"
                  @click="$emit('refreshToday')"
                >
                  {{ t('pomodoroRetry') }}
                </button>
              </template>
              <span
                v-else-if="
                  today.status === 'idle'
                    || (today.status === 'loading' && !today.stale)
                "
              >{{ t('pomodoroTodayLoading') }}</span>
              <span v-else-if="today.count">{{
                t('pomodoroTodaySummary', {
                  time: formatDurationI18n(today.durationSeconds),
                  n: today.count,
                })
              }}</span>
              <span v-else>{{ t('pomodoroTodayEmpty') }}</span>
            </div>
            <details class="pomo-today__method">
              <summary>{{ t('pomodoroTodayMethodLabel') }}</summary>
              <p>{{ t('pomodoroTodayMethod') }}</p>
            </details>
          </footer>
        </template>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { PomodoroManager } from '../../utils/pomodoro'
import type { PomodoroFormKey } from './composables/forms'
import type { PomodoroView } from './composables/usePomodoroPresenter'
import type { DurationRecommendation } from './composables/useSmartDuration'
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import {
  formatDurationI18n,
  t,
} from '../../i18n'
import AchievementMoment from './AchievementMoment.vue'
import { POMODORO_FORM_LABEL_KEYS } from './composables/forms'
import CycleRail from './CycleRail.vue'
import FocusPanelHeader from './FocusPanelHeader.vue'
import BreakPanel from './panels/BreakPanel.vue'
import ReadyPanel from './panels/ReadyPanel.vue'
import RunningPanel from './panels/RunningPanel.vue'
import PomodoroStage from './PomodoroStage.vue'

const props = defineProps<{
  pomodoro: PomodoroManager
  view: PomodoroView
  anchorEl: HTMLElement | null
  isOpen: boolean
  activeForm: PomodoroFormKey
  intensity: 'calm' | 'expressive'
  allowAmbient: boolean
  reduced: boolean
  wheelEnabled: boolean
  interruptionEnabled: boolean
  smartEnabled: boolean
  recommendation: DurationRecommendation | null
  noteDraft: string
  confirmingDiscard: boolean
  presets: ReadonlyArray<number>
  today: {
    status: 'idle' | 'loading' | 'ready' | 'error'
    count: number
    durationSeconds: number
    stale: boolean
  }
  completionVisible: boolean
  completionMinutes: number
  recordStatus: 'saving' | 'saved' | 'error' | 'ignored' | null
  appearanceError: string
}>()
const emit = defineEmits<{
  (e: 'close', restoreFocus?: boolean): void
  (e: 'switchForm', key: PomodoroFormKey): void
  (e: 'update:preferredMinutes', value: number): void
  (e: 'update:preferStopwatch', value: boolean): void
  (e: 'start'): void
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'finish'): void
  (e: 'confirmDiscard'): void
  (e: 'update:confirmingDiscard', value: boolean): void
  (e: 'update:noteDraft', value: string): void
  (e: 'saveNote'): void
  (e: 'skipNote'): void
  (e: 'dismissAfk'): void
  (e: 'skipBreak'): void
  (e: 'extendBreak', minutes: number): void
  (e: 'openDashboard'): void
  (e: 'refreshToday'): void
  (e: 'dismissCompletion'): void
}>()
const cardEl = ref<HTMLElement | null>(null)
const readyPanel = ref<{ closeExpanded: () => boolean } | null>(null)
const runningPanel = ref<{ closeExpanded: () => boolean } | null>(null)
const breakPanel = ref<{ closeExpanded: () => boolean } | null>(null)
const appearanceOpen = ref(false)
const forms = Object.entries(POMODORO_FORM_LABEL_KEYS).map(([key, label]) => ({
  key: key as PomodoroFormKey,
  label,
}))
const positionStyle = ref<Record<string, string>>({
  right: '16px',
  bottom: '40px',
})
let observer: ResizeObserver | undefined

function reposition() {
  if (!props.isOpen || !props.anchorEl) return
  const anchor = props.anchorEl.getBoundingClientRect()
  const viewport = window.visualViewport
  const width = viewport?.width ?? window.innerWidth
  const height = viewport?.height ?? window.innerHeight
  const offsetX = viewport?.offsetLeft ?? 0
  const offsetY = viewport?.offsetTop ?? 0
  const margin = 16
  const panelWidth = Math.max(0, Math.min(360, width - margin * 2))
  const left = Math.max(
    offsetX + margin,
    Math.min(anchor.right - panelWidth, offsetX + width - panelWidth - margin),
  )
  const above = anchor.top - offsetY - margin - 8
  const below = offsetY + height - anchor.bottom - margin - 8
  const useAbove = above >= below
  const available = Math.max(0, Math.max(above, below))
  const base = {
    left: `${left}px`,
    width: `${panelWidth}px`,
    maxHeight: `${available}px`,
  }
  positionStyle.value = useAbove
    ? {
        ...base,
        bottom: `${window.innerHeight - anchor.top + 8}px`,
      }
    : {
        ...base,
        top: `${anchor.bottom + 8}px`,
      }
}
function focusPanel() {
  cardEl.value?.focus({ preventScroll: true })
}
function toggleAppearance() {
  appearanceOpen.value = !appearanceOpen.value
  void nextTick(focusPanel)
}
function closeExpanded(): boolean {
  if (appearanceOpen.value) {
    toggleAppearance()
    return true
  }
  return !!(
    readyPanel.value?.closeExpanded()
    || runningPanel.value?.closeExpanded()
    || breakPanel.value?.closeExpanded()
  )
}
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.key !== 'Escape')
    return
  event.preventDefault()
  event.stopPropagation()
  if (!closeExpanded()) emit('close', true)
}
function outsidePointer(event: PointerEvent) {
  if (!props.isOpen || !(event.target instanceof Node)) return
  if (
    cardEl.value?.contains(event.target)
    || props.anchorEl?.contains(event.target)
  ) {
    return
  }
  emit('close', false)
}
function openDoc() {
  if (props.view.docId.value)
    window.open(`siyuan://blocks/${props.view.docId.value}`)
  emit('close', false)
}
watch(
  () => props.isOpen,
  async (open) => {
    observer?.disconnect()
    if (!open) {
      appearanceOpen.value = false
      return
    }
    reposition()
    await nextTick()
    if (!props.isOpen) return
    reposition()
    focusPanel()
    if (typeof ResizeObserver !== 'undefined' && cardEl.value) {
      observer = new ResizeObserver(reposition)
      observer.observe(cardEl.value)
    }
  },
)
watch(
  () => props.view.uiPhase.value,
  async () => {
    const hadFocus = cardEl.value?.contains(document.activeElement)
    appearanceOpen.value = false
    await nextTick()
    reposition()
    if (
      props.isOpen
      && hadFocus
      && !cardEl.value?.contains(document.activeElement)
    ) {
      focusPanel()
    }
  },
)
onMounted(() => {
  document.addEventListener('pointerdown', outsidePointer, true)
  window.addEventListener('resize', reposition)
  window.visualViewport?.addEventListener('resize', reposition)
  window.visualViewport?.addEventListener('scroll', reposition)
})
onUnmounted(() => {
  observer?.disconnect()
  document.removeEventListener('pointerdown', outsidePointer, true)
  window.removeEventListener('resize', reposition)
  window.visualViewport?.removeEventListener('resize', reposition)
  window.visualViewport?.removeEventListener('scroll', reposition)
})
defineExpose({
  closeExpanded,
  contains: (target: Node | null) =>
    !!target && !!cardEl.value?.contains(target),
})
</script>

<style scoped>
.sy-pomo-card {
  position: fixed;
  z-index: 9991;
  padding: 16px 20px 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--st-pomo-line);
  border-radius: 24px;
  background: var(--st-pomo-surface);
  box-shadow:
    0 18px 70px -18px #00000030,
    0 4px 16px -8px #0000001a;
  outline: none;
  scrollbar-width: thin;
}
.pomo-document {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 14px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--st-pomo-muted);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.pomo-document:disabled {
  cursor: default;
}
.pomo-document > svg {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
}
.pomo-document > span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.pomo-document:hover:not(:disabled) {
  color: var(--st-pomo-ink);
}
.pomo-document__open {
  opacity: 0.65;
}
.pomo-stage-wrap {
  display: flex;
  justify-content: center;
  padding: 12px 0 20px;
}
.pomo-footer {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid var(--st-pomo-line);
}
.pomo-footer__cycle {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}
.pomo-footer__cycle > :first-child {
  flex: 1;
  min-width: 0;
}
.pomo-footer__cycle > button {
  flex-shrink: 0;
  padding-inline: 4px;
}
.pomo-today {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 6px;
  font-size: 12px;
  color: var(--st-pomo-muted);
}
.pomo-today__method {
  font-size: 12px;
  color: var(--st-pomo-muted);
  margin-top: 8px;
}
.pomo-today__method summary {
  cursor: pointer;
  width: fit-content;
  min-height: 24px;
}
.pomo-today__method p {
  margin: 4px 0 0;
}
.pomo-appearance {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 0 8px;
}
.pomo-appearance h2 {
  font: inherit;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.pomo-appearance__forms {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.pomo-appearance__form {
  flex-direction: column;
  padding: 10px 4px !important;
  border: 1px solid var(--st-pomo-line) !important;
  font-size: 12px !important;
}
.pomo-appearance__form[aria-pressed='true'] {
  border-color: var(--st-pomo-accent) !important;
  background: var(--st-pomo-soft);
}
.pomo-appearance__form svg {
  width: 62px;
  max-width: 100%;
  height: 62px;
}
.pomo-panel-enter-active {
  transition:
    opacity 180ms,
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pomo-panel-leave-active {
  transition:
    opacity 120ms,
    transform 120ms;
}
.pomo-panel-enter-from,
.pomo-panel-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
@media (max-height: 650px) {
  .pomo-stage-wrap {
    padding: 4px 0 12px;
  }
  .pomo-stage-wrap :deep(.sy-pomo-stage) {
    width: 180px;
    height: 180px;
  }
}
@media (max-width: 360px) {
  .sy-pomo-card {
    padding-inline: 16px;
  }
  .pomo-footer__cycle {
    flex-wrap: wrap;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pomo-panel-enter-active,
  .pomo-panel-leave-active {
    transition: none;
  }
}
</style>
