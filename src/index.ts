import {
  Plugin,
  getFrontend,
  SyFrontendTypes
} from "siyuan";
import "@/index.css";
import PluginInfoString from '@/../plugin.json'
import { destroy, init } from '@/main'
import { TimeTracker } from './utils/tracker';
import { StorageManager } from './utils/storage';

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('Plugin info parse error: ', err)
}
const {
  version,
} = PluginInfo

export default class PluginSample extends Plugin {
  // Run as mobile
  public isMobile: boolean
  // Run in browser
  public isBrowser: boolean
  // Run as local
  public isLocal: boolean
  // Run in Electron
  public isElectron: boolean
  // Run in window
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version
  
  private timeTracker: TimeTracker;
  public storageManager: StorageManager;

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    this.isInWindow = location.href.includes('window.html')

    try {
      require("@electron/remote")
        .require("@electron/remote/main")
      this.isElectron = true
    } catch (err) {
      this.isElectron = false
    }

    console.log('Plugin loaded, the plugin is ', this)

    init(this)
    
    // Initialize storage manager
    this.storageManager = new StorageManager(this);
    
    // Initialize and start time tracker
    this.timeTracker = new TimeTracker(this, this.storageManager);
    this.timeTracker.start();
  }

  onunload() {
    if (this.timeTracker) {
      this.timeTracker.stop();
    }
    destroy()
  }

  openSetting() {
    window._sy_plugin_sample.openSetting()
  }
}
