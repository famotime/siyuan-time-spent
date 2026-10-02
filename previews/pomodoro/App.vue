<template>
  <main class="preview-shell">
    <header class="preview-toolbar">
      <strong>专注组件预览</strong><span>独立演示 · 示例数据 · 不读写真实笔记</span>
      <label>主题
        <select
          v-model="theme"
          @change="applyTheme"
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="custom">第三方主题</option>
        </select></label>
      <label>状态
        <select
          v-model="state"
          @change="applyState"
        >
          <option value="idle">待机</option>
          <option value="focus">专注</option>
          <option value="paused">暂停</option>
          <option value="away">离桌</option>
          <option value="break">短休息</option>
          <option value="long-break">长休息</option>
          <option value="saved">完成</option>
          <option value="error">保存失败</option>
        </select></label>
      <label>形态
        <select
          v-model="form"
          @change="applyForm"
        >
          <option value="zen">光环</option>
          <option value="chrono">刻度</option>
          <option value="hourglass">沙漏</option>
        </select></label>
      <label>语言
        <select
          v-model="language"
          @change="setLangSetting(language)"
        >
          <option value="zh_CN">中文</option>
          <option value="en_US">English</option>
        </select></label>
    </header>
    <article class="preview-document">
      <p class="preview-document__eyebrow">
        示例笔记
      </p>
      <h1>让注意力，回到这一页。</h1>
      <p>好的工具知道什么时候出现，也知道什么时候退后。</p>
      <div class="protyle">
        <div
          class="preview-editor"
          contenteditable="true"
          role="textbox"
          aria-label="示例笔记编辑器"
        >
          在这里写下你的想法。点击编辑区不会被计时面板的遮罩阻挡。
        </div>
      </div>
      <p class="preview-help">
        右下角打开番茄钟。可选择时长、开始、暂停、记录打断；顶部可以切换固定的演示状态。
      </p>
      <p
        v-if="dashboardOpened"
        role="status"
      >
        这是预览环境；正式插件会打开已有的记录看板。
      </p>
    </article>
    <footer class="preview-statusbar">
      <span>示例工作区</span><StatusBarTimer
        ref="timerComponent"
        :plugin="plugin"
        :pomodoro="pomodoro"
      />
    </footer>
  </main>
</template>

<script setup lang="ts">
import type { PomodoroFormKey } from '../../src/components/Pomodoro/composables/forms'
import type TimeSpentPlugin from '../../src/index'
import type { TimeLog } from '../../src/models/TimeLog'
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import StatusBarTimer from '../../src/components/Pomodoro/StatusBarTimer.vue'
import { setLangSetting } from '../../src/i18n'
import { DEFAULT_SETTINGS } from '../../src/models/Settings'
import { PomodoroManager } from '../../src/utils/pomodoro'
import { docTitles } from '../../src/utils/title-cache'

const params = new URLSearchParams(location.search)
const theme = ref(params.get('theme') || 'light')
const state = ref(params.get('state') || 'idle')
const form = ref<PomodoroFormKey>(
  (params.get('form') as PomodoroFormKey) || 'zen',
)
const language = ref<'zh_CN' | 'en_US'>(
  params.get('lang') === 'en_US' ? 'en_US' : 'zh_CN',
)
const timerComponent = ref<InstanceType<typeof StatusBarTimer> | null>(null)
const dashboardOpened = ref(false)
const noteId = '20261002090000-preview'
const now = Date.now()
const logs: TimeLog[] = [1, 2].map((n) => ({
  id: `demo-${n}`,
  docId: noteId,
  startTime: now - n * 3600000,
  endTime: now - n * 3600000 + 1500000,
  duration: 1500,
  idleTime: 0,
  type: 'pomodoro',
  isPomodoro: true,
}))
docTitles.value[noteId] = params.has('longTitle')
  ? '一份非常长的示例笔记标题：关于注意力、设计细节和如何在复杂工作中保持清晰思考'
  : '产品设计笔记'
const plugin = {
  settings: {
    ...DEFAULT_SETTINGS,
    pomodoroSound: false,
    pomodoroNotification: false,
    pomodoroThemeStyle: form.value,
  },
  storageManager: {
    loadTodayLogs: async () => [...logs],
    loadLogsForDate: async () => [...logs],
  },
  timeTracker: {
    getCurrentDocId: () => noteId,
    getIdleWatcher: () => null,
    addManualLog: async (log: TimeLog) => {
      logs.push(log)
    },
  },
  saveSettings: async () => undefined,
  openDashboard: () => {
    dashboardOpened.value = true
  },
} as unknown as TimeSpentPlugin
const pomodoro = new PomodoroManager(plugin)
function applyTheme() {
  document.documentElement.dataset.themeMode =
    theme.value === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.previewTheme = theme.value
}
function applyForm() {
  plugin.settings.pomodoroThemeStyle = form.value
  window.dispatchEvent(
    new CustomEvent('siyuan-time-spent:pomodoro-config-changed'),
  )
}
function applyState() {
  pomodoro.discard()
  pomodoro.currentDocId.value = noteId
  if (state.value === 'idle') return
  pomodoro.totalSeconds.value = 1500
  pomodoro.targetMinutes.value = 25
  pomodoro.remainingSeconds.value = 18 * 60 + 42
  pomodoro.cycleCompleted.value = 1
  if (['break', 'long-break', 'saved', 'error'].includes(state.value)) {
    pomodoro.state.value = 'break'
    pomodoro.breakKind.value = state.value === 'long-break' ? 'long' : 'short'
    pomodoro.breakTotalSeconds.value = state.value === 'long-break' ? 900 : 300
    pomodoro.breakRemainingSeconds.value =
      state.value === 'long-break' ? 812 : 263
    if (state.value === 'saved' || state.value === 'error') {
      pomodoro.lastRecord.value = {
        id: 'demo-completion',
        startedAt: now - 1500000,
        durationSeconds: 1500,
        status: state.value === 'saved' ? 'saved' : 'error',
      }
    }
  } else {
    pomodoro.state.value = state.value === 'paused' ? 'paused' : 'running'
    pomodoro.afkFrozen.value = state.value === 'away'
    pomodoro.afkIdleSeconds.value = state.value === 'away' ? 183 : 0
  }
}
onMounted(async () => {
  applyTheme()
  setLangSetting(language.value)
  applyState()
  await nextTick()
  ;(timerComponent.value?.$el as HTMLElement)?.querySelector('button')?.click()
})
onUnmounted(() => pomodoro.discard())
</script>

<style>
:root {
  --b3-theme-background: #fff;
  --b3-theme-surface: #f5f5f7;
  --b3-theme-surface-lighter: #fff;
  --b3-theme-on-background: #1d1d1f;
  --b3-theme-on-surface: #626268;
  --b3-theme-on-surface-light: #626268;
  --b3-theme-primary: #bd493f;
  --b3-theme-on-primary: #fff;
  --b3-border-color: #e8e8eb;
  --preview-bg: #f5f5f7;
  --preview-ink: #1d1d1f;
  --preview-muted: #626268;
}
:root[data-preview-theme='dark'] {
  --b3-theme-background: #232326;
  --b3-theme-surface: #2e2e32;
  --b3-theme-surface-lighter: #353539;
  --b3-theme-on-background: #f3f3f5;
  --b3-theme-on-surface: #b8b8be;
  --b3-theme-on-surface-light: #b8b8be;
  --b3-theme-primary: #ea8a7f;
  --b3-theme-on-primary: #251412;
  --b3-border-color: #424247;
  --preview-bg: #19191c;
  --preview-ink: #f3f3f5;
  --preview-muted: #b8b8be;
}
:root[data-preview-theme='custom'] {
  --b3-theme-background: #eff5f3;
  --b3-theme-surface: #e6efeb;
  --b3-theme-on-background: #183d32;
  --b3-theme-on-surface: #426758;
  --b3-theme-primary: #267051;
  --b3-theme-on-primary: #fff;
  --preview-bg: #e6efeb;
  --preview-ink: #183d32;
  --preview-muted: #426758;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--preview-bg);
  color: var(--preview-ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--b3-border-color);
  font-size: 12px;
}
.preview-toolbar > span {
  color: var(--preview-muted);
  margin-right: auto;
}
.preview-toolbar select {
  margin-left: 4px;
  padding: 6px;
  background: var(--b3-theme-background);
  color: var(--preview-ink);
  border: 1px solid var(--b3-border-color);
  border-radius: 6px;
}
.preview-document {
  max-width: 650px;
  padding: 80px 24px;
  margin-left: max(16px, calc((100vw - 1150px) / 2));
}
.preview-document h1 {
  font-size: clamp(24px, 3vw, 40px);
  font-weight: 500;
  letter-spacing: -0.04em;
}
.preview-document p {
  line-height: 1.8;
}
.preview-document__eyebrow {
  font-size: 13px;
  color: var(--preview-muted);
}
.preview-editor {
  min-height: 180px;
  margin-top: 40px;
  padding: 20px;
  border: 1px solid var(--b3-border-color);
  border-radius: 12px;
  line-height: 1.8;
  background: var(--b3-theme-background);
}
.preview-help {
  font-size: 13px;
  color: var(--preview-muted);
}
.preview-statusbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 16px;
  border-top: 1px solid var(--b3-border-color);
  background: var(--b3-theme-surface);
  font-size: 12px;
  color: var(--preview-muted);
}
@media (max-width: 600px) {
  .preview-document {
    margin: 0;
    padding: 24px 16px;
  }
  .preview-toolbar {
    padding-inline: 16px;
  }
}
</style>
