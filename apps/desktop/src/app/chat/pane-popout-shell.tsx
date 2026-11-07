import { type CSSProperties } from 'react'

import { PanelEmpty } from '@/app/overlays/panel'
import { TITLEBAR_HEIGHT } from '@/app/shell/titlebar'
import { ContribBoundary, ContribRender } from '@/contrib/react/boundary'
import { useContributions } from '@/contrib/react/use-contributions'
import { useI18n } from '@/i18n'
import { windowPaneId } from '@/store/windows'

/**
 * Dedicated shell for `?win=pane`: ONE contributed pane (`area: 'panes'`, by
 * registry id), full-window, no session sidebar or layout tree. The same
 * `render` the docked tab mounts — just in its own OS window.
 *
 * Plugins load into this window the same way they load into the primary, a
 * moment after boot, so the pane is looked up reactively: until its
 * contribution registers (or while its plugin is disabled) the window shows a
 * waiting state instead of an error.
 */
export function PanePopoutShell() {
  const { t } = useI18n()
  const paneId = windowPaneId()
  const pane = useContributions('panes').find(contribution => contribution.id === paneId)

  return (
    <div
      className="flex h-screen min-h-0 w-screen flex-col bg-(--ui-bg-chrome) text-(--ui-text-primary)"
      data-contrib-shell=""
      style={{ '--titlebar-height': `${TITLEBAR_HEIGHT}px` } as CSSProperties}
    >
      <div aria-hidden="true" className="relative shrink-0 bg-(--ui-bg-chrome)" style={{ height: TITLEBAR_HEIGHT }}>
        {/* Same traffic-light / native-overlay carve-out as the main titlebar:
            a full-bar drag region would eat the window buttons. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-(--titlebar-controls-left,14px) [-webkit-app-region:drag]" />
        <div className="pointer-events-none absolute inset-y-0 left-[calc(var(--titlebar-controls-left,14px)+(var(--titlebar-control-size,24px)*2)+0.75rem)] right-[calc(var(--titlebar-tools-right,0.75rem)+0.75rem)] [-webkit-app-region:drag]" />
      </div>
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {pane?.render ? (
          <ContribBoundary id={pane.id} variant="pane">
            <ContribRender render={pane.render} />
          </ContribBoundary>
        ) : (
          <div className="grid h-full place-items-center">
            <PanelEmpty
              description={paneId ? t.zones.missingPane(paneId) : undefined}
              icon="extensions"
              title={t.zones.poppedOutWaiting}
            />
          </div>
        )}
      </div>
    </div>
  )
}
