import {
  Plugin,
  getFrontend,
  openTab,
} from "siyuan";
import { createApp, ref, type Ref } from "vue";
import "@/index.css";
import PluginInfoString from '@/../plugin.json';
import { destroy, init, openOverlay } from '@/main';
import Dashboard from './components/Dashboard.vue';
import { TimeTracker } from './utils/tracker';
import { StorageManager } from './utils/storage';
import { SettingManager } from './utils/setting';
import Logger from './utils/logger';
import { DEFAULT_SETTINGS, PluginSettings } from './models/Settings';
import type { SharedConfig } from './types/api-switch';

const TAB_TYPE = "dashboard_tab";

export type SyFrontendTypes = "desktop" | "desktop-window" | "mobile" | "browser-desktop" | "browser-mobile";

let PluginInfo = {
  version: '',
};
try {
  PluginInfo = PluginInfoString;
} catch (err) {
  // 插件信息解析失败时的兜底
}
const {
  version,
} = PluginInfo;

const SETTINGS_STORAGE_NAME = "settings.json";

export default class TimeSpentPlugin extends Plugin {
  // Run as mobile
  public isMobile: boolean;
  // Run in browser
  public isBrowser: boolean;
  // Run as local
  public isLocal: boolean;
  // Run in Electron
  public isElectron: boolean;
  // Run in window
  public isInWindow: boolean;
  public platform: SyFrontendTypes;
  public readonly version = version;
  
  private timeTracker: TimeTracker;
  public storageManager: StorageManager;
  public settingManager: SettingManager;
  public settings: PluginSettings = { ...DEFAULT_SETTINGS };

  // AI 旋钮 (siyuan-api-switch) 当前接管的配置与就绪事件监听
  public activeAiConfig: Ref<SharedConfig | null> = ref(null);
  private _onApiSwitchReady: (() => void) | null = null;

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes;
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    this.isBrowser = frontEnd.includes('browser');
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost');
    this.isInWindow = location.href.includes('window.html');

    try {
      require("@electron/remote")
        .require("@electron/remote/main");
      this.isElectron = true;
    } catch (err) {
      this.isElectron = false;
    }

    // 1. 加载配置并初始化日志管理器（默认关闭日志输出）
    await this.loadSettings();
    Logger.setEnableLog(this.settings.enableLog);
    Logger.log('Plugin loading, platform:', this.platform, 'version:', this.version);

    // 2. 初始化独立设置面板
    this.settingManager = new SettingManager(this);
    this.settingManager.initSetting(this.settings);

    // 3. 注册到 API 旋钮 (siyuan-api-switch) 并监听 ready 事件
    this.registerToApiSwitch();
    this._onApiSwitchReady = () => {
      this.registerToApiSwitch();
    };
    window.addEventListener("siyuan-api-switch:ready", this._onApiSwitchReady);

    // 4. 初始化 Vue 挂载容器
    init(this);

    // 4. 注册思源自定义看板页签 (Tab)
    this.addTab({
      type: TAB_TYPE,
      init(this: any) {
        this.element.innerHTML = "";
        this.element.style.height = "100%";
        this.element.style.width = "100%";
        this.element.style.overflow = "auto";
        this.element.style.backgroundColor = "rgb(3 7 18)";

        const app = createApp(Dashboard, {
          inTab: true,
          onClose: () => {
            this.tab.close();
          },
        });
        app.mount(this.element);
        this._vueApp = app;
      },
      destroy(this: any) {
        if (this._vueApp) {
          this._vueApp.unmount();
          this._vueApp = null;
        }
      },
    });

    // 5. 注册思源顶栏图标
    this.addTopBar({
      icon: "iconClock",
      title: this.i18n.title || "源时记",
      callback: () => {
        this.openDashboard();
      },
    });
    
    // 6. 初始化数据存储管理器
    this.storageManager = new StorageManager(this);
    
    // 7. 初始化并启动时间追踪器
    this.timeTracker = new TimeTracker(this, this.storageManager);
    this.timeTracker.start();
  }

  onunload() {
    if (this.timeTracker) {
      this.timeTracker.stop();
    }

    // 清理 API 旋钮就绪事件监听与注销
    if (this._onApiSwitchReady) {
      window.removeEventListener("siyuan-api-switch:ready", this._onApiSwitchReady);
      this._onApiSwitchReady = null;
    }
    if (window.siyuanApiSwitch?.unregister) {
      try {
        window.siyuanApiSwitch.unregister(this.name);
      } catch (err) {
        Logger.error("[siyuan-time-spent] Failed to unregister from api-switch:", err);
      }
    }

    destroy();
  }

  /**
   * 打开源时记看板（根据设置在页签或弹窗中打开）
   */
  public async openDashboard() {
    if (this.settings.openInTab) {
      await openTab({
        app: this.app,
        custom: {
          id: this.name + TAB_TYPE,
          icon: "iconClock",
          title: this.i18n.title || "源时记",
        },
      });
    } else {
      openOverlay();
    }
  }

  /**
   * 打开独立设置页面
   */
  openSetting() {
    if (this.settingManager) {
      this.settingManager.open();
    }
  }

  /**
   * 注册当前插件到 API 旋钮 (siyuan-api-switch)
   */
  public registerToApiSwitch(): void {
    if (window.siyuanApiSwitch) {
      const settings = this.settings;
      const localConfig = {
        provider: settings.aiProvider || "openai",
        baseUrl: settings.aiBaseUrl || "",
        apiKey: settings.aiApiKey || "",
        model: settings.aiModel || "",
        models: settings.aiModels
          ? settings.aiModels.split(",").map((m: string) => m.trim()).filter(Boolean)
          : [],
        requestTimeoutSeconds: settings.aiRequestTimeoutSeconds ?? 30,
        temperature: settings.aiTemperature ?? 0.7,
        maxTokens: settings.aiMaxTokens ?? 4096,
      };

      window.siyuanApiSwitch.register(
        this.name,
        this.i18n.title || "源时记",
        (config: SharedConfig | null) => {
          this.activeAiConfig.value = config;
          if (this.settings.enableLog) {
            Logger.log("[siyuan-time-spent] AI Config updated by api-switch:", config);
          }
          window.dispatchEvent(
            new CustomEvent("siyuan-time-spent:ai-config-changed", { detail: config })
          );
        },
        localConfig
      );
    }
  }

  /**
   * 当前 AI 服务是否由 siyuan-api-switch 接管
   */
  public isAiControlled(): boolean {
    return !!this.activeAiConfig.value;
  }

  /**
   * 获取当前生效的 AI 服务配置（优先返回被接管配置，无接管时返回本地设置）
   */
  public getActiveAiConfig() {
    if (this.activeAiConfig.value) {
      return {
        profileId: this.activeAiConfig.value.profileId,
        profileName: this.activeAiConfig.value.profileName,
        provider: this.activeAiConfig.value.provider,
        baseUrl: this.activeAiConfig.value.baseUrl,
        apiKey: this.activeAiConfig.value.apiKey,
        model: this.activeAiConfig.value.model,
        models: this.activeAiConfig.value.models,
        requestTimeoutSeconds: this.activeAiConfig.value.requestTimeoutSeconds ?? 30,
        temperature: this.activeAiConfig.value.temperature ?? 0.7,
        maxTokens: this.activeAiConfig.value.maxTokens ?? 4096,
      };
    }
    return {
      provider: this.settings.aiProvider || "openai",
      baseUrl: this.settings.aiBaseUrl || "",
      apiKey: this.settings.aiApiKey || "",
      model: this.settings.aiModel || "",
      models: this.settings.aiModels
        ? this.settings.aiModels.split(",").map((m: string) => m.trim()).filter(Boolean)
        : [],
      requestTimeoutSeconds: this.settings.aiRequestTimeoutSeconds ?? 30,
      temperature: this.settings.aiTemperature ?? 0.7,
      maxTokens: this.settings.aiMaxTokens ?? 4096,
    };
  }

  /**
   * 加载插件持久化配置
   */
  public async loadSettings(): Promise<PluginSettings> {
    try {
      const data = await this.loadData(SETTINGS_STORAGE_NAME);
      if (data && typeof data === "object") {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } catch (e) {
      this.settings = { ...DEFAULT_SETTINGS };
    }
    return this.settings;
  }

  /**
   * 保存插件配置到存储文件并同步更新到 API 旋钮
   */
  public async saveSettings(): Promise<void> {
    try {
      await this.saveData(SETTINGS_STORAGE_NAME, this.settings);
      this.registerToApiSwitch();
    } catch (e) {
      Logger.error("Failed to save settings", e);
    }
  }
}
