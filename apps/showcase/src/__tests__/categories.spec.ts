import { describe, it, expect } from 'vitest'
import { categories, categoryMap } from '../categories'
import { registryEntries } from '../registry'
import { validateCategories } from '@yzen-ui/shared'

describe('categories data layer', () => {
  it('categories.json passes validation (key unique/format, bilingual label, order unique)', () => {
    expect(validateCategories(categories)).toEqual({ ok: true })
  })

  it('categories are sorted by order', () => {
    const orders = categories.map((c) => c.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
  })

  it('categoryMap resolves every category by key', () => {
    for (const c of categories) {
      expect(categoryMap[c.key]).toBe(c)
    }
  })

  it('every component category exists in the categories table (drift guard)', () => {
    const keys = new Set(categories.map((c) => c.key))
    for (const e of registryEntries) {
      expect(keys.has(e.category), `组件 ${e.key} 引用了不存在的分类: ${e.category}`).toBe(true)
    }
  })
})
