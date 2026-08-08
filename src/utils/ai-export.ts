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

        if (logs.length === 0) {
            return `# ⏱️ 源时记 · 专注与时间复盘报告 (${scopeTitle} - ${scopeLabel})\n\n该统计周期内暂无活动记录。`;
        }

        const totalSeconds = logs.reduce((acc, log) => acc + log.duration, 0);
        const totalIdle = logs.reduce((acc, log) => acc + log.idleTime, 0);

        // Aggregate by document
        const aggregated: Record<string, { duration: number, sessions: number }> = {};
        logs.forEach(log => {
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
        md += `- **专注会话总数**: ${logs.length} 次\n`;
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
        md += `> "你是一位高效能个人时间管理与深度工作教练。以上是我在思源笔记中使用【源时记】记录的【${scopeTitle}】(${scopeLabel})时间投入数据。请根据我的专注时长分布、文档投入比例和会话频次进行深度复盘：\n`;
        md += `> 1. 分析我的时间分配是否存在碎片化或偏离核心目标的情况；\n`;
        md += `> 2. 评估我的专注节奏与深度工作效率；\n`;
        md += `> 3. 为我接下来的时间规划提供 3 条可立即落地的优化建议。"\n`;

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
