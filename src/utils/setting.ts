import { Setting, showMessage } from "siyuan";
import type TimeSpentPlugin from "../index";
import Logger from "./logger";
import { PluginSettings } from "../models/Settings";

/**
 * 插件设置面板管理器
 * 参考 siyuan-canvas 项目设计，采用标准化卡片式折叠分组（基础设置、AI 服务）
 * 确保所有卡片与选项完全左对齐，并支持 siyuan-api-switch 统一接管与热更新。
 */
export class SettingManager {
  private plugin: TimeSpentPlugin;
  private setting: Setting | null = null;
  private globalTooltip: HTMLElement | null = null;
  private onAiConfigChangedListener: ((e: Event) => void) | null = null;

  constructor(plugin: TimeSpentPlugin) {
    this.plugin = plugin;
  }

  /**
   * 初始化思源原生 Setting 实例供思源调用
   */
  public initSetting(settings: PluginSettings) {
    this.buildSetting(settings);
  }

  /**
   * 打开设置面板并进行卡片化分类
   */
  public open() {
    this.buildSetting(this.plugin.settings);
    if (this.setting) {
      this.setting.open(this.plugin.name);

      let retryCount = 0;
      const isControlled = this.plugin.isAiControlled();
      const tryCategorize = () => {
        const anchorEl = document.querySelector('[data-setting-key="enableLog"]');
        if (anchorEl) {
          try {
            this.categorizeSettings(isControlled);
          } catch (err) {
            console.error("Failed to categorize siyuan-time-spent settings:", err);
          }
        } else if (retryCount < 50) {
          retryCount++;
          setTimeout(tryCategorize, 50);
        }
      };
      tryCategorize();

      // 监听 API 旋钮切换广播，实现零刷新热更新
      this.bindAiConfigListener();
    }
  }

  /**
   * 监听 API 旋钮广播事件实现热更新
   */
  private bindAiConfigListener() {
    if (this.onAiConfigChangedListener) {
      window.removeEventListener("siyuan-time-spent:ai-config-changed", this.onAiConfigChangedListener);
    }

    this.onAiConfigChangedListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newConfig = customEvent.detail;
      const isNowControlled = Boolean(newConfig);

      const baseUrlEl = document.querySelector('[data-setting-key="aiBaseUrl"]') as HTMLInputElement | null;
      if (!baseUrlEl) {
        if (this.onAiConfigChangedListener) {
          window.removeEventListener("siyuan-time-spent:ai-config-changed", this.onAiConfigChangedListener);
          this.onAiConfigChangedListener = null;
        }
        return;
      }

      const providerEl = document.querySelector('[data-setting-key="aiProvider"]') as HTMLInputElement | null;
      const apiKeyEl = document.querySelector('[data-setting-key="aiApiKey"]') as HTMLInputElement | null;
      const modelEl = document.querySelector('[data-setting-key="aiModel"]') as HTMLInputElement | null;
      const modelsEl = document.querySelector('[data-setting-key="aiModels"]') as HTMLInputElement | null;
      const timeoutEl = document.querySelector('[data-setting-key="aiRequestTimeoutSeconds"]') as HTMLInputElement | null;
      const tempEl = document.querySelector('[data-setting-key="aiTemperature"]') as HTMLInputElement | null;
      const maxTokensEl = document.querySelector('[data-setting-key="aiMaxTokens"]') as HTMLInputElement | null;

      const draft = this.plugin.settings;

      if (providerEl) {
        providerEl.value = isNowControlled ? (newConfig.provider || "openai") : (draft.aiProvider || "openai");
        providerEl.disabled = isNowControlled;
      }
      if (baseUrlEl) {
        baseUrlEl.value = isNowControlled ? (newConfig.baseUrl || "") : (draft.aiBaseUrl || "");
        baseUrlEl.disabled = isNowControlled;
      }
      if (apiKeyEl) {
        apiKeyEl.value = isNowControlled ? (newConfig.apiKey || "") : (draft.aiApiKey || "");
        apiKeyEl.disabled = isNowControlled;
      }
      if (modelEl) {
        modelEl.value = isNowControlled ? (newConfig.model || "") : (draft.aiModel || "");
        modelEl.disabled = isNowControlled;
      }
      if (modelsEl) {
        modelsEl.value = isNowControlled
          ? (Array.isArray(newConfig.models) ? newConfig.models.join(", ") : (newConfig.model || ""))
          : (draft.aiModels || "");
        modelsEl.disabled = isNowControlled;
      }
      if (timeoutEl) {
        timeoutEl.value = isNowControlled
          ? (newConfig.requestTimeoutSeconds ?? 30).toString()
          : (draft.aiRequestTimeoutSeconds ?? 30).toString();
        timeoutEl.disabled = isNowControlled;
      }
      if (tempEl) {
        tempEl.value = isNowControlled
          ? (newConfig.temperature ?? 0.7).toString()
          : (draft.aiTemperature ?? 0.7).toString();
        tempEl.disabled = isNowControlled;
      }
      if (maxTokensEl) {
        maxTokensEl.value = isNowControlled
          ? (newConfig.maxTokens ?? 4096).toString()
          : (draft.aiMaxTokens ?? 4096).toString();
        maxTokensEl.disabled = isNowControlled;
      }

      // 切换行置灰状态
      const apiKeys = [
        "aiProvider", "aiBaseUrl", "aiApiKey", "aiModel", "aiModels",
        "aiRequestTimeoutSeconds", "aiTemperature", "aiMaxTokens"
      ];
      for (const key of apiKeys) {
        const el = document.querySelector(`[data-setting-key="${key}"]`);
        if (el) {
          let itemWrapper: HTMLElement | null = el as HTMLElement;
          while (itemWrapper && itemWrapper.parentElement && !itemWrapper.classList.contains("siyuan-time-spent-settings-details-content")) {
            if (itemWrapper.parentElement.classList.contains("siyuan-time-spent-settings-details-content")) {
              break;
            }
            itemWrapper = itemWrapper.parentElement;
          }
          if (itemWrapper) {
            if (isNowControlled) {
              itemWrapper.classList.add("siyuan-time-spent-settings-item--disabled");
            } else {
              itemWrapper.classList.remove("siyuan-time-spent-settings-item--disabled");
            }
          }
        }
      }

      // 切换徽标
      const badge = document.querySelector(".siyuan-time-spent-ai-badge");
      if (badge) {
        badge.className = `siyuan-time-spent-ai-badge ${isNowControlled ? "siyuan-time-spent-ai-badge--managed" : ""}`;
        badge.textContent = isNowControlled
          ? (this.plugin.i18n.settingsAiBadgeManaged || "API 旋钮已接管")
          : (this.plugin.i18n.settingsAiBadgeLocal || "本地配置");
      }

      // 切换横幅
      const aiContent = document.querySelector('[data-setting-key="aiProvider"]')?.closest(".siyuan-time-spent-settings-details-content");
      if (aiContent) {
        let banner = aiContent.querySelector(".siyuan-time-spent-settings-banner");
        if (isNowControlled) {
          if (!banner) {
            banner = document.createElement("div");
            banner.className = "siyuan-time-spent-settings-banner";
            banner.innerHTML = this.getBannerHtml(newConfig);
            aiContent.insertBefore(banner, aiContent.firstChild);
          } else {
            banner.innerHTML = this.getBannerHtml(newConfig);
          }
        } else {
          if (banner) {
            banner.remove();
          }
        }
      }
    };

    window.addEventListener("siyuan-time-spent:ai-config-changed", this.onAiConfigChangedListener);
  }

  /**
   * 构建思源原生 Setting 实例及各项设置项
   */
  public buildSetting(settings: PluginSettings) {
    this.injectSettingsPanelStyles();

    this.setting = new Setting({
      width: "560px",
      destroyCallback: () => {
        if (this.onAiConfigChangedListener) {
          window.removeEventListener("siyuan-time-spent:ai-config-changed", this.onAiConfigChangedListener);
          this.onAiConfigChangedListener = null;
        }
        if (this.globalTooltip) {
          this.globalTooltip.classList.remove("siyuan-time-spent-global-tooltip--show");
          this.globalTooltip.style.display = "none";
        }
      },
    });

    const isControlled = this.plugin.isAiControlled();
    const activeAiConfig = this.plugin.getActiveAiConfig();

    // ================= 1. 基础设置项 =================
    // 1.1 日志打印开关项
    this.setting.addItem({
      title: this.plugin.i18n.settingEnableLogTitle || "日志打印",
      description:
        this.plugin.i18n.settingEnableLogDesc ||
        "开启后在开发者工具控制台输出时间追踪与调试日志（默认关闭）",
      createActionElement: () => {
        const checkbox = document.createElement("input");
        checkbox.dataset.settingKey = "enableLog";
        checkbox.type = "checkbox";
        checkbox.className = "b3-switch fn__flex-center";
        checkbox.checked = !!settings.enableLog;
        checkbox.addEventListener("change", async () => {
          const isChecked = checkbox.checked;
          settings.enableLog = isChecked;
          Logger.setEnableLog(isChecked);
          await this.plugin.saveSettings();
        });
        return checkbox;
      },
    });

    // 1.2 在页签打开开关项
    this.setting.addItem({
      title: this.plugin.i18n.settingOpenInTabTitle || "在页签打开",
      description:
        this.plugin.i18n.settingOpenInTabDesc ||
        "开启后点击顶栏图标将在新页签中打开看板，关闭后以弹窗形式打开（默认开启）",
      createActionElement: () => {
        const checkbox = document.createElement("input");
        checkbox.dataset.settingKey = "openInTab";
        checkbox.type = "checkbox";
        checkbox.className = "b3-switch fn__flex-center";
        checkbox.checked = settings.openInTab ?? true;
        checkbox.addEventListener("change", async () => {
          const isChecked = checkbox.checked;
          settings.openInTab = isChecked;
          await this.plugin.saveSettings();
        });
        return checkbox;
      },
    });

    // ================= 2. AI 服务设置项 =================
    // 2.1 API 提供商
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiProviderTitle || "API 提供商",
      description:
        this.plugin.i18n.settingsAiProviderDescription ||
        "大模型服务提供商，如 openai、anthropic 等。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiProvider";
        input.className = "b3-text-field fn__flex-center";
        input.type = "text";
        input.value = isControlled && activeAiConfig
          ? activeAiConfig.provider || "openai"
          : settings.aiProvider || "openai";
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            settings.aiProvider = input.value.trim();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.2 API 接口地址
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiBaseUrlTitle || "API 接口地址",
      description:
        this.plugin.i18n.settingsAiBaseUrlDescription ||
        "API 的 Base URL 地址，如 https://api.openai.com/v1。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiBaseUrl";
        input.className = "b3-text-field fn__flex-center";
        input.type = "text";
        input.value = isControlled && activeAiConfig
          ? activeAiConfig.baseUrl || ""
          : settings.aiBaseUrl || "";
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            settings.aiBaseUrl = input.value.trim();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.3 API 密钥
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiApiKeyTitle || "API 密钥",
      description:
        this.plugin.i18n.settingsAiApiKeyDescription ||
        "大模型 API 的安全密钥，通常为 Bearer Key。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiApiKey";
        input.className = "b3-text-field fn__flex-center";
        input.type = "password";
        input.value = isControlled && activeAiConfig
          ? activeAiConfig.apiKey || ""
          : settings.aiApiKey || "";
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            settings.aiApiKey = input.value.trim();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.4 模型名称
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiModelTitle || "模型名称",
      description:
        this.plugin.i18n.settingsAiModelDescription ||
        "当前使用的大语言模型名称，如 gpt-4o。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiModel";
        input.className = "b3-text-field fn__flex-center";
        input.type = "text";
        input.value = isControlled && activeAiConfig
          ? activeAiConfig.model || ""
          : settings.aiModel || "";
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            settings.aiModel = input.value.trim();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.5 可选模型列表
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiModelsTitle || "可选模型列表",
      description:
        this.plugin.i18n.settingsAiModelsDescription ||
        "逗号分隔的模型列表，用于快速切换。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiModels";
        input.className = "b3-text-field fn__flex-center";
        input.type = "text";
        input.value = isControlled && activeAiConfig
          ? Array.isArray(activeAiConfig.models)
            ? activeAiConfig.models.join(", ")
            : activeAiConfig.model || ""
          : settings.aiModels || "";
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            settings.aiModels = input.value.trim();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.6 请求超时 (秒)
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiRequestTimeoutSecondsTitle || "请求超时 (秒)",
      description:
        this.plugin.i18n.settingsAiRequestTimeoutSecondsDescription ||
        "大模型 API 请求的超时时长（5-300 秒），默认为 30 秒。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiRequestTimeoutSeconds";
        input.className = "b3-text-field fn__flex-center";
        input.type = "number";
        input.min = "5";
        input.max = "300";
        input.value = isControlled && activeAiConfig
          ? (activeAiConfig.requestTimeoutSeconds ?? 30).toString()
          : (settings.aiRequestTimeoutSeconds ?? 30).toString();
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            const val = Number.parseInt(input.value, 10);
            settings.aiRequestTimeoutSeconds = Number.isNaN(val)
              ? 30
              : Math.min(300, Math.max(5, val));
            input.value = settings.aiRequestTimeoutSeconds.toString();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.7 温度 (Temperature)
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiTemperatureTitle || "温度 (Temperature)",
      description:
        this.plugin.i18n.settingsAiTemperatureDescription ||
        "采样温度（0-2），值越高输出越随机和有创造性，默认为 0.7。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiTemperature";
        input.className = "b3-text-field fn__flex-center";
        input.type = "number";
        input.min = "0";
        input.max = "2";
        input.step = "0.1";
        input.value = isControlled && activeAiConfig
          ? (activeAiConfig.temperature ?? 0.7).toString()
          : (settings.aiTemperature ?? 0.7).toString();
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            const val = Number.parseFloat(input.value);
            settings.aiTemperature = Number.isNaN(val)
              ? 0.7
              : Math.min(2, Math.max(0, val));
            input.value = settings.aiTemperature.toString();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 2.8 最大 Token 数
    this.setting.addItem({
      title: this.plugin.i18n.settingsAiMaxTokensTitle || "最大 Token 数",
      description:
        this.plugin.i18n.settingsAiMaxTokensDescription ||
        "单次生成内容时限制的最大 Token 数量，默认为 4096。",
      createActionElement: () => {
        const input = document.createElement("input");
        input.dataset.settingKey = "aiMaxTokens";
        input.className = "b3-text-field fn__flex-center";
        input.type = "number";
        input.min = "1";
        input.max = "65536";
        input.value = isControlled && activeAiConfig
          ? (activeAiConfig.maxTokens ?? 4096).toString()
          : (settings.aiMaxTokens ?? 4096).toString();
        input.disabled = isControlled;
        if (!isControlled) {
          input.addEventListener("change", async () => {
            const val = Number.parseInt(input.value, 10);
            settings.aiMaxTokens = Number.isNaN(val)
              ? 4096
              : Math.min(65536, Math.max(1, val));
            input.value = settings.aiMaxTokens.toString();
            await this.plugin.saveSettings();
          });
        }
        return input;
      },
    });

    // 挂载到 plugin 实例供思源调用
    this.plugin.setting = this.setting;
  }

  /**
   * 将设置项分类组织为统一的折叠卡片（基础设置、AI 服务）
   * 彻底避免混排和分栏挤压，保证所有卡片及条目完全左对齐
   */
  private categorizeSettings(isControlled: boolean) {
    const anchorEl = document.querySelector('[data-setting-key="enableLog"]') as HTMLElement | null;
    if (!anchorEl) return;

    let wrapper: HTMLElement | null = anchorEl;
    while (wrapper && wrapper.parentElement) {
      const parent = wrapper.parentElement;
      if (parent.classList.contains("b3-dialog__content") || parent.children.length > 5) {
        break;
      }
      wrapper = parent;
    }

    const container = (anchorEl.closest(".b3-dialog__content") || wrapper?.parentElement) as HTMLElement | null;
    if (!container) return;

    const groups = [
      {
        id: "basic",
        title: this.plugin.i18n.settingsGroupBasic || "基础设置",
        keys: ["enableLog", "openInTab"],
        open: true,
      },
      {
        id: "ai",
        title: this.plugin.i18n.settingsGroupAi || "AI 服务",
        keys: [
          "aiProvider",
          "aiBaseUrl",
          "aiApiKey",
          "aiModel",
          "aiModels",
          "aiRequestTimeoutSeconds",
          "aiTemperature",
          "aiMaxTokens",
        ],
        open: true,
      },
    ];

    const itemWrappersMap = new Map<string, HTMLElement>();
    for (const group of groups) {
      for (const key of group.keys) {
        const el = container.querySelector(`[data-setting-key="${key}"]`) as HTMLElement | null;
        if (el) {
          let itemWrapper: HTMLElement | null = el;
          while (itemWrapper && itemWrapper.parentElement !== container) {
            itemWrapper = itemWrapper.parentElement;
          }
          if (itemWrapper) {
            itemWrappersMap.set(key, itemWrapper);

            const apiKeys = [
              "aiProvider", "aiBaseUrl", "aiApiKey", "aiModel", "aiModels",
              "aiRequestTimeoutSeconds", "aiTemperature", "aiMaxTokens"
            ];
            if (isControlled && apiKeys.includes(key)) {
              itemWrapper.classList.add("siyuan-time-spent-settings-item--disabled");
            }
          }
        }
      }
    }

    // 描述信息转为悬浮 Tooltip（参照 siyuan-canvas 设计，隐藏占位文本，保持整洁统一单行行高）
    const settingKeysMapping = [
      { key: "enableLog", desc: this.plugin.i18n.settingEnableLogDesc || "开启后在开发者工具控制台输出时间追踪与调试日志（默认关闭）" },
      { key: "openInTab", desc: this.plugin.i18n.settingOpenInTabDesc || "开启后点击顶栏图标将在新页签中打开看板，关闭后以弹窗形式打开（默认开启）" },
      { key: "aiProvider", desc: this.plugin.i18n.settingsAiProviderDescription || "大模型服务提供商，如 openai、anthropic 等。" },
      { key: "aiBaseUrl", desc: this.plugin.i18n.settingsAiBaseUrlDescription || "API 的 Base URL 地址，如 https://api.openai.com/v1。" },
      { key: "aiApiKey", desc: this.plugin.i18n.settingsAiApiKeyDescription || "大模型 API 的安全密钥，通常为 Bearer Key。" },
      { key: "aiModel", desc: this.plugin.i18n.settingsAiModelDescription || "当前使用的大语言模型名称，如 gpt-4o。" },
      { key: "aiModels", desc: this.plugin.i18n.settingsAiModelsDescription || "逗号分隔的模型列表，用于快速切换。" },
      { key: "aiRequestTimeoutSeconds", desc: this.plugin.i18n.settingsAiRequestTimeoutSecondsDescription || "大模型 API 请求的超时时长（5-300 秒），默认为 30 秒。" },
      { key: "aiTemperature", desc: this.plugin.i18n.settingsAiTemperatureDescription || "采样温度（0-2），值越高输出越随机和有创造性，默认为 0.7。" },
      { key: "aiMaxTokens", desc: this.plugin.i18n.settingsAiMaxTokensDescription || "单次生成内容时限制的最大 Token 数量，默认为 4096。" },
    ];

    settingKeysMapping.forEach(({ key, desc }) => {
      const itemWrapper = itemWrappersMap.get(key);
      if (!itemWrapper) return;
      if (!desc) return;

      const descEl = itemWrapper.querySelector(".b3-label__text") as HTMLElement | null;
      if (descEl) {
        descEl.style.display = "none";
      }

      itemWrapper.dataset.timeSpentTooltip = desc;
      if (!(itemWrapper as any).__tooltipBound) {
        (itemWrapper as any).__tooltipBound = true;

        itemWrapper.addEventListener("mouseenter", () => {
          const text = itemWrapper.dataset.timeSpentTooltip;
          if (!text) return;

          const tooltip = this.getOrCreateGlobalTooltip();
          tooltip.textContent = text;
          tooltip.style.display = "block";
          tooltip.style.visibility = "hidden";
          tooltip.classList.remove("siyuan-time-spent-global-tooltip--show");

          void tooltip.offsetHeight;

          const tooltipH = tooltip.offsetHeight || 36;
          const tooltipW = tooltip.offsetWidth || 240;
          const rect = itemWrapper.getBoundingClientRect();
          const top = rect.bottom + 6;
          const rawLeft = rect.left;
          const left = Math.max(8, Math.min(rawLeft, window.innerWidth - tooltipW - 8));

          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;
          tooltip.style.visibility = "";
          tooltip.classList.add("siyuan-time-spent-global-tooltip--show");
        });

        itemWrapper.addEventListener("mouseleave", () => {
          const tooltip = this.getOrCreateGlobalTooltip();
          tooltip.classList.remove("siyuan-time-spent-global-tooltip--show");
          tooltip.style.display = "none";
        });
      }
    });

    const categorizedWrappers = new Set(itemWrappersMap.values());
    const otherWrappers: HTMLElement[] = [];
    Array.from(container.children).forEach((child) => {
      const htmlChild = child as HTMLElement;
      if (
        htmlChild.tagName !== "DETAILS" &&
        htmlChild.tagName !== "STYLE" &&
        !categorizedWrappers.has(htmlChild)
      ) {
        otherWrappers.push(htmlChild);
      }
    });

    // 逐组创建 details 折叠卡片并移入子项
    groups.forEach((group) => {
      const groupWrappers = group.keys
        .map((k) => itemWrappersMap.get(k))
        .filter((w): w is HTMLElement => !!w);

      if (groupWrappers.length === 0) return;

      const details = document.createElement("details");
      details.className = "siyuan-time-spent-settings-details";
      if (group.open) {
        details.setAttribute("open", "");
      }

      const summary = document.createElement("summary");
      summary.className = "siyuan-time-spent-settings-summary fn__flex fn__flex-center";

      const arrowIcon = document.createElement("span");
      arrowIcon.className = "siyuan-time-spent-settings-summary-arrow fn__flex fn__flex-center";
      arrowIcon.innerHTML = `<svg viewBox="0 0 24 24" class="siyuan-time-spent-settings-arrow-svg"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;

      const titleSpan = document.createElement("span");
      titleSpan.className = "siyuan-time-spent-settings-summary-title";
      titleSpan.textContent = group.title;

      summary.appendChild(arrowIcon);
      summary.appendChild(titleSpan);

      if (group.id === "ai") {
        const badge = document.createElement("span");
        badge.className = `siyuan-time-spent-ai-badge ${isControlled ? "siyuan-time-spent-ai-badge--managed" : ""}`;
        badge.textContent = isControlled
          ? (this.plugin.i18n.settingsAiBadgeManaged || "API 旋钮已接管")
          : (this.plugin.i18n.settingsAiBadgeLocal || "本地配置");
        summary.appendChild(badge);
      }

      details.appendChild(summary);

      const contentDiv = document.createElement("div");
      contentDiv.className = "siyuan-time-spent-settings-details-content";

      if (group.id === "ai" && isControlled) {
        const banner = document.createElement("div");
        banner.className = "siyuan-time-spent-settings-banner";
        banner.innerHTML = this.getBannerHtml(this.plugin.getActiveAiConfig());
        contentDiv.appendChild(banner);
      }

      groupWrappers.forEach((wrapper) => {
        const providerEl = wrapper.querySelector('[data-setting-key="aiProvider"]');
        if (providerEl) {
          const separator = document.createElement("div");
          separator.className = "siyuan-time-spent-settings-separator siyuan-time-spent-settings-separator--first";
          const title = document.createElement("div");
          title.className = "siyuan-time-spent-settings-separator-title";
          title.textContent = this.plugin.i18n.settingsGroupAiApiSubTitle || "API 基础设置";
          separator.appendChild(title);
          contentDiv.appendChild(separator);
        }
        contentDiv.appendChild(wrapper);
      });

      details.appendChild(contentDiv);
      container.appendChild(details);
    });

    if (otherWrappers.length > 0) {
      const details = document.createElement("details");
      details.className = "siyuan-time-spent-settings-details";
      details.setAttribute("open", "");

      const summary = document.createElement("summary");
      summary.className = "siyuan-time-spent-settings-summary fn__flex fn__flex-center";

      const arrowIcon = document.createElement("span");
      arrowIcon.className = "siyuan-time-spent-settings-summary-arrow fn__flex fn__flex-center";
      arrowIcon.innerHTML = `<svg viewBox="0 0 24 24" class="siyuan-time-spent-settings-arrow-svg"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;

      const titleSpan = document.createElement("span");
      titleSpan.className = "siyuan-time-spent-settings-summary-title";
      titleSpan.textContent = this.plugin.i18n.settingsGroupOther || "其他设置";

      summary.appendChild(arrowIcon);
      summary.appendChild(titleSpan);
      details.appendChild(summary);

      const contentDiv = document.createElement("div");
      contentDiv.className = "siyuan-time-spent-settings-details-content";
      otherWrappers.forEach((wrapper) => {
        contentDiv.appendChild(wrapper);
      });
      details.appendChild(contentDiv);
      container.appendChild(details);
    }
  }

  /**
   * 生成接管提示横幅 HTML
   */
  public getBannerHtml(config: { profileName?: string } | null): string {
    const profileText = config?.profileName ? ` (${config.profileName})` : "";
    const rawTpl =
      this.plugin.i18n.settingsAiControlledHint ||
      "当前已由 API 旋钮 (siyuan-api-switch) 插件接管配置{profile}，本地设置已失效。";
    return rawTpl.replace("{profile}", profileText);
  }

  /**
   * 获取或创建挂在 body 下的全局 Tooltip，避免被父容器 overflow 裁剪
   */
  private getOrCreateGlobalTooltip(): HTMLElement {
    if (this.globalTooltip) return this.globalTooltip;
    this.globalTooltip = document.querySelector(".siyuan-time-spent-global-tooltip") as HTMLElement | null;
    if (!this.globalTooltip) {
      this.globalTooltip = document.createElement("div");
      this.globalTooltip.className = "siyuan-time-spent-global-tooltip";
      document.body.appendChild(this.globalTooltip);
    }
    return this.globalTooltip;
  }

  /**
   * 注入设置面板专用样式（完全对齐 siyuan-canvas 标准风格）
   */
  private injectSettingsPanelStyles() {
    if (document.getElementById("siyuan-time-spent-settings-panel-styles")) return;

    const style = document.createElement("style");
    style.id = "siyuan-time-spent-settings-panel-styles";
    style.textContent = `
      /* 折叠卡片容器：与 siyuan-canvas 保持完全一致的优雅圆角卡片 */
      .siyuan-time-spent-settings-details {
        margin: 6px 0 18px 0 !important;
        border: 1px solid var(--b3-theme-border, rgba(0,0,0,0.1)) !important;
        border-radius: 8px !important;
        background-color: rgba(120, 120, 128, 0.06) !important;
        display: block !important;
        transition: all 0.2s ease-in-out !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03) !important;
        box-sizing: border-box !important;
      }
      .siyuan-time-spent-settings-details[open] {
        background-color: var(--b3-theme-background) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06) !important;
      }

      /* 头部摘要行：完全左对齐、点击展开/折叠 */
      .siyuan-time-spent-settings-summary {
        padding: 14px 18px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        user-select: none !important;
        background-color: rgba(120, 120, 128, 0.04) !important;
        border-bottom: 1px solid transparent !important;
        display: flex !important;
        align-items: center !important;
        color: var(--b3-theme-on-background) !important;
        transition: background-color 0.2s ease !important;
        outline: none !important;
        border-radius: 8px !important;
        box-sizing: border-box !important;
      }
      .siyuan-time-spent-settings-details[open] .siyuan-time-spent-settings-summary {
        border-bottom-color: var(--b3-theme-border) !important;
        background-color: rgba(120, 120, 128, 0.02) !important;
        border-radius: 8px 8px 0 0 !important;
      }
      .siyuan-time-spent-settings-summary:hover {
        background-color: rgba(120, 120, 128, 0.1) !important;
      }
      .siyuan-time-spent-settings-summary::-webkit-details-marker,
      .siyuan-time-spent-settings-summary::marker {
        display: none !important;
      }
      .siyuan-time-spent-settings-summary-arrow {
        margin-right: 12px !important;
        width: 16px !important;
        height: 16px !important;
        color: var(--b3-theme-on-background) !important;
        transition: transform 0.2s ease !important;
        opacity: 0.8 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .siyuan-time-spent-settings-arrow-svg {
        width: 100% !important;
        height: 100% !important;
        fill: currentColor !important;
        transition: transform 0.2s ease !important;
      }
      .siyuan-time-spent-settings-details[open] .siyuan-time-spent-settings-summary-arrow {
        transform: rotate(90deg) !important;
      }
      .siyuan-time-spent-settings-summary-title {
        flex: 1 !important;
        letter-spacing: 0.5px !important;
      }

      /* 状态胶囊徽标 */
      .siyuan-time-spent-ai-badge {
        font-size: 11px !important;
        font-weight: 500 !important;
        padding: 2px 8px !important;
        border-radius: 12px !important;
        background-color: var(--b3-theme-surface-lighter, rgba(120, 120, 128, 0.15)) !important;
        color: var(--b3-theme-on-surface-mute, #888) !important;
        margin-right: 4px !important;
      }
      .siyuan-time-spent-ai-badge--managed {
        background-color: rgba(63, 81, 181, 0.15) !important;
        color: #5c6bc0 !important;
      }

      /* 内容面板容器 */
      .siyuan-time-spent-settings-details-content {
        padding: 6px 12px 10px 12px !important;
        box-sizing: border-box !important;
      }

      /* 内部条目行：单行水平布局、左右绝对对齐 */
      .siyuan-time-spent-settings-details-content > .fn__flex,
      .siyuan-time-spent-settings-details-content > .b3-label,
      .siyuan-time-spent-settings-details-content > .config-item,
      .b3-dialog__content .config-item:has([data-setting-key]) {
        padding: 10px 12px !important;
        margin: 2px 0 !important;
        border-bottom: 1px solid var(--b3-theme-border-mute, rgba(0, 0, 0, 0.04)) !important;
        border-radius: 6px !important;
        transition: background-color 0.15s ease !important;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
      }
      .siyuan-time-spent-settings-details-content > *:hover {
        background-color: var(--b3-theme-hover) !important;
      }
      .siyuan-time-spent-settings-details-content > *:last-child {
        border-bottom: none !important;
      }

      /* 消除思源默认换行分栏 */
      .b3-dialog__content .config-item:has([data-setting-key]) > .fn__flex-1,
      .siyuan-time-spent-settings-details-content .config-item:has([data-setting-key]) > .fn__flex-1 {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        width: auto !important;
        max-width: none !important;
        margin-bottom: 0 !important;
        margin-right: 16px !important;
      }
      .b3-dialog__content .config-item:has([data-setting-key]) .config-name,
      .siyuan-time-spent-settings-details-content .config-item:has([data-setting-key]) .config-name {
        margin-bottom: 0 !important;
        line-height: 20px !important;
        font-size: 14px !important;
      }
      .b3-dialog__content .config-item:has([data-setting-key]) > .fn__space,
      .siyuan-time-spent-settings-details-content .config-item:has([data-setting-key]) > .fn__space {
        display: none !important;
      }

      /* 文本输入框：固定 200px 尺寸靠右对齐 */
      .b3-dialog__content .config-item > input[data-setting-key]:not([type="checkbox"]),
      .siyuan-time-spent-settings-details-content input[data-setting-key]:not([type="checkbox"]) {
        flex: 0 0 200px !important;
        width: 200px !important;
        min-width: 200px !important;
        max-width: 200px !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        align-self: center !important;
      }

      /* 开关控件：思源标准 26px × 16px 样式 */
      .b3-dialog__content .config-item input[data-setting-key][type="checkbox"],
      .b3-dialog__content input[data-setting-key][type="checkbox"],
      .siyuan-time-spent-settings-details-content input[data-setting-key][type="checkbox"],
      input[data-setting-key][type="checkbox"].fn__size200,
      input[data-setting-key][type="checkbox"] {
        position: relative !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        width: 26px !important;
        min-width: 26px !important;
        max-width: 26px !important;
        height: 16px !important;
        min-height: 16px !important;
        max-height: 16px !important;
        flex: 0 0 26px !important;
        box-sizing: border-box !important;
        background-color: var(--b3-switch-background, #e1e3e1) !important;
        border: 1px solid var(--b3-switch-border, rgba(120, 120, 128, 0.3)) !important;
        border-radius: 12px !important;
        outline: none !important;
        cursor: pointer !important;
        transition: background-color 0.15s ease, border-color 0.15s ease !important;
        display: inline-block !important;
        margin: 0 !important;
      }
      .b3-dialog__content input[data-setting-key][type="checkbox"]:checked,
      input[data-setting-key][type="checkbox"]:checked {
        background-color: var(--b3-switch-checked-background, var(--b3-theme-primary, #3575f0)) !important;
        border-color: transparent !important;
      }
      .b3-dialog__content input[data-setting-key][type="checkbox"]::after,
      input[data-setting-key][type="checkbox"]::after {
        content: "" !important;
        position: absolute !important;
        top: 50% !important;
        left: 7px !important;
        transform: translate(-50%, -50%) !important;
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background-color: var(--b3-switch-border, rgba(0, 0, 0, 0.4)) !important;
        transition: left 0.12s ease, width 0.12s ease, height 0.12s ease, background-color 0.12s ease !important;
        pointer-events: none !important;
        box-shadow: none !important;
      }
      .b3-dialog__content input[data-setting-key][type="checkbox"]:checked::after,
      input[data-setting-key][type="checkbox"]:checked::after {
        left: 17px !important;
        width: 12px !important;
        height: 12px !important;
        background-color: var(--b3-switch-checked, #ffffff) !important;
      }

      /* AI 接管提示 Banner（警告黄色虚线框） */
      .siyuan-time-spent-settings-banner {
        margin: 6px 12px 12px 12px !important;
        padding: 10px 14px !important;
        background-color: rgba(246, 190, 0, 0.1) !important;
        border: 1px dashed rgba(246, 190, 0, 0.4) !important;
        border-radius: 6px !important;
        color: var(--b3-theme-warning, #f6be00) !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        line-height: 1.5 !important;
      }

      /* AI 设置分隔区 */
      .siyuan-time-spent-settings-separator {
        margin: 18px 12px 10px 12px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }
      .siyuan-time-spent-settings-separator--first {
        margin-top: 6px !important;
      }
      .siyuan-time-spent-settings-separator-title {
        font-size: 12px !important;
        font-weight: 600 !important;
        color: var(--b3-theme-on-surface-mute, rgba(0,0,0,0.5)) !important;
        letter-spacing: 0.8px !important;
      }

      /* 接管置灰禁用样式 */
      .siyuan-time-spent-settings-item--disabled {
        opacity: 0.55 !important;
        pointer-events: none !important;
        background-color: rgba(120, 120, 128, 0.02) !important;
        filter: grayscale(1) !important;
      }
      .siyuan-time-spent-settings-item--disabled input {
        cursor: not-allowed !important;
      }

      /* 挂在 body 下的全局气泡浮层，彻底防 overflow 裁剪 */
      .siyuan-time-spent-global-tooltip {
        position: fixed !important;
        background-color: #1e1e2e !important;
        color: #e2e8f0 !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        padding: 7px 13px !important;
        border-radius: 7px !important;
        font-size: 12px !important;
        font-weight: normal !important;
        line-height: 1.55 !important;
        white-space: pre-wrap !important;
        width: 240px !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
        z-index: 999999 !important;
        pointer-events: none !important;
        display: none;
        opacity: 0;
        transform: scale(0.88) translateY(4px);
        transform-origin: bottom center;
        transition: opacity 0.14s ease, transform 0.14s ease;
      }
      .siyuan-time-spent-global-tooltip.siyuan-time-spent-global-tooltip--show {
        opacity: 1 !important;
        transform: scale(1) translateY(0) !important;
      }
    `;
    document.head.appendChild(style);
  }
}
