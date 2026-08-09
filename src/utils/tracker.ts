import { Plugin } from "siyuan";
import { IdleWatcher } from "./idle-watcher";
import { TimeLog } from "../models/TimeLog";
import { StorageManager } from "./storage";
import Logger from "./logger";

export class TimeTracker {
    private plugin: Plugin;
    private idleWatcher: IdleWatcher;
    private storageManager: StorageManager;
    
    private currentDocId: string | null = null;
    private currentSessionStart: number = 0;
    private currentSessionIdleTime: number = 0;

    constructor(plugin: Plugin, storageManager: StorageManager, idleThresholdSeconds = 300) {
        this.plugin = plugin;
        this.storageManager = storageManager;
        this.idleWatcher = new IdleWatcher(idleThresholdSeconds, this.handleIdleStatusChange.bind(this));
    }

    public start() {
        this.idleWatcher.start();
        
        // Listen to document switch events
        this.plugin.eventBus.on('switch-protyle', this.handleSwitchProtyle.bind(this));
        
        // Optional: you can listen to focus/blur of the window
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
    }

    public stop() {
        this.idleWatcher.stop();
        this.plugin.eventBus.off('switch-protyle', this.handleSwitchProtyle.bind(this));
        window.removeEventListener('focus', this.handleWindowFocus.bind(this));
        window.removeEventListener('blur', this.handleWindowBlur.bind(this));
        
        this.finishCurrentSession();
    }

    private handleIdleStatusChange(isIdle: boolean, idleDurationMs: number) {
        if (!isIdle) {
            // Woke up from idle, add the idle duration to the current session's idle time
            // Note: The idleWatcher reports idleDuration in milliseconds, convert to seconds
            this.currentSessionIdleTime += Math.floor(idleDurationMs / 1000);
            Logger.log(`Woke up from idle. Added ${Math.floor(idleDurationMs / 1000)}s of idle time.`);
        }
    }

    private handleSwitchProtyle(event: any) {
        // Find docId from event
        // The event object for switch-protyle contains detail.protyle.block.rootID
        const detail = event.detail;
        const docId = detail?.protyle?.block?.rootID;
        
        if (docId && docId !== this.currentDocId) {
            this.switchDocument(docId);
        }
    }

    private handleWindowFocus() {
        // Could be used to resume tracking if needed
    }

    private handleWindowBlur() {
        // Could be used to trigger immediate idle or pause tracking
    }

    private switchDocument(newDocId: string) {
        this.finishCurrentSession();
        
        this.currentDocId = newDocId;
        this.currentSessionStart = Date.now();
        this.currentSessionIdleTime = 0;
        Logger.log(`Started tracking document: ${newDocId}`);
    }

    private finishCurrentSession() {
        if (this.currentDocId && this.currentSessionStart > 0) {
            const endTime = Date.now();
            const durationSecs = Math.floor((endTime - this.currentSessionStart) / 1000);
            const effectiveDuration = Math.max(0, durationSecs - this.currentSessionIdleTime);
            
            if (effectiveDuration > 0) {
                const log: TimeLog = {
                    id: this.generateId(),
                    docId: this.currentDocId,
                    startTime: this.currentSessionStart,
                    endTime: endTime,
                    duration: effectiveDuration,
                    idleTime: this.currentSessionIdleTime
                };
                
                this.saveLog(log);
            }
        }
        
        this.currentDocId = null;
        this.currentSessionStart = 0;
        this.currentSessionIdleTime = 0;
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    private saveLog(log: TimeLog) {
        Logger.log(`Saved log: `, log);
        this.storageManager.appendLog(log).catch(e => {
            Logger.error(`Failed to save log`, e);
        });
    }
}
