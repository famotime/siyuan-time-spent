import {
  Plugin,
} from "siyuan";
import { createApp } from 'vue';
import App from './App.vue';
import Logger from './utils/logger';

let plugin: Plugin | null = null;

export function usePlugin(pluginProps?: Plugin): Plugin {
  Logger.log('usePlugin', pluginProps, plugin);
  if (pluginProps) {
    plugin = pluginProps;
  }
  if (!plugin && !pluginProps) {
    Logger.error('need bind plugin');
  }
  return plugin!;
}

let app: any = null;

export function init(pluginInstance: Plugin) {
  // bind plugin hook
  usePlugin(pluginInstance);

  const div = document.createElement('div');
  div.classList.toggle('siyuan-time-spent-app');
  div.id = pluginInstance.name;
  app = createApp(App);
  app.mount(div);
  document.body.appendChild(div);
}

export function destroy() {
  if (app) {
    app.unmount();
  }
  if (plugin) {
    const div = document.getElementById(plugin.name);
    if (div) {
      document.body.removeChild(div);
    }
  }
}
