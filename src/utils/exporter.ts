import type { TimeLog } from '../models/TimeLog';
import { getDocMeta } from './title-cache';
import { t, formatDurationI18n, currentLang } from '../i18n';

export interface ExportableTimeRecord {
  id: string;
  docId: string;
  title: string;
  notebook: string;
  path: string;
  tags: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  durationFormatted: string;
  idleTimeSeconds: number;
}

export class Exporter {
  /**
   * 将 TimeLog 列表转换为包含元数据的扁平化结构
   */
  public static transformLogs(logs: TimeLog[]): ExportableTimeRecord[] {
    const isEn = currentLang.value === 'en_US';
    return (logs || []).map((log) => {
      const meta = getDocMeta(log.docId);
      const startDate = new Date(log.startTime);
      const endDate = new Date(log.endTime);
      const tagsStr = (meta.tags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');

      return {
        id: log.id,
        docId: log.docId,
        title: meta.title || log.docId,
        notebook: meta.notebookName || (isEn ? 'Uncategorized' : '未知笔记本'),
        path: meta.hpath || '',
        tags: tagsStr,
        startTime: this.formatDateTime(startDate),
        endTime: this.formatDateTime(endDate),
        durationSeconds: log.duration,
        durationFormatted: this.formatDuration(log.duration),
        idleTimeSeconds: log.idleTime || 0,
      };
    });
  }

  /**
   * 导出为 JSON 文件并触发下载
   */
  public static exportToJson(logs: TimeLog[], filename = 'siyuan-time-spent.json') {
    const data = this.transformLogs(logs);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  /**
   * 导出为 CSV 文件并触发下载（添加 UTF-8 BOM，防止 Excel 打开中文乱码）
   */
  public static exportToCsv(logs: TimeLog[], filename = 'siyuan-time-spent.csv') {
    const data = this.transformLogs(logs);
    const headers = [
      t('csvRecordId'),
      t('csvDocId'),
      t('csvDocTitle'),
      t('csvNotebook'),
      t('csvDocPath'),
      t('csvDocTags'),
      t('csvStartTime'),
      t('csvEndTime'),
      t('csvDurationSeconds'),
      t('csvDurationFormatted'),
      t('csvIdleSeconds'),
    ];

    const rows = data.map((item) => {
      return [
        this.escapeCsvCell(item.id),
        this.escapeCsvCell(item.docId),
        this.escapeCsvCell(item.title),
        this.escapeCsvCell(item.notebook),
        this.escapeCsvCell(item.path),
        this.escapeCsvCell(item.tags),
        this.escapeCsvCell(item.startTime),
        this.escapeCsvCell(item.endTime),
        item.durationSeconds,
        this.escapeCsvCell(item.durationFormatted),
        item.idleTimeSeconds,
      ].join(',');
    });

    // \uFEFF 是 UTF-8 的 BOM 头，确保 Microsoft Excel 打开时不出现乱码
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  private static escapeCsvCell(cell: string): string {
    if (!cell) return '""';
    const escaped = cell.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private static formatDateTime(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private static formatDuration(seconds: number): string {
    return formatDurationI18n(seconds, currentLang.value);
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
