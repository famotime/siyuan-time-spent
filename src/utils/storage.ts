import { Plugin } from "siyuan"
import { TimeLog } from "../models/TimeLog"
import Logger from "./logger"

export class StorageManager {
  private plugin: Plugin
  private cache: Map<string, TimeLog[]> = new Map()

  constructor(plugin: Plugin) {
    this.plugin = plugin
  }

  // Get date string in YYYY-MM-DD format
  public formatDate(d: Date): string {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get today's date string in YYYY-MM-DD format
  public getTodayString(): string {
    return this.formatDate(new Date())
  }

  public async loadTodayLogs(options?: { strict?: boolean }): Promise<TimeLog[]> {
    return await this.loadLogsForDate(this.getTodayString(), options)
  }

  public async loadLogsForDate(dateStr: string, options?: { strict?: boolean }): Promise<TimeLog[]> {
    const primaryFile = `${dateStr}.json`
    const mobileFile = `${dateStr}_mobile.json`
    
    // 并行读取主文件与移动端分片文件
    const [primaryLogs, mobileLogs] = await Promise.all([
      this.loadLogsByFile(primaryFile, options),
      this.loadLogsByFile(mobileFile, options)
    ])

    const logMap = new Map<string, TimeLog>()
    for (const log of primaryLogs) {
      if (log && log.id) logMap.set(log.id, log)
    }
    for (const log of mobileLogs) {
      if (log && log.id) logMap.set(log.id, log)
    }

    const merged = Array.from(logMap.values()).sort((a, b) => a.startTime - b.startTime)
    this.cache.set(dateStr, merged)
    return merged
  }

  /**
   * Load logs for a specific range of days [startDateStr, endDateStr]
   */
  public async loadLogsForDateRange(startDateStr: string, endDateStr: string): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    const dayMap: Record<string, TimeLog[]> = {}
    let allLogs: TimeLog[] = []

    const current = new Date(start)
    while (current.getTime() <= end.getTime()) {
      const dateStr = this.formatDate(current)
      const logs = await this.loadLogsForDate(dateStr)
      dayMap[dateStr] = logs
      allLogs = allLogs.concat(logs)
      current.setDate(current.getDate() + 1)
    }

    return {
      allLogs,
      dayMap,
    }
  }

  /**
   * Load logs for an entire month (e.g. 2026, 8)
   */
  public async loadLogsForMonth(year: number, month: number): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0) // last day of month
    const startStr = this.formatDate(firstDay)
    const endStr = this.formatDate(lastDay)
    return await this.loadLogsForDateRange(startStr, endStr)
  }

  /**
   * Load logs for an entire year (e.g. 2026)
   */
  public async loadLogsForYear(year: number): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
    const firstDay = new Date(year, 0, 1)
    const lastDay = new Date(year, 11, 31)
    const startStr = this.formatDate(firstDay)
    const endStr = this.formatDate(lastDay)
    return await this.loadLogsForDateRange(startStr, endStr)
  }

  /**
   * 获取当前内存中已缓存的所有日志条目
   */
  public getAllCachedLogs(): TimeLog[] {
    let all: TimeLog[] = []
    this.cache.forEach((logs) => {
      all = all.concat(logs)
    })
    return all
  }

  /**
   * Load logs for a week starting at weekStartDate (Monday) or 7-day span
   */
  public async loadLogsForWeek(startDate: Date): Promise<{ allLogs: TimeLog[], dayMap: Record<string, TimeLog[]> }> {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    return await this.loadLogsForDateRange(this.formatDate(startDate), this.formatDate(endDate))
  }

  public async loadWeekLogs(): Promise<TimeLog[]> {
    let allLogs: TimeLog[] = []
    // Load logs from 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const dateStr = this.getDateStringFromDaysAgo(i)
      const logs = await this.loadLogsForDate(dateStr)
      allLogs = allLogs.concat(logs)
    }
    return allLogs
  }

  public async saveTodayLogs(logs: TimeLog[]): Promise<void> {
    const dateStr = this.getTodayString()
    const filename = `${dateStr}.json`
    this.cache.set(dateStr, logs)
    await this.plugin.saveData(filename, logs)
  }

  public async appendLog(log: TimeLog): Promise<void> {
    const isMobile = (this.plugin as any)?.isMobile ?? false
    if (!log.device) {
      log.device = isMobile ? 'mobile' : 'desktop'
    }
    const dateStr = this.getDateStringFromTimestamp(log.startTime)
    const filename = isMobile ? `${dateStr}_mobile.json` : `${dateStr}.json`
    const logs = await this.loadLogsByFile(filename, { strict: true })
    const updatedLogs = [...logs, log]
    const result: unknown = await this.plugin.saveData(filename, updatedLogs)
    // 宿主版本可能返回 void；只有明确的非零响应码才判定为保存失败。
    if (result && typeof result === 'object' && 'code' in result
      && typeof result.code === 'number' && result.code !== 0) {
      throw new Error(`Failed to save data to ${filename}: code ${result.code}`)
    }
    
    // 更新内存缓存并去重排序
    const currentCached = this.cache.get(dateStr) || []
    const map = new Map<string, TimeLog>()
    for (const item of currentCached) {
      if (item?.id) map.set(item.id, item)
    }
    map.set(log.id, log)
    this.cache.set(dateStr, Array.from(map.values()).sort((a, b) => a.startTime - b.startTime))
  }

  public async loadLogsByFile(filename: string, options?: { strict?: boolean }): Promise<TimeLog[]> {
    try {
      const data = await this.plugin.loadData(filename)
      if (Array.isArray(data)) return data
      // loadData 在正常无文件时可返回空串，不能把它当作读取失败。
      if (data === null || data === undefined || data === '') return []
      throw new Error(`Invalid log data format in ${filename}: expected an array`)
    } catch (e) {
      Logger.error(`Failed to load data from ${filename}`, e)
      if (options?.strict) throw e
      return []
    }
  }

  public getDateStringFromTimestamp(timestamp: number): string {
    return this.formatDate(new Date(timestamp))
  }

  public getDateStringFromDaysAgo(daysAgo: number): string {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return this.formatDate(d)
  }

  public async saveLogsForDate(dateStr: string, logs: TimeLog[]): Promise<void> {
    const isMobile = (this.plugin as any)?.isMobile ?? false
    const filename = isMobile ? `${dateStr}_mobile.json` : `${dateStr}.json`
    this.cache.set(dateStr, logs)
    await this.plugin.saveData(filename, logs)
  }

  public async deleteLog(dateStr: string, logId: string): Promise<boolean> {
    const primaryFile = `${dateStr}.json`
    const mobileFile = `${dateStr}_mobile.json`
    const [primaryLogs, mobileLogs] = await Promise.all([
      this.loadLogsByFile(primaryFile),
      this.loadLogsByFile(mobileFile)
    ])
    let deleted = false
    const filteredPrimary = primaryLogs.filter((l) => l.id !== logId)
    if (filteredPrimary.length !== primaryLogs.length) {
      await this.plugin.saveData(primaryFile, filteredPrimary)
      deleted = true
    }
    const filteredMobile = mobileLogs.filter((l) => l.id !== logId)
    if (filteredMobile.length !== mobileLogs.length) {
      await this.plugin.saveData(mobileFile, filteredMobile)
      deleted = true
    }
    if (deleted) {
      const map = new Map<string, TimeLog>()
      for (const item of filteredPrimary) {
        if (item?.id) map.set(item.id, item)
      }
      for (const item of filteredMobile) {
        if (item?.id) map.set(item.id, item)
      }
      this.cache.set(dateStr, Array.from(map.values()).sort((a, b) => a.startTime - b.startTime))
      return true
    }
    return false
  }

  /**
   * 清理内存中的日志缓存（在数据同步或外部改写时调用）
   */
  public clearCache(): void {
    this.cache.clear()
  }
}

