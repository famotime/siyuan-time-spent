import { TimeLog } from '../models/TimeLog';

export class AIExportManager {
    public static generateMarkdownSummary(logs: TimeLog[], dateStr: string): string {
        if (logs.length === 0) {
            return `# Time Spent Summary for ${dateStr}\n\nNo activity recorded on this day.`;
        }

        const totalSeconds = logs.reduce((acc, log) => acc + log.duration, 0);
        const totalIdle = logs.reduce((acc, log) => acc + log.idleTime, 0);

        // Aggregate by document
        const aggregated: Record<string, { duration: number, sessions: number }> = {};
        logs.forEach(log => {
            const docId = log.docId || 'Unknown Document';
            if (!aggregated[docId]) {
                aggregated[docId] = { duration: 0, sessions: 0 };
            }
            aggregated[docId].duration += log.duration;
            aggregated[docId].sessions += 1;
        });

        let md = `# Time Spent Summary for ${dateStr}\n\n`;
        md += `## Overview\n`;
        md += `- **Total Focused Time**: ${this.formatDuration(totalSeconds)}\n`;
        md += `- **Total Idle Time Deducted**: ${this.formatDuration(totalIdle)}\n\n`;

        md += `## Document Distribution\n`;
        Object.entries(aggregated)
            .sort((a, b) => b[1].duration - a[1].duration)
            .forEach(([docId, stats]) => {
                md += `- **${docId}**: ${this.formatDuration(stats.duration)} across ${stats.sessions} sessions\n`;
            });

        md += `\n## Prompt for AI Coach\n`;
        md += `> "You are an expert time management coach. Above is my time spent data for ${dateStr}. Please analyze my focus patterns, point out any fragmentation (e.g., too many short sessions on different documents), and give me actionable advice on how to improve my deep work for tomorrow."\n`;

        return md;
    }

    private static formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
}
