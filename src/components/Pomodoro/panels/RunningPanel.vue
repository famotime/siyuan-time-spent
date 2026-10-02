<template>
  <div class="flex flex-col gap-2.5">
    <!-- 离桌归来提示卡 -->
    <div
      v-if="afkReturn"
      class="p-3 rounded-xl border flex flex-col gap-1.5 animate-fadeIn"
      style="border-color: var(--st-pomo-frozen-border); background: var(--st-pomo-frozen-bg);"
    >
      <div
        class="text-xs font-bold"
        style="color: var(--st-pomo-frozen-text);"
      >
        {{ t('pomodoroAfkWelcomeTitle') }}
      </div>
      <div class="text-[12px] text-secondary">
        {{ t('pomodoroAfkWelcomeDesc', { time: formatIdle(afkReturn.idleSec) }) }}
      </div>
      <div class="flex justify-end mt-0.5">
        <button
          type="button"
          class="text-[12px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer"
          style="color: var(--st-pomo-frozen-text);"
          @click="$emit('dismissAfk')"
        >
          {{ t('saved') }}
        </button>
      </div>
    </div>

    <!-- 防误触确认放弃卡片 -->
    <div
      v-if="confirmingDiscard"
      class="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col gap-2 animate-fadeIn"
    >
      <div class="text-xs font-bold text-rose-600 dark:text-rose-400">
        {{ t('pomodoroDiscardConfirmTitle') }}
      </div>
      <div class="text-[12px] text-secondary">
        {{ t('pomodoroDiscardConfirmDesc') }}
      </div>
      <div class="flex items-center gap-2 mt-1">
        <button
          type="button"
          class="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          @click="$emit('confirmDiscard')"
        >
          {{ t('pomodoroConfirmDiscard') }}
        </button>
        <button
          type="button"
          class="flex-1 py-1.5 rounded-lg border border-subtle hover:bg-surface text-secondary text-xs transition-colors cursor-pointer"
          @click="$emit('update:confirmingDiscard', false)"
        >
          {{ t('pomodoroCancelDiscard') }}
        </button>
      </div>
    </div>

    <!-- 常规操作行 -->
    <div
      v-else
      class="flex flex-col gap-2"
    >
      <!-- 离桌凝滞徽 -->
      <div
        v-if="frozen"
        class="flex items-center gap-1.5 text-[12px] font-medium px-2 py-1 rounded-lg self-start"
        style="background: var(--st-pomo-frozen-bg); color: var(--st-pomo-frozen-text); border: 1px solid var(--st-pomo-frozen-border);"
      >
        <span
          class="st-pomo-anim w-1.5 h-1.5 rounded-full"
          style="background: currentColor; animation: st-pomo-frozen-frost 2s ease-in-out infinite;"
        ></span>
        <span>{{ t('pomodoroAfkAway', { time: formatIdle(afkIdleSeconds) }) }}</span>
      </div>

      <div class="flex items-center gap-2 w-full">
        <!-- 暂停 / 继续按钮 -->
        <button
          v-if="state === 'running' && !frozen"
          type="button"
          class="flex-1 py-2 rounded-xl border border-subtle bg-subtle hover:opacity-85 text-primary font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          @click="$emit('pause')"
        >
          <svg
            class="w-3.5 h-3.5"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect
              x="6"
              y="5"
              width="4"
              height="14"
              rx="1"
            />
            <rect
              x="14"
              y="5"
              width="4"
              height="14"
              rx="1"
            />
          </svg>
          <span>{{ t('pomodoroPause') }}</span>
        </button>
        <button
          v-else
          type="button"
          class="flex-1 py-2 rounded-xl text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
          :style="primaryBtnStyle"
          @click="$emit('resume')"
        >
          <svg
            class="w-3.5 h-3.5 text-white"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>{{ t('pomodoroResume') }}</span>
        </button>

        <!-- 提前达成按钮 -->
        <button
          type="button"
          class="py-2 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
          :title="t('pomodoroFinish')"
          @click="$emit('finish')"
        >
          <svg
            class="w-3.5 h-3.5"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{{ t('pomodoroFinish') }}</span>
        </button>
      </div>

      <!-- 打断记录卡（仅暂停态） -->
      <div
        v-if="state === 'paused' && interruptionEnabled"
        class="p-2.5 rounded-xl border border-subtle bg-subtle flex flex-col gap-1.5 animate-fadeIn"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-primary">{{ t('pomodoroInterruptionTitle') }}</span>
          <span
            v-if="previousNotes.length"
            class="text-[12px] text-tertiary"
          >
            {{ t('pomodoroInterruptionRecorded', { n: previousNotes.length }) }}
          </span>
        </div>
        <textarea
          :value="noteDraft"
          rows="2"
          class="w-full text-xs px-2 py-1.5 rounded-lg bg-surface border border-subtle focus:outline-none resize-none"
          :placeholder="t('pomodoroInterruptionPlaceholder')"
          @input="$emit('update:noteDraft', ($event.target as HTMLTextAreaElement).value)"
          @keydown.enter.prevent="$emit('saveNote')"
          @keydown.esc.prevent="$emit('skipNote')"
        ></textarea>
        <div class="flex items-center justify-end gap-1.5">
          <button
            v-for="note in previousNotes"
            :key="note"
            type="button"
            class="text-[12px] px-1.5 py-0.5 rounded-md bg-surface border border-subtle text-tertiary max-w-[110px] truncate"
            :title="note"
          >
            {{ note }}
          </button>
          <button
            type="button"
            class="text-[12px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer text-tertiary hover:text-primary"
            @click="$emit('skipNote')"
          >
            {{ t('pomodoroInterruptionSkip') }}
          </button>
          <button
            type="button"
            class="text-[12px] px-2 py-1 rounded-md font-bold transition-colors cursor-pointer text-white"
            style="background: var(--b3-theme-primary);"
            @click="$emit('saveNote')"
          >
            {{ t('pomodoroInterruptionSave') }}
          </button>
        </div>
      </div>

      <!-- 放弃按钮 (次级操作，轻量化) -->
      <div class="flex justify-end">
        <button
          type="button"
          class="text-[12px] text-tertiary hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-1 py-1 px-1.5 rounded"
          :title="t('pomodoroCancel')"
          @click="$emit('update:confirmingDiscard', true)"
        >
          <svg
            class="w-3 h-3"
            style="fill: none !important;"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.75"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>{{ t('pomodoroCancel') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '../../../i18n';
import { formatIdle } from '../composables/usePomodoroPresenter';

defineProps<{
  state: 'running' | 'paused'
  frozen: boolean
  afkIdleSeconds: number
  afkReturn: { idleSec: number, at: number } | null
  interruptionEnabled: boolean
  noteDraft: string
  previousNotes: ReadonlyArray<string>
  confirmingDiscard: boolean
}>()

defineEmits<{
  (e: 'pause'): void
  (e: 'resume'): void
  (e: 'finish'): void
  (e: 'confirmDiscard'): void
  (e: 'update:confirmingDiscard', v: boolean): void
  (e: 'update:noteDraft', v: string): void
  (e: 'saveNote'): void
  (e: 'skipNote'): void
  (e: 'dismissAfk'): void
}>()

const primaryBtnStyle = computed(() => ({
  background: 'var(--b3-theme-primary)',
  boxShadow: '0 4px 12px color-mix(in srgb, var(--b3-theme-primary) 35%, transparent)',
}))

</script>
