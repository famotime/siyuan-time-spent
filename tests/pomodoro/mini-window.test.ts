import { mount } from '@vue/test-utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import FocusPanelHeader from '../../src/components/Pomodoro/FocusPanelHeader.vue';
import MiniPomodoroCapsule from '../../src/components/Pomodoro/MiniPomodoroCapsule.vue';
import { MiniWindowManager } from '../../src/utils/mini-window';

if (typeof (globalThis as any).PointerEvent === 'undefined') {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {};
}

const wrappers: ReturnType<typeof mount>[] = [];

function render(component: any, props: Record<string, unknown> = {}) {
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return wrapper;
}

afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('FocusPanelHeader minimize entry', () => {
  it('renders minimize button and emits minimize event on click', async () => {
    const wrapper = render(FocusPanelHeader);
    const minBtn = wrapper.find('.pomo-header__minimize');
    expect(minBtn.exists()).toBe(true);

    await minBtn.trigger('click');
    expect(wrapper.emitted('minimize')).toBeTruthy();
    expect(wrapper.emitted('minimize')?.length).toBe(1);
  });
});

describe('MiniPomodoroCapsule component', () => {
  it('renders time and action buttons, and triggers actions', async () => {
    const wrapper = render(MiniPomodoroCapsule, { initialX: 150, initialY: 80 });

    const timeDisplay = wrapper.find('.time-display');
    expect(timeDisplay.exists()).toBe(true);
    expect(timeDisplay.text()).toBe('25:00');

    const pinBtn = wrapper.findAll('.btn-action')[0];
    const restoreBtn = wrapper.findAll('.btn-action')[1];
    const closeBtn = wrapper.findAll('.btn-action')[2];

    expect(pinBtn.exists()).toBe(true);
    expect(restoreBtn.exists()).toBe(true);
    expect(closeBtn.exists()).toBe(true);

    // Test restore
    await restoreBtn.trigger('click');
    expect(wrapper.emitted('restore')).toBeTruthy();

    // Test togglePin
    await pinBtn.trigger('click');
    expect(wrapper.emitted('togglePin')).toBeTruthy();

    // Test close
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('handles pointer drag and emits positionChange', async () => {
    const wrapper = render(MiniPomodoroCapsule, { initialX: 100, initialY: 100 });
    const root = wrapper.find('.mini-pomodoro-dom-root');

    root.element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }));
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 150, clientY: 160 }));
    window.dispatchEvent(new MouseEvent('pointerup'));

    expect(wrapper.emitted('positionChange')).toBeTruthy();
    const emittedPos = wrapper.emitted('positionChange')?.[0]?.[0] as { x: number; y: number };
    expect(emittedPos).toBeDefined();
    expect(emittedPos.x).toBe(150);
    expect(emittedPos.y).toBe(160);
  });
});

describe('MiniWindowManager lifecycle and synchronization', () => {
  let mockPlugin: any;

  beforeEach(() => {
    mockPlugin = {
      name: 'siyuan-time-spent',
      isElectron: false,
      settings: {
        pomodoroMiniAlwaysOnTop: true,
        pomodoroMiniPosition: { x: 200, y: 150 },
      },
      saveSettings: vi.fn().mockResolvedValue(undefined),
      openPomodoro: vi.fn(),
      pomodoroManager: {
        state: { value: 'running' },
        uiPhase: { value: 'focus' },
        isStopwatch: { value: false },
        remainingSeconds: { value: 1450 },
        elapsedSeconds: { value: 50 },
        breakRemainingSeconds: { value: 300 },
        preferredMinutes: { value: 25 },
        preferStopwatch: { value: false },
      },
    };
  });

  it('initializes and manages state synchronization', () => {
    const manager = new MiniWindowManager(mockPlugin);
    expect(manager.alwaysOnTop).toBe(true);

    manager.show();
    expect(manager.isOpen).toBe(true);

    // Toggle pin
    manager.setAlwaysOnTop(false);
    expect(manager.alwaysOnTop).toBe(false);
    expect(mockPlugin.settings.pomodoroMiniAlwaysOnTop).toBe(false);

    manager.hide();
    expect(manager.isOpen).toBe(false);

    manager.destroy();
  });
});
