export interface PluginSettings {
  // 基础设置
  language?: 'auto' | 'zh_CN' | 'en_US';
  enableLog: boolean;
  openInTab: boolean;
  idleThresholdMinutes?: number;

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
  aiProvider: "openai",
  aiBaseUrl: "",
  aiApiKey: "",
  aiModel: "",
  aiModels: "",
  aiRequestTimeoutSeconds: 30,
  aiTemperature: 0.7,
  aiMaxTokens: 4096,
};

