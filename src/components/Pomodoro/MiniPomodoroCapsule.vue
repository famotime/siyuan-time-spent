<template>
  <div
    v-if="visible"
    class="mini-pomodoro-dom-root"
    :style="capsuleStyle"
    :data-theme="themeMode"
    @pointerdown="startDrag"
  >
    <div class="capsule-container">
      <div class="action-bar" @pointerdown.stop>
        <!-- 📌 置顶按钮 -->
        <button
          type="button"
          class="btn-action"
          :class="{ 'is-pinned': isPinned }"
          :title="isPinned ? t('pomodoroUnpin') : t('pomodoroPin')"
          @click="togglePin"
        >
          <svg viewBox="0 0 24 24">
            <line x1="12" y1="17" x2="12" y2="22" />
            <path d="M5 17h14v-2l-2-3V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 3v2z" />
          </svg>
        </button>

        <!-- ⤢ 还原按钮 -->
        <button
          type="button"
          class="btn-action"
          :title="t('pomodoroRestore')"
          @click="restore"
        >
          <svg viewBox="0 0 24 24">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        <!-- ✕ 关闭按钮 -->
        <button
          type="button"
          class="btn-action"
          :title="t('pomodoroClose')"
          @click="close"
        >
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="time-display" :class="phaseClass">
        {{ displayText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { t } from '../../i18n';

const props = defineProps<{
  initialX?: number;
  initialY?: number;
}>();

const emit = defineEmits<{
  (e: 'restore'): void;
  (e: 'togglePin'): void;
  (e: 'close'): void;
  (e: 'positionChange', pos: { x: number; y: number }): void;
}>();

const visible = ref(true);
const displayText = ref('25:00');
const state = ref('idle');
const uiPhase = ref('idle');
const themeMode = ref<'light' | 'dark'>('dark');
const isPinned = ref(true);

const posX = ref(props.initialX ?? (typeof window !== 'undefined' ? window.innerWidth - 120 : 100));
const posY = ref(props.initialY ?? 60);

const capsuleStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  zIndex: isPinned.value ? 999999 : 9999,
}));

const phaseClass = computed(() => {
  if (state.value === 'paused') return 'phase-paused';
  if (uiPhase.value === 'shortBreak' || uiPhase.value === 'longBreak' || uiPhase.value === 'short-break' || uiPhase.value === 'long-break') {
    return 'phase-break';
  }
  return 'phase-focus';
});

let channel: BroadcastChannel | null = null;

const syncTheme = () => {
  const isDark =
    document.documentElement.getAttribute('data-theme-mode') === 'dark' ||
    document.body.getAttribute('data-theme-mode') === 'dark';
  themeMode.value = isDark ? 'dark' : 'light';
};

// 拖拽逻辑
let isDragging = false;
let startPointerX = 0;
let startPointerY = 0;
let startPosX = 0;
let startPosY = 0;

const onPointerMove = (e: MouseEvent | PointerEvent) => {
  if (!isDragging) return;
  const deltaX = e.clientX - startPointerX;
  const deltaY = e.clientY - startPointerY;
  const width = 96;
  const height = 48;
  const maxX = Math.max(0, window.innerWidth - width);
  const maxY = Math.max(0, window.innerHeight - height);

  posX.value = Math.max(0, Math.min(maxX, startPosX + deltaX));
  posY.value = Math.max(0, Math.min(maxY, startPosY + deltaY));
};

const onPointerUp = () => {
  if (!isDragging) return;
  isDragging = false;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  emit('positionChange', { x: posX.value, y: posY.value });
};

const startDrag = (e: MouseEvent | PointerEvent) => {
  if (e.button !== 0) return;
  isDragging = true;
  startPointerX = e.clientX;
  startPointerY = e.clientY;
  startPosX = posX.value;
  startPosY = posY.value;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
};

const restore = () => {
  emit('restore');
  channel?.postMessage({ type: 'ACTION', action: 'RESTORE' });
};

const togglePin = () => {
  isPinned.value = !isPinned.value;
  emit('togglePin');
  channel?.postMessage({ type: 'ACTION', action: 'TOGGLE_PIN' });
};

const close = () => {
  visible.value = false;
  emit('close');
  channel?.postMessage({ type: 'ACTION', action: 'CLOSE' });
};

onMounted(() => {
  syncTheme();
  try {
    channel = new BroadcastChannel('siyuan-time-spent-pomodoro-mini');
    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.type === 'STATE_UPDATE') {
        if (data.displayText) displayText.value = data.displayText;
        if (data.state) state.value = data.state;
        if (data.uiPhase) uiPhase.value = data.uiPhase;
        if (data.themeMode) themeMode.value = data.themeMode;
        if (typeof data.alwaysOnTop === 'boolean') isPinned.value = data.alwaysOnTop;
      }
    };
    channel.postMessage({ type: 'REQUEST_INIT' });
  } catch {}
});

onUnmounted(() => {
  if (channel) {
    channel.close();
    channel = null;
  }
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});
</script>

<style scoped>
.mini-pomodoro-dom-root {
  position: fixed;
  width: 96px;
  height: 48px;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
  border-radius: 12px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  opacity: 0.7;
  transition: opacity 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.mini-pomodoro-dom-root:active {
  cursor: grabbing;
}

.mini-pomodoro-dom-root:hover {
  opacity: 1;
}

/* 暗色主题 */
.mini-pomodoro-dom-root[data-theme="dark"] {
  background: rgba(18, 20, 29, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}
.mini-pomodoro-dom-root[data-theme="dark"]:hover {
  background: rgba(18, 20, 29, 0.95);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
}

/* 亮色主题 */
.mini-pomodoro-dom-root[data-theme="light"] {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
.mini-pomodoro-dom-root[data-theme="light"]:hover {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

.capsule-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 18px;
  margin-top: -2px;
  margin-bottom: 1px;
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.mini-pomodoro-dom-root:hover .action-bar {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.btn-action {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  color: rgba(148, 163, 184, 0.85);
  transition: color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}

.btn-action:hover {
  background-color: rgba(148, 163, 184, 0.2);
  transform: scale(1.1);
}

.mini-pomodoro-dom-root[data-theme="dark"] .btn-action:hover {
  color: #ffffff;
}

.mini-pomodoro-dom-root[data-theme="light"] .btn-action:hover {
  color: #0f172a;
}

.btn-action.is-pinned {
  color: #6366f1 !important;
}

.btn-action svg {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.time-display {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  transition: color 0.2s ease, transform 0.15s ease;
  color: #f1f5f9;
}

.mini-pomodoro-dom-root[data-theme="light"] .time-display {
  color: #1e293b;
}

.mini-pomodoro-dom-root:hover .time-display {
  transform: translateY(1px);
}

.phase-focus {
  color: #f59e0b !important;
}

.phase-break {
  color: #06b6d4 !important;
}

.phase-paused {
  color: #94a3b8 !important;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
