import { ref } from 'vue';
import { fetchSyncPost } from 'siyuan';
import { getBlockByID } from '../api';
import Logger from './logger';

export interface DocMetaInfo {
  id: string;
  title: string;
  box: string;
  notebookName: string;
  hpath: string;
  tags: string[];
}

export const docTitles = ref<Record<string, string>>({});
export const docMetas = ref<Record<string, DocMetaInfo>>({});
export const notebookNames = ref<Record<string, string>>({});

let hasLoadedNotebooks = false;

/**
 * 缓存所有笔记本的 ID 与名称映射
 */
export async function loadNotebooks(): Promise<void> {
  if (hasLoadedNotebooks) return;
  try {
    const res: any = await fetchSyncPost('/api/notebook/lsNotebooks', {});
    if (res && res.code === 0 && res.data && Array.isArray(res.data.notebooks)) {
      for (const nb of res.data.notebooks) {
        if (nb && nb.id) {
          notebookNames.value[nb.id] = nb.name || nb.id;
        }
      }
      hasLoadedNotebooks = true;
    }
  } catch (err) {
    Logger.error('Failed to load notebooks:', err);
  }
}

/**
 * 解析思源笔记中存储的 tag 字符串为干净的标签数组
 */
export function parseTags(tagStr?: string): string[] {
  if (!tagStr) return [];
  return tagStr
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+|#+$/g, '').trim())
    .filter(Boolean);
}

// 记录正在排队或请求中的 docId，防止并发重复请求
const pendingDocIds = new Set<string>();
let batchQueue: string[] = [];
let batchTimer: any = null;

async function flushBatch() {
  if (batchQueue.length === 0) return;
  const currentBatch = [...new Set(batchQueue)];
  batchQueue = [];

  try {
    await loadNotebooks();

    // 构建 SQL 批量查询，包含 box (笔记本)、hpath (层级路径) 和 tag (标签)
    const CHUNK_SIZE = 100;
    for (let i = 0; i < currentBatch.length; i += CHUNK_SIZE) {
      const chunk = currentBatch.slice(i, i + CHUNK_SIZE);
      const idList = chunk.map((id) => `'${id.replace(/'/g, '')}'`).join(', ');
      const stmt = `SELECT id, content, box, hpath, tag FROM blocks WHERE id IN (${idList})`;

      const res: any = await fetchSyncPost('/api/query/sql', { stmt });
      const foundIds = new Set<string>();
      if (res && res.code === 0 && Array.isArray(res.data)) {
        for (const row of res.data) {
          if (row && row.id) {
            const title = row.content || row.id;
            const boxId = row.box || '';
            const nbName = notebookNames.value[boxId] || boxId || '默认笔记本';
            const hpath = row.hpath || '';
            const tags = parseTags(row.tag);

            docTitles.value[row.id] = title;
            docMetas.value[row.id] = {
              id: row.id,
              title,
              box: boxId,
              notebookName: nbName,
              hpath,
              tags,
            };
            foundIds.add(row.id);
          }
        }
      }

      // 未匹配到的文档块回退或降级
      for (const id of chunk) {
        if (!foundIds.has(id)) {
          try {
            const block = await getBlockByID(id);
            const title = block?.content || id;
            const boxId = block?.box || '';
            const nbName = notebookNames.value[boxId] || boxId || '默认笔记本';
            const hpath = block?.hpath || '';
            const tags = parseTags((block as any)?.tag);

            docTitles.value[id] = title;
            docMetas.value[id] = {
              id,
              title,
              box: boxId,
              notebookName: nbName,
              hpath,
              tags,
            };
          } catch {
            docTitles.value[id] = id;
            docMetas.value[id] = {
              id,
              title: id,
              box: '',
              notebookName: '未知笔记本',
              hpath: '',
              tags: [],
            };
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
        const title = block?.content || id;
        const boxId = block?.box || '';
        const nbName = notebookNames.value[boxId] || boxId || '默认笔记本';
        const hpath = block?.hpath || '';
        const tags = parseTags((block as any)?.tag);

        docTitles.value[id] = title;
        docMetas.value[id] = {
          id,
          title,
          box: boxId,
          notebookName: nbName,
          hpath,
          tags,
        };
      } catch {
        docTitles.value[id] = id;
        docMetas.value[id] = {
          id,
          title: id,
          box: '',
          notebookName: '未知笔记本',
          hpath: '',
          tags: [],
        };
      }
      pendingDocIds.delete(id);
    }
  }
}

/**
 * 异步批量请求一组文档标题与元数据（高频循环外优先使用）
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
 * 请求单个文档标题与元数据（自动在 10ms 窗口内合并防抖为单次批量 SQL 查询）
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

/**
 * 获取文档元数据
 */
export function getDocMeta(docId: string): DocMetaInfo {
  return (
    docMetas.value[docId] || {
      id: docId,
      title: docTitles.value[docId] || docId,
      box: '',
      notebookName: '其他/未知',
      hpath: '',
      tags: [],
    }
  );
}
