<template>
  <div class="flex items-center justify-between pb-2 border-b border-subtle">
    <div class="flex items-center gap-1.5">
      <span
        class="p-1 rounded-lg bg-primary-subtle flex items-center justify-center"
        style="color: var(--b3-theme-primary);"
      >
        <svg
          class="w-3.5 h-3.5"
          style="fill: none !important;"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path d="M12 7v5l3 3" />
        </svg>
      </span>
      <span class="text-xs font-bold text-primary tracking-wide">{{ t('pomodoroTimerTitle') }}</span>

      <!-- 状态徽章 -->
      <span
        v-if="badgeText"
        class="text-xs px-1.5 py-0.5 rounded-full font-medium"
        :class="badgeClass"
      >
        {{ badgeText }}
      </span>
    </div>

    <!-- 右侧：皮肤形态极简分段器与关闭 -->
    <div class="flex items-center gap-1">
      <!-- 形态切换极简分段开关 -->
      <div
        class="flex items-center bg-subtle p-0.5 rounded-lg text-xs font-medium"
        role="group"
        :aria-label="t('pomodoroSwitchTheme')"
      >
        <button
          v-for="skin in forms"
          :key="skin.key"
          type="button"
          class="px-1.5 py-0.5 rounded cursor-pointer transition-all min-h-6 flex items-center"
          :class="activeForm === skin.key ? 'bg-surface text-primary font-bold shadow-xs' : 'text-tertiary hover:text-primary'"
          :aria-pressed="activeForm === skin.key"
          @click="$emit('switchForm', skin.key)"
        >
          {{ skin.label }}
        </button>
      </div>

      <!-- 关闭按钮 -->
      <button
        type="button"
        class="text-tertiary hover:text-primary transition-colors cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
        :aria-label="t('pomodoroShortcutClose')"
        @click="$emit('close')"
      >
        <svg
          class="w-3.5 h-3.5"
          style="fill: none !important;"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
          />
          <line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PomodoroState, UiPhase } from '../../utils/pomodoro';
import { computed } from 'vue';
import { t } from '../../i18n';

export type PomodoroFormKey = 'zen' | 'chrono' | 'hourglass';

const props = defineProps<{
  state: PomodoroState
  uiPhase: UiPhase
  badgeText: string
  forms: ReadonlyArray<{ key: PomodoroFormKey, label: string }>
  activeForm: PomodoroFormKey
}>()

defineEmits<{
  (e: 'switchForm', key: PomodoroFormKey): void
  (e: 'close'): void
}>()

const badgeClass = computed(() => {
  if (props.uiPhase === 'long-break') return 'bg-primary-subtle'
  if (props.uiPhase === 'short-break') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (props.uiPhase === 'paused') {
    return props.state === 'running' ? 'bg-subtle text-secondary' : 'bg-subtle text-secondary'
  }
  return 'bg-primary-subtle text-primary'
})
</script>
