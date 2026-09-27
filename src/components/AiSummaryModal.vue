<template>
  <div v-if="visible" 
       class="fixed inset-0 z-50 sy-summary-modal-mask flex items-center justify-center p-3 sm:p-6 transition-all duration-300"
       @click.self="handleClose">
    
    <!-- Modal Card Container (深度适配明暗主题) -->
    <div class="sy-modal-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
      
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b sy-divider flex items-center justify-between sy-header-bg shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
            <svg class="w-5 h-5 text-white sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm sm:text-base font-bold sy-text-primary tracking-wide">
                {{ t('aiSummaryModalTitle') }}
              </h3>
              <!-- 周期标签 -->
              <span class="text-xs px-2.5 py-0.5 rounded-full sy-badge font-medium font-mono font-tabular">
                {{ scopeTitle }}
              </span>
              <!-- 模型标签 -->
              <span v-if="currentModel" class="text-xs px-2.5 py-0.5 rounded-full sy-model-badge font-medium font-mono">
                {{ currentModel }}
              </span>
            </div>
            <!-- 设定目标提示 (纯矢量显式线框) -->
            <p v-if="focusGoal" class="text-xs sy-text-secondary mt-1 truncate max-w-md flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-indigo-500 shrink-0 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>{{ t('aiModalTarget') }}{{ focusGoal }}</span>
            </p>
          </div>
        </div>

        <!-- Close Button -->
        <SyTooltip :content="`${t('aiModalClose')} (Esc)`" placement="bottom">
          <SyIconButton 
            icon="close" 
            size="md" 
            variant="ghost" 
            :aria-label="t('aiModalClose')" 
            @click="handleClose" 
          />
        </SyTooltip>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-5 sm:p-6 overflow-y-auto flex-1 min-h-[260px] max-h-[calc(88vh-140px)] sy-body-bg">
        
        <!-- Case 1: 未配置 AI 服务 -->
        <div v-if="noConfigError" class="flex flex-col items-center justify-center py-10 text-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-1">
            <svg class="w-8 h-8 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="max-w-md">
            <h4 class="text-sm sm:text-base font-bold sy-text-primary">{{ t('aiModalNoConfigTitle') }}</h4>
            <p class="text-xs sy-text-secondary mt-2 leading-relaxed" v-html="t('aiModalNoConfigDesc')">
            </p>
          </div>
          <button @click="handleOpenSettings" 
                  class="mt-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer">
            {{ t('aiModalGoConfig') }}
          </button>
        </div>

        <!-- Case 2: 发生网络或接口错误 -->
        <div v-else-if="errorMessage" class="flex flex-col items-center justify-center py-8 text-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <svg class="w-7 h-7 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div class="max-w-lg">
            <h4 class="text-xs sm:text-sm font-bold text-rose-500">{{ t('aiModalErrorTitle') }}</h4>
            <p class="text-xs sy-text-secondary mt-1 font-mono sy-code-block p-3 rounded-lg border sy-divider break-all text-left">
              {{ errorMessage }}
            </p>
          </div>
          <div class="flex items-center gap-3 mt-2">
            <button @click="generateSummary" 
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer">
              {{ t('aiModalRegenerate') }}
            </button>
            <button @click="handleOpenSettings" 
                    class="px-4 py-2 rounded-xl sy-btn-secondary text-xs font-medium border transition-all cursor-pointer">
              {{ t('aiModalCheckSettings') }}
            </button>
          </div>
        </div>

        <!-- Case 3: 思考生成中 (前置等待骨架) -->
        <div v-else-if="loading && !summaryMarkdown" class="flex flex-col items-center justify-center py-12 gap-4">
          <div class="relative w-12 h-12 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <svg class="w-6 h-6 text-indigo-500 animate-pulse sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="text-center">
            <div class="text-xs sm:text-sm font-semibold sy-text-primary">{{ t('aiModalThinking') }}</div>
            <div class="text-xs sy-text-secondary mt-1">{{ t('aiModalThinkingDesc') }}</div>
          </div>
        </div>

        <!-- Case 4: 渲染已生成或正在流式生成的 Markdown 内容 -->
        <div v-else class="markdown-preview sy-text-primary leading-relaxed text-xs sm:text-sm">
          <div v-html="renderedHtml"></div>
          
          <!-- 流式打字中光标指示 -->
          <span v-if="loading" class="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
        </div>

      </div>

      <!-- Modal Footer (生产力生态沉淀操作区) -->
      <div class="px-5 py-3.5 border-t sy-divider flex flex-wrap items-center justify-between gap-3 sy-header-bg shrink-0">
        <div class="text-xs sy-text-secondary flex items-center gap-2 font-tabular">
          <span v-if="loading" class="flex items-center gap-1.5 text-indigo-500 font-medium">
            <span class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            {{ t('aiModalGeneratingStatus') }}
          </span>
          <span v-else class="sy-text-secondary">
            {{ t('aiModalTotalSessions', { count: logs?.length || 0 }) }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- 导出为独立思源复盘文档 (核心生产力生态闭环) -->
          <SyTooltip :content="t('aiModalSaveDocTooltip')" placement="top">
            <button 
              @click="saveAsSiyuanDoc" 
              :disabled="loading || !summaryMarkdown || isSavingDoc"
              class="px-3.5 py-1.5 rounded-xl sy-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg class="w-3.5 h-3.5 text-indigo-500 sy-wire-icon" :class="{ 'animate-spin': isSavingDoc }" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{{ isSavingDoc ? t('aiModalSavingDoc') : t('aiModalSaveDoc') }}</span>
            </button>
          </SyTooltip>

          <!-- 复制总结 -->
          <SyTooltip :content="t('aiModalCopyTooltip')" placement="top">
            <button 
              @click="copySummary" 
              :disabled="loading || !summaryMarkdown"
              class="px-3.5 py-1.5 rounded-xl sy-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg v-if="!copySuccess" class="w-3.5 h-3.5 sy-wire-icon text-indigo-500" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg v-else class="w-3.5 h-3.5 text-emerald-500 sy-wire-icon" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{{ copySuccess ? t('aiModalCopiedBtn') : t('aiModalCopyBtn') }}</span>
            </button>
          </SyTooltip>

          <!-- 重新生成 -->
          <button 
            @click="generateSummary" 
            :disabled="loading"
            class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 sy-wire-icon" :class="{ 'animate-spin': loading }" style="fill: none !important;" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ t('aiModalRegenerate') }}</span>
          </button>

          <!-- 关闭 -->
          <button 
            @click="handleClose" 
            class="px-3.5 py-1.5 rounded-xl sy-btn-secondary text-xs font-medium border transition-colors cursor-pointer"
          >
            {{ t('aiModalClose') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { showMessage } from 'siyuan';
import type TimeSpentPlugin from '../index';
import type { TimeLog } from '../models/TimeLog';
import { AIService } from '../utils/ai-service';
import { renderMarkdown } from '../utils/markdown';
import SyTooltip from './Common/SyTooltip.vue';
import SyIconButton from './Common/SyIconButton.vue';
import { lsNotebooks, createDocWithMd } from '../api';
import { t, currentLang } from '../i18n';

const props = defineProps<{
  visible: boolean;
  plugin: TimeSpentPlugin;
  logs: TimeLog[];
  scopeTitle: string;
  scopeType: 'day' | 'week' | 'month';
  focusGoal?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const loading = ref(false);
const summaryMarkdown = ref('');
const errorMessage = ref('');
const noConfigError = ref(false);
const copySuccess = ref(false);
const isSavingDoc = ref(false);

const currentModel = computed(() => {
  if (!props.plugin) return '';
  const cfg = props.plugin.getActiveAiConfig();
  return cfg.model || 'gpt-4o';
});

const renderedHtml = computed(() => {
  return renderMarkdown(summaryMarkdown.value);
});

// 生成总结
const generateSummary = async () => {
  if (!props.plugin) return;

  const cfg = props.plugin.getActiveAiConfig();
  if (!cfg.apiKey || !cfg.baseUrl) {
    noConfigError.value = true;
    errorMessage.value = '';
    return;
  }

  noConfigError.value = false;
  errorMessage.value = '';
  loading.value = true;
  summaryMarkdown.value = '';

  try {
    await AIService.generateSummary({
      plugin: props.plugin,
      logs: props.logs || [],
      scopeTitle: props.scopeTitle,
      scopeType: props.scopeType,
      focusGoal: props.focusGoal,
      onChunk: (_delta, accumulated) => {
        summaryMarkdown.value = accumulated;
      },
    });
  } catch (err: any) {
    if (err.message === 'NO_API_KEY' || err.message === 'NO_BASE_URL') {
      noConfigError.value = true;
    } else {
      errorMessage.value = err.message || '未知错误';
    }
  } finally {
    loading.value = false;
  }
};

const copySummary = async () => {
  if (!summaryMarkdown.value) return;
  try {
    await navigator.clipboard.writeText(summaryMarkdown.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy summary:', err);
    showMessage(t('aiSummaryCopyFailed'), 3000, 'error');
  }
};

// 沉淀为思源笔记独立文档
const saveAsSiyuanDoc = async () => {
  if (!summaryMarkdown.value) return;
  isSavingDoc.value = true;
  try {
    const notebooksRes = await lsNotebooks();
    const openNotebook = notebooksRes?.notebooks?.find(nb => !nb.closed) || notebooksRes?.notebooks?.[0];
    if (!openNotebook) {
      showMessage(t('aiModalSaveDocFailed'), 3000, 'error');
      return;
    }

    const isEn = currentLang.value === 'en_US';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const folderName = isEn ? 'TimeReview' : '时间复盘';
    const pluginName = isEn ? 'TimeSpent' : '源时记';
    const docPath = `/${folderName}/${pluginName} · ${props.scopeTitle} (${dateStr})`;
    
    // 生成美观的 Markdown 头部
    const title = isEn ? `# TimeSpent · ${props.scopeTitle} Deep Review` : `# 源时记 · ${props.scopeTitle} 深度复盘`;
    const metaTime = isEn ? `⏱️ Generated: ${now.toLocaleString()}` : `⏱️ 生成时间：${now.toLocaleString()}`;
    const metaSessions = isEn ? `Sessions: ${props.logs?.length || 0}` : `统计会话：${props.logs?.length || 0} 次`;
    const metaGoal = props.focusGoal ? (isEn ? ` | Goal: ${props.focusGoal}` : ` | 专注目标：${props.focusGoal}`) : '';
    const content = `${title}\n\n> ${metaTime} | ${metaSessions}${metaGoal}\n\n${summaryMarkdown.value}`;

    const docId = await createDocWithMd(openNotebook.id, docPath, content);
    if (docId) {
      showMessage(t('aiModalSaveDocSuccess'), 3500, 'info');
      // 打开新建的文档
      window.open(`siyuan://blocks/${docId}`);
    } else {
      showMessage(t('aiModalSaveDocFailed'), 3000, 'error');
    }
  } catch (err) {
    console.error('Failed to create siyuan doc:', err);
    showMessage(t('aiModalSaveDocFailed'), 3000, 'error');
  } finally {
    isSavingDoc.value = false;
  }
};

const handleOpenSettings = () => {
  if (props.plugin) {
    props.plugin.openSetting();
  }
};

const handleClose = () => {
  emit('close');
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    generateSummary();
  } else {
    errorMessage.value = '';
  }
});
</script>

<style scoped>
.sy-summary-modal-mask {
  background-color: var(--st-surface-overlay, rgba(15, 23, 42, 0.65));
  backdrop-filter: blur(var(--st-surface-backdrop-blur, 8px));
  -webkit-backdrop-filter: blur(var(--st-surface-backdrop-blur, 8px));
}

.sy-modal-card {
  background-color: var(--st-bg-surface, #161b22);
  border: 1px solid var(--st-border-subtle, rgba(255, 255, 255, 0.12));
}

.sy-header-bg {
  background-color: var(--st-bg-surface, #161b22);
}

.sy-body-bg {
  background-color: var(--st-bg-base, #0d1117);
}

.sy-divider {
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.1));
}

.sy-text-primary {
  color: var(--st-text-primary, #f0f6fc);
}

.sy-text-secondary {
  color: var(--st-text-secondary, #8b949e);
}

.sy-badge {
  background-color: var(--st-primary-subtle, rgba(99, 102, 241, 0.14));
  border: 1px solid var(--st-primary-border, rgba(99, 102, 241, 0.4));
  color: var(--st-primary, #818cf8);
}

.sy-model-badge {
  background-color: rgba(168, 85, 247, 0.14);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

.sy-btn-secondary {
  background-color: var(--st-bg-elevated, #21262d);
  border-color: var(--st-border-subtle, rgba(255, 255, 255, 0.12));
  color: var(--st-text-primary, #f0f6fc);
}

.sy-btn-secondary:hover {
  background-color: var(--st-bg-hover, rgba(148, 163, 184, 0.16));
}

.sy-code-block {
  background-color: var(--st-bg-base, #0d1117);
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  scroll-margin-top: 2rem;
  color: var(--st-text-primary, #f0f6fc);
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-preview :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.25rem;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.25rem;
}

.markdown-preview :deep(blockquote) {
  border-left: 3px solid var(--st-primary, #6366f1);
  padding-left: 0.75rem;
  margin: 0.75rem 0;
  color: var(--st-text-secondary, #8b949e);
  background-color: var(--st-bg-subtle, rgba(148, 163, 184, 0.05));
  border-radius: 0 0.5rem 0.5rem 0;
}

/* 核心线框图标防御 */
:deep(svg),
svg.sy-wire-icon {
  fill: none !important;
}
</style>
