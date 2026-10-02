import { onUnmounted, type Ref } from 'vue';

export interface ShortcutHandlers {
  onTogglePanel: () => void;
  onClosePanel: () => void;
  onTogglePause: () => void;
}

/** 焦点落在可编辑区域时，绝不让快捷键劫持键盘 */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  // 思源正文编辑器容器
  return !!el.closest?.('.protyle');
}

/**
 * 番茄钟键盘驱动：Alt+P 开关面板、Space 暂停/继续、Esc 关闭
 * 必须在面板打开时才响应 Space，且严格规避编辑器焦点
 */
export function usePomodoroShortcuts(
  enabled: Ref<boolean>,
  isOpen: Ref<boolean>,
  handlers: ShortcutHandlers,
): { dispose: () => void } {
  const onKeyDown = (e: KeyboardEvent) => {
    if (!enabled.value) return;

    // Alt + P：全局开关面板，即使焦点在编辑器也可用
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      handlers.onTogglePanel();
      return;
    }

    if (!isOpen.value) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      handlers.onClosePanel();
      return;
    }

    // 空格：仅面板打开且焦点不在可编辑区域时暂停/继续
    if (e.key === ' ' || e.code === 'Space') {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      handlers.onTogglePause();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  const dispose = () => window.removeEventListener('keydown', onKeyDown);

  onUnmounted(dispose);
  return { dispose };
}
