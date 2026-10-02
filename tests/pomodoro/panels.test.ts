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
  nextTick,
  ref,
} from 'vue'
import AchievementMoment from '../../src/components/Pomodoro/AchievementMoment.vue'
import { usePomodoroShortcuts } from '../../src/components/Pomodoro/composables/usePomodoroShortcuts'
import BreakPanel from '../../src/components/Pomodoro/panels/BreakPanel.vue'
import ReadyPanel from '../../src/components/Pomodoro/panels/ReadyPanel.vue'
import RunningPanel from '../../src/components/Pomodoro/panels/RunningPanel.vue'

const wrappers: ReturnType<typeof mount>[] = []
function render(component: any, props: Record<string, unknown>) {
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  vi.useRealTimers()
  document.body.innerHTML = ''
})
const readyProps = {
  isStopwatchMode: false,
  minutes: 25,
  presets: [15, 25, 45, 60],
  recommendation: null,
  smartEnabled: true,
  wheelEnabled: true,
}

describe('duration controls', () => {
  it.each([1, 27, 90])(
    'accepts %i minutes via slider range input',
    async (minutes) => {
      const wrapper = render(ReadyPanel, readyProps)
      const input = wrapper.get('input[type="range"]')
      await input.setValue(String(minutes))
      expect(wrapper.emitted('update:minutes')?.at(-1)).toEqual([minutes])
    },
  )
  it.each([15, 25, 45, 60])(
    'selects %i minutes when clicking the mark button',
    async (mark) => {
      const wrapper = render(ReadyPanel, readyProps)
      const markBtn = wrapper.findAll('.pomo-slider-mark-btn').find(
        (b) => b.text().includes(String(mark)),
      )
      expect(markBtn).toBeDefined()
      await markBtn!.trigger('click')
      expect(wrapper.emitted('update:minutes')?.at(-1)).toEqual([mark])
    },
  )
  it('adjusts duration with wheel when wheel adjustment is enabled', async () => {
    const wrapper = render(ReadyPanel, {
      ...readyProps,
      minutes: 25,
      wheelEnabled: true,
    })
    const container = wrapper.get('.pomo-slider-container')
    await container.trigger('wheel', { deltaY: -50 })
    expect(wrapper.emitted('update:minutes')?.at(-1)).toEqual([26])
  })
  it('does not adjust duration when wheel adjustment is disabled', async () => {
    const wrapper = render(ReadyPanel, {
      ...readyProps,
      wheelEnabled: false,
    })
    const container = wrapper.get('.pomo-slider-container')
    await container.trigger('wheel', { deltaY: -50 })
    expect(wrapper.emitted('update:minutes')).toBeUndefined()
  })
  it('provides an explicitly selected count-up mode while keeping duration slider visible', async () => {
    const wrapper = render(ReadyPanel, {
      ...readyProps,
      isStopwatchMode: true,
    })
    expect(wrapper.find('.pomo-slider-container').exists()).toBe(true)
    expect(
      wrapper.get('.pomo-mode button:last-child').attributes('aria-pressed'),
    ).toBe('true')
  })
})

describe('quiet state controls', () => {
  const props = {
    state: 'running',
    frozen: false,
    afkIdleSeconds: 0,
    afkReturn: null,
    interruptionEnabled: true,
    noteDraft: '',
    previousNotes: [],
    confirmingDiscard: false,
  }
  it('does not treat AFK as a manually paused timer', async () => {
    const wrapper = render(RunningPanel, {
      ...props,
      frozen: true,
      afkIdleSeconds: 180,
    })
    await wrapper.get('.st-pomo-button--primary').trigger('click')
    expect(wrapper.emitted('pause')).toHaveLength(1)
    expect(wrapper.emitted('resume')).toBeUndefined()
  })
  it('exposes discard button directly and supports confirmation', async () => {
    const wrapper = render(RunningPanel, {
      ...props,
      state: 'running',
    })
    const discardBtn = wrapper.get('.st-pomo-button--danger-text')
    expect(discardBtn.text()).toContain('放弃')
    await discardBtn.trigger('click')
    expect(wrapper.emitted('update:confirmingDiscard')?.at(-1)).toEqual([true])

    const confirmingWrapper = render(RunningPanel, {
      ...props,
      confirmingDiscard: true,
    })
    expect(confirmingWrapper.text()).toContain('确认放弃')
    expect(confirmingWrapper.text()).toContain('继续专注')
  })
  it('does not run a breathing timer until requested', async () => {
    vi.useFakeTimers()
    const wrapper = render(BreakPanel, {
      kind: 'short',
      remainingText: '05:00',
      cycleSize: 4,
      reduced: false,
    })
    expect(vi.getTimerCount()).toBe(0)
    const coachBtn = wrapper.get('button[aria-pressed="false"]')
    await coachBtn.trigger('click')
    expect(wrapper.emitted('update:breathing')?.at(-1)).toEqual([true])
    expect(vi.getTimerCount()).toBeGreaterThan(0)
  })
  it('completion is an inline status, never a full-screen overlay', () => {
    const wrapper = render(AchievementMoment, {
      visible: true,
      minutes: 25,
      status: 'error',
    })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('未保存')
    expect(wrapper.find('.fixed').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('已记录 25')
  })
})

describe('keyboard ownership', () => {
  function setup(enabled = true) {
    const pause = vi.fn()
    const close = vi.fn()
    const toggle = vi.fn()
    const Component = defineComponent({
      setup() {
        usePomodoroShortcuts(ref(enabled), ref(true), {
          onTogglePanel: toggle,
          onClosePanel: close,
          onTogglePause: pause,
          isPanelTarget: (node) => !!node && document.body.contains(node),
        })
        return () =>
          h('div', { tabindex: -1 }, [
            h('button', 'Start'),
            h('input'),
            h('div', { contenteditable: true }, 'Note'),
          ])
      },
    })
    return {
      wrapper: render(Component, {}),
      pause,
      close,
      toggle,
    }
  }
  it('leaves Space on a button to its native activation', async () => {
    const {
      wrapper,
      pause,
    } = setup()
    await wrapper.get('button').trigger('keydown', {
      key: ' ',
      code: 'Space',
    })
    expect(pause).not.toHaveBeenCalled()
  })
  it('leaves editable content and composition untouched', async () => {
    const {
      wrapper,
      pause,
      toggle,
    } = setup()
    await wrapper.get('input').trigger('keydown', {
      key: ' ',
      code: 'Space',
    })
    await wrapper.get('[contenteditable]').trigger('keydown', {
      key: 'p',
      altKey: true,
    })
    await wrapper.trigger('keydown', {
      key: ' ',
      code: 'Space',
      isComposing: true,
    })
    expect(pause).not.toHaveBeenCalled()
    expect(toggle).not.toHaveBeenCalled()
  })
  it('keeps Escape available when shortcuts are disabled', async () => {
    const {
      wrapper,
      close,
    } = setup(false)
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(close).toHaveBeenCalledOnce()
  })
  it('cleans up its global listener on unmount', async () => {
    const {
      wrapper,
      pause,
    } = setup()
    wrapper.unmount()
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
      }),
    )
    await nextTick()
    expect(pause).not.toHaveBeenCalled()
  })
})
