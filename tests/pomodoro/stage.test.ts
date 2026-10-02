import { mount } from '@vue/test-utils'
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'
import CycleRail from '../../src/components/Pomodoro/CycleRail.vue'
import PomodoroStage from '../../src/components/Pomodoro/PomodoroStage.vue'

const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
const props = {
  form: 'zen',
  uiPhase: 'focus',
  progress: 0.5,
  displayText: '12:30',
  subtitle: '专注',
  heat: 0.5,
  frozen: false,
  intensity: 'calm',
  allowAmbient: false,
  wheelEnabled: true,
  isStopwatch: false,
}

describe('dial semantics', () => {
  for (const phase of [
    'idle',
    'focus',
    'paused',
    'short-break',
    'long-break',
  ]) {
    it(`announces ${phase} no more than once per minute`, async () => {
      const wrapper = mount(PomodoroStage, {
        props: {
          ...props,
          uiPhase: phase,
          displayText: '04:59',
        } as any,
      })
      wrappers.push(wrapper)
      const before = wrapper.get('[aria-live="polite"]').text()
      await wrapper.setProps({ displayText: '04:58' })
      expect(wrapper.get('[aria-live="polite"]').text()).toBe(before)
      expect(before).toContain('5 分钟')
      await wrapper.setProps({ displayText: '04:00' })
      expect(wrapper.get('[aria-live="polite"]').text()).toContain('4 分钟')
    })
  }
  it('does not invent a completion percentage for count-up sessions', () => {
    const wrapper = mount(PomodoroStage, {
      props: {
        ...props,
        isStopwatch: true,
      } as any,
    })
    wrappers.push(wrapper)
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('已用')
  })
  it('uses remaining time during a break following count-up', () => {
    const wrapper = mount(PomodoroStage, {
      props: {
        ...props,
        isStopwatch: true,
        uiPhase: 'short-break',
      } as any,
    })
    wrappers.push(wrapper)
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    expect(wrapper.get('[aria-live="polite"]').text()).toContain('剩余')
  })
  it('allows ordinary wheel scrolling over the dial', () => {
    const wrapper = mount(PomodoroStage, { props: props as any })
    wrappers.push(wrapper)
    const event = new WheelEvent('wheel', {
      cancelable: true,
      deltaY: 120,
    })
    wrapper.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
  it('does not label an idle cycle as in progress', () => {
    const wrapper = mount(CycleRail, {
      props: {
        completed: 1,
        size: 4,
        longBreakNext: false,
      },
    })
    wrappers.push(wrapper)
    expect(wrapper.text()).not.toContain('进行中')
    expect(wrapper.text()).toContain('已完成')
  })
})
