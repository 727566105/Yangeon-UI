import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ComponentList from '../ComponentList.vue'
import type { Platform, RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

vi.mock('../../api', () => ({
  saveRegistry: vi.fn(),
}))

import { saveRegistry } from '../../api'
const mockedSave = vi.mocked(saveRegistry)

const CATEGORIES: RegistryCategory[] = [
  { key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 },
  { key: 'ai', label: { zh: 'AI 场景', en: 'AI' }, order: 2 },
]

const PLATFORMS: Platform[] = [
  { key: 'mobile', label: { zh: '移动端', en: 'Mobile' }, order: 1 },
  { key: 'desktop', label: { zh: 'PC 端', en: 'Desktop' }, order: 2 },
]

const entry = (over: Partial<RegistryEntry> = {}): RegistryEntry => ({
  key: 'button',
  name: { zh: 'Button 按钮', en: 'Button' },
  description: { zh: '描述', en: 'Description' },
  category: 'basic',
  platform: 'desktop',
  tags: [{ zh: '基础', en: 'Basic' }],
  order: 1,
  visible: true,
  source: 'components/button',
  variants: [{ id: 'solid', label: { zh: '实心', en: 'Solid' }, props: {} }],
  ...over,
})

const mountList = (entries: RegistryEntry[]) =>
  mount(ComponentList, { props: { entries, categories: CATEGORIES, platforms: PLATFORMS } })

beforeEach(() => {
  mockedSave.mockReset()
  mockedSave.mockResolvedValue({ ok: true })
})

describe('ComponentList', () => {
  it('renders bilingual category labels instead of raw keys (zh mode)', () => {
    const wrapper = mountList([
      entry({ key: 'button', category: 'basic' }),
      entry({ key: 'ai-card', category: 'ai' }),
    ])
    const rows = wrapper.findAll('.list__row')
    expect(rows.length).toBe(2)
    // 每行第一个 .list__key 是组件 key，第二个是分类列
    expect(rows[0].findAll('code.list__key')[1].text()).toBe('基础组件')
    expect(rows[1].findAll('code.list__key')[1].text()).toBe('AI 场景')
  })

  it('falls back to the raw key when the category is missing from props', () => {
    const wrapper = mountList([entry({ key: 'legacy', category: 'legacy' })])
    const row = wrapper.find('.list__row')
    expect(row.findAll('code.list__key')[1].text()).toBe('legacy')
  })

  it('shows a hidden badge only for non-visible entries', () => {
    const wrapper = mountList([
      entry({ key: 'button', visible: true }),
      entry({ key: 'ai-card', category: 'ai', visible: false }),
    ])
    const rows = wrapper.findAll('.list__row')
    expect(rows[0].find('.list__hidden-badge').exists()).toBe(false)
    expect(rows[1].find('.list__hidden-badge').exists()).toBe(true)
    expect(rows[1].find('.list__hidden-badge').text()).toBe('隐藏')
  })

  it('moves a row up and saves the reordered registry', async () => {
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', category: 'ai', order: 2 }),
    ])
    const rows = wrapper.findAll('.list__row')
    expect(rows[0].find('code.list__key').text()).toBe('button')
    // 第二行（ai-card）点 ↑
    await rows[1].find('.list__mini').trigger('click')
    await flushPromises()
    expect(mockedSave).toHaveBeenCalledTimes(1)
    const saved = mockedSave.mock.calls[0][0] as RegistryEntry[]
    expect(saved.map((e) => e.key)).toEqual(['ai-card', 'button'])
    expect(saved.map((e) => e.order)).toEqual([1, 2])
    // 乐观更新生效：行序已交换 + 通知父级刷新
    const after = wrapper.findAll('.list__row')
    expect(after[0].find('code.list__key').text()).toBe('ai-card')
    expect(wrapper.emitted('order-saved')).toBeTruthy()
  })

  it('disables up on the first row and down on the last row', () => {
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', category: 'ai', order: 2 }),
    ])
    const rows = wrapper.findAll('.list__row')
    const upBtns = rows.map((r) => r.findAll('.list__mini')[0])
    const downBtns = rows.map((r) => r.findAll('.list__mini')[1])
    expect((upBtns[0].element as HTMLButtonElement).disabled).toBe(true)
    expect((downBtns[1].element as HTMLButtonElement).disabled).toBe(true)
    expect((upBtns[1].element as HTMLButtonElement).disabled).toBe(false)
  })

  it('reverts the order and shows an error when saving fails', async () => {
    mockedSave.mockRejectedValue(new Error('network down'))
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', category: 'ai', order: 2 }),
    ])
    await wrapper.findAll('.list__row')[1].find('.list__mini').trigger('click')
    await flushPromises()
    const rows = wrapper.findAll('.list__row')
    expect(rows[0].find('code.list__key').text()).toBe('button') // 已回滚
    expect(wrapper.find('.list__error').text()).toContain('network down')
    expect(wrapper.emitted('order-saved')).toBeFalsy()
  })
  it('filters rows by platform and shows the platform badge', async () => {
    const wrapper = mountList([
      entry({ key: 'button', platform: 'desktop' }),
      entry({ key: 'm-btn', platform: 'mobile' }),
    ])
    // 端徽标列双语渲染
    expect(wrapper.findAll('.list__plat').map((x) => x.text())).toEqual(['PC 端', '移动端'])
    // 端筛选：第二个 select 是端
    const selects = wrapper.findAll('.list__select')
    await selects[1].setValue('mobile')
    const rows = wrapper.findAll('.list__row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('code.list__key').text()).toBe('m-btn')
  })
  it('keeps sort buttons enabled by global position when a filter is active', async () => {
    // 3 个组件，端筛选 mobile 显示 2 个；按钮禁用按全局 orderedKeys 位置而非筛选后索引
    const wrapper = mountList([
      entry({ key: 'a', platform: 'desktop' }),
      entry({ key: 'b', platform: 'mobile' }),
      entry({ key: 'c', platform: 'mobile' }),
    ])
    const selects = wrapper.findAll('.list__select')
    await selects[1].setValue('mobile')
    const rows = wrapper.findAll('.list__row')
    expect(rows).toHaveLength(2)
    // b 全局中间：↑↓ 均可用
    expect((rows[0].findAll('.list__mini')[0].element as HTMLButtonElement).disabled).toBe(false)
    expect((rows[0].findAll('.list__mini')[1].element as HTMLButtonElement).disabled).toBe(false)
    // c 全局最后：↓ 禁用
    expect((rows[1].findAll('.list__mini')[1].element as HTMLButtonElement).disabled).toBe(true)
  })
})


