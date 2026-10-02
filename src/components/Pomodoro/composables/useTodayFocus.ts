import type { TimeLog } from '../../../models/TimeLog'
import {
  computed,
  onUnmounted,
  ref,
  shallowRef,
} from 'vue'

export type TodayFocusStatus = 'idle' | 'loading' | 'ready' | 'error'

/** 只累计有合法正时长的番茄记录；同一日志 ID 最多计入一次。 */
export function summarizeFocusLogs(logs: TimeLog[]) {
  const seen = new Set<string>()
  let count = 0
  let durationSeconds = 0

  for (const log of logs) {
    if (!log || !(log.isPomodoro || log.type === 'pomodoro')) continue
    if (!Number.isFinite(log.duration) || log.duration <= 0 || seen.has(log.id))
      continue
    seen.add(log.id)
    count += 1
    durationSeconds += log.duration
  }

  return {
    count,
    durationSeconds,
    minutes: Math.round(durationSeconds / 60),
  }
}

function getLocalDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function useTodayFocus(
  loader: (date: string) => Promise<TimeLog[]>,
  getDate: () => string = getLocalDate,
) {
  const status = ref<TodayFocusStatus>('idle')
  const count = ref(0)
  const durationSeconds = ref(0)
  const minutes = computed(() => Math.round(durationSeconds.value / 60))
  const stale = ref(false)
  const error = shallowRef<unknown>(null)
  const date = ref(getDate())
  let hasSnapshot = false
  let latestRequest = 0
  let disposed = false

  async function refresh(): Promise<void> {
    if (disposed) return
    const request = ++latestRequest
    const requestedDate = getDate()

    if (requestedDate !== date.value) {
      date.value = requestedDate
      count.value = 0
      durationSeconds.value = 0
      hasSnapshot = false
    }

    status.value = 'loading'
    stale.value = hasSnapshot
    error.value = null

    try {
      const logs = await loader(requestedDate)
      if (disposed || request !== latestRequest) return
      const summary = summarizeFocusLogs(logs)
      count.value = summary.count
      durationSeconds.value = summary.durationSeconds
      hasSnapshot = true
      status.value = 'ready'
      stale.value = false
    } catch (cause) {
      if (disposed || request !== latestRequest) return
      status.value = 'error'
      stale.value = hasSnapshot
      error.value = cause
    }
  }

  onUnmounted(() => {
    disposed = true
    latestRequest += 1
  })

  return {
    status,
    count,
    durationSeconds,
    minutes,
    stale,
    error,
    date,
    refresh,
  }
}
