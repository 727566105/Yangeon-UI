import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentList from '../ComponentList.vue'
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

const CATEGORIES: RegistryCategory[] = [
  { key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 },
  { key: 'ai', label: { zh: 'AI 场景', en: 'AI' }, order: 2 },
]

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

describe('ComponentList', () => {
  it('renders bilingual category labels instead of raw keys (zh mode)', () => {
    const wrapper = mount(ComponentList, {
      props: {
        entries: [
          entry({ key: 'button', category: 'basic' }),
          entry({ key: 'ai-card', category: 'ai' }),
        ],
        categories: CATEGORIES,
      },
    })
    const rows = wrapper.findAll('.list__row')
    expect(rows.length).toBe(2)
    // 每行第一个 .list__key 是组件 key，第二个是分类列
    expect(rows[0].findAll('code.list__key')[1].text()).toBe('基础组件')
    expect(rows[1].findAll('code.list__key')[1].text()).toBe('AI 场景')
  })

  it('falls back to the raw key when the category is missing from props', () => {
    const wrapper = mount(ComponentList, {
      props: {
        entries: [entry({ key: 'legacy', category: 'legacy' })],
        categories: CATEGORIES,
      },
    })
    const row = wrapper.find('.list__row')
    expect(row.findAll('code.list__key')[1].text()).toBe('legacy')
  })

  it('shows a hidden badge only for non-visible entries', () => {
    const wrapper = mount(ComponentList, {
      props: {
        entries: [
          entry({ key: 'button', visible: true }),
          entry({ key: 'ai-card', category: 'ai', visible: false }),
        ],
        categories: CATEGORIES,
      },
    })
    const rows = wrapper.findAll('.list__row')
    expect(rows[0].find('.list__hidden-badge').exists()).toBe(false)
    expect(rows[1].find('.list__hidden-badge').exists()).toBe(true)
    expect(rows[1].find('.list__hidden-badge').text()).toBe('隐藏')
  })
})
