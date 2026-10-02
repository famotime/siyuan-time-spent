import type { Ref } from 'vue'
import { onUnmounted } from 'vue'

export interface ShortcutHandlers {
  onTogglePanel: () => void
  onClosePanel: () => void
  onTogglePause: () => void
  isPanelTarget?: (target: Node | null) => boolean
}

function isEditable(target: Element | null): boolean {
  return !!target?.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), .protyle',
  )
}

export function usePomodoroShortcuts(
  enabled: Ref<boolean>,
  isOpen: Ref<boolean>,
  handlers: ShortcutHandlers,
): { dispose: () => void } {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat) return
    const target = event.target instanceof Element ? event.target : null
    const inPanel = handlers.isPanelTarget
      ? handlers.isPanelTarget(target)
      : true
    if (event.key === 'Escape' && isOpen.value && inPanel) {
      event.preventDefault()
      handlers.onClosePanel()
      return
    }
    if (!enabled.value || isEditable(target)) return
    if (
      event.altKey
      && !event.ctrlKey
      && !event.metaKey
      && event.key.toLowerCase() === 'p'
    ) {
      event.preventDefault()
      handlers.onTogglePanel()
      return
    }
    if (
      !isOpen.value
      || !inPanel
      || event.altKey
      || event.ctrlKey
      || event.metaKey
    ) {
      return
    }
    if (
      (event.key === ' ' || event.code === 'Space')
      && !target?.closest('button, a, summary, [role="button"], [role="slider"]')
    ) {
      event.preventDefault()
      handlers.onTogglePause()
    }
  }
  window.addEventListener('keydown', onKeyDown)
  const dispose = () => window.removeEventListener('keydown', onKeyDown)
  onUnmounted(dispose)
  return { dispose }
}
