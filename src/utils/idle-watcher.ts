export type IdleStatusCallback = (isIdle: boolean, idleDurationMs: number) => void;

export class IdleWatcher {
    private threshold: number; // in milliseconds
    private lastActivity: number;
    private checkIntervalId: any = null;
    private isIdle: boolean = false;
    private idleStartTime: number = 0;
    private onStatusChange: IdleStatusCallback;

    private readonly activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    private boundActivityHandler: () => void;

    constructor(thresholdSeconds: number, onStatusChange: IdleStatusCallback) {
        this.threshold = thresholdSeconds * 1000;
        this.onStatusChange = onStatusChange;
        this.lastActivity = Date.now();
        this.boundActivityHandler = this.handleActivity.bind(this);
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
