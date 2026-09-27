import { ref } from 'vue';
import type TimeSpentPlugin from '../index';
import { playPomodoroCompleteChord } from './audio';
import { showMessage } from 'siyuan';
import { t } from '../i18n';
import type { TimeLog } from '../models/TimeLog';
import Logger from './logger';

export type PomodoroState = 'idle' | 'running' | 'paused' | 'break';

export class PomodoroManager {
  private plugin: TimeSpentPlugin;
  
  public state = ref<PomodoroState>('idle');
  public isStopwatch = ref<boolean>(false);
  public remainingSeconds = ref<number>(25 * 60);
  public elapsedSeconds = ref<number>(0);
  public targetMinutes = ref<number>(25);
  public currentDocId = ref<string | null>(null);

  private timerId: any = null;
  private sessionStartTime: number = 0;
  private targetEndTime: number = 0;
  private pausedRemaining: number = 0;

  constructor(plugin: TimeSpentPlugin) {
    this.plugin = plugin;
    this.remainingSeconds.value = (this.plugin.settings?.pomodoroWorkMinutes || 25) * 60;
  }

  public start(minutes: number, docId?: string) {
    this.stopTimer();
    this.isStopwatch.value = false;
    this.targetMinutes.value = minutes;
    this.remainingSeconds.value = minutes * 60;
    this.currentDocId.value = docId || this.plugin.timeTracker?.getCurrentDocId() || null;
    this.sessionStartTime = Date.now();
    this.targetEndTime = this.sessionStartTime + minutes * 60 * 1000;
    this.state.value = 'running';

    this.timerId = setInterval(() => this.tick(), 500);
    Logger.log(`Pomodoro started: ${minutes}m on doc: ${this.currentDocId.value}`);
  }

  public startStopwatch(docId?: string) {
    this.stopTimer();
    this.isStopwatch.value = true;
    this.elapsedSeconds.value = 0;
    this.currentDocId.value = docId || this.plugin.timeTracker?.getCurrentDocId() || null;
    this.sessionStartTime = Date.now();
    this.state.value = 'running';

    this.timerId = setInterval(() => this.tickStopwatch(), 500);
    Logger.log(`Stopwatch started on doc: ${this.currentDocId.value}`);
  }

  public pause() {
    if (this.state.value === 'running') {
      this.state.value = 'paused';
      this.pausedRemaining = this.remainingSeconds.value;
      this.stopTimer();
    }
  }

  public resume() {
    if (this.state.value === 'paused') {
      this.state.value = 'running';
      if (this.isStopwatch.value) {
        this.sessionStartTime = Date.now() - this.elapsedSeconds.value * 1000;
        this.timerId = setInterval(() => this.tickStopwatch(), 500);
      } else {
        this.targetEndTime = Date.now() + this.pausedRemaining * 1000;
        this.timerId = setInterval(() => this.tick(), 500);
      }
    }
  }

  public finishEarly() {
    if (this.state.value === 'running' || this.state.value === 'paused') {
      const now = Date.now();
      const actualDuration = Math.max(1, Math.floor((now - this.sessionStartTime) / 1000));
      this.recordPomodoroSession(actualDuration, true);
      this.reset();
    }
  }

  public discard() {
    this.stopTimer();
    this.reset();
  }

  private tick() {
    const now = Date.now();
    const diff = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));
    this.remainingSeconds.value = diff;

    if (diff <= 0) {
      this.handleComplete();
    }
  }

  private tickStopwatch() {
    const now = Date.now();
    this.elapsedSeconds.value = Math.max(0, Math.floor((now - this.sessionStartTime) / 1000));
  }

  private handleComplete() {
    this.stopTimer();
    const duration = this.targetMinutes.value * 60;
    this.recordPomodoroSession(duration, false);

    // 播放提示音
    if (this.plugin.settings.pomodoroSound !== false) {
      playPomodoroCompleteChord();
    }

    // 提示
    if (this.plugin.settings.pomodoroNotification !== false) {
      showMessage(t('pomodoroCompletedMsg'), 8000, 'info');
    }

    this.reset();
  }

  private recordPomodoroSession(durationSec: number, isEarlyFinish: boolean) {
    if (durationSec < 10) return; // 忽略极其短暂的操作

    const docId = this.currentDocId.value || this.plugin.timeTracker?.getCurrentDocId() || 'pomodoro-focus';
    const log: TimeLog = {
      id: 'pomo_' + Math.random().toString(36).substring(2, 12),
      docId: docId,
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      duration: durationSec,
      idleTime: 0,
      type: 'pomodoro',
      isPomodoro: true,
      pomodoroTargetMin: this.targetMinutes.value,
      note: isEarlyFinish ? '番茄冲刺(提前结束)' : '番茄钟达成'
    };

    this.plugin.timeTracker?.addManualLog(log).catch(e => {
      Logger.error('Failed to save pomodoro log:', e);
    });
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private reset() {
    this.stopTimer();
    this.state.value = 'idle';
    this.isStopwatch.value = false;
    this.remainingSeconds.value = (this.plugin.settings.pomodoroWorkMinutes || 25) * 60;
    this.elapsedSeconds.value = 0;
  }
}
