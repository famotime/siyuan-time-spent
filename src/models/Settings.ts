export interface PluginSettings {
  // 基础设置
  language?: 'auto' | 'zh_CN' | 'en_US';
  enableLog: boolean;
  openInTab: boolean;
  idleThresholdMinutes?: number;

  // 番茄钟双模设置
  enableStatusBarTimer?: boolean;    // 是否在状态栏显示专注计时胶囊
  pomodoroWorkMinutes?: number;      // 专注时长（默认 25）
  pomodoroBreakMinutes?: number;     // 短休息时长（默认 5）
  pomodoroSound?: boolean;           // 是否播放和弦完成提示音
  pomodoroNotification?: boolean;    // 是否弹出系统通知

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
  enableStatusBarTimer: true,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroSound: true,
  pomodoroNotification: true,
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


