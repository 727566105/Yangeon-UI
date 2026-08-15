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
      variants: [{ id: '', label: { zh: 'x', en: 'x' }, props: {} }],
    }
    expect(validateRegistry([bad], ['button']).ok).toBe(false)
  })

  it('detects duplicate variant ids within one entry', () => {
    const bad: RegistryEntry = {
      ...registryEntries[0],
      variants: [
        { id: 'solid', label: { zh: 'x', en: 'x' }, props: {} },
        { id: 'solid', label: { zh: 'x', en: 'x' }, props: {} },
      ],
    }
    expect(validateRegistry([bad], ['button']).ok).toBe(false)
  })

  it('detects duplicate orders', () => {
    const bad: RegistryEntry = { ...registryEntries[1], order: registryEntries[0].order }
    expect(validateRegistry([registryEntries[0], bad], ['button']).ok).toBe(false)
  })

  it('detects missing bilingual copy (name/description/tags/variant label)', () => {
    const badName: RegistryEntry = { ...registryEntries[0], name: { zh: '缺英文', en: '' } }
    expect(validateRegistry([badName], ['button']).ok).toBe(false)
    const badDesc: RegistryEntry = { ...registryEntries[0], description: { zh: '', en: 'Desc' } }
    expect(validateRegistry([badDesc], ['button']).ok).toBe(false)
    const badTag: RegistryEntry = { ...registryEntries[0], tags: [{ zh: '基础', en: '' }] }
    expect(validateRegistry([badTag], ['button']).ok).toBe(false)
    const badLabel: RegistryEntry = {
      ...registryEntries[0],
      variants: [{ id: 'solid', label: { zh: '实心', en: '' }, props: {} }],
    }
    expect(validateRegistry([badLabel], ['button']).ok).toBe(false)
  })

  it('registry entries keep stable ids matching bilingual labels', () => {
    for (const e of registryEntries) {
      const ids = e.variants.map((v) => v.id)
      expect(new Set(ids).size).toBe(ids.length)
      // 双语文案完整性（validateRegistry 之外的直接数据断言）
      expect(e.name.zh.trim()).toBeTruthy()
      expect(e.name.en.trim()).toBeTruthy()
      expect(e.description.zh.trim()).toBeTruthy()
      expect(e.description.en.trim()).toBeTruthy()
      for (const t of e.tags) {
        expect(t.zh.trim()).toBeTruthy()
        expect(t.en.trim()).toBeTruthy()
      }
      for (const v of e.variants) {
        expect(v.label.zh.trim()).toBeTruthy()
        expect(v.label.en.trim()).toBeTruthy()
      }
    }
  })
})
