import type TimeSpentPlugin from '../../src/index'
import type { TimeLog } from '../../src/models/TimeLog'
import { mount } from '@vue/test-utils'
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  defineComponent,
  h,
} from 'vue'
import {
  summarizeFocusLogs,
  useTodayFocus,
} from '../../src/components/Pomodoro/composables/useTodayFocus'
import { DEFAULT_SETTINGS } from '../../src/models/Settings'
import { PomodoroManager } from '../../src/utils/pomodoro'
import { StorageManager } from '../../src/utils/storage'

const log = (id = 'a', duration = 1500): TimeLog => ({
  id,
  docId: 'note',
  startTime: Date.now(),
  endTime: Date.now() + duration * 1000,
  duration,
  idleTime: 0,
  type: 'pomodoro',
  isPomodoro: true,
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return {
    promise,
    resolve,
    reject,
  }
}
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn())
  vi.useRealTimers()
})
function mountSummary(
  loader: (date: string) => Promise<TimeLog[]>,
  date = () => '2026-10-02',
) {
  let summary!: ReturnType<typeof useTodayFocus>
  const wrapper = mount(
    defineComponent({
      setup() {
        summary = useTodayFocus(loader, date)
        return () => h('div')
      },
    }),
  )
  cleanups.push(() => wrapper.unmount())
  return summary
}

describe('recorded focus totals', () => {
  it('deduplicates IDs and excludes passive and invalid records', () => {
    const result = summarizeFocusLogs([
      log(),
      log(),
      log('b', 600),
      {
        ...log('passive'),
        type: 'manual',
        isPomodoro: false,
      },
      log('negative', -1),
      log('nan', Number.NaN),
    ])
    expect(result).toEqual({
      count: 2,
      durationSeconds: 2100,
      minutes: 35,
    })
  })
  it('keeps the last successful same-day total after failure', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce([log()])
      .mockRejectedValueOnce(new Error('offline'))
    const summary = mountSummary(loader)
    await summary.refresh()
    await summary.refresh()
    expect(summary.status.value).toBe('error')
    expect(summary.count.value).toBe(1)
    expect(summary.stale.value).toBe(true)
  })
  it('does not label yesterday as today when the new day fails', async () => {
    let day = '2026-10-02'
    const summary = mountSummary(
      vi
        .fn()
        .mockResolvedValueOnce([log()])
        .mockRejectedValueOnce(new Error('offline')),
      () => day,
    )
    await summary.refresh()
    day = '2026-10-03'
    await summary.refresh()
    expect(summary.date.value).toBe(day)
    expect(summary.count.value).toBe(0)
    expect(summary.stale.value).toBe(false)
  })
  it('ignores older requests that finish later', async () => {
    const first = deferred<TimeLog[]>()
    const second = deferred<TimeLog[]>()
    const summary = mountSummary(
      vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    )
    const a = summary.refresh()
    const b = summary.refresh()
    second.resolve([log('new', 60)])
    await b
    first.resolve([log('old', 1500)])
    await a
    expect(summary.durationSeconds.value).toBe(60)
  })
  it('does not update after its component unmounts', async () => {
    const pending = deferred<TimeLog[]>()
    const summary = mountSummary(() => pending.promise)
    const request = summary.refresh()
    cleanups.pop()!()
    pending.resolve([log()])
    await request
    expect(summary.count.value).toBe(0)
  })
  it('distinguishes empty results from failure', async () => {
    const summary = mountSummary(async () => [])
    await summary.refresh()
    expect(summary.status.value).toBe('ready')
    expect(summary.count.value).toBe(0)
  })
})

describe('storage acknowledgements', () => {
  it('keeps default read compatibility while strict reads reject', async () => {
    const storage = new StorageManager({
      loadData: vi.fn().mockRejectedValue(new Error('offline')),
    } as any)
    await expect(storage.loadTodayLogs()).resolves.toEqual([])
    await expect(storage.loadTodayLogs({ strict: true })).rejects.toThrow(
      'offline',
    )
  })
  it.each(['', null, undefined])(
    'accepts the host empty-file response %s',
    async (empty) => {
      const storage = new StorageManager({ loadData: async () => empty } as any)
      await expect(storage.loadTodayLogs({ strict: true })).resolves.toEqual([])
    },
  )
  it('rejects invalid strict data rather than replacing it with an empty log', async () => {
    const saveData = vi.fn()
    const storage = new StorageManager({
      loadData: async () => ({ unexpected: true }),
      saveData,
    } as any)
    await expect(storage.appendLog(log())).rejects.toThrow('Invalid log data')
    expect(saveData).not.toHaveBeenCalled()
  })
  it('does not mutate cached records or claim success after failed saving', async () => {
    const existing = [log('existing')]
    const storage = new StorageManager({
      loadData: async () => existing,
      saveData: async () => ({ code: 1 }),
    } as any)
    await storage.loadTodayLogs()
    await expect(storage.appendLog(log('new'))).rejects.toThrow('code 1')
    expect(existing).toHaveLength(1)
    expect(storage.getAllCachedLogs()).toHaveLength(1)
  })
})

describe('manager save state without timing changes', () => {
  function manager(save: (log: TimeLog) => Promise<void>) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-02T12:00:00'))
    const plugin = {
      settings: {
        ...DEFAULT_SETTINGS,
        pomodoroSound: false,
        pomodoroNotification: false,
        pomodoroAfkGuardian: false,
      },
      timeTracker: {
        getCurrentDocId: () => 'note',
        addManualLog: save,
      },
    } as unknown as TimeSpentPlugin
    const timer = new PomodoroManager(plugin)
    cleanups.push(() => timer.discard())
    return timer
  }
  it('reports ignored for under-ten-second sessions', () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const timer = manager(save)
    timer.start(25)
    vi.advanceTimersByTime(5000)
    timer.finishEarly()
    expect(timer.lastRecord.value?.status).toBe('ignored')
    expect(save).not.toHaveBeenCalled()
  })
  it('enters break immediately but only counts a record after saving', async () => {
    const pending = deferred<void>()
    const timer = manager(() => pending.promise)
    timer.start(25)
    vi.advanceTimersByTime(10000)
    timer.finishEarly()
    expect(timer.state.value).toBe('break')
    expect(timer.lastRecord.value?.status).toBe('saving')
    expect(timer.savedLogVersion.value).toBe(0)
    pending.resolve()
    await pending.promise
    await Promise.resolve()
    expect(timer.lastRecord.value?.status).toBe('saved')
    expect(timer.savedLogVersion.value).toBe(1)
  })
  it('keeps a late success from taking over a new session', async () => {
    const pending = deferred<void>()
    const timer = manager(() => pending.promise)
    timer.start(25)
    vi.advanceTimersByTime(10000)
    timer.finishEarly()
    timer.skipBreak()
    timer.start(15)
    pending.resolve()
    await pending.promise
    await Promise.resolve()
    expect(timer.lastRecord.value).toBeNull()
    expect(timer.state.value).toBe('running')
    expect(timer.savedLogVersion.value).toBe(1)
  })
  it('exposes rejected saving without adding a successful record', async () => {
    const pending = deferred<void>()
    const timer = manager(() => pending.promise)
    timer.start(25)
    vi.advanceTimersByTime(10000)
    timer.finishEarly()
    pending.reject(new Error('disk full'))
    await pending.promise.catch(() => undefined)
    await Promise.resolve()
    expect(timer.lastRecord.value?.status).toBe('error')
    expect(timer.savedLogVersion.value).toBe(0)
  })
  it('keeps discarded sessions out of storage', () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const timer = manager(save)
    timer.start(25)
    vi.advanceTimersByTime(30000)
    timer.discard()
    expect(save).not.toHaveBeenCalled()
    expect(timer.lastRecord.value).toBeNull()
  })
})
