<template>
  <div
    ref="capsuleEl"
    class="sy-pomo-capsule px-2.5 py-1 rounded-full flex items-center gap-1.5 cursor-pointer select-none transition-all active:scale-95 min-h-6"
    :class="{
      'is-running': view.state.value === 'running' && !view.isFrozen.value,
      'is-paused': view.state.value === 'paused',
      'is-break': view.state.value === 'break',
      'is-frozen': view.isFrozen.value,
    }"
    :style="view.capsuleStyle.value"
    :title="view.capsuleTooltip.value"
    role="button"
    tabindex="0"
    aria-keyshortcuts="Alt+P"
    :aria-label="`${t('pomodoroTimerTitle')} · ${view.capsuleText.value}`"
    @click="$emit('toggle')"
    @keydown.enter.prevent="$emit('toggle')"
    @keydown.space.prevent="$emit('toggle')"
  >
    <!-- 16px 矢量微进度环 (Peripheral Micro-Dial) -->
    <span class="w-4 h-4 flex items-center justify-center shrink-0 relative">
      <svg
        class="w-4 h-4 transform -rotate-90 st-pomo-heat-channel"
        viewBox="0 0 24 24"
      >
        <!-- 微底轨 -->
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke-width="2.2"
          stroke="currentColor"
          class="opacity-20"
          style="fill: none !important;"
        />
        <!-- 动态微进度弧：随色温迁移，由 --pomo-heat 驱动 -->
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke-width="2.5"
          stroke-linecap="round"
          :stroke="ringTint"
          :stroke-dasharray="56.54"
          :stroke-dashoffset="56.54 * (1 - view.progress.value)"
          class="transition-all duration-300"
          style="fill: none !important;"
        />
      </svg>

      <!-- 运行中心流呼吸光点 -->
      <span
        v-if="view.state.value === 'running' && !view.isFrozen.value"
        class="absolute w-1.5 h-1.5 rounded-full animate-ping opacity-75"
        :style="{ background: ringTint }"
      ></span>
      <!-- 凝滞态霜点 -->
      <span
        v-else-if="view.isFrozen.value"
        class="st-pomo-anim absolute w-1.5 h-1.5 rounded-full"
        :style="{
          background: 'var(--st-pomo-frozen-text)',
          animation: 'st-pomo-frozen-frost 2s ease-in-out infinite',
        }"
      ></span>
    </span>

    <!-- 等宽数字与状态文本 -->
    <span class="font-mono font-bold tracking-tight font-tabular text-xs">
      {{ view.capsuleText.value }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { PomodoroView } from './composables/usePomodoroPresenter';
import { ref } from 'vue';
import { t } from '../../i18n';

defineProps<{
  view: PomodoroView
}>()

defineEmits<{ (e: 'toggle'): void }>();

/** 胶囊元素引用，交由根组件传给浮层做智能锚定定位 */
const capsuleEl = ref<HTMLElement | null>(null);
defineExpose({ capsuleEl });

/** 进度弧取色，跟随色温通道 */
const ringTint = 'var(--pomo-tint, var(--b3-theme-primary))';
</script>
