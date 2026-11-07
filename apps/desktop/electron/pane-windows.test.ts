import assert from 'node:assert/strict'

import { test } from 'vitest'

import { buildPaneWindowUrl, paneWindowRequestId } from './pane-windows'

test('buildPaneWindowUrl puts win=pane before the hash (dev server)', () => {
  const url = buildPaneWindowUrl('creature-workshop:pane', { devServer: 'http://localhost:5173' })

  assert.equal(url, 'http://localhost:5173/?win=pane&pane=creature-workshop%3Apane#/')
  assert.ok(url.indexOf('?win=pane') < url.indexOf('#'))
})

test('buildPaneWindowUrl avoids a double slash when the dev server has a trailing slash', () => {
  const url = buildPaneWindowUrl('p', { devServer: 'http://localhost:5173/' })

  assert.equal(url, 'http://localhost:5173/?win=pane&pane=p#/')
})

test('buildPaneWindowUrl builds a packaged file URL with the flag before the hash', () => {
  const url = buildPaneWindowUrl('abc', { rendererIndexPath: '/opt/app/index.html' })

  assert.match(url, /^file:\/\/.*index\.html\?win=pane&pane=abc#\/$/)
})

test('paneWindowRequestId accepts only a non-blank string', () => {
  assert.equal(paneWindowRequestId(' creature-workshop:pane '), 'creature-workshop:pane')
  assert.equal(paneWindowRequestId('   '), null)
  assert.equal(paneWindowRequestId(null), null)
  assert.equal(paneWindowRequestId({ paneId: 'x' }), null)
})
