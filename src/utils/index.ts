import { createApp } from 'vue';

export function getDomByVueComponent(component: any) {
  const div = document.createElement('div');
  const app = createApp(component);
  app.mount(div);
  return div;
}

export function openSiYuanDoc(docId: string): void {
  if (!docId) return;
  const url = `siyuan://blocks/${docId}`;
  if (typeof (window as any).openFileByURL === 'function') {
    (window as any).openFileByURL(url);
  } else {
    window.open(url);
  }
}
