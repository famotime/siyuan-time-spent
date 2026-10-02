import type TimeSpentPlugin from '../index'
import type { TimeLog } from '../models/TimeLog'
import { showMessage } from 'siyuan'
import {
  computed,
  ref,
  shallowRef,
} from 'vue'
import { t } from '../i18n'
import {
  playBreakCompleteChord,
  playCycleCompleteChord,
  playPomodoroCompleteChord,
} from './audio'
import Logger from './logger'

export type PomodoroState = 'idle' | 'running' | 'paused' | 'break'

/** 休息的正交分类轴：短休息 / 长休息。不并入 PomodoroState，避免改动所有既有 state 分支 */
export type BreakKind = 'short' | 'long'

/** 派生视图相位。UI 只认这一个轴，冻结态对外表现为 paused，既有视觉分支自动走灰化 */
export type UiPhase = 'idle' | 'focus' | 'paused' | 'short-break' | 'long-break'

/**
 * 表盘走时基线：毫秒级已过时长、是否按墙钟推进、会话总时长与是否走秒环。
 * 表盘据此在两次 tick 之间做帧级插值，指针速度与真实钟表一致。
 */
export interface PomodoroTimeBasis {
  /** 会话已过毫秒；暂停与离桌冻结时是各自的快照 */
  elapsedMs: number
  /** 是否按墙钟推进：就绪、暂停、冻结都为 false */
  live: boolean
  /** 一整圈的毫秒数；休息阶段为休息总时长 */
  totalMs: number
  /** 正计时走秒环（一圈一分钟），倒计时与休息走整段进度 */
  sweep: boolean
}

export class PomodoroManager {
  private plugin: TimeSpentPlugin

  public state = ref<PomodoroState>('idle')
  public isStopwatch = ref<boolean>(false)
  public remainingSeconds = ref<number>(25 * 60)
  public totalSeconds = ref<number>(25 * 60)
  public elapsedSeconds = ref<number>(0)
  public targetMinutes = ref<number>(25)
  public currentDocId = ref<string | null>(null)

  // 休息阶段专属状态
  public breakRemainingSeconds = ref<number>(5 * 60)
  public breakTotalSeconds = ref<number>(5 * 60)
  public breakMinutes = ref<number>(5)

  // —— 番茄周期叙事 ——
  public cycleSize = ref<number>(4)
  public cycleCompleted = ref<number>(0)
  public breakKind = ref<BreakKind>('short')

  // —— 离桌守卫 ——
  // afkIdleSeconds 为「当前这一段」离桌时长，驱动"离开中"徽；
  // sessionIdleAccumSec 为本会话累计，仅记录进 TimeLog.idleTime，不从有效时长中扣除
  public afkFrozen = ref<boolean>(false)
  public afkIdleSeconds = ref<number>(0)
  public afkReturn = ref<{ idleSec: number, at: number } | null>(null)

  // —— 打断记录 ——
  public pendingNote = ref<string>('')
  public sessionNotes = ref<string[]>([])

  // —— 完成仪式 ——
  public lastCompletion = ref<{ at: number, minutes: number, cycleDone: boolean } | null>(null)
  public lastRecord = ref<{
    id: string
    startedAt: number
    durationSeconds: number
    status: 'saving' | 'saved' | 'error' | 'ignored'
  } | null>(null)

  public savedLogVersion = ref(0)

  // —— 待机意向（从组件下沉，供胶囊文本/表盘预览/快捷键/设置热更新共用）——
  public preferredMinutes = ref<number>(25)
  public preferStopwatch = ref<boolean>(false)

  private timerId: any = null
  private sessionStartTime: number = 0
  private targetEndTime: number = 0
  private pausedRemaining: number = 0
  /** 暂停瞬间的已过毫秒：表盘指针与墙钟恢复都以它为基线，暂停时长不计入 */
  private pausedElapsedMs: number = 0

  private sessionIdleAccumSec: number = 0
  private afkFreezeProgress: number = 0
  /** 冻结瞬间的已过毫秒，与进度快照同时取样 */
  private afkFreezeElapsedMs: number = 0
  private afkArmedAt: number = 0
  /** 番茄启动后的宽容窗口：用户可能正在点按钮，且开始前若已闲置，IdleWatcher 的 lastActivity 已陈旧会误判 */
  private static readonly AFK_GRACE_MS = 10_000

  constructor(plugin: TimeSpentPlugin) {
    this.plugin = plugin
    const defaultWork = this.plugin.settings?.pomodoroWorkMinutes || 25
    this.targetMinutes.value = defaultWork
    this.remainingSeconds.value = defaultWork * 60
    this.totalSeconds.value = defaultWork * 60
    this.preferredMinutes.value = defaultWork

    const defaultBreak = this.plugin.settings?.pomodoroBreakMinutes || 5
    this.breakMinutes.value = defaultBreak
    this.breakRemainingSeconds.value = defaultBreak * 60
    this.breakTotalSeconds.value = defaultBreak * 60

    this.cycleSize.value = Math.max(2, Math.min(8, this.plugin.settings?.pomodoroCycleSize ?? 4))
    this.sampleTimeBasis()
  }

  /**
   * 派生视图相位
   * 冻结时 state 仍为 'running'，但相位归为 'paused'，所有既有 state==='running' 的视觉分支自动灰化
   */
  public uiPhase = computed<UiPhase>(() => {
    const s = this.state.value
    if (s === 'idle') return 'idle'
    if (s === 'paused') return 'paused'
    if (s === 'break') return this.breakKind.value === 'long' ? 'long-break' : 'short-break'
    return this.afkFrozen.value ? 'paused' : 'focus'
  })

  /**
   * 启动自定义时长倒计时
   * @param minutes 设定的专注分钟数（支持任意自定义数值）
   * @param docId 关联笔记 ID
   */
  public start(minutes: number, docId?: string) {
    this.stopTimer()
    this.isStopwatch.value = false
    this.targetMinutes.value = minutes
    this.totalSeconds.value = minutes * 60
    this.remainingSeconds.value = minutes * 60
    this.currentDocId.value = docId || this.plugin.timeTracker?.getCurrentDocId() || null
    this.sessionStartTime = Date.now()
    this.targetEndTime = this.sessionStartTime + minutes * 60 * 1000
    this.pausedElapsedMs = 0
    this.state.value = 'running'
    this.armAfk()

    this.timerId = setInterval(() => this.tick(), 500)
    this.sampleTimeBasis()
    Logger.log(`Pomodoro started: ${minutes}m on doc: ${this.currentDocId.value}`)
  }

  /**
   * 启动正向秒表
   */
  public startStopwatch(docId?: string) {
    this.stopTimer()
    this.isStopwatch.value = true
    this.elapsedSeconds.value = 0
    this.currentDocId.value = docId || this.plugin.timeTracker?.getCurrentDocId() || null
    this.sessionStartTime = Date.now()
    this.pausedElapsedMs = 0
    this.state.value = 'running'
    this.armAfk()

    this.timerId = setInterval(() => this.tickStopwatch(), 500)
    this.sampleTimeBasis()
    Logger.log(`Stopwatch started on doc: ${this.currentDocId.value}`)
  }

  /**
   * 暂停倒计时或秒表
   */
  public pause() {
    if (this.state.value === 'running') {
      // 先收尾离桌累计，避免暂停期间继续累加
      this.commitAfk()
      this.state.value = 'paused'
      this.pausedRemaining = this.remainingSeconds.value
      // 按 targetEndTime 取毫秒基线：tick 的 ceil 取整会让整数秒快半秒到一秒
      this.pausedElapsedMs = this.isStopwatch.value
        ? this.elapsedSeconds.value * 1000
        : Math.max(
            0,
            this.totalSeconds.value * 1000 - (this.targetEndTime - Date.now()),
          )
      this.stopTimer()
      this.sampleTimeBasis()
    }
  }

  /**
   * 继续倒计时或秒表
   */
  public resume() {
    if (this.state.value === 'paused') {
      this.state.value = 'running'
      if (this.isStopwatch.value) {
        this.sessionStartTime = Date.now() - this.elapsedSeconds.value * 1000
        this.timerId = setInterval(() => this.tickStopwatch(), 500)
      } else {
        // 把暂停区间从墙钟起点里剔除：指针续转与统计时长都不该含暂停
        this.sessionStartTime = Date.now() - this.pausedElapsedMs
        this.targetEndTime = Date.now() + this.pausedRemaining * 1000
        this.timerId = setInterval(() => this.tick(), 500)
      }
      this.afkArmedAt = Date.now()
      this.afkFrozen.value = false
      this.sampleTimeBasis()
    }
  }

  /**
   * 提前完成并记录有效时长，随后转入休息
   */
  public finishEarly() {
    if (this.state.value === 'running' || this.state.value === 'paused') {
      this.commitAfk()
      const now = Date.now()
      const actualDuration = Math.max(1, Math.floor((now - this.sessionStartTime) / 1000))
      this.advanceCycle()
      this.recordPomodoroSession(actualDuration, true)
      this.lastCompletion.value = {
        at: now,
        minutes: Math.round(actualDuration / 60),
        cycleDone: this.cycleCompleted.value >= this.cycleSize.value,
      }
      this.enterBreak()
    }
  }

  /**
   * 放弃当前专注会话（不计入有效专注数据）
   */
  public discard() {
    this.stopTimer()
    this.reset()
  }

  /**
   * 开启短休息阶段
   */
  public startBreak(minutes?: number) {
    this.stopTimer()
    const breakMin = minutes || this.plugin.settings?.pomodoroBreakMinutes || 5
    this.breakKind.value = 'short'
    this.applyBreakWindow(breakMin)
    Logger.log(`Pomodoro break started: ${breakMin}m`)
  }

  /**
   * 开启长休息阶段（整轮番茄达成后）
   */
  public startLongBreak(minutes?: number) {
    this.stopTimer()
    const breakMin = minutes || this.plugin.settings?.pomodoroLongBreakMinutes || 15
    this.breakKind.value = 'long'
    this.applyBreakWindow(breakMin)

    if (this.plugin.settings.pomodoroSound !== false) {
      playCycleCompleteChord()
    }
    Logger.log(`Pomodoro long break started: ${breakMin}m`)
  }

  /**
   * 跳过休息直接回到就绪状态（长休息跳过时重置轮次）
   */
  public skipBreak() {
    const wasLong = this.breakKind.value === 'long'
    this.stopTimer()
    if (wasLong) {
      this.cycleCompleted.value = 0
    }
    this.reset()
  }

  /**
   * 延长休息时间
   */
  public extendBreak(extraMinutes: number = 5) {
    if (this.state.value === 'break') {
      this.breakTotalSeconds.value += extraMinutes * 60
      this.breakRemainingSeconds.value += extraMinutes * 60
      this.targetEndTime += extraMinutes * 60 * 1000
      this.sampleTimeBasis()
    }
  }

  /**
   * 设置整轮番茄数（设置面板热更新入口）
   */
  public setCycleSize(n: number) {
    this.cycleSize.value = Math.max(2, Math.min(8, n))
    // 夹紧已完成数，防止轮次轨道渲染越界
    if (this.cycleCompleted.value > this.cycleSize.value) {
      this.cycleCompleted.value = this.cycleSize.value
    }
  }

  /**
   * 记录一次打断原因（trim 去空，单次会话最多 5 条）
   */
  public recordInterruption(text: string) {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    if (this.sessionNotes.value.length >= 5) return
    this.sessionNotes.value.push(trimmed)
    this.pendingNote.value = ''
  }

  /**
   * 关闭「欢迎回来」提示卡
   */
  public dismissAfkReturn() {
    this.afkReturn.value = null
  }

  /**
   * 未冻结的归一化进度，供冻结快照与视图层使用
   */
  public computeRawProgress(): number {
    if (this.state.value === 'break') {
      const total = this.breakTotalSeconds.value || 300
      return Math.max(0, Math.min(1, 1 - this.breakRemainingSeconds.value / total))
    }
    if (this.isStopwatch.value) {
      return (this.elapsedSeconds.value % 60) / 60
    }
    const total = this.totalSeconds.value || (this.targetMinutes.value * 60) || 1500
    return Math.max(0, Math.min(1, this.elapsedSeconds.value / total))
  }

  private tick() {
    this.probeAfk()
    const now = Date.now()
    const diff = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000))
    this.remainingSeconds.value = diff
    this.elapsedSeconds.value = Math.max(
      0,
      this.totalSeconds.value - diff,
    )

    if (diff <= 0) {
      this.handleComplete()
    }
    this.sampleTimeBasis()
  }

  private tickStopwatch() {
    this.probeAfk()
    const now = Date.now()
    this.elapsedSeconds.value = Math.max(
      0,
      Math.ceil((now - this.sessionStartTime) / 1000),
    )
    this.sampleTimeBasis()
  }

  private tickBreak() {
    const now = Date.now()
    const diff = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000))
    this.breakRemainingSeconds.value = diff

    if (diff <= 0) {
      this.handleBreakComplete()
    }
    this.sampleTimeBasis()
  }

  private handleComplete() {
    this.stopTimer()
    this.commitAfk()
    const duration = this.targetMinutes.value * 60
    this.advanceCycle()
    this.recordPomodoroSession(duration, false)

    // 播放提示音
    if (this.plugin.settings.pomodoroSound !== false) {
      playPomodoroCompleteChord()
    }

    // 提示完成
    if (this.plugin.settings.pomodoroNotification !== false) {
      showMessage(t('pomodoroCompletedMsg'), 8000, 'info')
    }

    this.lastCompletion.value = {
      at: Date.now(),
      minutes: Math.round(duration / 60),
      cycleDone: this.cycleCompleted.value >= this.cycleSize.value,
    }

    this.enterBreak()
  }

  private handleBreakComplete() {
    this.stopTimer()
    if (this.plugin.settings.pomodoroSound !== false) {
      playBreakCompleteChord()
    }

    if (this.breakKind.value === 'long') {
      this.cycleCompleted.value = 0
      showMessage(t('pomodoroLongBreakEnded'), 6000, 'info')
    } else {
      showMessage(t('pomodoroBreakEnded'), 6000, 'info')
    }
    this.reset()
  }

  /**
   * 推进一轮计数，满轮则进入长休息，否则进入短休息
   */
  private enterBreak() {
    if (this.cycleCompleted.value >= this.cycleSize.value) {
      this.startLongBreak()
    } else {
      this.startBreak()
    }
  }

  private advanceCycle() {
    this.cycleCompleted.value += 1
  }

  private applyBreakWindow(breakMin: number) {
    this.breakMinutes.value = breakMin
    this.breakTotalSeconds.value = breakMin * 60
    this.breakRemainingSeconds.value = breakMin * 60
    this.sessionStartTime = Date.now()
    this.targetEndTime = this.sessionStartTime + breakMin * 60 * 1000
    this.state.value = 'break'
    this.afkFrozen.value = false
    this.afkIdleSeconds.value = 0

    this.timerId = setInterval(() => this.tickBreak(), 500)
    this.sampleTimeBasis()
  }

  /**
   * 布防离桌守卫：重置本会话的所有离桌与打断上下文
   */
  private armAfk() {
    this.afkFrozen.value = false
    this.afkIdleSeconds.value = 0
    this.afkReturn.value = null
    this.sessionIdleAccumSec = 0
    this.sessionNotes.value = []
    this.pendingNote.value = ''
    this.lastCompletion.value = null
    this.lastRecord.value = null
    this.afkArmedAt = Date.now()
  }

  /**
   * 离桌探测。在既有 500ms tick 内轮询，不新增定时器、不改 IdleWatcher、不改计时机制。
   * 冻结仅影响表现层：墙钟计时继续跑，保证休眠恢复对齐与 targetEndTime 稳定。
   */
  private probeAfk() {
    if (this.plugin.settings?.pomodoroAfkGuardian === false) return
    if (this.state.value !== 'running') return
    if (Date.now() - this.afkArmedAt < PomodoroManager.AFK_GRACE_MS) return

    const watcher = this.plugin.timeTracker?.getIdleWatcher?.()
    if (!watcher) return
    const idle = watcher.getIsIdle()

    if (idle && !this.afkFrozen.value) {
      // 刚跨过闲置阈值：冻结表现层，快照进度
      this.afkFrozen.value = true
      this.afkFreezeProgress = this.computeRawProgress()
      this.afkFreezeElapsedMs = this.wallElapsedMs()
      this.afkIdleSeconds.value = 0
      this.afkReturn.value = null
    } else if (idle && this.afkFrozen.value) {
      this.afkIdleSeconds.value = watcher.getOngoingIdleDurationSec()
    } else if (!idle && this.afkFrozen.value) {
      // 归来：结算本段离桌
      this.afkFrozen.value = false
      const sec = this.afkIdleSeconds.value
      this.sessionIdleAccumSec += sec
      this.afkReturn.value = sec > 0
        ? {
            idleSec: sec,
            at: Date.now(),
          }
        : null
    }
    this.sampleTimeBasis()
  }

  /**
   * 把当前这段离桌累计进会话总量（暂停、提前完成、自然结束时调用）
   */
  private commitAfk() {
    if (this.afkFrozen.value) {
      this.sessionIdleAccumSec += this.afkIdleSeconds.value
      const sec = this.afkIdleSeconds.value
      this.afkFrozen.value = false
      if (sec > 0 && this.state.value === 'running') {
        this.afkReturn.value = {
          idleSec: sec,
          at: Date.now(),
        }
      }
    }
  }

  /**
   * 冻结瞬间的进度快照，供表现层原地凝滞
   */
  public getFrozenProgress(): number {
    return this.afkFreezeProgress
  }

  /**
   * 当前会话的墙钟已过毫秒，暂停与冻结取各自快照
   */
  private wallElapsedMs(): number {
    if (this.state.value === 'idle') return 0
    if (this.state.value === 'break') {
      const breakTotalMs = this.breakTotalSeconds.value * 1000
      return Math.max(0, Date.now() - (this.targetEndTime - breakTotalMs))
    }
    if (this.state.value === 'paused') return this.pausedElapsedMs
    return Math.max(0, Date.now() - this.sessionStartTime)
  }

  /**
   * 走时基线快照。墙钟时间本身不可响应，所以由 tick 与状态切换处主动采样：
   * 视图层读这个 ref，才不会把毫秒锚点缓存成上次求值时的旧值
   * （那会让每次重开面板，指针都回到 0 点重新起步）。
   * 采样点漏一次不要紧——下一次 tick 会在 500ms 内把它纠正回来。
   */
  public timeBasis = shallowRef<PomodoroTimeBasis>({
    elapsedMs: 0,
    live: false,
    totalMs: 25 * 60_000,
    sweep: false,
  })

  /** 重新采样走时基线；状态被外部直接改写后（预览页、状态恢复）也走这里 */
  public sampleTimeBasis() {
    this.timeBasis.value = this.computeTimeBasis()
  }

  /** 现算一份走时基线，不经过采样缓存 */
  public getTimeBase(): PomodoroTimeBasis {
    return this.computeTimeBasis()
  }

  private computeTimeBasis(): PomodoroTimeBasis {
    const sweep = this.isStopwatch.value && this.state.value !== 'break'
    if (this.afkFrozen.value) {
      // 冻结：表盘与数字层一起停在离桌瞬间
      return {
        elapsedMs: this.afkFreezeElapsedMs,
        live: false,
        totalMs: this.totalMs(),
        sweep,
      }
    }
    return {
      elapsedMs: this.wallElapsedMs(),
      live: this.state.value !== 'idle' && this.state.value !== 'paused',
      totalMs: this.totalMs(),
      sweep,
    }
  }

  private totalMs(): number {
    if (this.state.value === 'break') return this.breakTotalSeconds.value * 1000
    return this.totalSeconds.value * 1000
  }

  /**
   * 拼接本次专注的备注：基础结论 + 打断记录（CalendarView 展示位有截断，只取前 2 条）
   */
  private buildSessionNote(base: string): string {
    const notes = this.sessionNotes.value
    if (notes.length === 0) return base
    const head = notes.slice(0, 2).join('；')
    const detail = notes.length > 2 ? `等${notes.length}条` : head
    return `${base}｜打断×${notes.length}：${detail}`
  }

  private recordPomodoroSession(durationSec: number, isEarlyFinish: boolean) {
    const id = `pomo_${Math.random().toString(36).substring(2, 12)}`
    this.lastRecord.value = {
      id,
      startedAt: this.sessionStartTime,
      durationSeconds: durationSec,
      status: durationSec < 10 ? 'ignored' : 'saving',
    }
    if (durationSec < 10) return // 忽略极其短暂的操作，不发起保存

    const docId = this.currentDocId.value || this.plugin.timeTracker?.getCurrentDocId() || 'pomodoro-focus'
    const baseNote = isEarlyFinish ? t('pomodoroNoteEarlyFinish') : t('pomodoroNoteAchieved')
    const log: TimeLog = {
      id,
      docId,
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      duration: durationSec,
      // 离桌守卫只做提示与记录：完整墙钟时长仍计入有效专注，idleTime 仅作留痕
      idleTime: this.sessionIdleAccumSec,
      type: 'pomodoro',
      isPomodoro: true,
      pomodoroTargetMin: this.isStopwatch.value
        ? Math.round(durationSec / 60)
        : this.targetMinutes.value,
      note: this.buildSessionNote(baseNote),
    }

    const onSaveError = (error: unknown) => {
      if (this.lastRecord.value?.id === log.id) {
        this.lastRecord.value.status = 'error'
      }
      Logger.error('Failed to save pomodoro log:', error)
    }

    try {
      if (!this.plugin.timeTracker) {
        throw new Error('Time tracker is unavailable')
      }
      // 保存不阻塞进入休息；旧会话晚到只通知统计刷新，不覆盖当前会话状态。
      this.plugin.timeTracker.addManualLog(log).then(() => {
        if (this.lastRecord.value?.id === log.id) {
          this.lastRecord.value.status = 'saved'
        }
        this.savedLogVersion.value += 1
      }, onSaveError)
    } catch (error) {
      onSaveError(error)
    }
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  private reset() {
    this.stopTimer()
    this.state.value = 'idle'
    this.isStopwatch.value = false
    this.breakKind.value = 'short'
    const defaultWork = this.plugin.settings?.pomodoroWorkMinutes || 25
    this.remainingSeconds.value = defaultWork * 60
    this.totalSeconds.value = defaultWork * 60
    this.elapsedSeconds.value = 0

    const defaultBreak = (this.plugin.settings?.pomodoroBreakMinutes || 5) * 60
    this.breakRemainingSeconds.value = defaultBreak
    this.breakTotalSeconds.value = defaultBreak

    this.afkFrozen.value = false
    this.afkIdleSeconds.value = 0
    this.afkReturn.value = null
    this.sessionIdleAccumSec = 0
    this.sessionNotes.value = []
    this.pendingNote.value = ''
    this.lastCompletion.value = null
    this.lastRecord.value = null
    this.pausedElapsedMs = 0
    this.sampleTimeBasis()
  }
}
