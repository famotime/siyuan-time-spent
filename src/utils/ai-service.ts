import type TimeSpentPlugin from "../index";
import type { TimeLog } from "../models/TimeLog";
import { AIExportManager } from "./ai-export";
import { docTitles } from "./title-cache";
import Logger from "./logger";

export interface AISummaryRequestOptions {
  plugin: TimeSpentPlugin;
  logs: TimeLog[];
  scopeTitle: string;
  scopeType: "day" | "week" | "month";
  focusGoal?: string;
  signal?: AbortSignal;
  onChunk?: (delta: string, accumulated: string) => void;
}

export class AIService {
  /**
   * 规范化 OpenAI 兼容的 chat/completions URL
   */
  public static normalizeEndpoint(baseUrl: string): string {
    let url = (baseUrl || "").trim().replace(/\/+$/, "");
    if (!url) return "https://api.openai.com/v1/chat/completions";

    if (url.endsWith("/chat/completions")) {
      return url;
    }
    if (url.endsWith("/v1")) {
      return `${url}/chat/completions`;
    }
    return `${url}/v1/chat/completions`;
  }

  /**
   * 生成精炼高效的时间复盘 Prompt
   */
  public static buildPrompt(
    logs: TimeLog[],
    scopeTitle: string,
    scopeType: "day" | "week" | "month",
    focusGoal?: string
  ): { systemPrompt: string; userPrompt: string } {
    const safeLogs = logs || [];
    const scopeLabels: Record<string, string> = {
      day: "今日",
      week: "本周",
      month: "本月",
    };
    const scopeLabel = scopeLabels[scopeType] || "统计周期";

    const totalSeconds = safeLogs.reduce((acc, log) => acc + log.duration, 0);
    const totalIdle = safeLogs.reduce((acc, log) => acc + log.idleTime, 0);

    // 聚合文档投入并取前 5 项
    const aggregated: Record<string, { duration: number; sessions: number }> = {};
    safeLogs.forEach((log) => {
      const title = docTitles.value[log.docId] || log.docId || "未知文档";
      if (!aggregated[title]) {
        aggregated[title] = { duration: 0, sessions: 0 };
      }
      aggregated[title].duration += log.duration;
      aggregated[title].sessions += 1;
    });

    const sortedDocs = Object.entries(aggregated).sort((a, b) => b[1].duration - a[1].duration);
    const topDocs = sortedDocs.slice(0, 5);

    let statsText = `【统计周期】: ${scopeTitle} (${scopeLabel})\n`;
    statsText += `- 总专注时长: ${this.formatDuration(totalSeconds)}，会话次数: ${safeLogs.length} 次，闲置扣除: ${this.formatDuration(totalIdle)}\n`;
    if (topDocs.length > 0) {
      statsText += `- 核心投入文档 (Top ${topDocs.length}):\n`;
      topDocs.forEach(([name, s]) => {
        const pct = totalSeconds > 0 ? ((s.duration / totalSeconds) * 100).toFixed(0) : "0";
        statsText += `  • ${name}: ${this.formatDuration(s.duration)} (${pct}%, ${s.sessions}次会话)\n`;
      });
    }

    const systemPrompt = `你是一位高效专注与深度工作复盘教练。
你的任务是对用户的笔记专注数据给出短小精悍、直击本质的复盘与建议。
原则：
1. 语言极其精炼、干货直接，严禁寒暄客套、废话与无意义铺垫；
2. 严禁冗长长篇段落和大段复述数据，全篇严格控制在 200~350 字以内；
3. 输出格式必须为清晰紧凑的 Markdown 结构与简短要点（Bullet points）。`;

    let userPrompt = `${statsText}\n`;

    if (focusGoal && focusGoal.trim()) {
      userPrompt += `【用户设定的专注目标】: ${focusGoal.trim()}\n\n`;
      userPrompt += `请直接按以下 3 个模块给出极其精简的复盘（拒绝套话，直奔主题）：
### 🎯 目标达成度评估
（用 1~2 句话直接评估推进节奏与完成情况）

### 🔍 关键专注洞察
（给出 2 条精练要点，指出最核心的时间去向及碎片化/心流状况）

### 💡 改进建议
（给出 2~3 条可立即执行的具体动作，每条不超过两句话）`;
    } else {
      userPrompt += `请直接按以下 3 个模块给出极其精简的复盘（拒绝套话，直奔主题）：
### ⚡ 效率概览
（用 1~2 句话指出当前周期投入核心亮点）

### 🔍 关键专注洞察
（给出 2 条精练要点，指出精力聚焦度及是否存在注意力碎片化）

### 💡 行动建议
（给出 2~3 条精简可落地的动作建议，每条不超过两句话）`;
    }

    return { systemPrompt, userPrompt };
  }

  private static formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}小时${m > 0 ? ` ${m}分钟` : ""}`;
    if (m > 0) return `${m}分钟`;
    return `${s}秒`;
  }

  /**
   * 发送请求给大模型服务并获取总结，支持流式 SSE 逐字返回
   */
  public static async generateSummary(options: AISummaryRequestOptions): Promise<string> {
    const { plugin, logs, scopeTitle, scopeType, focusGoal, signal, onChunk } = options;

    const config = plugin.getActiveAiConfig();
    const apiKey = (config.apiKey || "").trim();
    const baseUrl = (config.baseUrl || "").trim();
    const model = (config.model || "").trim() || "gpt-4o";
    const temperature = typeof config.temperature === "number" ? config.temperature : 0.7;
    const maxTokens = typeof config.maxTokens === "number" ? config.maxTokens : 4096;
    const timeoutSeconds = config.requestTimeoutSeconds ?? 30;

    // 检查 API Key 与 BaseUrl 是否存在
    if (!apiKey) {
      throw new Error("NO_API_KEY");
    }
    if (!baseUrl) {
      throw new Error("NO_BASE_URL");
    }

    const endpoint = this.normalizeEndpoint(baseUrl);
    const { systemPrompt, userPrompt } = this.buildPrompt(logs, scopeTitle, scopeType, focusGoal);

    // 超时控制
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutSeconds * 1000);

    // 组合外部 signal
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errDetail = "";
        try {
          const errJson = await response.json();
          errDetail = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errDetail = await response.text();
        }
        throw new Error(`HTTP ${response.status}: ${errDetail || response.statusText}`);
      }

      // 处理流式响应
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                accumulated += delta;
                if (onChunk) {
                  onChunk(delta, accumulated);
                }
              }
            } catch (err) {
              // 忽略解析中间未闭合包的错误
            }
          }
        }

        if (accumulated.trim()) {
          return accumulated;
        }
      }

      // 如果未进入流式或流式为空，尝试 fallback 读取 json
      const fallbackData = await response.json();
      const content = fallbackData.choices?.[0]?.message?.content || "";
      if (onChunk && content) {
        onChunk(content, content);
      }
      return content;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`请求超时（限制 ${timeoutSeconds} 秒）或已被手动取消`);
      }
      Logger.error("[siyuan-time-spent] AI Summary request failed:", err);
      throw err;
    }
  }
}
