import { Plugin } from "siyuan";
import { TimeLog } from "../models/TimeLog";

export class StorageManager {
    private plugin: Plugin;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }
    
    // Get today's date string in YYYY-MM-DD format
    public getTodayString(): string {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    public async loadTodayLogs(): Promise<TimeLog[]> {
        const filename = `${this.getTodayString()}.json`;
        return await this.loadLogsByFile(filename);
    }
    
    public async loadWeekLogs(): Promise<TimeLog[]> {
        let allLogs: TimeLog[] = [];
        // Load logs from 6 days ago up to today
        for (let i = 6; i >= 0; i--) {
            const dateStr = this.getDateStringFromDaysAgo(i);
            const filename = `${dateStr}.json`;
            const logs = await this.loadLogsByFile(filename);
            allLogs = allLogs.concat(logs);
        }
        return allLogs;
    }
    
    public async saveTodayLogs(logs: TimeLog[]): Promise<void> {
        const filename = `${this.getTodayString()}.json`;
        await this.plugin.saveData(filename, logs);
    }
    
    public async appendLog(log: TimeLog): Promise<void> {
        const dateStr = this.getDateStringFromTimestamp(log.startTime);
        const filename = `${dateStr}.json`;
        const logs = await this.loadLogsByFile(filename);
        logs.push(log);
        await this.plugin.saveData(filename, logs);
    }
    
    public async loadLogsByFile(filename: string): Promise<TimeLog[]> {
        try {
            const data = await this.plugin.loadData(filename);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error(`[StorageManager] Failed to load data from ${filename}`, e);
            return [];
        }
    }

    private getDateStringFromTimestamp(timestamp: number): string {
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getDateStringFromDaysAgo(daysAgo: number): string {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
