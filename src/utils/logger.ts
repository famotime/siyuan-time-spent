/**
 * 统一日志管理器
 * 控制全插件的控制台日志输出，默认静默（enableLog = false）
 */
export class Logger {
  private static enabled: boolean = false;

  public static setEnableLog(enabled: boolean) {
    this.enabled = !!enabled;
  }

  public static isEnabled(): boolean {
    return this.enabled;
  }

  public static log(...args: any[]) {
    if (this.enabled) {
      console.log("[TimeSpent]", ...args);
    }
  }

  public static info(...args: any[]) {
    if (this.enabled) {
      console.info("[TimeSpent]", ...args);
    }
  }

  public static warn(...args: any[]) {
    if (this.enabled) {
      console.warn("[TimeSpent]", ...args);
    }
  }

  public static error(...args: any[]) {
    if (this.enabled) {
      console.error("[TimeSpent]", ...args);
    }
  }
}

export default Logger;
