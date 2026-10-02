<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9990] transition-opacity"
      style="background: var(--st-surface-overlay); backdrop-filter: blur(var(--st-surface-backdrop-blur));"
      @click="$emit('close')"
    >
      <div
        ref="cardEl"
        class="sy-pomo-card fixed rounded-2xl p-4 w-[360px] flex flex-col gap-3.5 z-[9991] border select-none"
        :style="[positionStyle, {
          maxHeight: 'calc(100dvh - 28px)', overflowY: 'auto',
        }]"
        :data-pomo-motion="intensity"
        role="dialog"
        :aria-label="t('pomodoroTimerTitle')"
        tabindex="-1"
        @click.stop
      >
        <!-- 1. 标题、形态切换、关闭 -->
        <FocusPanelHeader
          :state="view.state.value"
          :ui-phase="view.uiPhase.value"
          :badge-text="view.statusBadge.value"
          :forms="formList"
          :active-form="activeForm"
          @switchForm="onSwitchForm"
          @close="$emit('close')"
        />

        <!-- 2. 当前关联笔记小条（知识沉淀隐喻，可点击跳转） -->
        <button
          type="button"
          class="flex items-center gap-1.5 text-xs text-secondary px-2.5 py-1.5 rounded-xl bg-subtle truncate text-left w-full transition-colors"
          :class="view.docId.value ? 'cursor-pointer hover:text-primary' : 'cursor-default'"
          :title="view.docName.value"
          :disabled="!view.docId.value"
          @click="openDoc"
        >
          <svg
            class="w-3.5 h-3.5 shrink-0 opacity-70"
            style="fill: none !important; color: var(--b3-theme-primary);"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.75"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span class="truncate flex-1 font-medium">{{ view.docName.value }}</span>
          <svg
            v-if="view.docId.value"
            class="w-3 h-3 shrink-0 opacity-40"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>

        <!-- 3. 核心表盘区 -->
        <div class="flex flex-col items-center justify-center py-1 relative">
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
            :wheel-enabled="wheelEnabled"
            @wheelAdjust="onWheelAdjust"
          />
        </div>

        <!-- 3.5 番茄轮次叙事轨 -->
        <CycleRail
          :completed="view.cycleCompleted.value"
          :size="view.cycleSize.value"
          :long-break-next="view.cycleCompleted.value >= view.cycleSize.value"
        />

        <!-- 4. 交互操作区：按相位分发 -->
        <ReadyPanel
          v-if="view.uiPhase.value === 'idle'"
          :is-stopwatch-mode="preferStopwatch"
          :minutes="preferredMinutes"
          :presets="presets"
          :recommendation="recommendation"
          :smart-enabled="smartEnabled"
          :wheel-enabled="wheelEnabled"
          @update:isStopwatchMode="onStopwatchMode"
          @update:minutes="onMinutes"
          @applyRecommendation="onMinutes"
          @adjust="onAdjust"
          @start="onStart"
        />
        <RunningPanel
          v-else-if="view.uiPhase.value === 'focus' || view.uiPhase.value === 'paused'"
          :state="view.state.value === 'paused' ? 'paused' : 'running'"
          :frozen="view.isFrozen.value"
          :afk-idle-seconds="view.afkIdleSeconds.value"
          :afk-return="view.afkReturn.value"
          :interruption-enabled="interruptionEnabled"
          :note-draft="noteDraft"
          :previous-notes="pomodoro.sessionNotes.value"
          :confirming-discard="confirmingDiscard"
          @pause="onPause"
          @resume="onResume"
          @finish="onFinish"
          @confirmDiscard="onConfirmDiscard"
          @update:confirmingDiscard="onConfirmingDiscard"
          @update:noteDraft="onNoteDraft"
          @saveNote="onSaveNote"
          @skipNote="onSkipNote"
          @dismissAfk="onDismissAfk"
        />
        <BreakPanel
          v-else
          :kind="pomodoro.breakKind.value"
          :remaining-text="view.displayText.value"
          :cycle-size="view.cycleSize.value"
          :reduced="reduced"
          @skip="onSkipBreak"
          @extend="onExtendBreak"
        />

        <!-- 5. Footer：看板跳转与署名 -->
        <div class="pt-2 border-t border-subtle flex items-center justify-between text-xs text-secondary">
          <button
            type="button"
            class="hover:text-primary transition-colors cursor-pointer flex items-center gap-1 font-medium"
            @click="openDashboard"
          >
            <span>{{ t('pomodoroOpenDashboard') }}</span>
            <svg
              class="w-3 h-3"
              style="fill: none !important;"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
          <span class="text-tertiary font-mono text-xs">SiYuan Time Spent</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type TimeSpentPlugin from '../../index';
import type { PomodoroManager } from '../../utils/pomodoro';
import type { PomodoroView } from './composables/usePomodoroPresenter';
import type { DurationRecommendation } from './composables/useSmartDuration';
import type { PomodoroFormKey } from './composables/forms';
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { t } from '../../i18n';
import CycleRail from './CycleRail.vue';
import FocusPanelHeader from './FocusPanelHeader.vue';
import BreakPanel from './panels/BreakPanel.vue';
import ReadyPanel from './panels/ReadyPanel.vue';
import RunningPanel from './panels/RunningPanel.vue';
import PomodoroStage from './PomodoroStage.vue';

const props = defineProps<{
  plugin: TimeSpentPlugin
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
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'switchForm', key: PomodoroFormKey): void
  (e: 'update:preferredMinutes', v: number): void
  (e: 'update:preferStopwatch', v: boolean): void
  (e: 'adjustMinutes', delta: number): void
  (e: 'start'): void
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'finish'): void
  (e: 'confirmDiscard'): void
  (e: 'update:confirmingDiscard', v: boolean): void
  (e: 'update:noteDraft', v: string): void
  (e: 'saveNote'): void
  (e: 'skipNote'): void
  (e: 'dismissAfk'): void
  (e: 'skipBreak'): void
  (e: 'extendBreak', minutes: number): void
  (e: 'openDashboard'): void
}>()

const preferredMinutes = computed(() => props.pomodoro.preferredMinutes.value);
const preferStopwatch = computed(() => props.pomodoro.preferStopwatch.value);
const cardEl = ref<HTMLElement | null>(null);
const positionStyle = ref<Record<string, string>>({
  right: '16px',
  bottom: '42px',
})

const formList = computed(() => [
  {
    key: 'zen' as const,
    label: t('pomodoroFormAuroraName'),
  },
  {
    key: 'chrono' as const,
    label: t('pomodoroFormChronoName'),
  },
  {
    key: 'hourglass' as const,
    label: t('pomodoroFormSandfallName'),
  },
])

const onSwitchForm = (key: PomodoroFormKey) => emit('switchForm', key);
const onMinutes = (v: number) => emit('update:preferredMinutes', v);
const onStopwatchMode = (v: boolean) => emit('update:preferStopwatch', v);
const onAdjust = (d: number) => emit('adjustMinutes', d);
const onStart = () => emit('start');
const onPause = () => emit('pause');
const onResume = () => emit('resume');
const onFinish = () => emit('finish');
const onConfirmDiscard = () => emit('confirmDiscard');
const onConfirmingDiscard = (v: boolean) => emit('update:confirmingDiscard', v);
const onNoteDraft = (v: string) => emit('update:noteDraft', v);
const onSaveNote = () => emit('saveNote');
const onSkipNote = () => emit('skipNote');
const onDismissAfk = () => emit('dismissAfk');
const onSkipBreak = () => emit('skipBreak');
const onExtendBreak = (m: number) => emit('extendBreak', m);
const onWheelAdjust = (d: number) => emit('adjustMinutes', d * 5);
const openDashboard = () => emit('openDashboard');

const openDoc = () => {
  const id = props.view.docId.value
  if (id) window.open(`siyuan://blocks/${id}`)
}

/** 智能锚定：始终贴住状态栏胶囊，靠近视口边缘时回撤 */
const reposition = () => {
  if (!props.anchorEl) return
  const rect = props.anchorEl.getBoundingClientRect()
  const popoverWidth = 360
  const margin = 12

  const bottom = Math.max(margin, window.innerHeight - rect.top + 8)
  let right = window.innerWidth - rect.right
  if (right < margin) right = margin
  if (right + popoverWidth > window.innerWidth - margin) {
    right = Math.max(margin, window.innerWidth - popoverWidth - margin)
  }

  positionStyle.value = {
    right: `${right}px`,
    bottom: `${bottom}px`,
  }
}

watch(() => props.isOpen, async (open) => {
  if (!open) return
  reposition()
  await nextTick()
  reposition()
  // 打开后取焦，使 Space 快捷键可用
  cardEl.value?.focus()
})

// 相位切换会改变卡片高度，需重算贴附位置
watch(() => props.view.uiPhase.value, () => {
  if (props.isOpen) nextTick(reposition)
})

onMounted(() => {
  window.addEventListener('resize', reposition)
  document.addEventListener('visibilitychange', reposition)
})

onUnmounted(() => {
  window.removeEventListener('resize', reposition)
  document.removeEventListener('visibilitychange', reposition)
})
</script>
