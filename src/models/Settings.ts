export interface PluginSettings {
  // 基础设置
  language?: 'auto' | 'zh_CN' | 'en_US';
  enableLog: boolean;
  openInTab: boolean;
  idleThresholdMinutes?: number;
  minBrowseThresholdSeconds?: number;// 浏览阈值下限（默认 5 秒），低于阈值不纳入统计，为0则不限最低浏览时间

  // 番茄钟双模设置
  enableStatusBarTimer?: boolean;    // 是否在状态栏显示专注计时胶囊
  pomodoroWorkMinutes?: number;      // 专注时长（默认 25）
  pomodoroBreakMinutes?: number;     // 短休息时长（默认 5）
  pomodoroSound?: boolean;           // 是否播放和弦完成提示音
  pomodoroNotification?: boolean;    // 是否弹出系统通知
  pomodoroThemeStyle?: 'zen' | 'chrono' | 'hourglass'; // 交互设计形态：极光流体 / 精密机械 / 时空沙漏
  pomodoroAnimationIntensity?: 'calm' | 'expressive'; // 动效仪式感强度：沉浸克制 / 灵动充沛
  pomodoroCycleSize?: number;             // 一轮番茄数（默认 4，范围 2-8），完成一轮后进入长休息
  pomodoroLongBreakMinutes?: number;      // 长休息时长（默认 15，范围 5-60）
  pomodoroAfkGuardian?: boolean;          // 离桌守卫：闲置时凝滞表盘并在归来时提示（仅提示，不扣除时长）
  pomodoroInterruptionLog?: boolean;      // 暂停时记录打断原因
  pomodoroSmartDuration?: boolean;        // 待机时推荐专注时长
  pomodoroAchievementMoment?: boolean;    // 番茄达成时播放全屏微时刻
  pomodoroShortcut?: boolean;             // 键盘快捷键 Alt+P / Space / Esc
  pomodoroWheelAdjust?: boolean;          // 待机时表盘滚轮以 5 分钟步进微调时长

  // 离桌归因设置
  enableAfkPrompt?: boolean;         // 离桌唤醒后是否弹窗询问归因
  afkPromptThresholdMinutes?: number;// 触发弹窗的闲置门槛（默认 10 分钟）

  // Daily Note 自动沉淀设置
  enableDailyNoteArchiving?: boolean;// 是否启用自动沉淀至日记
  dailyNoteAutoTime?: string;        // 触发时间点（默认 "23:55"）

  // AI 服务设置（支持本地配置及 siyuan-api-switch 接管）
  aiProvider?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiModels?: string;
  aiRequestTimeoutSeconds?: number;
  aiTemperature?: number;
  aiMaxTokens?: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  language: 'auto',
  enableLog: false,
  openInTab: true,
  idleThresholdMinutes: 5,
  minBrowseThresholdSeconds: 5,
  enableStatusBarTimer: true,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroSound: true,
  pomodoroNotification: true,
  pomodoroThemeStyle: 'zen',
  pomodoroAnimationIntensity: 'expressive',
  pomodoroCycleSize: 4,
  pomodoroLongBreakMinutes: 15,
  pomodoroAfkGuardian: true,
  pomodoroInterruptionLog: true,
  pomodoroSmartDuration: true,
  pomodoroAchievementMoment: true,
  pomodoroShortcut: true,
  pomodoroWheelAdjust: true,
  enableAfkPrompt: false,
  afkPromptThresholdMinutes: 10,
  enableDailyNoteArchiving: false,
  dailyNoteAutoTime: "23:55",
  aiProvider: "openai",
  aiBaseUrl: "",
  aiApiKey: "",
  aiModel: "",
  aiModels: "",
  aiRequestTimeoutSeconds: 30,
  aiTemperature: 0.7,
  aiMaxTokens: 4096,
};


