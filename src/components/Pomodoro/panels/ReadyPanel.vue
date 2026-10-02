<template>
  <div class="flex flex-col gap-2.5">
    <!-- 模式分段切换胶囊 -->
    <div class="grid grid-cols-2 p-1 rounded-xl bg-subtle text-xs font-semibold">
      <button
        type="button"
        class="py-1 rounded-lg transition-all text-center cursor-pointer"
        :class="!isStopwatchMode ? 'bg-surface text-primary shadow-xs' : 'text-secondary hover:text-primary'"
        @click="$emit('update:isStopwatchMode', false)"
      >
        {{ t('pomodoroModeCountdown') }}
      </button>
      <button
        type="button"
        class="py-1 rounded-lg transition-all text-center cursor-pointer"
        :class="isStopwatchMode ? 'bg-surface text-primary shadow-xs' : 'text-secondary hover:text-primary'"
        @click="$emit('update:isStopwatchMode', true)"
      >
        {{ t('pomodoroStopwatch') }}
      </button>
    </div>

    <!-- 倒计时模式专属配置 -->
    <template v-if="!isStopwatchMode">
      <!-- 智能时长推荐芯片 -->
      <button
        v-if="smartEnabled && recommendation"
        type="button"
        class="w-full px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 group"
        :class="minutes === recommendation.minutes ? 'border-primary bg-primary-subtle' : 'border-subtle bg-surface hover:border-primary/50'"
        :style="minutes === recommendation.minutes ? activePresetStyle : inactivePresetStyle"
        @click="$emit('applyRecommendation', recommendation.minutes)"
      >
        <span
          class="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
          style="background: var(--b3-theme-primary); color: #fff;"
        >
          <svg
            class="w-3.5 h-3.5"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-xs font-bold leading-tight">
            {{ t('pomodoroSmartChip', { min: recommendation.minutes }) }}
          </span>
          <span class="block text-[12px] leading-tight opacity-70 truncate">
            {{ t(recommendation.reasonKey, recommendation.params) }}
          </span>
        </span>
      </button>

      <!-- 快捷步长预设 -->
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="preset in presets"
          :key="preset"
          type="button"
          class="py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
          :style="minutes === preset ? activePresetStyle : inactivePresetStyle"
          @click="$emit('update:minutes', preset)"
        >
          <span>{{ preset }}</span>
          <span class="text-[12px] font-normal opacity-70">m</span>
        </button>
      </div>

      <!-- 阻尼微调滑块与步进 -->
      <div class="p-2 rounded-xl border border-subtle bg-surface flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-secondary font-medium">{{ t('pomodoroCustomDuration') }}</span>
          <div class="flex items-center gap-1 font-mono font-bold">
            <input
              type="number"
              :value="minutes"
              min="1"
              max="180"
              class="w-12 text-center text-sm font-bold bg-subtle rounded-md border border-subtle focus:outline-none"
              @input="onMinutesInput"
              @change="onMinutesCommit"
            />
            <span class="text-secondary text-[12px]">{{ t('pomodoroMinutesUnit') }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="p-1 rounded-lg border border-subtle hover:bg-subtle cursor-pointer shrink-0"
            :title="t('pomodoroDecrease')"
            @click="$emit('adjust', -5)"
          >
            <svg
              class="w-3.5 h-3.5"
              style="fill: none !important;"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
              />
            </svg>
          </button>

          <input
            type="range"
            :value="minutes"
            min="5"
            max="120"
            step="5"
            class="flex-1 cursor-pointer h-1.5 bg-subtle rounded-lg accent-current text-primary"
            @input="onMinutesInput"
          />

          <button
            type="button"
            class="p-1 rounded-lg border border-subtle hover:bg-subtle cursor-pointer shrink-0"
            :title="t('pomodoroIncrease')"
            @click="$emit('adjust', 5)"
          >
            <svg
              class="w-3.5 h-3.5"
              style="fill: none !important;"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
              />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- 启动入定按钮 (思源原生主题色全宽按钮) -->
    <button
      type="button"
      class="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mt-0.5 active:scale-[0.98]"
      :style="primaryBtnStyle"
      @click="$emit('start')"
    >
      <svg
        class="w-3.5 h-3.5 text-white"
        style="fill: none !important;"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      <span>{{ isStopwatchMode ? `${t('pomodoroStart')} (${t('pomodoroStopwatch')})` : `${t('pomodoroStart')} (${minutes}m)` }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DurationRecommendation } from '../composables/useSmartDuration';
import { computed } from 'vue';
import { t } from '../../../i18n';

const props = defineProps<{
  isStopwatchMode: boolean
  minutes: number
  presets: ReadonlyArray<number>
  recommendation: DurationRecommendation | null
  smartEnabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isStopwatchMode', v: boolean): void
  (e: 'update:minutes', v: number): void
  (e: 'applyRecommendation', v: number): void
  (e: 'adjust', delta: number): void
  (e: 'start'): void
}>()

const activePresetStyle = computed(() => ({
  borderColor: 'var(--b3-theme-primary)',
  background: 'color-mix(in srgb, var(--b3-theme-primary) 12%, transparent)',
  color: 'var(--b3-theme-primary)',
}))

const inactivePresetStyle = computed(() => ({
  borderColor: 'color-mix(in srgb, var(--b3-theme-on-background) 12%, transparent)',
  background: 'var(--b3-theme-surface)',
  color: 'var(--b3-theme-on-surface)',
}))

const primaryBtnStyle = computed(() => ({
  background: 'var(--b3-theme-primary)',
  boxShadow: '0 4px 12px color-mix(in srgb, var(--b3-theme-primary) 35%, transparent)',
}))

/** 夹紧到 1-180 分钟后上抛；输入过程中的中间态（如空串）不打断绑定 */
const emitMinutes = (raw: number) => {
  if (!Number.isFinite(raw)) return
  emit('update:minutes', Math.max(1, Math.min(180, Math.round(raw))))
}

const onMinutesInput = (e: Event) => {
  emitMinutes(Number((e.target as HTMLInputElement).value))
}

const onMinutesCommit = (e: Event) => {
  const el = e.target as HTMLInputElement
  const raw = Number(el.value)
  const safe = Number.isFinite(raw) ? Math.max(1, Math.min(180, Math.round(raw))) : props.minutes
  el.value = String(safe)
  emitMinutes(safe)
}
</script>
