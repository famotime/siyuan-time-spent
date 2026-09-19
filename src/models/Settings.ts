export interface PluginSettings {
  // 基础设置
  enableLog: boolean;
  openInTab: boolean;

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
  enableLog: false,
  openInTab: true,
  aiProvider: "openai",
  aiBaseUrl: "",
  aiApiKey: "",
  aiModel: "",
  aiModels: "",
  aiRequestTimeoutSeconds: 30,
  aiTemperature: 0.7,
  aiMaxTokens: 4096,
};

