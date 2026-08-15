import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ComponentEdit from '../ComponentEdit.vue'
import type { RegistryEntry } from '@yzen-ui/shared'

vi.mock('../../api', () => ({
  saveRegistry: vi.fn(),
  fetchRegistry: vi.fn(),
}))

import { saveRegistry, fetchRegistry } from '../../api'
const mockedSave = vi.mocked(saveRegistry)
const mockedFetch = vi.mocked(fetchRegistry)

const CATEGORIES = [
  { key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 },
  { key: 'ai', label: { zh: 'AI 场景', en: 'AI' }, order: 2 },
]

const PLATFORMS = [
  { key: 'mobile', label: { zh: '移动端', en: 'Mobile' }, order: 1 },
  { key: 'desktop', label: { zh: 'PC 端', en: 'Desktop' }, order: 2 },
]

const ENTRY: RegistryEntry = {
  key: 'button',
  name: { zh: 'Button 按钮', en: 'Button' },
  description: { zh: '描述', en: 'Description' },
  category: 'basic',
  platform: 'desktop',
  tags: [{ zh: '基础', en: 'Basic' }],
  order: 1,
  visible: true,
  source: 'components/button',
  variants: [
    { id: 'solid', label: { zh: '实心', en: 'Solid' }, props: { type: 'solid' } },
    { id: 'outline', label: { zh: '描边', en: 'Outline' }, props: { type: 'outline' } },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedFetch.mockResolvedValue([ENTRY])
  mockedSave.mockResolvedValue({ ok: true })
})

describe('ComponentEdit', () => {
  it('renders the metadata form from the entry', () => {
    const wrapper = mount(ComponentEdit, { props: { entry: ENTRY, categories: CATEGORIES, platforms: PLATFORMS } })
    const inputs = wrapper.findAll('.edit__form input[type="text"]')
    // name zh/en + description zh/en + 2 tag 输入
    expect(inputs.length).toBeGreaterThanOrEqual(4)
    expect((inputs[0].element as HTMLInputElement).value).toBe('Button 按钮')
    expect((inputs[2].element as HTMLInputElement).value).toBe('描述')
    // 变体块与预览
    expect(wrapper.findAll('.edit__variant').length).toBe(2)
    expect(wrapper.findAll('.edit__preview-chip').length).toBe(2)
    expect(wrapper.find('.edit__preview-surface').exists()).toBe(true)
  })

  it('shows validation errors instead of saving when metadata is incomplete', async () => {
    mockedSave.mockResolvedValue({ ok: false, errors: ['组件 button 的 name 缺少双语文案'] })
    const wrapper = mount(ComponentEdit, { props: { entry: ENTRY, categories: CATEGORIES, platforms: PLATFORMS } })
    await wrapper.find('.edit__save').trigger('click')
    await flushPromises()
    expect(wrapper.find('.edit__errors').exists()).toBe(true)
    expect(wrapper.text()).toContain('name 缺少双语文案')
  })

  it('saves the full registry after editing a field', async () => {
    const wrapper = mount(ComponentEdit, { props: { entry: ENTRY, categories: CATEGORIES, platforms: PLATFORMS } })
    const inputs = wrapper.findAll('.edit__form input[type="text"]')
    await inputs[2].setValue('新描述')
    await wrapper.find('.edit__save').trigger('click')
    await flushPromises()
    expect(mockedFetch).toHaveBeenCalled()
    expect(mockedSave).toHaveBeenCalledTimes(1)
    const saved = mockedSave.mock.calls[0][0]
    expect(saved[0].description.zh).toBe('新描述')
    expect(saved).toHaveLength(1)
  })

  it('emits saved after a successful save', async () => {
    const wrapper = mount(ComponentEdit, { props: { entry: ENTRY, categories: CATEGORIES, platforms: PLATFORMS } })
    await wrapper.find('.edit__save').trigger('click')
    await flushPromises()
    // save() 成功后延迟 600ms 再 emit（让「已保存」toast 可见）
    await new Promise((r) => setTimeout(r, 700))
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('creates a new entry draft when entry is undefined (import flow)', async () => {
    const wrapper = mount(ComponentEdit, {
      props: { entry: undefined, entryKey: 'my-widget', categories: CATEGORIES, platforms: PLATFORMS },
    })
    const inputs = wrapper.findAll('.edit__form input[type="text"]')
    // 模板：name 空 + 默认分类 + 默认端 + 默认变体
    expect((inputs[0].element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('.edit__title').text()).toContain('my-widget')
    expect(wrapper.findAll('.edit__variant').length).toBe(1)
    // 新建默认端 = 第一个平台（mobile）
    const selects = wrapper.findAll('.edit__input--sm')
    expect((selects[1].element as HTMLSelectElement).value).toBe('mobile')
    // 填名称后保存 → fetchRegistry 拿到全量 → 新建条目 order 分配 max+1 后写入
    // （校验要求双语字段齐全：name/description/tags 的 zh+en）
    const values = ['我的组件', 'My Widget', '我的描述', 'My Description', '标签', 'Tag']
    for (let i = 0; i < values.length; i++) {
      await inputs[i].setValue(values[i])
    }
    await wrapper.find('.edit__save').trigger('click')
    await flushPromises()
    expect(mockedSave).toHaveBeenCalledTimes(1)
    const saved = mockedSave.mock.calls[0][0]
    expect(saved).toHaveLength(2) // 原 1 条 + 新 1 条
    const created = saved.find((e: RegistryEntry) => e.key === 'my-widget')
    expect(created).toBeDefined()
    expect(created?.name.zh).toBe('我的组件')
    expect(created?.order).toBe(2) // max(1) + 1
    expect(created?.category).toBe('basic') // 默认取第一个分类
  })
  it('keeps the platform field intact when saving an edit', async () => {
    const wrapper = mount(ComponentEdit, { props: { entry: ENTRY, categories: CATEGORIES, platforms: PLATFORMS } })
    await wrapper.find('.edit__save').trigger('click')
    await flushPromises()
    const saved = mockedSave.mock.calls[0][0]
    expect(saved[0].platform).toBe('desktop')
  })
})

