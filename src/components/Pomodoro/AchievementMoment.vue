<template>
  <Teleport to="body">
    <div
      v-if="visible && !reduced"
      class="fixed inset-0 z-[10005] flex items-center justify-center p-6"
      style="background: var(--st-surface-overlay, rgba(15, 23, 42, 0.55)); backdrop-filter: blur(4px);"
      role="status"
      aria-live="polite"
      @click="$emit('done')"
    >
      <div
        class="st-pomo-anim relative flex flex-col items-center gap-2 px-8 py-7 rounded-3xl text-center"
        :style="cardStyle"
        :class="closing ? 'st-pomo-moment-out' : 'st-pomo-moment-in'"
      >
        <!-- 达成迸发涟漪 -->
        <span
          class="st-pomo-anim absolute inset-0 rounded-3xl pointer-events-none"
          :style="bloomStyle"
          aria-hidden="true"
        ></span>

        <span
          class="relative w-12 h-12 rounded-full flex items-center justify-center"
          :style="orbStyle"
          aria-hidden="true"
        >
          <svg
            class="w-6 h-6"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.2"
          >
            <polyline
              points="20 6 9 17 4 12"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>

        <span
          class="relative text-sm font-black tracking-wide"
          style="color: var(--st-text-primary);"
        >
          {{ t('pomodoroMomentTitle') }}
        </span>
        <span
          class="relative text-xs font-medium"
          style="color: var(--st-text-secondary);"
        >
          {{ t('pomodoroMomentSub', {
            min: minutes, n: cycleCompleted, total: cycleSize,
          }) }}
        </span>
        <span
          v-if="cycleComplete"
          class="relative text-xs font-bold"
          style="color: var(--st-pomo-longbreak-text);"
        >
          {{ t('pomodoroLongBreakTitle') }}
        </span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { t } from '../../i18n';

const props = defineProps<{
  visible: boolean
  minutes: number
  cycleCompleted: number
  cycleSize: number
  cycleComplete: boolean
  reduced: boolean
}>()

const emit = defineEmits<{ (e: 'done'): void }>();

const closing = ref(false);
let hideTimer: any = null;

watch(() => props.visible, (v) => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (!v) {
    closing.value = false
    return
  }
  closing.value = false
  // 2 秒后自动消散，不打断后续操作
  hideTimer = setTimeout(() => {
    closing.value = true
    hideTimer = setTimeout(() => {
      closing.value = false
      emit('done')
    }, 400)
  }, 2000)
})


const cardStyle = computed(() => ({
  background: 'color-mix(in srgb, var(--st-bg-elevated) 96%, transparent)',
  border: '1px solid var(--st-pomo-active-border)',
  boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.45)',
}))

const orbStyle = computed(() => ({
  background: 'var(--st-pomo-active-bg)',
  color: 'var(--st-pomo-active-text)',
  boxShadow: '0 0 24px color-mix(in srgb, var(--st-pomo-active-text) 35%, transparent)',
}))

const bloomStyle = computed(() => ({
  animation: 'st-pomo-bloom var(--st-pomo-bloom-duration) cubic-bezier(0.16, 1, 0.3, 1) 1',
  background: 'radial-gradient(circle, color-mix(in srgb, var(--st-pomo-active-text) 22%, transparent) 0%, transparent 70%)',
}))
</script>
