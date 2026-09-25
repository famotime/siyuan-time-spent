/**
 * API 旋钮 (siyuan-api-switch) 共享配置与服务接口声明
 */

export interface SharedConfig {
  /** 绑定的 Profile 唯一标识 */
  profileId: string;
  /** Profile 名称，如 "DeepSeek-V3 默认" */
  profileName: string;
  /** 服务商标识，如 "deepseek", "openai", "custom" 等 */
  provider: string;
  /** API 基础 URL，如 "https://api.openai.com/v1" */
  baseUrl: string;
  /** API Key / 鉴权密钥 */
  apiKey: string;
  /** 当前启用的模型名称，如 "gpt-4o" */
  model: string;
  /** 候选模型列表 */
  models?: string[];
  /** 请求超时时间（秒） */
  requestTimeoutSeconds?: number;
  /** 采样温度 (0.0 - 2.0) */
  temperature?: number;
  /** 最大输出 Token 数 */
  maxTokens?: number;
  /** Profile 备注 */
  memo?: string;
  /** 服务商官网链接 */
  providerUrl?: string;
  protocol?: string;
  headers?: Record<string, string>;
  isDecisionModel?: boolean;
}

export interface SiyuanApiSwitch {
  version: string;
  /**
   * 注册子插件到 API 旋钮
   * @param pluginId 插件唯一 ID（通常对应 plugin.json 中的 name 字段）
   * @param displayName 插件显示的名称
   * @param callback 配置变更回调函数。当被接管或配置更新时传入 SharedConfig；当解除接管时传入 null
   * @param localConfig 插件本地配置快照（用于在旋钮界面中一键导入）
   */
  register(
    pluginId: string,
    displayName: string,
    callback: (config: SharedConfig | null) => void,
    localConfig?: Omit<SharedConfig, "profileId" | "profileName">
  ): void;

  /**
   * 取消注册子插件
   */
  unregister(pluginId: string): void;

  /**
   * 获取当前插件绑定的配置（若未接管则返回 null）
   */
  getBoundConfig(pluginId: string): SharedConfig | null;
}

declare global {
  interface Window {
    siyuanApiSwitch?: SiyuanApiSwitch;
  }
}
