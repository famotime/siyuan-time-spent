export type IdleStatusCallback = (isIdle: boolean, idleDurationMs: number) => void;

export class IdleWatcher {
    private threshold: number; // in milliseconds
    private lastActivity: number;
    private checkIntervalId: any = null;
    private isIdle: boolean = false;
    private idleStartTime: number = 0;
    private onStatusChange: IdleStatusCallback;

    private readonly activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'touchmove', 'touchend'];
    private boundActivityHandler: () => void;
    private afkThresholdMs: number = 600 * 1000; // 默认 10 分钟触发离桌归因询问

    constructor(thresholdSeconds: number, onStatusChange: IdleStatusCallback, afkThresholdMinutes: number = 10) {
        this.threshold = thresholdSeconds * 1000;
        this.afkThresholdMs = Math.max(1, afkThresholdMinutes) * 60 * 1000;
        this.onStatusChange = onStatusChange;
        this.lastActivity = Date.now();
        this.boundActivityHandler = this.handleActivity.bind(this);
    }

    public setThreshold(thresholdSeconds: number) {
        this.threshold = Math.max(10, thresholdSeconds) * 1000;
    }

    public setAfkThreshold(minutes: number) {
        this.afkThresholdMs = Math.max(1, minutes) * 60 * 1000;
    }

    public getIsIdle(): boolean {
        return this.isIdle;
    }

    /**
     * 若当前处于闲置中，返回从开始闲置到当前已过去的秒数；若未闲置则返回 0
     */
    public getOngoingIdleDurationSec(): number {
        if (this.isIdle && this.idleStartTime > 0) {
            return Math.max(0, Math.floor((Date.now() - this.idleStartTime) / 1000));
        }
        return 0;
    }

    public start() {
        this.lastActivity = Date.now();
        this.isIdle = false;
        
        this.activityEvents.forEach(event => {
            document.addEventListener(event, this.boundActivityHandler, { passive: true });
        });
        
        // Check for idle status every second
        this.checkIntervalId = setInterval(() => this.checkIdleStatus(), 1000);
    }

    public stop() {
        this.activityEvents.forEach(event => {
            document.removeEventListener(event, this.boundActivityHandler);
        });
        if (this.checkIntervalId !== null) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
        }
    }

    private handleActivity() {
        this.lastActivity = Date.now();
        
        if (this.isIdle) {
            // Woke up from idle
            this.isIdle = false;
            const idleDurationMs = Date.now() - this.idleStartTime;
            this.onStatusChange(false, idleDurationMs);

            // 若闲置时长达到归因门槛，广播离桌唤醒事件供界面归因
            if (idleDurationMs >= this.afkThresholdMs) {
                try {
                    window.dispatchEvent(new CustomEvent('siyuan-time-spent:afk-detected', {
                        detail: {
                            durationSec: Math.floor(idleDurationMs / 1000),
                            startTime: this.idleStartTime,
                            endTime: Date.now()
                        }
                    }));
                } catch (e) {
                    // 忽略事件分发异常
                }
            }
        }
    }

    private checkIdleStatus() {
        const now = Date.now();
        if (!this.isIdle && now - this.lastActivity >= this.threshold) {
            // Just became idle
            this.isIdle = true;
            this.idleStartTime = this.lastActivity; // The actual idle time started from the last activity
            this.onStatusChange(true, 0);
        }
    }
}
