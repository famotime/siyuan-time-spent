<template>
  <div 
    class="sy-tooltip-wrapper relative inline-flex items-center"
    @mouseenter="handleMouseEnter" 
    @mouseleave="handleMouseLeave"
    @focusin="showTooltip"
    @focusout="hideTooltip"
  >
    <slot />
    
    <Transition name="sy-tooltip-pop">
      <div 
        v-if="isVisible && content && !disabled" 
        role="tooltip"
        class="sy-tooltip-bubble absolute z-[9999] pointer-events-none px-2.5 py-1 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5"
        :class="placementClasses"
      >
        <span class="text-white font-sans leading-tight">{{ content }}</span>
        <kbd 
          v-if="shortcut" 
          class="sy-tooltip-kbd px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/20 text-white/90 border border-white/25 leading-none shrink-0"
        >
          {{ shortcut }}
        </kbd>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(defineProps<{
  content: string;
  shortcut?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}>(), {
  placement: 'bottom',
  delay: 120,
  disabled: false
});

const isVisible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const handleMouseEnter = () => {
  if (props.disabled) return;
  timer = setTimeout(() => {
    isVisible.value = true;
  }, props.delay);
};

const handleMouseLeave = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  isVisible.value = false;
};

const showTooltip = () => {
  if (!props.disabled) {
    isVisible.value = true;
  }
};

const hideTooltip = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  isVisible.value = false;
};

const placementClasses = computed(() => {
  switch (props.placement) {
    case 'top': 
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    case 'left': 
      return 'right-full top-1/2 -translate-y-1/2 mr-2';
    case 'right': 
      return 'left-full top-1/2 -translate-y-1/2 ml-2';
    default: 
      return 'top-full left-1/2 -translate-x-1/2 mt-2';
  }
});
</script>

<style scoped>
.sy-tooltip-bubble {
  background-color: rgba(15, 23, 42, 0.94);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
}

.sy-tooltip-pop-enter-active,
.sy-tooltip-pop-leave-active {
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1), transform 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

.sy-tooltip-pop-enter-from,
.sy-tooltip-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, 2px) scale(0.96);
}

/* 左右方向动画微调 */
:deep(.sy-tooltip-wrapper) {
  display: inline-flex;
}
</style>
