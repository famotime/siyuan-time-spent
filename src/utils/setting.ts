import { Setting, showMessage } from "siyuan";
import type TimeSpentPlugin from "../index";
import Logger from "./logger";
import { PluginSettings } from "../models/Settings";

/**
 * 插件设置面板管理器
 */
export class SettingManager {
  private plugin: TimeSpentPlugin;
  private setting: Setting | null = null;

  constructor(plugin: TimeSpentPlugin) {
    this.plugin = plugin;
  }

  /**
   * 初始化思源原生 Setting 实例及各项设置组件（无确认/取消按钮，自动保存）
   */
  public initSetting(settings: PluginSettings) {
    // 不传入 confirmCallback，从而不生成底部的保存和取消按钮，所有设置项变更时自动保存
    this.setting = new Setting({
      width: "560px",
    });

    // 1. 日志打印开关项
    this.setting.addItem({
      title: this.plugin.i18n.settingEnableLogTitle || "日志打印",
      description:
        this.plugin.i18n.settingEnableLogDesc ||
        "开启后在开发者工具控制台输出时间追踪与调试日志（默认关闭）",
      createActionElement: () => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "b3-switch fn__flex-center";
        checkbox.checked = !!settings.enableLog;
        checkbox.addEventListener("change", async () => {
          const isChecked = checkbox.checked;
          settings.enableLog = isChecked;
          Logger.setEnableLog(isChecked);
          await this.plugin.saveSettings();

          const tip = isChecked
            ? this.plugin.i18n.settingLogEnabledMsg || "已开启控制台日志打印"
            : this.plugin.i18n.settingLogDisabledMsg || "已关闭控制台日志打印";
          showMessage(tip, 2000, "info");
        });
        return checkbox;
      },
    });

    // 挂载到 plugin 实例供思源调用
    this.plugin.setting = this.setting;
  }

  /**
   * 打开设置面板
   */
  public open() {
    if (this.setting) {
      this.setting.open(this.plugin.name);
    }
  }
}
