import {
  Plugin,
} from "siyuan";
import { createApp } from 'vue';
import App from './App.vue';
import Logger from './utils/logger';
// 仅类型导入，编译后擦除，不会与 index.ts 形成运行时循环
import type TimeSpentPlugin from './index';

let plugin: TimeSpentPlugin | null = null;

export function usePlugin(pluginProps?: Plugin): TimeSpentPlugin {
  Logger.log('usePlugin', pluginProps, plugin);
  if (pluginProps) {
    plugin = pluginProps as TimeSpentPlugin;
  }
  if (!plugin && !pluginProps) {
    Logger.error('need bind plugin');
  }
  return plugin!;
}

let app: any = null;
let overlayVm: any = null;
let themeObserver: MutationObserver | null = null;

export function init(pluginInstance: Plugin) {
  plugin = pluginInstance as TimeSpentPlugin;
  // bind plugin hook
  usePlugin(pluginInstance);

  const div = document.createElement('div');
  div.classList.toggle('siyuan-time-spent-app');
  div.id = pluginInstance.name;

  const syncTheme = () => {
    const isDark = (window as any).siyuan?.config?.appearance?.mode !== undefined
      ? (window as any).siyuan.config.appearance.mode === 1
      : document.documentElement.getAttribute('data-theme-mode') === 'dark' || document.body.getAttribute('data-theme-mode') === 'dark';
    div.setAttribute('data-theme-mode', isDark ? 'dark' : 'light');
  };
  syncTheme();

  themeObserver = new MutationObserver(() => {
    syncTheme();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme-mode', 'class'] });

  app = createApp(App);
  overlayVm = app.mount(div);
  document.body.appendChild(div);
}

export function openOverlay() {
  if (overlayVm?.openDashboard) {
    overlayVm.openDashboard();
  }
}

export function closeOverlay() {
  if (overlayVm?.closeDashboard) {
    overlayVm.closeDashboard();
  }
}

export function destroy() {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  if (app) {
    app.unmount();
    app = null;
    overlayVm = null;
  }
  if (plugin) {
    const div = document.getElementById(plugin.name);
    if (div) {
      document.body.removeChild(div);
    }
  }
}
