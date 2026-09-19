import { TimeLog } from '../models/TimeLog';
import { docTitles } from './title-cache';

export class AIExportManager {
    public static generateMarkdownSummary(
        logs: TimeLog[], 
        scopeTitle: string, 
        scopeType: 'day' | 'week' | 'month' = 'day'
    ): string {
        const scopeLabels: Record<string, string> = {
            day: '今日 / 单日',
            week: '本周 / 周度',
            month: '本月 / 月度'
        };
        const scopeLabel = scopeLabels[scopeType] || '时间追踪';
        const safeLogs = logs || [];

        if (safeLogs.length === 0) {
            return `# ⏱️ 源时记 · 专注与时间复盘报告 (${scopeTitle} - ${scopeLabel})\n\n该统计周期内暂无活动记录。`;
        }

        const totalSeconds = safeLogs.reduce((acc, log) => acc + log.duration, 0);
        const totalIdle = safeLogs.reduce((acc, log) => acc + log.idleTime, 0);

        // Aggregate by document
        const aggregated: Record<string, { duration: number, sessions: number }> = {};
        safeLogs.forEach(log => {
            const title = docTitles.value[log.docId] || log.docId || '未知文档';
            if (!aggregated[title]) {
                aggregated[title] = { duration: 0, sessions: 0 };
            }
            aggregated[title].duration += log.duration;
            aggregated[title].sessions += 1;
        });

        const sortedDocs = Object.entries(aggregated).sort((a, b) => b[1].duration - a[1].duration);
        const topDoc = sortedDocs.length > 0 ? sortedDocs[0] : null;

        let md = `# 📊 源时记 · 深度工作与时间复盘报告 (${scopeTitle})\n\n`;
        md += `**统计维度**: ${scopeLabel}\n\n`;
        
        md += `## 1. 核心概览 (Overview)\n`;
        md += `- **总专注时长**: ${this.formatDuration(totalSeconds)}\n`;
        md += `- **专注会话总数**: ${safeLogs.length} 次\n`;
        md += `- **闲置扣除时长**: ${this.formatDuration(totalIdle)}\n`;
        if (topDoc) {
            const percent = totalSeconds > 0 ? Math.round((topDoc[1].duration / totalSeconds) * 100) : 0;
            md += `- **主要专注文档**: ${topDoc[0]} (${this.formatDuration(topDoc[1].duration)}, 占比 ${percent}%)\n`;
        }
        md += `\n`;

        md += `## 2. 文档分布详情 (Document Distribution)\n`;
        md += `| 文档名称 | 专注时长 | 会话次数 | 占比 |\n`;
        md += `| :--- | :--- | :--- | :--- | \n`;
        sortedDocs.forEach(([docName, stats]) => {
            const pct = totalSeconds > 0 ? ((stats.duration / totalSeconds) * 100).toFixed(1) : '0';
            md += `| ${docName} | ${this.formatDuration(stats.duration)} | ${stats.sessions} 次 | ${pct}% |\n`;
        });
        md += `\n`;

        md += `## 3. 智能分析提示词 (Prompt for AI Coach)\n`;
        md += `> "你是一位专注效率与深度工作教练。根据以上【源时记】在【${scopeTitle}】(${scopeLabel})记录的专注数据，请极其精练、直击要点地提供复盘（严禁寒暄废话，控制在300字内）：\n`;
        md += `> 1. 核心专注亮点与碎片化诊断（2条简短要点）；\n`;
        md += `> 2. 下一步针对性改进建议（2~3条具体行动，每条不超过两句话）。"\n`;

        return md;
    }

    private static formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}小时 ${m}分钟`;
        if (m > 0) return `${m}分钟 ${s}秒`;
        return `${s}秒`;
    }
}
