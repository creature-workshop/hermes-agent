import { dismissTreePane, restoreTreePane } from '@/components/pane-shell/tree/store'
import { openPaneInNewWindow } from '@/store/windows'

/**
 * Pop a docked pane into its own OS window. The docked copy is dismissed —
 * not closed — once the window opens: `closeTreePane` on a plugin's only pane
 * disables the whole plugin, which would unload it from the pop-out as well.
 * On failure the pane stays where it is.
 */
export async function popOutPane(paneId: string, options?: { maximized?: boolean }): Promise<boolean> {
  const opened = await openPaneInNewWindow(paneId, options)

  if (opened) {
    dismissTreePane(paneId)
  }

  return opened
}

/**
 * Dock a pane again when its pop-out window closes. Every chat window hears
 * the shell's broadcast; `restoreTreePane` is idempotent, so a window that
 * never dismissed the pane only re-reveals a pane it already shows. Returns
 * the disposer; a no-op outside Electron.
 */
export function watchPanePopoutClosed(): () => void {
  const subscribe = typeof window === 'undefined' ? undefined : window.hermesDesktop?.onPanePopoutClosed

  if (!subscribe) {
    return () => {}
  }

  return subscribe(paneId => restoreTreePane(paneId))
}
