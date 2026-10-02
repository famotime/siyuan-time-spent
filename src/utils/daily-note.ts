import { sql, appendBlock, updateBlock, lsNotebooks, createDocWithMd } from '../api';
import type { TimeLog } from '../models/TimeLog';
import { docTitles } from './title-cache';
import { formatDurationI18n, currentLang } from '../i18n';
import Logger from './logger';

export class DailyNoteArchiver {
  /**
   * 自动探测或创建今日日记文档 ID
   */
  public static async findOrCreateTodayDailyDoc(dateStr: string): Promise<{ docId: string; notebookId: string } | null> {
    try {
      // 1. 尝试通过 SQL 查询路径中包含当前日期的文档块 (type='d')
      const queryStmt = `SELECT id, box, root_id, hpath FROM blocks WHERE type='d' AND (hpath LIKE '%${dateStr}%' OR content LIKE '%${dateStr}%') ORDER BY updated DESC LIMIT 1`;
      const rows = await sql(queryStmt);
      if (rows && rows.length > 0 && rows[0].id) {
        return { docId: rows[0].id, notebookId: rows[0].box };
      }

      // 2. 如果未找到现有日记，获取第一个可用的笔记本，创建今日日记文档
      const notebooksRes = await lsNotebooks();
      const notebooks = notebooksRes?.notebooks || [];
      const openNotebook = notebooks.find(nb => !nb.closed) || notebooks[0];
      if (!openNotebook) {
        Logger.error('No open notebook available for Daily Note archiving');
        return null;
      }

      const docPath = `/Daily Notes/${dateStr}`;
      const initialMd = `# ${dateStr}\n\n`;
      const newDocId = await createDocWithMd(openNotebook.id, docPath, initialMd);
      if (newDocId) {
        return { docId: newDocId, notebookId: openNotebook.id };
      }
      return null;
    } catch (e) {
      Logger.error('Failed to find or create Daily Note:', e);
      return null;
    }
  }

  /**
   * 生成精炼的今日专注轨迹摘要 Markdown 折叠块
   */
  public static buildSummaryMarkdown(logs: TimeLog[], dateStr: string): string {
    const isEn = currentLang.value === 'en_US';
    const safeLogs = logs || [];
    const totalSeconds = safeLogs.reduce((acc, log) => acc + log.duration, 0);
    const totalIdle = safeLogs.reduce((acc, log) => acc + log.idleTime, 0);
    const pomodoroLogs = safeLogs.filter(log => log.isPomodoro || log.type === 'pomodoro');

    // 聚合文档
    const aggregated: Record<string, { duration: number; sessions: number }> = {};
    safeLogs.forEach(log => {
      const title = docTitles.value[log.docId] || log.docId || (isEn ? 'Unknown Note' : '未知文档');
      if (!aggregated[title]) {
        aggregated[title] = { duration: 0, sessions: 0 };
      }
      aggregated[title].duration += log.duration;
      aggregated[title].sessions += 1;
    });

    const sortedDocs = Object.entries(aggregated).sort((a, b) => b[1].duration - a[1].duration);
    const topDocs = sortedDocs.slice(0, 5);

    const titlePrefix = isEn ? "Time Spent · Today's Focus Summary" : "源时记 · 今日专注轨迹摘要";
    const netFocusLabel = isEn ? "Net Focus Time" : "净专注时长";
    const totalSessionsLabel = isEn ? "Total Sessions" : "专注会话";
    const pomodoroLabel = isEn ? "Pomodoros" : "达成番茄";
    const idleFilteredLabel = isEn ? "Idle Filtered" : "离桌去水";
    const coreDocsLabel = isEn ? "Core Documents" : "核心主攻文档";
    const footerNote = isEn ? "Auto-archived by Time Spent" : "由「源时记」自动沉淀";

    let md = `{{{row\n`;
    md += `{: custom-time-spent-summary="true"}\n`;
    md += `### ⏱️ ${titlePrefix} (${dateStr})\n\n`;
    md += `- **${netFocusLabel}**: ${formatDurationI18n(totalSeconds, isEn ? 'en_US' : 'zh_CN')}\n`;
    md += `- **${totalSessionsLabel}**: ${safeLogs.length} ${isEn ? 'times' : '次'} | **${pomodoroLabel}**: ${pomodoroLogs.length} ${isEn ? '' : '个'} | **${idleFilteredLabel}**: ${formatDurationI18n(totalIdle, isEn ? 'en_US' : 'zh_CN')}\n\n`;

    if (topDocs.length > 0) {
      md += `#### ${coreDocsLabel}\n`;
      topDocs.forEach(([title, stat], idx) => {
        const pct = totalSeconds > 0 ? Math.round((stat.duration / totalSeconds) * 100) : 0;
        md += `${idx + 1}. **${title}**：${formatDurationI18n(stat.duration, isEn ? 'en_US' : 'zh_CN')} (${pct}%)\n`;
      });
      md += `\n`;
    }

    md += `> *${footerNote}*\n`;
    md += `}}}`;

    return md;
  }

  /**
   * 执行归档或更新到今日日记
   */
  public static async archiveToDailyNote(logs: TimeLog[], dateStr: string): Promise<boolean> {
    try {
      const dailyDoc = await this.findOrCreateTodayDailyDoc(dateStr);
      if (!dailyDoc || !dailyDoc.docId) {
        return false;
      }

      const summaryMd = this.buildSummaryMarkdown(logs, dateStr);

      // 检查是否已有历史生成的折叠块
      const checkStmt = `SELECT id FROM blocks WHERE root_id='${dailyDoc.docId}' AND ial LIKE '%custom-time-spent-summary="true"%' LIMIT 1`;
      const existingBlocks = await sql(checkStmt);

      if (existingBlocks && existingBlocks.length > 0 && existingBlocks[0].id) {
        // 原地更新已存在的摘要块，避免重复
        Logger.log('Updating existing daily note summary block:', existingBlocks[0].id);
        await updateBlock('markdown', summaryMd, existingBlocks[0].id);
      } else {
        // 追加至日记末尾
        Logger.log('Appending daily note summary block to doc:', dailyDoc.docId);
        await appendBlock('markdown', summaryMd, dailyDoc.docId);
      }

      return true;
    } catch (e) {
      Logger.error('Failed to archive to daily note:', e);
      return false;
    }
  }
}
