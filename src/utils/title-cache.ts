import { ref } from 'vue';
import { fetchSyncPost } from 'siyuan';
import { getBlockByID } from '../api';
import Logger from './logger';

export const docTitles = ref<Record<string, string>>({});

// 记录正在排队或请求中的 docId，防止并发重复请求
const pendingDocIds = new Set<string>();
let batchQueue: string[] = [];
let batchTimer: any = null;

async function flushBatch() {
  if (batchQueue.length === 0) return;
  const currentBatch = [...new Set(batchQueue)];
  batchQueue = [];

  try {
    // 构建 SQL 批量查询，最多 100 条一组
    const CHUNK_SIZE = 100;
    for (let i = 0; i < currentBatch.length; i += CHUNK_SIZE) {
      const chunk = currentBatch.slice(i, i + CHUNK_SIZE);
      const idList = chunk.map((id) => `'${id.replace(/'/g, '')}'`).join(', ');
      const stmt = `SELECT id, content FROM blocks WHERE id IN (${idList})`;

      const res: any = await fetchSyncPost('/api/query/sql', { stmt });
      const foundIds = new Set<string>();
      if (res && res.code === 0 && Array.isArray(res.data)) {
        for (const row of res.data) {
          if (row && row.id) {
            docTitles.value[row.id] = row.content || row.id;
            foundIds.add(row.id);
          }
        }
      }

      // 未匹配到的文档块回退或降级
      for (const id of chunk) {
        if (!foundIds.has(id)) {
          try {
            const block = await getBlockByID(id);
            docTitles.value[id] = block?.content || id;
          } catch {
            docTitles.value[id] = id;
          }
        }
        pendingDocIds.delete(id);
      }
    }
  } catch (err) {
    Logger.error('Failed to batch fetch titles via SQL:', err);
    // 发生异常时单条降级兜底
    for (const id of currentBatch) {
      try {
        const block = await getBlockByID(id);
        docTitles.value[id] = block?.content || id;
      } catch {
        docTitles.value[id] = id;
      }
      pendingDocIds.delete(id);
    }
  }
}

/**
 * 异步批量请求一组文档标题（高频循环外优先使用）
 */
export async function fetchDocTitles(docIds: string[]): Promise<void> {
  const neededIds = docIds.filter((id) => id && !docTitles.value[id] && !pendingDocIds.has(id));
  if (neededIds.length === 0) return;

  neededIds.forEach((id) => {
    pendingDocIds.add(id);
    batchQueue.push(id);
  });

  if (batchTimer) clearTimeout(batchTimer);
  await flushBatch();
}

/**
 * 请求单个文档标题（自动在 10ms 窗口内合并防抖为单次批量 SQL 查询）
 */
export async function fetchDocTitle(docId: string): Promise<void> {
  if (!docId || docTitles.value[docId] || pendingDocIds.has(docId)) return;

  pendingDocIds.add(docId);
  batchQueue.push(docId);

  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    flushBatch();
  }, 10);
}
