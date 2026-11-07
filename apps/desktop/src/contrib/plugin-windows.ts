/**
 * The window door: a plugin pops one of ITS OWN panes into a separate OS
 * window. The pane id is the plugin-local id it registered (`'pane'`), scoped
 * here to the registry id (`'<pluginId>:pane'`) so a plugin can never pop out
 * another plugin's pane or a core pane. Result-shaped like `runAction`: a
 * missing capability (no Electron shell, an older desktop build) or a foreign
 * id is refused with `{ ok: false, reason, error }`, never thrown.
 */

import { popOutPane } from '@/app/pane-popout'
import { canOpenPaneWindow } from '@/store/windows'

import { registry } from './registry'

export interface PluginOpenPaneOptions {
  /** Open the window filling the work area (an IDE-sized surface). */
  maximized?: boolean
}

export type PluginWindowResult =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'unavailable' | 'unknown'; error: string }

export interface PluginWindows {
  /** Pop one of this plugin's panes (by the local id it registered) into its
   *  own OS window. The docked copy leaves the layout while the window is
   *  open and docks again when it closes. Feature-detect on older hosts:
   *  `ctx.windows?.openPane('pane')`. */
  openPane: (paneId: string, options?: PluginOpenPaneOptions) => Promise<PluginWindowResult>
}

function refuse(pluginId: string, reason: 'denied' | 'unavailable' | 'unknown', error: string): PluginWindowResult {
  console.warn(`[plugin:${pluginId}] windows.openPane: ${error}`)

  return { ok: false, reason, error }
}

/** The registry id of a plugin-local pane id, or null when the plugin has
 *  not registered a pane under that id. Ownership is checked by source, not
 *  by prefix alone, so a crafted id cannot reach another plugin's pane. */
export function ownedPaneId(pluginId: string, paneId: string): null | string {
  const scoped = `${pluginId}:${paneId}`
  const pane = registry.getArea('panes').find(contribution => contribution.id === scoped)

  return pane && pane.source === `plugin:${pluginId}` ? scoped : null
}

export function createPluginWindows(pluginId: string): PluginWindows {
  return {
    openPane: async (paneId, options) => {
      if (typeof paneId !== 'string' || !paneId.trim()) {
        return refuse(pluginId, 'unknown', 'a pane id is required')
      }

      const scoped = ownedPaneId(pluginId, paneId.trim())

      if (!scoped) {
        return refuse(pluginId, 'denied', `'${paneId}' is not a pane this plugin registered`)
      }

      if (!canOpenPaneWindow()) {
        return refuse(pluginId, 'unavailable', 'this desktop build cannot open pane windows')
      }

      const opened = await popOutPane(scoped, { maximized: Boolean(options?.maximized) })

      return opened ? { ok: true } : refuse(pluginId, 'unavailable', 'the window did not open')
    }
  }
}
