<template>
  <div class="sy-status-timer-root">
    <!-- 常驻读屏播报区：面板关闭时的「已结束 / 保存失败」只进这里，不依赖胶囊 aria-label 的后台变化。 -->
    <span
      class="st-pomo-sr-only"
      role="status"
      aria-live="polite"
    >{{ announcement }}</span>
    <FocusCapsule
      :ref="setAnchor"
      :view="view"
      :is-open="isOpen"
      :intensity="intensity"
      :notice="isOpen ? '' : capsuleNotice"
      :pulse="pulseActive"
      @toggle="togglePopover"
    />
    <FocusPanel
      ref="panel"
      :pomodoro="pomodoro"
      :view="view"
      :anchor-el="anchorEl"
      :is-open="isOpen"
      :active-form="currentForm"
      :intensity="intensity"
      :reduced="reduced"
      :wheel-enabled="wheelEnabled"
      :interruption-enabled="interruptionEnabled"
      :smart-enabled="smartEnabled"
      :recommendation="recommendation"
      :note-draft="noteDraft"
      :confirming-discard="confirmingDiscard"
      :presets="presets"
      :today="todayView"
      :completion-visible="completionVisible"
      :completion-minutes="completionMinutes"
      :record-status="recordStatus"
      :appearance-error="appearanceError"
      @close="closePopover"
      @switchForm="switchForm"
      @update:preferredMinutes="onMinutes"
      @update:preferStopwatch="pomodoro.preferStopwatch.value = $event"
      @start="handleStart"
      @pause="pomodoro.pause()"
      @resume="pomodoro.resume()"
      @finish="pomodoro.finishEarly()"
      @confirmDiscard="discard"
      @update:confirmingDiscard="confirmingDiscard = $event"
      @update:noteDraft="noteDraft = $event"
      @saveNote="saveNote"
      @skipNote="noteDraft = ''"
      @dismissAfk="pomodoro.dismissAfkReturn()"
      @skipBreak="pomodoro.skipBreak()"
      @extendBreak="pomodoro.extendBreak($event)"
      @openDashboard="openDashboard"
      @refreshToday="today.refresh()"
      @dismissCompletion="dismissCompletion"
    />
  </div>
</template>

<script setup lang="ts">
import type TimeSpentPlugin from '../../index'
import type { PomodoroManager } from '../../utils/pomodoro'
import type { PomodoroFormKey } from './composables/forms'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { t } from '../../i18n'
import { fetchDocTitle } from '../../utils/title-cache'
import { usePomodoroPresenter } from './composables/usePomodoroPresenter'
import { usePomodoroShortcuts } from './composables/usePomodoroShortcuts'
import { useReducedMotion } from './composables/useReducedMotion'
import {
  POMODORO_PRESETS,
  useSmartDuration,
} from './composables/useSmartDuration'
import { useTodayFocus } from './composables/useTodayFocus'
import FocusCapsule from './FocusCapsule.vue'
import FocusPanel from './FocusPanel.vue'

const props = defineProps<{
  plugin: TimeSpentPlugin
  pomodoro: PomodoroManager
}>()
const anchorEl = ref<HTMLElement | null>(null)
const panel = ref<{
  closeExpanded: () => boolean
  contains: (target: Node | null) => boolean
} | null>(null)
const isOpen = ref(false)
const confirmingDiscard = ref(false)
const noteDraft = ref('')
const upcomingDocId = ref<string | null>(null)
const currentForm = ref<PomodoroFormKey>(
  props.plugin.settings?.pomodoroThemeStyle || 'zen',
)
const appearanceError = ref('')
const presets = POMODORO_PRESETS
const settingsVersion = ref(0)
const settings = () => {
  void settingsVersion.value
  return props.plugin.settings
}
const {
  intensity,
  reduced,
} = useReducedMotion(settings)
const smartEnabled = computed(() => settings()?.pomodoroSmartDuration !== false)
const interruptionEnabled = computed(
  () => settings()?.pomodoroInterruptionLog !== false,
)
const wheelEnabled = computed(() => settings()?.pomodoroWheelAdjust !== false)
const shortcutEnabled = computed(() => settings()?.pomodoroShortcut !== false)
const view = usePomodoroPresenter(
  props.pomodoro,
  props.plugin,
  props.pomodoro.preferredMinutes,
  props.pomodoro.preferStopwatch,
  upcomingDocId,
)
const smart = useSmartDuration(
  props.pomodoro,
  () => props.plugin.storageManager?.loadTodayLogs() ?? Promise.resolve([]),
)
const recommendation = computed(() =>
  smartEnabled.value ? smart.recommendation.value : null,
)
const today = useTodayFocus((date) => {
  if (!props.plugin.storageManager)
    return Promise.reject(new Error('Storage unavailable'))
  return props.plugin.storageManager.loadLogsForDate(date, { strict: true })
})
const todayView = computed(() => ({
  status: today.status.value,
  count: today.count.value,
  durationSeconds: today.durationSeconds.value,
  stale: today.stale.value,
}))
const recordStatus = computed(
  () => props.pomodoro.lastRecord.value?.status ?? null,
)
const completionMinutes = computed(
  () => (props.pomodoro.lastRecord.value?.durationSeconds ?? 0) / 60,
)
const completionVisible = ref(false)
const capsuleNotice = ref('')
const announcement = ref('')
const pulseActive = ref(false)
let noticeTimer: ReturnType<typeof setTimeout> | undefined
let pulseTimer: ReturnType<typeof setTimeout> | undefined
let midnightTimer: ReturnType<typeof setTimeout> | undefined
let formSave: Promise<void> = Promise.resolve()

function setAnchor(element: unknown) {
  anchorEl.value = (element as { $el?: HTMLElement } | null)?.$el ?? null
}
function refreshNote() {
  if (props.pomodoro.state.value !== 'idle') return
  const id = props.plugin.timeTracker?.getCurrentDocId() || null
  upcomingDocId.value = id
  if (id) void fetchDocTitle(id).catch(() => undefined)
}
function refreshData() {
  refreshNote()
  void today.refresh()
  if (smartEnabled.value) void smart.refresh()
}
function scheduleMidnight() {
  if (midnightTimer) clearTimeout(midnightTimer)
  if (!isOpen.value) return
  const next = new Date()
  next.setHours(24, 0, 0, 50)
  midnightTimer = setTimeout(() => {
    refreshData()
    scheduleMidnight()
  }, next.getTime() - Date.now())
}
function onVisibilityChange() {
  if (!document.hidden && isOpen.value) {
    refreshData()
    scheduleMidnight()
  }
}
function onMinutes(value: number) {
  if (!Number.isFinite(value)) return
  props.pomodoro.preferredMinutes.value = Math.max(
    1,
    Math.min(180, Math.round(value)),
  )
}
function closePopover(restoreFocus = true) {
  isOpen.value = false
  confirmingDiscard.value = false
  if (midnightTimer) clearTimeout(midnightTimer)
  if (restoreFocus)
    void nextTick(() => anchorEl.value?.focus({ preventScroll: true }))
}
function togglePopover() {
  if (isOpen.value) return closePopover()
  isOpen.value = true
  confirmingDiscard.value = false
  refreshData()
  scheduleMidnight()
}
function handleStart() {
  refreshNote()
  noteDraft.value = ''
  if (props.pomodoro.preferStopwatch.value) {
    props.pomodoro.startStopwatch(upcomingDocId.value ?? undefined)
  }
  else {
    props.pomodoro.start(
      props.pomodoro.preferredMinutes.value,
      upcomingDocId.value ?? undefined,
    )
  }
}
function discard() {
  props.pomodoro.discard()
  confirmingDiscard.value = false
  noteDraft.value = ''
}
function saveNote() {
  if (!noteDraft.value.trim()) return
  props.pomodoro.recordInterruption(noteDraft.value)
  noteDraft.value = ''
}
function dismissCompletion() {
  completionVisible.value = false
  capsuleNotice.value = ''
}
function pulseOnce() {
  pulseActive.value = true
  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => {
    pulseActive.value = false
  }, 1700)
}
function openDashboard() {
  closePopover(false)
  props.plugin.openDashboard()
}
function switchForm(form: PomodoroFormKey) {
  const previous = currentForm.value
  currentForm.value = form
  appearanceError.value = ''
  props.plugin.settings.pomodoroThemeStyle = form
  formSave = formSave
    .then(() => props.plugin.saveSettings())
    .catch(() => {
      if (currentForm.value === form) {
        currentForm.value = previous
        props.plugin.settings.pomodoroThemeStyle = previous
        appearanceError.value = t('pomodoroAppearanceError')
      }
    })
}
function onSettingsChanged() {
  settingsVersion.value += 1
  const config = props.plugin.settings
  if (config.pomodoroThemeStyle) currentForm.value = config.pomodoroThemeStyle
  if (config.pomodoroWorkMinutes && props.pomodoro.state.value === 'idle')
    onMinutes(config.pomodoroWorkMinutes)
  if (config.pomodoroCycleSize)
    props.pomodoro.setCycleSize(config.pomodoroCycleSize)
}
watch(
  () => [props.pomodoro.lastRecord.value?.id, recordStatus.value],
  () => {
    const record = props.pomodoro.lastRecord.value
    if (noticeTimer) clearTimeout(noticeTimer)
    if (pulseTimer) clearTimeout(pulseTimer)
    pulseActive.value = false
    if (!record) {
      dismissCompletion()
      announcement.value = ''
      return
    }
    completionVisible.value =
      record.status === 'error'
      || settings()?.pomodoroAchievementMoment !== false
    if (!completionVisible.value) return
    const message = t(
      record.status === 'error'
        ? 'pomodoroRecordFailed'
        : 'pomodoroSessionComplete',
    )
    capsuleNotice.value = message
    // 面板关闭时胶囊 aria-label 的后台变化不进读屏，必须由常驻 live region 播报。
    announcement.value = message
    if (record.status !== 'error') {
      noticeTimer = setTimeout(() => {
        capsuleNotice.value = ''
        announcement.value = ''
      }, 8000)
      pulseOnce()
    }
  },
)
watch(
  () => props.pomodoro.savedLogVersion.value,
  () => {
    if (isOpen.value) refreshData()
  },
)
watch(
  () => props.pomodoro.state.value,
  (state) => {
    if (state === 'idle') refreshNote()
  },
)
onMounted(() => {
  window.addEventListener(
    'siyuan-time-spent:pomodoro-config-changed',
    onSettingsChanged,
  )
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onUnmounted(() => {
  window.removeEventListener(
    'siyuan-time-spent:pomodoro-config-changed',
    onSettingsChanged,
  )
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (noticeTimer) clearTimeout(noticeTimer)
  if (pulseTimer) clearTimeout(pulseTimer)
  if (midnightTimer) clearTimeout(midnightTimer)
})
usePomodoroShortcuts(shortcutEnabled, isOpen, {
  onTogglePanel: togglePopover,
  isPanelTarget: (target) => panel.value?.contains(target) ?? false,
  onClosePanel: () => {
    if (!panel.value?.closeExpanded()) closePopover()
  },
  onTogglePause: () => {
    if (props.pomodoro.state.value === 'running') props.pomodoro.pause()
    else if (props.pomodoro.state.value === 'paused') props.pomodoro.resume()
  },
})
</script>

<style scoped>
.sy-status-timer-root {
  display: inline-flex;
  align-items: center;
}
</style>
