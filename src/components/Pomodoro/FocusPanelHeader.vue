<template>
  <header class="pomo-header">
    <button
      v-if="appearanceOpen"
      type="button"
      class="st-pomo-button st-pomo-button--quiet"
      @click="$emit('appearance')"
    >
      <svg
        viewBox="0 0 24 24"
        style="fill: none !important"
        stroke="currentColor"
        stroke-width="1.75"
        aria-hidden="true"
      >
        <path d="m14 6-6 6 6 6" />
      </svg>
      {{ t('pomodoroBack') }}
    </button>
    <span
      v-else
      class="pomo-header__title"
    >{{ t('pomodoroFocusTitle') }}</span>
    <div class="pomo-header__actions">
      <button
        v-if="canCustomize && !appearanceOpen"
        type="button"
        class="st-pomo-button st-pomo-button--quiet"
        :aria-expanded="appearanceOpen"
        @click="$emit('appearance')"
      >
        {{ t('pomodoroAppearance') }}
      </button>
      <SyIconButton
        class="pomo-header__close st-pomo-anim-soft"
        icon="close"
        size="lg"
        :aria-label="t('pomodoroClose')"
        @click="$emit('close')"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { t } from '../../i18n'
import SyIconButton from '../Common/SyIconButton.vue'

defineProps<{ appearanceOpen: boolean, canCustomize: boolean }>()
defineEmits<{ (e: 'appearance'): void, (e: 'close'): void }>()
</script>

<style scoped>
.pomo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
}
.pomo-header__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.pomo-header__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.pomo-header svg {
  width: 16px;
  height: 16px;
}
.pomo-header__close {
  color: var(--st-pomo-muted);
}
@media (pointer: coarse) {
  .pomo-header__close {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
