import { Plugin } from "siyuan";
import { TimeLog } from "../models/TimeLog";
import Logger from "./logger";

export class StorageManager {
    private plugin: Plugin;
    private cache: Map<string, TimeLog[]> = new Map();
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }
    
    // Get date string in YYYY-MM-DD format
    public formatDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get today's date string in YYYY-MM-DD format
    public getTodayString(): string {
        return this.formatDate(new Date());
    }
    
    public async loadTodayLogs(): Promise<TimeLog[]> {
        return await this.loadLogsForDate(this.getTodayString());
    }

    public async loadLogsForDate(dateStr: string): Promise<TimeLog[]> {
        const filename = `${dateStr}.json`;
        const logs = await this.loadLogsByFile(filename);
        this.cache.set(dateStr, logs);
        return logs;
    }

    /**
     * Load logs for a specific range of days [startDateStr, endDateStr]
     */
    public async loadLogsForDateRange(startDateStr: string, endDateStr: string): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const dayMap: Record<string, TimeLog[]> = {};
        let allLogs: TimeLog[] = [];

        const current = new Date(start);
        while (current <= end) {
            const dateStr = this.formatDate(current);
            const logs = await this.loadLogsForDate(dateStr);
            dayMap[dateStr] = logs;
            allLogs = allLogs.concat(logs);
            current.setDate(current.getDate() + 1);
        }

        return { allLogs, dayMap };
    }

    /**
     * Load logs for an entire month (e.g. 2026, 8)
     */
    public async loadLogsForMonth(year: number, month: number): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0); // last day of month
        const startStr = this.formatDate(firstDay);
        const endStr = this.formatDate(lastDay);
        return await this.loadLogsForDateRange(startStr, endStr);
    }
    
    /**
     * Load logs for a week starting at weekStartDate (Monday) or 7-day span
     */
    public async loadLogsForWeek(startDate: Date): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        return await this.loadLogsForDateRange(this.formatDate(startDate), this.formatDate(endDate));
    }
    
    public async loadWeekLogs(): Promise<TimeLog[]> {
        let allLogs: TimeLog[] = [];
        // Load logs from 6 days ago up to today
        for (let i = 6; i >= 0; i--) {
            const dateStr = this.getDateStringFromDaysAgo(i);
            const logs = await this.loadLogsForDate(dateStr);
            allLogs = allLogs.concat(logs);
        }
        return allLogs;
    }
    
    public async saveTodayLogs(logs: TimeLog[]): Promise<void> {
        const dateStr = this.getTodayString();
        const filename = `${dateStr}.json`;
        this.cache.set(dateStr, logs);
        await this.plugin.saveData(filename, logs);
    }
    
    public async appendLog(log: TimeLog): Promise<void> {
        const dateStr = this.getDateStringFromTimestamp(log.startTime);
        const filename = `${dateStr}.json`;
        const logs = await this.loadLogsByFile(filename);
        logs.push(log);
        this.cache.set(dateStr, logs);
        await this.plugin.saveData(filename, logs);
    }
    
    public async loadLogsByFile(filename: string): Promise<TimeLog[]> {
        try {
            const data = await this.plugin.loadData(filename);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            Logger.error(`Failed to load data from ${filename}`, e);
            return [];
        }
    }

    public getDateStringFromTimestamp(timestamp: number): string {
        return this.formatDate(new Date(timestamp));
    }

    public getDateStringFromDaysAgo(daysAgo: number): string {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return this.formatDate(d);
    }
}
