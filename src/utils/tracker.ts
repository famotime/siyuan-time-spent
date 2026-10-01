import { Plugin } from "siyuan";
import { IdleWatcher } from "./idle-watcher";
import { TimeLog } from "../models/TimeLog";
import { StorageManager } from "./storage";
import Logger from "./logger";

export class TimeTracker {
    private plugin: Plugin;
    private idleWatcher: IdleWatcher;
    private storageManager: StorageManager;
    private minBrowseThresholdSeconds: number = 5;
    
    private currentDocId: string | null = null;
    private currentSessionStart: number = 0;
    private currentSessionIdleTime: number = 0;

    constructor(plugin: Plugin, storageManager: StorageManager, idleThresholdSeconds = 300, minBrowseThresholdSeconds = 5) {
        this.plugin = plugin;
        this.storageManager = storageManager;
        this.idleWatcher = new IdleWatcher(idleThresholdSeconds, this.handleIdleStatusChange.bind(this));
        this.minBrowseThresholdSeconds = minBrowseThresholdSeconds;
    }

    public updateIdleThreshold(minutes: number) {
        const seconds = Math.max(1, minutes) * 60;
        this.idleWatcher.setThreshold(seconds);
        Logger.log(`Updated idle threshold to ${minutes} minutes (${seconds}s)`);
    }

    public updateMinBrowseThreshold(seconds: number) {
        this.minBrowseThresholdSeconds = Math.max(0, seconds);
        Logger.log(`Updated min browse threshold to ${this.minBrowseThresholdSeconds} seconds`);
    }

    public updateAfkThreshold(minutes: number) {
        this.idleWatcher.setAfkThreshold(minutes);
        Logger.log(`Updated AFK prompt threshold to ${minutes} minutes`);
    }

    public start() {
        this.idleWatcher.start();
        
        // Listen to document switch events
        this.plugin.eventBus.on('switch-protyle', this.handleSwitchProtyle.bind(this));
        
        // Optional: you can listen to focus/blur of the window
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));

        // 监听可见性变化与挂起，防止移动端切后台或系统休眠导致当前会话丢失
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.addEventListener('pagehide', this.handlePageHide.bind(this));

        // 探测思源启动时默认已打开的文档，避免首篇文档未切换前漏记
        setTimeout(() => {
            this.detectInitialDocument();
        }, 500);
    }

    private handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            Logger.log('Page hidden or app suspended in background, flushing session...');
            this.finishCurrentSession();
        } else if (document.visibilityState === 'visible') {
            Logger.log('Page visible again, detecting active document...');
            setTimeout(() => {
                this.detectInitialDocument();
            }, 300);
        }
    }

    private handlePageHide() {
        Logger.log('Page hide triggered, flushing session...');
        this.finishCurrentSession();
    }

    public detectInitialDocument() {
        try {
            const activeProtyle = document.querySelector('.layout__wnd--active .protyle:not(.fn__none)')
                || document.querySelector('.protyle:not(.fn__none)');
            if (activeProtyle) {
                const wysiwyg = activeProtyle.querySelector('.protyle-wysiwyg[data-doc-type="NodeDocument"]')
                    || activeProtyle.querySelector('.protyle-wysiwyg[data-node-id]');
                const rootId = wysiwyg?.getAttribute('data-node-id');
                if (rootId && !this.currentDocId) {
                    Logger.log(`Captured initial active document on start: ${rootId}`);
                    this.switchDocument(rootId);
                }
            }
        } catch (e) {
            Logger.error('Failed to detect initial document:', e);
        }
    }

    public stop() {
        this.idleWatcher.stop();
        this.plugin.eventBus.off('switch-protyle', this.handleSwitchProtyle.bind(this));
        window.removeEventListener('focus', this.handleWindowFocus.bind(this));
        window.removeEventListener('blur', this.handleWindowBlur.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.removeEventListener('pagehide', this.handlePageHide.bind(this));
        
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
            
            // 精准结算：若当前正处于闲置中，将持续中的闲置时长一并准确扣除
            const ongoingIdleSecs = this.idleWatcher.getOngoingIdleDurationSec();
            const totalIdleSecs = this.currentSessionIdleTime + ongoingIdleSecs;
            const effectiveDuration = Math.max(0, durationSecs - totalIdleSecs);
            
            const minThreshold = this.minBrowseThresholdSeconds ?? 5;
            const isEligible = minThreshold <= 0 ? effectiveDuration > 0 : effectiveDuration >= minThreshold;

            if (isEligible) {
                const log: TimeLog = {
                    id: this.generateId(),
                    docId: this.currentDocId,
                    startTime: this.currentSessionStart,
                    endTime: endTime,
                    duration: effectiveDuration,
                    idleTime: totalIdleSecs,
                    type: 'passive'
                };
                
                this.saveLog(log);
            } else {
                Logger.log(`Session duration (${effectiveDuration}s) is below min browse threshold (${minThreshold}s), not recorded.`);
            }
        }
        
        this.currentDocId = null;
        this.currentSessionStart = 0;
        this.currentSessionIdleTime = 0;
    }

    public getCurrentDocId(): string | null {
        return this.currentDocId;
    }

    public getCurrentSessionDurationSec(): number {
        if (!this.currentDocId || this.currentSessionStart === 0) return 0;
        const now = Date.now();
        const durationSecs = Math.floor((now - this.currentSessionStart) / 1000);
        const ongoingIdleSecs = this.idleWatcher.getOngoingIdleDurationSec();
        const totalIdleSecs = this.currentSessionIdleTime + ongoingIdleSecs;
        return Math.max(0, durationSecs - totalIdleSecs);
    }

    public async addManualLog(log: TimeLog): Promise<void> {
        await this.storageManager.appendLog(log);
    }

    public async deleteLog(dateStr: string, logId: string): Promise<boolean> {
        return await this.storageManager.deleteLog(dateStr, logId);
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
