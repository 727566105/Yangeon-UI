import { describe, it, expect } from 'vitest'
import { validateRegistry, validateCategories } from '../validate'
import type { RegistryCategory, RegistryEntry } from '../types'

// 合法样例（Button 的双语结构）
const entry = (over: Partial<RegistryEntry> = {}): RegistryEntry => ({
  key: 'button',
  name: { zh: 'Button 按钮', en: 'Button' },
  description: { zh: '描述', en: 'Description' },
  category: 'basic',
  tags: [{ zh: '基础', en: 'Basic' }],
  order: 1,
  visible: true,
  source: 'components/button',
  variants: [{ id: 'solid', label: { zh: '实心', en: 'Solid' }, props: {} }],
  ...over,
})

const category = (over: Partial<RegistryCategory> = {}): RegistryCategory => ({
  key: 'basic',
  label: { zh: '基础组件', en: 'Basic' },
  order: 1,
  ...over,
})

describe('validateRegistry', () => {
  it('accepts a valid entry', () => {
    expect(validateRegistry([entry()], ['button'])).toEqual({ ok: true })
  })

  it('detects duplicate keys', () => {
    expect(validateRegistry([entry(), entry()], ['button']).ok).toBe(false)
  })

  it('detects missing component', () => {
    expect(validateRegistry([entry({ key: 'ghost', source: 'components/ghost' })], ['button']).ok).toBe(false)
  })

  it('detects non-integer order and duplicate orders', () => {
    expect(validateRegistry([entry({ order: 1.5 })], ['button']).ok).toBe(false)
    expect(
      validateRegistry([entry(), entry({ key: 'input', order: 1 })], ['button', 'input']).ok,
    ).toBe(false)
  })

  it('detects entries without variants and variants without id', () => {
    expect(validateRegistry([entry({ variants: [] })], ['button']).ok).toBe(false)
    expect(
      validateRegistry(
        [entry({ variants: [{ id: '', label: { zh: 'x', en: 'x' }, props: {} }] })],
        ['button'],
      ).ok,
    ).toBe(false)
  })

  it('detects duplicate variant ids', () => {
    const v = { id: 'solid', label: { zh: 'x', en: 'x' }, props: {} }
    expect(validateRegistry([entry({ variants: [v, v] })], ['button']).ok).toBe(false)
  })

  it('detects missing bilingual copy in name/description/tags/variant label', () => {
    expect(validateRegistry([entry({ name: { zh: '缺英文', en: '' } })], ['button']).ok).toBe(false)
    expect(validateRegistry([entry({ description: { zh: '', en: 'Desc' } })], ['button']).ok).toBe(false)
    expect(validateRegistry([entry({ tags: [{ zh: '基础', en: '' }] })], ['button']).ok).toBe(false)
    expect(
      validateRegistry(
        [entry({ variants: [{ id: 'solid', label: { zh: '实心', en: '' }, props: {} }] })],
        ['button'],
      ).ok,
    ).toBe(false)
    expect(validateRegistry([entry({ tags: [] })], ['button']).ok).toBe(false)
  })
})

describe('validateCategories', () => {
  it('accepts a valid category list', () => {
    expect(validateCategories([category(), category({ key: 'ai', order: 2 })]).ok).toBe(true)
  })

  it('detects duplicate and malformed keys', () => {
    expect(validateCategories([category(), category()]).ok).toBe(false)
    expect(validateCategories([category({ key: '../evil' })]).ok).toBe(false)
    expect(validateCategories([category({ key: '大写' })]).ok).toBe(false)
  })

  it('detects missing bilingual label and invalid order', () => {
    expect(validateCategories([category({ label: { zh: '', en: 'Basic' } })]).ok).toBe(false)
    expect(validateCategories([category({ label: { zh: '基础', en: '' } })]).ok).toBe(false)
    expect(validateCategories([category({ order: 1.5 })]).ok).toBe(false)
    expect(validateCategories([category({ order: 1 }), category({ key: 'ai', order: 1 })]).ok).toBe(false)
  })
})

describe('validateRegistry with categories', () => {
  it('rejects entries referencing an unknown category', () => {
    const cats = [category()]
    expect(validateRegistry([entry()], ['button'], cats).ok).toBe(true)
    expect(validateRegistry([entry({ category: 'ghost-cat' })], ['button'], cats).ok).toBe(false)
  })

  it('skips category check when not provided (backward compatible)', () => {
    expect(validateRegistry([entry({ category: 'anything' })], ['button']).ok).toBe(true)
  })
})
