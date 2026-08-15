import { describe, it, expect } from 'vitest'
import { platforms, platformMap } from '../platforms'
import { registryEntries, registryEntriesFor } from '../registry'
import { validatePlatforms } from '@yzen-ui/shared'

describe('platforms.json', () => {
  it('passes validatePlatforms (unique keys, bilingual labels, integer orders)', () => {
    expect(validatePlatforms(platforms).ok).toBe(true)
  })

  it('sorts by order and builds the key map', () => {
    expect(platforms.map((p) => p.order)).toEqual([...platforms.map((p) => p.order)].sort((a, b) => a - b))
    for (const p of platforms) {
      expect(platformMap[p.key].key).toBe(p.key)
    }
  })

  it('every registry entry references an existing platform (drift guard)', () => {
    const keys = new Set(platforms.map((p) => p.key))
    for (const e of registryEntries) {
      expect(e.platform).toBeTruthy()
      expect(keys.has(e.platform)).toBe(true)
    }
  })

  it('registryEntriesFor filters by platform', () => {
    const desktop = registryEntriesFor('desktop')
    expect(desktop.length).toBeGreaterThan(0)
    expect(desktop.every((e) => e.platform === 'desktop')).toBe(true)
    // 空态路径不依赖数据现状：mobile 为空或非空均可（端管理开放后移动端组件可能随时上架）
    for (const e of registryEntriesFor('mobile')) {
      expect(e.platform).toBe('mobile')
    }
  })
})
