/**
 * 轻量安全的 Markdown 渲染器
 * 将基础 Markdown 语法转换为带有 Tailwind 暗黑风格类名的 HTML
 */
export function renderMarkdown(md: string): string {
  if (!md) return "";

  // 1. 转义基础 HTML 特殊字符，防 XSS
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. 代码块处理 ```lang ... ```
  const codeBlocks: string[] = [];
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(
      `<pre class="my-3 p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl overflow-x-auto text-xs font-mono text-cyan-200"><code>${code.trim()}</code></pre>`
    );
    return placeholder;
  });

  // 3. 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 mx-0.5 bg-gray-800 text-indigo-300 rounded text-xs font-mono">$1</code>');

  // 4. 标题处理 (# 到 ######)
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="text-xs font-bold text-gray-300 mt-3 mb-1.5 flex items-center gap-1.5">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="text-sm font-bold text-gray-200 mt-3.5 mb-1.5 flex items-center gap-1.5">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="text-sm font-semibold text-gray-100 mt-4 mb-2 flex items-center gap-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-bold text-white mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-indigo-200 mt-5 mb-2.5 pb-1 border-b border-gray-800/80 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-indigo-500"></span>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-black text-white mt-4 mb-3 pb-1.5 border-b border-gray-800">$1</h1>');

  // 5. 引用块 (> quote)
  html = html.replace(/^\&gt;\s+(.+)$/gm, '<blockquote class="border-l-4 border-indigo-500/80 pl-3.5 py-1.5 my-2.5 bg-indigo-950/30 rounded-r-lg text-sm text-gray-300 italic">$1</blockquote>');

  // 6. 表格处理 (简单表格)
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableMatch) => {
    const lines = tableMatch.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return tableMatch;

    let tableHtml = '<div class="overflow-x-auto my-3.5"><table class="w-full text-xs text-left border-collapse border border-gray-800 rounded-lg overflow-hidden">';
    let hasHeader = false;

    lines.forEach((line, idx) => {
      // 检查是否为分隔行 | --- | --- |
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        hasHeader = true;
        return;
      }

      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      if (idx === 0) {
        tableHtml += '<thead class="bg-gray-800/90 text-gray-200 uppercase font-semibold"><tr>';
        cells.forEach(c => {
          tableHtml += `<th class="px-3 py-2 border-b border-gray-700">${c}</th>`;
        });
        tableHtml += '</tr></thead><tbody class="divide-y divide-gray-800/80">';
      } else {
        tableHtml += '<tr class="hover:bg-gray-800/40 transition-colors">';
        cells.forEach(c => {
          tableHtml += `<td class="px-3 py-2 text-gray-300 border-b border-gray-800/60">${c}</td>`;
        });
        tableHtml += '</tr>';
      }
    });

    if (hasHeader) {
      tableHtml += '</tbody>';
    }
    tableHtml += '</table></div>';
    return tableHtml;
  });

  // 7. 加粗与斜体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-indigo-300">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-200">$1</em>');

  // 8. 无序列表与有序列表
  // 无序列表
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="flex items-start gap-2 my-1 text-sm text-gray-300"><span class="text-indigo-400 mt-1 select-none">•</span><span>$1</span></li>');
  // 有序列表
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="flex items-start gap-2 my-1 text-sm text-gray-300"><span class="text-cyan-400 font-mono text-xs mt-0.5 font-bold select-none">$1.</span><span>$2</span></li>');

  // 9. 段落与换行
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return "";
    // 如果已经带有块级元素标签，不再包裹 <p>
    if (/^<(h[1-6]|div|table|blockquote|pre|li)/i.test(p)) {
      return p;
    }
    return `<p class="my-2 leading-relaxed text-sm text-gray-300">${p.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n");

  // 10. 还原代码块
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`__CODE_BLOCK_${idx}__`, block);
  });

  return html;
}
