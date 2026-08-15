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

const mountList = (entries: RegistryEntry[], categories: RegistryCategory[] = CATEGORIES) =>
  mount(ComponentList, { props: { entries, categories, platforms: PLATFORMS } })

beforeEach(() => {
  mockedSave.mockReset()
  mockedSave.mockResolvedValue({ ok: true })
})

describe('ComponentList', () => {
  it('renders bilingual category labels instead of raw keys (zh mode)', async () => {
    const wrapper = mountList([
      entry({ key: 'button', category: 'basic' }),
      entry({ key: 'ai-card', category: 'ai' }),
    ])
    // 默认选中第一个分类（basic）→ 分类列渲染双语标签
    let rows = wrapper.findAll('.list__row')
    expect(rows.length).toBe(1)
    expect(rows[0].findAll('code.list__key')[1].text()).toBe('基础组件')
    // 切到 AI 分类 → 第二分类双语
    await wrapper.findAll('.list__tab')[1].trigger('click')
    rows = wrapper.findAll('.list__row')
    expect(rows[0].findAll('code.list__key')[1].text()).toBe('AI 场景')
  })

  it('falls back to the raw key when the category is missing from props', () => {
    // categories 为空 → category 兜底 'all'（不筛选）且分类列回退 raw key
    const wrapper = mountList([entry({ key: 'legacy', category: 'legacy' })], [])
    const row = wrapper.find('.list__row')
    expect(row.findAll('code.list__key')[1].text()).toBe('legacy')
  })

  it('shows a hidden badge only for non-visible entries', () => {
    const wrapper = mountList([
      entry({ key: 'button', visible: true }),
      entry({ key: 'ai-card', visible: false }),
    ])
    const rows = wrapper.findAll('.list__row')
    expect(rows[0].find('.list__hidden-badge').exists()).toBe(false)
    expect(rows[1].find('.list__hidden-badge').exists()).toBe(true)
    expect(rows[1].find('.list__hidden-badge').text()).toBe('隐藏')
  })

  it('moves a row up and saves the reordered registry', async () => {
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', order: 2 }),
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
      entry({ key: 'ai-card', order: 2 }),
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
      entry({ key: 'ai-card', order: 2 }),
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
    // 端筛选：唯一一个 select 是端
    await wrapper.find('.list__select').setValue('mobile')
    const rows = wrapper.findAll('.list__row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('code.list__key').text()).toBe('m-btn')
  })
  it('filters rows by category via the tab group (defaults to the first category)', async () => {
    const wrapper = mountList([
      entry({ key: 'button', category: 'basic' }),
      entry({ key: 'ai-card', category: 'ai' }),
    ])
    // 无「全部分类」入口，只渲染各分类；默认激活第一个分类（basic）并直接筛选
    const tabs = wrapper.findAll('.list__tab')
    expect(tabs.map((t) => t.text())).toEqual(['基础组件', 'AI 场景'])
    expect(tabs[0].classes()).toContain('list__tab--active')
    let rows = wrapper.findAll('.list__row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('code.list__key').text()).toBe('button')
    // 点「AI 场景」→ 只显示 ai 行
    await tabs[1].trigger('click')
    rows = wrapper.findAll('.list__row')
    expect(rows).toHaveLength(1)
    expect(rows[0].find('code.list__key').text()).toBe('ai-card')
  })
  it('combines category tab with the platform select (AND filtering)', async () => {
    const wrapper = mountList([
      entry({ key: 'btn-d', category: 'basic' }),
      entry({ key: 'btn-m', category: 'basic', platform: 'mobile' }),
      entry({ key: 'ai-d', category: 'ai' }),
    ])
    // 默认 basic → 2 行；叠加端筛选 mobile → 1 行
    let rows = wrapper.findAll('.list__row')
    expect(rows.map((r) => r.find('code.list__key').text())).toEqual(['btn-d', 'btn-m'])
    await wrapper.find('.list__select').setValue('mobile')
    rows = wrapper.findAll('.list__row')
    expect(rows.map((r) => r.find('code.list__key').text())).toEqual(['btn-m'])
  })
  it('combines category tab with keyword search (AND filtering)', async () => {
    const wrapper = mountList([
      entry({ key: 'button', category: 'basic', name: { zh: 'Button 按钮', en: 'Button' } }),
      entry({ key: 'input', category: 'basic', name: { zh: 'Input 输入框', en: 'Input' } }),
    ])
    // 默认 basic + 搜索「input」→ 只匹配 input（key/名称/标签命中）
    const search = wrapper.find('.list__search')
    await search.setValue('input')
    const rows = wrapper.findAll('.list__row')
    expect(rows.map((r) => r.find('code.list__key').text())).toEqual(['input'])
  })
  it('auto-selects the first category when categories load asynchronously', async () => {
    // 挂载时 categories 为空 → 兜底 'all' 显示全部
    const wrapper = mount(ComponentList, {
      props: { entries: [entry({ key: 'button', category: 'basic' })], categories: [], platforms: PLATFORMS },
    })
    expect(wrapper.findAll('.list__tab')).toHaveLength(0)
    expect(wrapper.findAll('.list__row')).toHaveLength(1)
    // 异步加载完成后 → 自动选中第一个分类并筛选
    await wrapper.setProps({
      categories: CATEGORIES,
    })
    const tabs = wrapper.findAll('.list__tab')
    expect(tabs.map((t) => t.text())).toEqual(['基础组件', 'AI 场景'])
    expect(tabs[0].classes()).toContain('list__tab--active')
    expect(wrapper.findAll('.list__row')).toHaveLength(1)
  })
  it('does not override a manually selected category when categories refresh', async () => {
    const wrapper = mountList([
      entry({ key: 'button', category: 'basic' }),
      entry({ key: 'ai-card', category: 'ai' }),
    ])
    // 手动切到 AI 场景
    await wrapper.findAll('.list__tab')[1].trigger('click')
    expect(wrapper.findAll('.list__row').length).toBe(1)
    // 分类列表刷新（新引用）→ 不应覆盖用户选择
    await wrapper.setProps({ categories: [...CATEGORIES] })
    const active = wrapper.findAll('.list__tab').find((t) => t.classes().includes('list__tab--active'))
    expect(active?.text()).toBe('AI 场景')
    expect(wrapper.findAll('.list__row').length).toBe(1)
  })
  it('keeps sort buttons enabled by global position when a filter is active', async () => {
    // 3 个组件，端筛选 mobile 显示 2 个；按钮禁用按全局 orderedKeys 位置而非筛选后索引
    const wrapper = mountList([
      entry({ key: 'a', platform: 'desktop' }),
      entry({ key: 'b', platform: 'mobile' }),
      entry({ key: 'c', platform: 'mobile' }),
    ])
    const selects = wrapper.findAll('.list__select')
    await selects[0].setValue('mobile')
    const rows = wrapper.findAll('.list__row')
    expect(rows).toHaveLength(2)
    // b 全局中间：↑↓ 均可用
    expect((rows[0].findAll('.list__mini')[0].element as HTMLButtonElement).disabled).toBe(false)
    expect((rows[0].findAll('.list__mini')[1].element as HTMLButtonElement).disabled).toBe(false)
    // c 全局最后：↓ 禁用
    expect((rows[1].findAll('.list__mini')[1].element as HTMLButtonElement).disabled).toBe(true)
  })
  it('reorders by drag-and-drop and saves the new order', async () => {
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', order: 2 }),
      entry({ key: 'm-btn', platform: 'mobile', order: 3 }),
    ])
    const rows = wrapper.findAll('.list__row')
    // 拖 m-btn（第 3 行）到 button（第 1 行）上 → 移到其前：[m-btn, button, ai-card]
    await rows[2].trigger('dragstart', { dataTransfer: { setData: vi.fn(), effectAllowed: '' } })
    await rows[0].trigger('dragover', { dataTransfer: {} })
    await rows[0].trigger('drop', { dataTransfer: { getData: () => 'm-btn' } })
    await flushPromises()
    expect(mockedSave).toHaveBeenCalledTimes(1)
    const saved = mockedSave.mock.calls[0][0] as RegistryEntry[]
    expect(saved.map((e) => e.key)).toEqual(['m-btn', 'button', 'ai-card'])
    expect(saved.map((e) => e.order)).toEqual([1, 2, 3])
    // 行序乐观更新
    expect(wrapper.findAll('.list__row')[0].find('code.list__key').text()).toBe('m-btn')
    expect(wrapper.emitted('order-saved')).toBeTruthy()
  })

  it('skips saving when dropping to the same relative position', async () => {
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', order: 2 }),
    ])
    const rows = wrapper.findAll('.list__row')
    // button 原本在 ai-card 前，drop 到 ai-card = 原位 → 不保存
    await rows[0].trigger('dragstart', { dataTransfer: { setData: vi.fn() } })
    await rows[1].trigger('drop', { dataTransfer: { getData: () => 'button' } })
    await flushPromises()
    expect(mockedSave).not.toHaveBeenCalled()
  })

  it('rolls back the drag order when saving fails', async () => {
    mockedSave.mockRejectedValue(new Error('network down'))
    const wrapper = mountList([
      entry({ key: 'button', order: 1 }),
      entry({ key: 'ai-card', order: 2 }),
      entry({ key: 'm-btn', platform: 'mobile', order: 3 }),
    ])
    const rows = wrapper.findAll('.list__row')
    await rows[2].trigger('dragstart', { dataTransfer: { setData: vi.fn() } })
    await rows[0].trigger('drop', { dataTransfer: { getData: () => 'm-btn' } })
    await flushPromises()
    // 回滚：顺序不变
    expect(wrapper.findAll('.list__row')[0].find('code.list__key').text()).toBe('button')
    expect(wrapper.find('.list__error').text()).toContain('network down')
  })
})



