import { afterEach, describe, expect, it, vi } from 'vitest'

// The shell call is the seam: the test proves which pane id (if any) reaches
// it, so a refusal is "nothing was asked of the shell", not a mocked answer.
const openPaneInNewWindow = vi.hoisted(() => vi.fn(async () => true))
const canOpenPaneWindow = vi.hoisted(() => vi.fn(() => true))

vi.mock('@/store/windows', async importOriginal => ({
  ...(await importOriginal<object>()),
  canOpenPaneWindow,
  openPaneInNewWindow
}))

import { createPluginContext } from './plugin'
import { ownedPaneId } from './plugin-windows'
import { registry } from './registry'

const disposers: Array<() => void> = []

function pluginWithPane(pluginId: string, localId = 'pane') {
  const ctx = createPluginContext(pluginId, dispose => disposers.push(dispose))

  ctx.register({ area: 'panes', id: localId, render: () => null, title: localId })

  return ctx
}

afterEach(() => {
  disposers.splice(0).forEach(dispose => dispose())
  openPaneInNewWindow.mockClear()
  canOpenPaneWindow.mockReturnValue(true)
})

describe('ownedPaneId', () => {
  it('resolves a pane the plugin registered to its registry id', () => {
    pluginWithPane('mine')

    expect(ownedPaneId('mine', 'pane')).toBe('mine:pane')
  })

  it('refuses a pane the plugin never registered', () => {
    pluginWithPane('mine')

    expect(ownedPaneId('mine', 'other')).toBeNull()
  })

  it("refuses another plugin's pane even when the local id is spelled to reach it", () => {
    pluginWithPane('theirs')

    // 'theirs:pane' exists, but prefixing it with 'mine:' does not match it,
    // and no plugin can register an id whose source is another plugin's.
    expect(ownedPaneId('mine', 'theirs:pane')).toBeNull()
    expect(ownedPaneId('mine', 'pane')).toBeNull()
  })

  it('refuses a pane that carries this plugin\'s id prefix but a foreign source', () => {
    // A core or host-registered pane that happens to sit under the prefix.
    disposers.push(
      registry.register({ area: 'panes', id: 'mine:pane', render: () => null, source: 'core', title: 'pane' })
    )

    expect(ownedPaneId('mine', 'pane')).toBeNull()
  })
})

describe('ctx.windows.openPane', () => {
  it('pops out the plugin\'s own pane by its scoped registry id', async () => {
    const ctx = pluginWithPane('mine')

    await expect(ctx.windows.openPane('pane', { maximized: true })).resolves.toEqual({ ok: true })
    expect(openPaneInNewWindow).toHaveBeenCalledWith('mine:pane', { maximized: true })
  })

  it("refuses a foreign id with reason 'denied' and never reaches the shell", async () => {
    pluginWithPane('theirs')
    const ctx = pluginWithPane('mine')

    const result = await ctx.windows.openPane('theirs:pane')

    expect(result).toMatchObject({ ok: false, reason: 'denied' })
    expect(openPaneInNewWindow).not.toHaveBeenCalled()
  })

  it("refuses a blank id with reason 'unknown'", async () => {
    const ctx = pluginWithPane('mine')

    await expect(ctx.windows.openPane('   ')).resolves.toMatchObject({ ok: false, reason: 'unknown' })
    expect(openPaneInNewWindow).not.toHaveBeenCalled()
  })

  it("resolves 'unavailable' (never throws) when the shell cannot open pane windows", async () => {
    canOpenPaneWindow.mockReturnValue(false)
    const ctx = pluginWithPane('mine')

    await expect(ctx.windows.openPane('pane')).resolves.toMatchObject({ ok: false, reason: 'unavailable' })
    expect(openPaneInNewWindow).not.toHaveBeenCalled()
  })
})
