<template>
  <header class="pomo-header">
    <button
      type="button"
      class="pomo-header__brand st-pomo-anim-soft"
      :title="t('title')"
      :aria-label="t('title')"
      @click="$emit('openDashboard')"
    >
      <img
        :src="iconUrl"
        :alt="t('title')"
        class="pomo-header__logo"
      />
      <span class="pomo-header__title">{{ t('title') }}</span>
    </button>
    <div class="pomo-header__actions">
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
import iconUrl from '../../../icon.webp'
import { t } from '../../i18n'
import SyIconButton from '../Common/SyIconButton.vue'

defineEmits<{ (e: 'openDashboard'): void, (e: 'close'): void }>()
</script>

<style scoped>
.pomo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
}
.pomo-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 4px 8px;
  margin-left: -8px;
  border-radius: var(--st-pomo-radius-sm, 8px);
  cursor: pointer;
  color: var(--st-pomo-ink);
  text-decoration: none;
  transition: background-color 0.15s ease, transform 0.15s ease;
}
.pomo-header__brand:hover {
  background-color: var(--st-pomo-soft);
  transform: translateY(-0.5px);
}
.pomo-header__brand:focus-visible {
  outline: 2px solid var(--st-pomo-accent);
  outline-offset: 1px;
}
.pomo-header__logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
  border-radius: 6px;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.15));
}
.pomo-header__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.pomo-header__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
/* 关闭按钮与相邻的安静按钮同族：不用共享组件的实心底色，
   选择器带到 .st-pomo-ui 以保证压过 SyIconButton 的 secondary 底色。
   同时收回它的 transition-all，否则焦点环会被过渡拖成灰边。 */
.st-pomo-ui .pomo-header__close {
  background-color: transparent;
  border-color: transparent;
  color: var(--st-pomo-muted);
  transition-property: background-color, color, transform;
}
.st-pomo-ui .pomo-header__close:hover {
  background-color: var(--st-pomo-soft);
  color: var(--st-pomo-ink);
}
@media (pointer: coarse) {
  .pomo-header__close {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
