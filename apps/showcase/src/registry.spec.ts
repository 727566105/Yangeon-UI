import { describe, it, expect } from 'vitest'
import { validateRegistry, registryEntries, componentMap } from './registry'
import type { RegistryEntry } from './registry'

describe('registry', () => {
  it('all entries pass validation against built component map', () => {
    const result = validateRegistry(registryEntries, Object.keys(componentMap))
    expect(result).toEqual({ ok: true })
  })

  it('entries are sorted by order', () => {
    const orders = registryEntries.map((e) => e.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
  })

  it('detects duplicate keys', () => {
    const dup = [registryEntries[0], registryEntries[0]]
    expect(validateRegistry(dup, ['button']).ok).toBe(false)
  })

  it('detects missing component', () => {
    const bad: RegistryEntry = { ...registryEntries[0], key: 'ghost', source: 'components/ghost' }
    expect(validateRegistry([bad], ['button']).ok).toBe(false)
  })

  it('detects variants without id', () => {
    const bad: RegistryEntry = {
      ...registryEntries[0],
      variants: [{ id: '', props: {} }],
    }
    expect(validateRegistry([bad], ['button']).ok).toBe(false)
  })

  it('detects duplicate variant ids within one entry', () => {
    const bad: RegistryEntry = {
      ...registryEntries[0],
      variants: [
        { id: 'solid', props: {} },
        { id: 'solid', props: {} },
      ],
    }
    expect(validateRegistry([bad], ['button']).ok).toBe(false)
  })

  it('registry entries keep stable ids matching i18n variant labels', () => {
    for (const e of registryEntries) {
      const ids = e.variants.map((v) => v.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
