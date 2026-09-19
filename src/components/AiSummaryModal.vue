<template>
  <div v-if="visible" 
       class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-all duration-300"
       @click.self="handleClose">
    
    <!-- Modal Card Container -->
    <div class="bg-gray-900 border border-gray-700/90 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden text-gray-100">
      
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-gray-800/90 flex items-center justify-between bg-gray-950/60 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-bold text-white tracking-wide">
                AI 深度复盘与建议
              </h3>
              <!-- 周期标签 -->
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-medium font-mono">
                {{ scopeTitle }}
              </span>
              <!-- 模型标签 -->
              <span v-if="currentModel" class="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-medium font-mono">
                {{ currentModel }}
              </span>
            </div>
            <!-- 设定目标提示 -->
            <p v-if="focusGoal" class="text-xs text-indigo-300/90 mt-1 truncate max-w-md">
              🎯 目标：{{ focusGoal }}
            </p>
          </div>
        </div>

        <!-- Close Button -->
        <button @click="handleClose" 
                class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                title="关闭">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-5 sm:p-6 overflow-y-auto flex-1 min-h-[260px] max-h-[calc(88vh-140px)]">
        
        <!-- Case 1: 未配置 AI 服务 -->
        <div v-if="noConfigError" class="flex flex-col items-center justify-center py-10 text-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="max-w-md">
            <h4 class="text-base font-bold text-gray-200">尚未配置大模型 API</h4>
            <p class="text-xs text-gray-400 mt-2 leading-relaxed">
              请先在插件设置中填写 API 接口地址与密钥，或者使用 <strong>API 旋钮 (siyuan-api-switch)</strong> 进行统一接管配置。
            </p>
          </div>
          <button @click="handleOpenSettings" 
                  class="mt-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
            前往配置 AI 服务
          </button>
        </div>

        <!-- Case 2: 发生网络或接口错误 -->
        <div v-else-if="errorMessage" class="flex flex-col items-center justify-center py-8 text-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="max-w-lg">
            <h4 class="text-sm font-bold text-rose-300">生成 AI 总结失败</h4>
            <p class="text-xs text-gray-400 mt-1 font-mono bg-gray-950/80 p-3 rounded-lg border border-gray-800 break-all text-left">
              {{ errorMessage }}
            </p>
          </div>
          <div class="flex items-center gap-3 mt-2">
            <button @click="generateSummary" 
                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer">
              重新生成
            </button>
            <button @click="handleOpenSettings" 
                    class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700 transition-all cursor-pointer">
              检查 AI 设置
            </button>
          </div>
        </div>

        <!-- Case 3: 思考生成中 (前置等待骨架) -->
        <div v-else-if="loading && !summaryMarkdown" class="flex flex-col items-center justify-center py-12 gap-4">
          <div class="relative w-12 h-12 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <svg class="w-6 h-6 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="text-center">
            <div class="text-sm font-semibold text-gray-200">AI 正在深度复盘与分析...</div>
            <div class="text-xs text-gray-400 mt-1">正在融合时间统计指标与专注目标数据</div>
          </div>
        </div>

        <!-- Case 4: 渲染已生成或正在流式生成的 Markdown 内容 -->
        <div v-else class="markdown-preview text-gray-300 leading-relaxed text-sm">
          <div v-html="renderedHtml"></div>
          
          <!-- 流式打字中光标指示 -->
          <span v-if="loading" class="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle"></span>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 border-t border-gray-800/90 flex flex-wrap items-center justify-between gap-3 bg-gray-950/60 shrink-0">
        <div class="text-xs text-gray-400 flex items-center gap-2">
          <span v-if="loading" class="flex items-center gap-1.5 text-indigo-400 font-medium">
            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            正在生成洞察与建议...
          </span>
          <span v-else class="text-gray-400">
            总计统计 {{ logs?.length || 0 }} 次专注会话
          </span>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- 复制总结 -->
          <button @click="copySummary" 
                  :disabled="loading || !summaryMarkdown"
                  class="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-gray-200 border border-gray-700/80 hover:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {{ copySuccess ? '✅ 已复制' : '复制总结' }}
          </button>

          <!-- 重新生成 -->
          <button @click="generateSummary" 
                  :disabled="loading"
                  class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新生成
          </button>

          <!-- 关闭 -->
          <button @click="handleClose" 
                  class="px-3.5 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-xs font-medium text-gray-300 border border-gray-700/60 transition-colors cursor-pointer">
            关闭
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type TimeSpentPlugin from '../index';
import type { TimeLog } from '../models/TimeLog';
import { AIService } from '../utils/ai-service';
import { renderMarkdown } from '../utils/markdown';

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

// 监听弹窗打开状态，打开时若无内容则自动触发生成
watch(() => props.visible, (newVal) => {
  if (newVal) {
    generateSummary();
  } else {
    // 关闭时清空错误信息
    errorMessage.value = '';
  }
});
</script>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  scroll-margin-top: 2rem;
}
</style>
