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
          @open-dashboard="$emit('openDashboard')"
          @close="$emit('close', true)"
        />
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
          <button
            v-if="view.state.value === 'idle'"
            type="button"
            class="pomo-stage-arrow pomo-stage-arrow--left st-pomo-anim-soft"
            :title="t('pomodoroPrevForm')"
            :aria-label="t('pomodoroPrevForm')"
            @click="switchDialForm(-1)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <PomodoroStage
            :form="activeForm"
            :ui-phase="view.uiPhase.value"
            :progress="view.progress.value"
            :display-text="view.displayText.value"
            :subtitle="view.subtitle.value"
            :frozen="view.isFrozen.value"
            :intensity="intensity"
            :breathing="isBreathing"
            :is-stopwatch="
              view.state.value === 'idle'
                ? pomodoro.preferStopwatch.value
                : view.isStopwatch.value
            "
            :reduced="reduced"
            :elapsed-ms="view.motionElapsedMs.value"
            :motion-live="view.motionLive.value"
            :total-ms="view.motionTotalMs.value"
            :motion-sweep="view.motionSweep.value"
          />
          <button
            v-if="view.state.value === 'idle'"
            type="button"
            class="pomo-stage-arrow pomo-stage-arrow--right st-pomo-anim-soft"
            :title="t('pomodoroNextForm')"
            :aria-label="t('pomodoroNextForm')"
            @click="switchDialForm(1)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <div class="pomo-region">
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
            :confirming-discard="confirmingDiscard"
            @pause="$emit('pause')"
            @resume="$emit('resume')"
            @finish="$emit('finish')"
            @confirmDiscard="$emit('confirmDiscard')"
            @update:confirmingDiscard="
              $emit('update:confirmingDiscard', $event)
            "
            @dismissAfk="$emit('dismissAfk')"
          />
          <BreakPanel
            v-else
            ref="breakPanel"
            :kind="pomodoro.breakKind.value"
            :remaining-text="view.displayText.value"
            :cycle-size="view.cycleSize.value"
            :reduced="reduced"
            :session-summary="breakSummary"
            @skip="$emit('skipBreak')"
            @extend="$emit('extendBreak', $event)"
            @update:breathing="isBreathing = $event"
          />
        </div>
        <footer class="pomo-footer">
          <div class="pomo-footer__row">
            <div class="pomo-footer__left">
              <CycleRail
                :completed="view.cycleCompleted.value"
                :size="view.cycleSize.value"
                :long-break-next="
                  view.cycleCompleted.value >= view.cycleSize.value
                "
                :active="view.state.value === 'running' && !view.isFrozen.value"
              />
            </div>
            <div
              class="pomo-footer__right pomo-today"
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
                t('pomodoroTodaySummaryShort', {
                  time: formatDurationI18n(today.durationSeconds),
                  n: today.count,
                })
              }}</span>
              <span v-else>{{ t('pomodoroTodayEmptyShort') }}</span>
            </div>
          </div>
        </footer>
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
  computed,
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
const isBreathing = ref(false)
const FORM_KEYS: PomodoroFormKey[] = ['zen', 'chrono', 'hourglass']

const breakSummary = computed(() => {
  const last = props.pomodoro.lastRecord.value
  if (last && last.durationSeconds > 0) {
    return t('pomodoroRecordSaved', {
      time: formatDurationI18n(last.durationSeconds),
    })
  }
  if (props.completionMinutes > 0) {
    return t('pomodoroRecordSaved', {
      time: formatDurationI18n(props.completionMinutes * 60),
    })
  }
  return ''
})

function switchDialForm(delta: number) {
  const currentIndex = FORM_KEYS.indexOf(props.activeForm)
  const safeIndex = currentIndex === -1 ? 0 : currentIndex
  const nextIndex = (safeIndex + delta + FORM_KEYS.length) % FORM_KEYS.length
  emit('switchForm', FORM_KEYS[nextIndex])
}

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
        bottom: `${offsetY + height - anchor.top + 8}px`,
      }
    : {
        ...base,
        top: `${anchor.bottom + 8}px`,
      }
}
function focusPanel() {
  cardEl.value?.focus({ preventScroll: true })
}
function closeExpanded(): boolean {
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
  async (phase) => {
    if (phase !== 'short-break' && phase !== 'long-break') {
      isBreathing.value = false
    }
    const hadFocus = cardEl.value?.contains(document.activeElement)
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
  display: flex;
  flex-direction: column;
  padding: 16px 20px 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--st-pomo-line);
  border-radius: 24px;
  background: var(--st-pomo-surface);
  box-shadow: var(--st-pomo-shadow-card);
  outline: none;
  scrollbar-width: thin;
}
/* 相位色温在面板根部一次性定好：表盘、游标、主操作、完成提示全部同温，
   比只在表盘内覆盖更连贯（此前只有舞台吃到相位色）。 */
.sy-pomo-card[data-pomo-phase='short-break'] {
  --st-pomo-accent: var(--st-pomo-break-text, var(--b3-theme-primary));
}
.sy-pomo-card[data-pomo-phase='long-break'] {
  --st-pomo-accent: var(--st-pomo-longbreak-text, var(--b3-theme-primary));
}
.sy-pomo-card[data-pomo-phase='frozen'] {
  --st-pomo-accent: var(
    --st-pomo-frozen-text,
    var(--st-pomo-muted, var(--b3-theme-on-surface))
  );
}
.pomo-document {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  min-height: 36px;
  max-height: 36px;
  margin-top: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--st-pomo-muted);
  text-align: left;
  font: inherit;
  cursor: pointer;
  box-sizing: border-box;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pomo-document:hover:not(:disabled) {
  color: var(--st-pomo-ink);
}
.pomo-document__open {
  opacity: 0.65;
}
.pomo-stage-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 228px;
  min-height: 228px;
  max-height: 228px;
  padding: 0;
  box-sizing: border-box;
}
.pomo-stage-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--st-pomo-line, rgba(125, 125, 125, 0.2));
  background: var(--st-pomo-surface, #fff);
  color: var(--st-pomo-muted, var(--b3-theme-on-surface));
  box-shadow: var(--st-pomo-shadow-chip, 0 2px 6px rgba(0, 0, 0, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}
.pomo-stage-arrow svg {
  width: 16px;
  height: 16px;
}
.pomo-stage-arrow--left {
  left: 6px;
}
.pomo-stage-arrow--right {
  right: 6px;
}
.pomo-stage-wrap:hover .pomo-stage-arrow,
.pomo-stage-arrow:focus-visible {
  opacity: 0.85;
  pointer-events: auto;
}
.pomo-stage-arrow:hover {
  opacity: 1;
  color: var(--st-pomo-ink, var(--b3-theme-on-background));
  background: var(--st-pomo-soft, rgba(125, 125, 125, 0.1));
  transform: translateY(-50%) scale(1.08);
}
.pomo-stage-arrow:active {
  transform: translateY(-50%) scale(0.95);
}
/* 操作区定高 148px，各子面板在此槽位内弹性分布，彻底消除各状态间高度差引起的钟表跳位。 */
.pomo-region {
  height: 148px;
  min-height: 148px;
  max-height: 148px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.pomo-footer {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid var(--st-pomo-line);
}
.pomo-footer__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
}
.pomo-footer__left {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
}
.pomo-footer__left :deep(.cycle-rail) {
  width: auto;
}
.pomo-footer__left :deep(.cycle-row) {
  justify-content: flex-start;
}
.pomo-footer__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1 1 auto;
  min-width: 0;
}
.pomo-today {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--st-pomo-muted);
  white-space: nowrap;
}
.pomo-today :deep(.pomo-completion) {
  margin-bottom: 0;
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
  .pomo-footer__row {
    flex-wrap: wrap;
  }
}
/* 触屏：可点击的笔记跳转与左右箭头支持 */
@media (pointer: coarse) {
  .pomo-document {
    min-height: 44px;
  }
  .pomo-stage-arrow {
    opacity: 0.7;
    pointer-events: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pomo-panel-enter-active,
  .pomo-panel-leave-active {
    transition: none;
  }
}
</style>
