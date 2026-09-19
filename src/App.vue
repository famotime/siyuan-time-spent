<template>
  <div v-if="isVisible" class="plugin-time-spent-overlay" @click.self="closeDashboard">
    <div class="dashboard-modal-container bg-gray-950 border border-gray-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col" @click.stop>
      <div class="modal-content flex-grow overflow-auto">
        <Dashboard @close="closeDashboard" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dashboard from './components/Dashboard.vue';

const isVisible = ref(false);

const openDashboard = () => {
  isVisible.value = true;
};

const closeDashboard = () => {
  isVisible.value = false;
};

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
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto; /* allow clicks */
}

.dashboard-modal-container {
  width: 92vw;
  height: 90vh;
  max-width: 1320px;
  pointer-events: auto;
}
</style>