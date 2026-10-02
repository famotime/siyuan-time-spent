import type TimeSpentPlugin from '../../src/index'
import { mount } from '@vue/test-utils'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  nextTick,
  ref,
} from 'vue'
import { usePomodoroPresenter } from '../../src/components/Pomodoro/composables/usePomodoroPresenter'
import ChronoDial from '../../src/components/Pomodoro/dials/ChronoDial.vue'
import { DEFAULT_SETTINGS } from '../../src/models/Settings'
import { PomodoroManager } from '../../src/utils/pomodoro'

const wrappers: ReturnType<typeof mount>[] = []

function makePlugin(): TimeSpentPlugin {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      pomodoroSound: false,
      pomodoroNotification: false,
    },
    timeTracker: null,
  } as unknown as TimeSpentPlugin
}

function makeManager(): PomodoroManager {
  return new PomodoroManager(makePlugin())
}

function mountChrono(extra: Record<string, unknown>) {
  const wrapper = mount(ChronoDial, {
    props: {
      smoothMotion: false,
      ...extra,
    } as any,
  })
  wrappers.push(wrapper)
  return wrapper
}

function handAngle(wrapper: ReturnType<typeof mount>, hand: string): number {
  const el = wrapper.get(`.chrono-hand--${hand}`)
  const match = /rotate\((-?[\d.]+)deg\)/.exec(el.attributes('style') ?? '')
  return match ? Number(match[1]) : Number.NaN
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.useRealTimers()
})

describe('chrono dial hands', () => {
  it('pace the three hands at real clock speed', async () => {
    const wrapper = mountChrono({
      elapsedMs: 3_661_000,
      motionLive: false,
      totalMs: 25 * 60_000,
    })
    // 1h1m1s：时针 = 整点 30° + 分针贡献 0.5° + 秒针贡献 0.0083°，分针 6.1°，秒针 6°
    expect(handAngle(wrapper, 'hour')).toBeCloseTo(30.5083, 3)
    expect(handAngle(wrapper, 'minute')).toBeCloseTo(6.1, 3)
    expect(handAngle(wrapper, 'second')).toBeCloseTo(6, 3)
  })

  it('sweep the second hand once per minute, stopwatch mode included', async () => {
    const start = mountChrono({
      elapsedMs: 0,
      motionLive: false,
      totalMs: 25 * 60_000,
      motionSweep: true,
    })
    await start.setProps({ elapsedMs: 15_000 })
    expect(handAngle(start, 'second')).toBeCloseTo(90, 3)
    await start.setProps({ elapsedMs: 45_000 })
    expect(handAngle(start, 'second')).toBeCloseTo(270, 3)
  })

  it('hold the hands still while paused', async () => {
    const wrapper = mountChrono({
      elapsedMs: 60_000,
      motionLive: false,
      totalMs: 25 * 60_000,
    })
    const before = handAngle(wrapper, 'minute')
    vi.advanceTimersByTime(5_000)
    await nextTick()
    expect(handAngle(wrapper, 'minute')).toBe(before)
  })

  it('rest the hands at noon when idle', async () => {
    const pomodoro = makeManager()
    pomodoro.start(25)
    vi.advanceTimersByTime(200_000)
    pomodoro.discard()
    const base = pomodoro.getTimeBase()
    expect(base).toMatchObject({
      live: false,
      sweep: false,
    })
    expect(base.elapsedMs).toBe(0)

    const wrapper = mountChrono({
      elapsedMs: base.elapsedMs,
      motionLive: base.live,
      totalMs: base.totalMs,
    })
    expect(handAngle(wrapper, 'second')).toBe(0)
    expect(handAngle(wrapper, 'minute')).toBe(0)
  })

  it('freeze the basis at the moment of leaving the desk', async () => {
    const pomodoro = makeManager()
    pomodoro.start(25)
    vi.advanceTimersByTime(300_000)
    // 冻结通常由 probeAfk 取样，这里直接复刻它记录的墙钟基线
    const clock = pomodoro as unknown as {
      afkFrozen: { value: boolean }
      afkFreezeElapsedMs: number
    }
    clock.afkFrozen.value = true
    clock.afkFreezeElapsedMs = 300_000
    const base = pomodoro.getTimeBase()
    expect(base).toMatchObject({
      live: false,
      elapsedMs: 300_000,
    })
    vi.advanceTimersByTime(60_000)
    expect(pomodoro.getTimeBase().elapsedMs).toBe(300_000)
  })
})

describe('pomodoro time base', () => {
  it('report wall-clock milliseconds for countdown, break and stopwatch', async () => {
    const pomodoro = makeManager()
    pomodoro.start(1)
    vi.advanceTimersByTime(500)
    expect(pomodoro.getTimeBase()).toMatchObject({
      live: true,
      sweep: false,
    })
    expect(pomodoro.getTimeBase().elapsedMs).toBeGreaterThanOrEqual(500)
    expect(pomodoro.getTimeBase().totalMs).toBe(60_000)

    pomodoro.startStopwatch()
    expect(pomodoro.getTimeBase()).toMatchObject({
      sweep: true,
      live: true,
    })
    expect(pomodoro.getTimeBase().elapsedMs).toBeLessThan(50)

    pomodoro.startBreak(1)
    vi.advanceTimersByTime(1_000)
    const breakBase = pomodoro.getTimeBase()
    expect(breakBase).toMatchObject({
      sweep: false,
      live: true,
      totalMs: 60_000,
    })
    expect(breakBase.elapsedMs).toBeGreaterThanOrEqual(1_000)
  })

  it('exclude the paused span from the clock basis', async () => {
    const pomodoro = makeManager()
    pomodoro.start(25)
    vi.advanceTimersByTime(120_000)
    pomodoro.pause()
    vi.advanceTimersByTime(90_000)
    const frozen = pomodoro.getTimeBase()
    expect(frozen).toMatchObject({ live: false })
    expect(frozen.elapsedMs).toBeCloseTo(120_000, -3)

    pomodoro.resume()
    const resumed = pomodoro.getTimeBase()
    // 恢复后基线仍从 120s 起算，暂停的 90s 没有算进指针与墙钟时长
    expect(resumed.live).toBe(true)
    expect(resumed.elapsedMs).toBeLessThan(126_000)
  })

  it('keep re-sampling the basis so reopening the panel does not restart the hands', () => {
    const plugin = makePlugin()
    const pomodoro = new PomodoroManager(plugin)
    const view = usePomodoroPresenter(
      pomodoro,
      plugin,
      ref(25),
      ref(false),
    )
    pomodoro.start(1)
    vi.advanceTimersByTime(500)
    expect(view.motionElapsedMs.value).toBeGreaterThanOrEqual(500)

    // 会话运行期间没有任何 state 变化，锚点只能靠 tick 采样往前推
    vi.advanceTimersByTime(10_000)
    expect(view.motionElapsedMs.value).toBeGreaterThanOrEqual(10_500)
    expect(view.motionLive.value).toBe(true)

    vi.advanceTimersByTime(10_000)
    expect(view.motionElapsedMs.value).toBeGreaterThanOrEqual(20_500)
  })

  it('rest the basis at zero once the session is discarded', () => {
    const pomodoro = makeManager()
    pomodoro.start(1)
    vi.advanceTimersByTime(5_000)
    pomodoro.discard()
    expect(pomodoro.timeBasis.value).toMatchObject({
      elapsedMs: 0,
      live: false,
    })
  })
})
