import {
  Plugin,
  getFrontend,
} from "siyuan";
import "@/index.css";
import PluginInfoString from '@/../plugin.json';
import { destroy, init } from '@/main';
import { TimeTracker } from './utils/tracker';
import { StorageManager } from './utils/storage';
import { SettingManager } from './utils/setting';
import Logger from './utils/logger';
import { DEFAULT_SETTINGS, PluginSettings } from './models/Settings';

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

    // 3. 初始化 Vue 挂载容器
    init(this);
    
    // 4. 初始化数据存储管理器
    this.storageManager = new StorageManager(this);
    
    // 5. 初始化并启动时间追踪器
    this.timeTracker = new TimeTracker(this, this.storageManager);
    this.timeTracker.start();
  }

  onunload() {
    if (this.timeTracker) {
      this.timeTracker.stop();
    }
    destroy();
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
   * 保存插件配置到存储文件
   */
  public async saveSettings(): Promise<void> {
    try {
      await this.saveData(SETTINGS_STORAGE_NAME, this.settings);
    } catch (e) {
      Logger.error("Failed to save settings", e);
    }
  }
}
