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
  it.each([1, 27, 180])(
    'accepts %i minutes without requiring five-minute steps',
    async (minutes) => {
      const wrapper = render(ReadyPanel, readyProps)
      await wrapper.get('.pomo-presets button:last-child').trigger('click')
      await wrapper.get('input').setValue(String(minutes))
      await wrapper.get('form').trigger('submit')
      expect(wrapper.emitted('update:minutes')?.at(-1)).toEqual([minutes])
    },
  )
  it.each(['', '0', '181', '2.5'])(
    'does not start with invalid custom duration %s',
    async (value) => {
      const wrapper = render(ReadyPanel, readyProps)
      await wrapper.get('.pomo-presets button:last-child').trigger('click')
      await wrapper.get('input').setValue(value)
      expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
      await wrapper.get('form').trigger('submit')
      expect(wrapper.emitted('update:minutes')).toBeUndefined()
      expect(
        wrapper.get('.st-pomo-button--primary').attributes('disabled'),
      ).toBeDefined()
    },
  )
  it('cancels draft with Escape and returns focus', async () => {
    const wrapper = render(ReadyPanel, readyProps)
    await wrapper.get('.pomo-presets button:last-child').trigger('click')
    await wrapper.get('input').setValue('27')
    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.emitted('update:minutes')).toBeUndefined()
    expect(document.activeElement).toBe(
      wrapper.get('.pomo-presets button:last-child').element,
    )
  })
  it('does not intercept scrolling when wheel adjustment is disabled', async () => {
    const wrapper = render(ReadyPanel, {
      ...readyProps,
      wheelEnabled: false,
    })
    await wrapper.get('.pomo-presets button:last-child').trigger('click')
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
    })
    wrapper.get('input').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('25')
  })
  it('provides an explicitly selected count-up mode', async () => {
    const wrapper = render(ReadyPanel, {
      ...readyProps,
      isStopwatchMode: true,
    })
    expect(wrapper.find('.pomo-presets').exists()).toBe(false)
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
  it('keeps interruption entry optional and exposes a visible label', async () => {
    const wrapper = render(RunningPanel, {
      ...props,
      state: 'paused',
    })
    expect(wrapper.find('textarea').exists()).toBe(false)
    await wrapper
      .get('button[aria-expanded="false"]:last-of-type')
      .trigger('click')
    // The note control is the second disclosure, after More.
    if (!wrapper.find('textarea').exists()) {
      await wrapper
        .findAll('button[aria-expanded="false"]')
        .at(-1)!
        .trigger('click')
    }
    expect(wrapper.find('label').exists()).toBe(true)
    expect(wrapper.get('textarea').attributes('id')).toBe(
      wrapper.get('label').attributes('for'),
    )
  })
  it('does not run a breathing timer until requested', () => {
    vi.useFakeTimers()
    render(BreakPanel, {
      kind: 'short',
      remainingText: '05:00',
      cycleSize: 4,
      reduced: false,
    })
    expect(vi.getTimerCount()).toBe(0)
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
