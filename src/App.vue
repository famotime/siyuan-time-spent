<template>
  <div v-if="isVisible" class="plugin-time-spent-overlay" @click.self="closeDashboard">
    <div class="dashboard-modal-container shadow-2xl rounded-2xl overflow-hidden flex flex-col" @click.stop>
      <div class="modal-content flex-grow overflow-auto">
        <Dashboard @close="closeDashboard" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Dashboard from './components/Dashboard.vue';

const isVisible = ref(false);

const openDashboard = () => {
  isVisible.value = true;
};

const closeDashboard = () => {
  isVisible.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isVisible.value) {
    // 只有在顶层弹窗且没有其他嵌套弹窗打开时才关闭
    const activeModals = document.querySelectorAll('.sy-summary-modal-mask');
    if (activeModals.length === 0) {
      closeDashboard();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

defineExpose({
  openDashboard,
  closeDashboard,
  isVisible,
});
</script>

<style scoped>
.plugin-time-spent-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--st-surface-overlay, rgba(15, 23, 42, 0.55));
  backdrop-filter: blur(var(--st-surface-backdrop-blur, 8px));
  -webkit-backdrop-filter: blur(var(--st-surface-backdrop-blur, 8px));
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

.dashboard-modal-container {
  width: 92vw;
  height: 90vh;
  max-width: 1320px;
  pointer-events: auto;
  background-color: var(--st-bg-base, #0d1117);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--st-border-subtle, rgba(255, 255, 255, 0.05));
  transition: background-color 200ms ease, border-color 200ms ease;
}
</style>