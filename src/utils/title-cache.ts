import { ref } from 'vue';
import { getBlockByID } from '../api';
import Logger from './logger';

export const docTitles = ref<Record<string, string>>({});

export async function fetchDocTitle(docId: string) {
    if (docTitles.value[docId]) return;
    try {
        const block = await getBlockByID(docId);
        if (block && block.content) {
            docTitles.value[docId] = block.content;
        } else {
            docTitles.value[docId] = docId;
        }
    } catch (e) {
        Logger.error("Failed to fetch title for doc", docId, e);
        docTitles.value[docId] = docId;
    }
}
