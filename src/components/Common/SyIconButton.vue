<template>
  <button
    type="button"
    class="sy-icon-button inline-flex items-center justify-center shrink-0 rounded-xl transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
    :class="[
      sizeClasses,
      variantClasses,
      { 'is-active': active }
    ]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <!-- 优先使用默认插槽，插槽内包含用户传入的自定义 svg -->
    <slot>
      <!-- 内置的高频显式线框 SVG 图标系统 (统一 24x24 栅格，stroke-width 1.75，fill: none !important) -->
      <svg
        v-if="icon"
        class="sy-wire-icon"
        :class="iconSizeClasses"
        style="fill: none !important;"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <!-- Chevron Left (上一周期) -->
        <path v-if="icon === 'chevron-left'" d="M15 18l-6-6 6-6" />
        
        <!-- Chevron Right (下一周期) -->
        <path v-else-if="icon === 'chevron-right'" d="M9 18l6-6-6-6" />

        <!-- Calendar Clock (回到今天/当前周期) -->
        <g v-else-if="icon === 'today' || icon === 'calendar-clock'">
          <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <circle cx="16" cy="16" r="6" />
          <path d="M16 14v2l1.5 1.5" />
        </g>

        <!-- Rotate CW (刷新数据) -->
        <g v-else-if="icon === 'refresh' || icon === 'rotate-cw'">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 21h5v-5" />
        </g>

        <!-- Settings 2 (插件设置) -->
        <g v-else-if="icon === 'settings' || icon === 'settings-2'">
          <path d="M20 7h-9" />
          <path d="M14 17H5" />
          <circle cx="17" cy="17" r="3" />
          <circle cx="7" cy="7" r="3" />
        </g>

        <!-- Download (导出) -->
        <g v-else-if="icon === 'download'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </g>

        <!-- Sparkles (AI 深度复盘) -->
        <g v-else-if="icon === 'sparkles' || icon === 'ai'">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </g>

        <!-- Close / X (关闭) -->
        <g v-else-if="icon === 'close' || icon === 'x'">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </g>

        <!-- Target (专注目标) -->
        <g v-else-if="icon === 'target'">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </g>

        <!-- Edit (编辑) -->
        <g v-else-if="icon === 'edit'">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </g>

        <!-- Trash (清除) -->
        <g v-else-if="icon === 'trash'">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </g>

        <!-- Check (成功/保存) -->
        <polyline v-else-if="icon === 'check'" points="20 6 9 17 4 12" />

        <!-- BookPlus (插入思源日记) -->
        <g v-else-if="icon === 'book-plus'">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h7" />
          <path d="M16 14v6" />
          <path d="M13 17h6" />
        </g>

        <!-- FileText (导出笔记) -->
        <g v-else-if="icon === 'file-text'">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </g>
      </svg>
    </slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'primary' | 'ai-sparkle' | 'danger';
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}>(), {
  size: 'md',
  variant: 'secondary',
  active: false,
  disabled: false
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-7 h-7';
    case 'lg':
      return 'w-9.5 h-9.5 sm:w-10 sm:h-10';
    default:
      return 'w-8.5 h-8.5';
  }
});

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3.5 h-3.5';
    case 'lg':
      return 'w-5 h-5';
    default:
      return 'w-4 h-4';
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'ghost':
      return 'text-gray-400 hover:text-white bg-transparent hover:bg-gray-800/60 border border-transparent';
    case 'primary':
      return 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 border border-indigo-500/50';
    case 'ai-sparkle':
      return 'text-purple-200 hover:text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 border border-purple-500/40';
    case 'danger':
      return 'text-gray-400 hover:text-red-400 bg-gray-900/80 hover:bg-red-950/40 border border-gray-800 hover:border-red-500/40';
    default:
      // secondary (标准桌面工具条按钮，自动融入思源明暗主题)
      return 'sy-btn-secondary';
  }
});
</script>

<style scoped>
/* 按钮基础与主题自适应 */
.sy-btn-secondary {
  background-color: var(--st-bg-elevated, rgba(30, 41, 59, 0.7));
  color: var(--st-text-secondary, #cbd5e1);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-btn-secondary:hover {
  background-color: var(--st-bg-hover, rgba(51, 65, 85, 0.8));
  color: var(--st-text-primary, #ffffff);
  border-color: var(--st-border-strong, rgba(255, 255, 255, 0.2));
}

.sy-btn-secondary.is-active {
  background-color: var(--st-primary, #6366f1);
  color: #ffffff;
  border-color: var(--st-primary-hover, #4f46e5);
}

/* 核心线框图标防御：无论宿主如何覆盖，强制 fill: none */
:deep(svg),
svg.sy-wire-icon {
  fill: none !important;
}
</style>
