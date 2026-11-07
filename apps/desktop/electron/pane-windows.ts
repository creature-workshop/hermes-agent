// Popped-out plugin pane windows: one OS window that renders a single
// contributed pane (`area: 'panes'`) and nothing else, so a plugin surface can
// live on its own monitor. Same query-before-hash contract as
// session-windows / browser-windows: `?win=pane` MUST sit in the search string
// before the '#', or HashRouter swallows it as part of the route.

import { pathToFileURL } from 'node:url'

export const PANE_WINDOW_WIDTH = 960
export const PANE_WINDOW_HEIGHT = 720
export const PANE_WINDOW_MIN_WIDTH = 360
export const PANE_WINDOW_MIN_HEIGHT = 320

/**
 * Renderer URL for a popped-out pane. `paneId` is the registry id of the
 * contribution (`<pluginId>:<id>`); the renderer looks it up in the `panes`
 * area once the plugin has loaded there.
 */
export function buildPaneWindowUrl(
  paneId: string,
  { devServer, rendererIndexPath }: { devServer?: null | string; rendererIndexPath?: string } = {}
): string {
  const query = `?win=pane&pane=${encodeURIComponent(paneId)}`

  if (devServer) {
    const base = devServer.endsWith('/') ? devServer.slice(0, -1) : devServer

    return `${base}/${query}#/`
  }

  return `${pathToFileURL(rendererIndexPath!).toString()}${query}#/`
}

/**
 * The pane id a renderer asked to pop out, or null when the request is not a
 * usable id. The id must name a registry contribution, so it is a non-blank
 * string; anything else is refused before a window is spawned.
 */
export function paneWindowRequestId(paneId: unknown): null | string {
  if (typeof paneId !== 'string') {
    return null
  }

  const trimmed = paneId.trim()

  return trimmed ? trimmed : null
}
