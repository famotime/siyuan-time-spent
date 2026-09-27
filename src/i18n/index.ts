import { ref, computed } from 'vue';
import zh_CN from './zh_CN.json';
import en_US from './en_US.json';
import Logger from '../utils/logger';

export type SupportedLang = 'zh_CN' | 'en_US';
export type LangSetting = 'auto' | 'zh_CN' | 'en_US';

const dictionaries: Record<SupportedLang, Record<string, string>> = {
  zh_CN,
  en_US,
};

export const langSetting = ref<LangSetting>('auto');
export const currentLang = ref<SupportedLang>('zh_CN');

/**
 * 智能探测思源笔记宿主与浏览器当前语言
 */
export function resolveAutoLang(): SupportedLang {
  try {
    // 1. 优先读取思源笔记全局配置 appearance.lang
    const syLang = (window as any).siyuan?.config?.appearance?.lang;
    if (typeof syLang === 'string' && syLang.trim()) {
      const normalized = syLang.trim().toLowerCase();
      if (normalized.startsWith('zh')) {
        return 'zh_CN';
      }
      return 'en_US';
    }

    // 2. 读取 document.documentElement 的 lang 属性
    const docLang = document.documentElement.getAttribute('lang') || (document.documentElement as any).lang;
    if (typeof docLang === 'string' && docLang.trim()) {
      const normalized = docLang.trim().toLowerCase();
      if (normalized.startsWith('zh')) {
        return 'zh_CN';
      }
      return 'en_US';
    }

    // 3. 读取浏览器语言 navigator.language
    const navLang = navigator.language || (navigator as any).userLanguage;
    if (typeof navLang === 'string' && navLang.trim()) {
      const normalized = navLang.trim().toLowerCase();
      if (normalized.startsWith('zh')) {
        return 'zh_CN';
      }
      return 'en_US';
    }
  } catch (err) {
    Logger.error('[i18n] Failed to detect host language:', err);
  }

  return 'zh_CN';
}

/**
 * 刷新并同步生效当前实际使用的语言
 */
export function syncCurrentLang() {
  if (langSetting.value === 'auto') {
    currentLang.value = resolveAutoLang();
  } else {
    currentLang.value = langSetting.value;
  }
}

/**
 * 设置语言偏好（auto / zh_CN / en_US）
 */
export function setLangSetting(setting: LangSetting) {
  langSetting.value = setting;
  syncCurrentLang();
}

/**
 * 核心翻译函数
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const lang = currentLang.value;
  const dict = dictionaries[lang] || dictionaries.zh_CN;
  let text = dict[key] || dictionaries.zh_CN[key] || dictionaries.en_US[key] || key;

  if (params && typeof params === 'object') {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }
  return text;
}

/**
 * 国际化时长格式化
 */
export function formatDurationI18n(seconds: number, lang?: SupportedLang): string {
  const activeLang = lang || currentLang.value;
  const sec = Math.max(0, Math.round(seconds || 0));

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (activeLang === 'en_US') {
    if (h > 0) {
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    if (m > 0) {
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    return `${s}s`;
  }

  // zh_CN
  if (h > 0) {
    return m > 0 ? `${h}小时${m}分` : `${h}小时`;
  }
  if (m > 0) {
    return s > 0 ? `${m}分${s}秒` : `${m}分`;
  }
  return `${s}秒`;
}

/**
 * 获取星期名称列表（周一到周日）
 */
export function getWeekdayNames(lang?: SupportedLang): string[] {
  const activeLang = lang || currentLang.value;
  if (activeLang === 'en_US') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }
  return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
}

/**
 * 获取简短星期缩写（日历表头或热力图使用）
 */
export function getShortWeekdayNames(lang?: SupportedLang): string[] {
  const activeLang = lang || currentLang.value;
  if (activeLang === 'en_US') {
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  }
  return ['一', '二', '三', '四', '五', '六', '日'];
}

/**
 * 获取月份名称列表（1月到12月）
 */
export function getMonthNames(lang?: SupportedLang): string[] {
  const activeLang = lang || currentLang.value;
  if (activeLang === 'en_US') {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }
  return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
}

let observer: MutationObserver | null = null;
let pollTimer: any = null;

/**
 * 初始化 i18n 监听器与状态绑定
 */
export function initI18n(initialSetting: LangSetting = 'auto') {
  langSetting.value = initialSetting;
  syncCurrentLang();

  // 监听 DOM 树属性变化以感知思源语言/主题切换
  if (typeof MutationObserver !== 'undefined' && !observer) {
    observer = new MutationObserver(() => {
      if (langSetting.value === 'auto') {
        const detected = resolveAutoLang();
        if (detected !== currentLang.value) {
          currentLang.value = detected;
          Logger.log('[i18n] Host language change observed:', detected);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang', 'data-theme-mode', 'class'],
    });
  }

  // 兜底心跳轮询感知思源配置变动
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (langSetting.value === 'auto') {
        const detected = resolveAutoLang();
        if (detected !== currentLang.value) {
          currentLang.value = detected;
        }
      }
    }, 2500);
  }

  // 监听窗口聚焦即时刷新
  window.addEventListener('focus', () => {
    if (langSetting.value === 'auto') {
      syncCurrentLang();
    }
  });
}

/**
 * 销毁监听器
 */
export function destroyI18n() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
