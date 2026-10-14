import type TimeSpentPlugin from '../index';
import { createApp } from 'vue';
import MiniPomodoroCapsule from '../components/Pomodoro/MiniPomodoroCapsule.vue';
import Logger from './logger';

export interface MiniSyncState {
  type: 'STATE_UPDATE';
  displayText: string;
  state: string;
  uiPhase: string;
  isStopwatch: boolean;
  themeMode: 'light' | 'dark';
  alwaysOnTop: boolean;
}

export class MiniWindowManager {
  private plugin: TimeSpentPlugin;
  private channel: BroadcastChannel | null = null;
  private electronWindow: any = null;
  private isElectron: boolean = false;
  public alwaysOnTop: boolean = true;
  public isOpen: boolean = false;
  private broadcastTimer: any = null;
  private themeObserver: MutationObserver | null = null;
  private fallbackContainer: HTMLElement | null = null;
  private fallbackApp: any = null;

  constructor(plugin: TimeSpentPlugin) {
    this.plugin = plugin;
    this.isElectron = !!plugin.isElectron;
    this.alwaysOnTop = plugin.settings?.pomodoroMiniAlwaysOnTop !== false;
    this.initChannel();
    this.initThemeObserver();
  }

  private initChannel() {
    try {
      this.channel = new BroadcastChannel('siyuan-time-spent-pomodoro-mini');
      this.channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'REQUEST_INIT') {
          this.broadcastState();
        } else if (data.type === 'ACTION') {
          if (data.action === 'RESTORE') {
            this.handleRestore();
          } else if (data.action === 'TOGGLE_PIN') {
            this.setAlwaysOnTop(!this.alwaysOnTop);
          } else if (data.action === 'CLOSE') {
            this.hide();
          }
        } else if (data.type === 'SAVE_POSITION') {
          if (typeof data.x === 'number' && typeof data.y === 'number') {
            this.savePosition(data.x, data.y);
          }
        }
      };
    } catch (e) {
      Logger.warn('[siyuan-time-spent] Failed to initialize mini window BroadcastChannel:', e);
    }
  }

  private initThemeObserver() {
    try {
      this.themeObserver = new MutationObserver(() => {
        if (this.isOpen) {
          this.broadcastState();
        }
      });
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme-mode', 'class'],
      });
      this.themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme-mode', 'class'],
      });
    } catch {}
  }

  private getInitialPosition(width = 96, height = 48): { x: number; y: number } {
    try {
      if (this.isElectron) {
        const remote = require('@electron/remote');
        const screen = remote.screen;
        const displays = screen.getAllDisplays();

        const saved = this.plugin.settings?.pomodoroMiniPosition;
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
          const isVisibleInAnyDisplay = displays.some((d: any) => {
            const { x, y, width: w, height: h } = d.workArea;
            return (
              saved.x >= x - 20 &&
              saved.x <= x + w - 20 &&
              saved.y >= y - 20 &&
              saved.y <= y + h - 20
            );
          });
          if (isVisibleInAnyDisplay) {
            return { x: saved.x, y: saved.y };
          }
        }

        const primary = screen.getPrimaryDisplay();
        const workArea = primary.workArea;
        return {
          x: Math.round(workArea.x + workArea.width - width - 40),
          y: Math.round(workArea.y + 40),
        };
      }
    } catch (e) {
      Logger.warn('[siyuan-time-spent] Failed to calculate initial position:', e);
    }

    const saved = this.plugin.settings?.pomodoroMiniPosition;
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
      return { x: saved.x, y: saved.y };
    }
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - width - 40 : 100,
      y: 60,
    };
  }

  private createElectronWindow() {
    try {
      const remote = require('@electron/remote');
      const { BrowserWindow } = remote;
      const { x, y } = this.getInitialPosition(96, 48);

      const win = new BrowserWindow({
        x,
        y,
        width: 96,
        height: 48,
        useContentSize: true,
        frame: false,
        transparent: true,
        alwaysOnTop: this.alwaysOnTop,
        resizable: false,
        skipTaskbar: true,
        focusable: true,
        hasShadow: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      win.setMenuBarVisibility(false);
      remote.enable(win.webContents);

      const miniUrl = `${location.origin}/plugins/${this.plugin.name}/mini.html`;
      win.loadURL(miniUrl).catch((err: any) => {
        Logger.warn('[siyuan-time-spent] Failed to load mini.html URL, trying file or fallback:', err);
      });

      win.on('moved', () => {
        if (!win || win.isDestroyed()) return;
        const [posX, posY] = win.getPosition();
        this.savePosition(posX, posY);
      });

      win.on('closed', () => {
        this.electronWindow = null;
        this.isOpen = false;
        this.stopBroadcastLoop();
      });

      this.electronWindow = win;
    } catch (e) {
      Logger.error('[siyuan-time-spent] Failed to create electron mini window, falling back to DOM:', e);
      this.isElectron = false;
      this.showFallbackDom();
    }
  }

  private showFallbackDom() {
    if (this.fallbackApp) {
      if (this.fallbackContainer) {
        this.fallbackContainer.style.display = 'block';
      }
      return;
    }

    const container = document.createElement('div');
    container.classList.add('siyuan-pomodoro-mini-fallback-host');
    document.body.appendChild(container);
    this.fallbackContainer = container;

    const { x, y } = this.getInitialPosition(96, 48);
    const app = createApp(MiniPomodoroCapsule, {
      initialX: x,
      initialY: y,
      onRestore: () => this.handleRestore(),
      onTogglePin: () => this.setAlwaysOnTop(!this.alwaysOnTop),
      onClose: () => this.hide(),
      onPositionChange: (pos: { x: number; y: number }) => this.savePosition(pos.x, pos.y),
    });

    app.mount(container);
    this.fallbackApp = app;
  }

  private hideFallbackDom() {
    if (this.fallbackContainer) {
      this.fallbackContainer.style.display = 'none';
    }
  }

  public show() {
    this.isOpen = true;
    if (this.isElectron) {
      if (!this.electronWindow || this.electronWindow.isDestroyed()) {
        this.createElectronWindow();
      } else {
        this.electronWindow.show();
      }
    } else {
      this.showFallbackDom();
    }

    this.startBroadcastLoop();
    this.broadcastState();
  }

  public hide() {
    this.isOpen = false;
    this.stopBroadcastLoop();
    if (this.isElectron && this.electronWindow && !this.electronWindow.isDestroyed()) {
      this.electronWindow.hide();
    } else {
      this.hideFallbackDom();
    }
  }

  public setAlwaysOnTop(val: boolean) {
    this.alwaysOnTop = val;
    this.plugin.settings.pomodoroMiniAlwaysOnTop = val;
    void this.plugin.saveSettings();

    if (this.electronWindow && !this.electronWindow.isDestroyed()) {
      try {
        this.electronWindow.setAlwaysOnTop(val);
      } catch (e) {
        Logger.warn('[siyuan-time-spent] Failed to setAlwaysOnTop on electron window:', e);
      }
    }
    this.broadcastState();
  }

  private handleRestore() {
    if (this.isElectron) {
      try {
        const remote = require('@electron/remote');
        const currentWin = remote.getCurrentWindow();
        if (currentWin && !currentWin.isDestroyed()) {
          currentWin.show();
          currentWin.focus();
        }
      } catch (e) {
        Logger.warn('[siyuan-time-spent] Failed to focus main window on restore:', e);
      }
    }
    this.hide();
    this.plugin.openPomodoro();
  }

  private savePosition(x: number, y: number) {
    if (!this.plugin.settings.pomodoroMiniPosition) {
      this.plugin.settings.pomodoroMiniPosition = { x, y };
    } else {
      this.plugin.settings.pomodoroMiniPosition.x = x;
      this.plugin.settings.pomodoroMiniPosition.y = y;
    }
    void this.plugin.saveSettings();
  }

  private getDisplayText(): string {
    const p = this.plugin.pomodoroManager;
    if (!p) return '25:00';
    const state = p.state.value;
    if (state === 'idle') {
      if (p.preferStopwatch.value) return '00:00';
      const mins = Math.max(1, Math.round(p.preferredMinutes.value || 25));
      return `${String(mins).padStart(2, '0')}:00`;
    }
    if (state === 'break') {
      const sec = p.breakRemainingSeconds.value;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    if (p.isStopwatch.value) {
      const sec = p.elapsedSeconds.value;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    const sec = p.remainingSeconds.value;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  public broadcastState() {
    if (!this.channel) return;
    const p = this.plugin.pomodoroManager;
    const isDark =
      document.documentElement.getAttribute('data-theme-mode') === 'dark' ||
      document.body.getAttribute('data-theme-mode') === 'dark';

    const state: MiniSyncState = {
      type: 'STATE_UPDATE',
      displayText: this.getDisplayText(),
      state: p?.state.value ?? 'idle',
      uiPhase: p?.uiPhase.value ?? 'idle',
      isStopwatch: !!p?.isStopwatch.value,
      themeMode: isDark ? 'dark' : 'light',
      alwaysOnTop: this.alwaysOnTop,
    };

    try {
      this.channel.postMessage(state);
    } catch (e) {
      Logger.warn('[siyuan-time-spent] Failed to postMessage to mini window channel:', e);
    }
  }

  private startBroadcastLoop() {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setInterval(() => {
      if (this.isOpen) {
        this.broadcastState();
      }
    }, 500);
  }

  private stopBroadcastLoop() {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }
  }

  public destroy() {
    this.stopBroadcastLoop();
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.electronWindow && !this.electronWindow.isDestroyed()) {
      try {
        this.electronWindow.destroy();
      } catch {}
      this.electronWindow = null;
    }
    if (this.fallbackApp) {
      try {
        this.fallbackApp.unmount();
      } catch {}
      this.fallbackApp = null;
    }
    if (this.fallbackContainer && this.fallbackContainer.parentNode) {
      this.fallbackContainer.parentNode.removeChild(this.fallbackContainer);
      this.fallbackContainer = null;
    }
  }
}
