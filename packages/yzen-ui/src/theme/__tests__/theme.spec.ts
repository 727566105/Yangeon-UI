import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('theme tokens', () => {
  const light = readFileSync(resolve(import.meta.dirname, '../tokens-light.scss'), 'utf-8')
  const dark = readFileSync(resolve(import.meta.dirname, '../tokens-dark.scss'), 'utf-8')

  it('defines all required light tokens', () => {
    for (const name of ['--yz-page', '--yz-canvas', '--yz-surface', '--yz-ink', '--yz-ink-2', '--yz-ink-3', '--yz-line', '--yz-line-strong', '--yz-accent', '--yz-accent-tint', '--yz-green', '--yz-orange', '--yz-red', '--yz-radius-chip', '--yz-radius-control', '--yz-radius-card', '--yz-radius-pill', '--yz-duration', '--yz-ease-out-strong']) {
      expect(light).toContain(name)
    }
  })

  it('light page token matches beautifului baseline #fafafb', () => {
    expect(light).toContain('--yz-page: #fafafb')
  })

  it('dark theme scopes to html[data-theme="dark"]', () => {
    expect(dark).toContain('html[data-theme="dark"]')
  })

  it('dark theme overrides page token', () => {
    expect(dark).toContain('--yz-page:')
    expect(dark).not.toContain('#fafafb')
  })

  it('respects prefers-reduced-motion via motion switch', () => {
    expect(light).toContain('--yz-motion-enabled')
  })
})
