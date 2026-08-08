<template>
  <div v-if="isVisible" class="plugin-time-spent-overlay">
    <div class="dashboard-modal-container bg-gray-900 border border-gray-700 shadow-2xl rounded-xl overflow-hidden flex flex-col">
      <div class="modal-header bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-200 flex items-center gap-2">
          <span>⏱️</span>
          <span>源时记 · 时间分布与专注看板</span>
        </h2>
        <button @click="closeDashboard" class="text-gray-400 hover:text-white transition-colors" title="关闭看板">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-content flex-grow overflow-auto">
        <Dashboard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePlugin } from './main';
import Dashboard from './components/Dashboard.vue';

const plugin = usePlugin();
const isVisible = ref(false);

const openDashboard = () => {
  isVisible.value = true;
};

const closeDashboard = () => {
  isVisible.value = false;
};

onMounted(() => {
  plugin.addTopBar({
    icon: 'iconClock',
    title: '源时记 (时间追踪与专注看板)',
    callback: () => {
      openDashboard();
    },
  });
});
</script>

<style scoped>
.plugin-time-spent-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto; /* allow clicks */
}

.dashboard-modal-container {
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  pointer-events: auto;
}
</style>