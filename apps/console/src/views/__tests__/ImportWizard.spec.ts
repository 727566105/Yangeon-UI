import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ImportWizard from '../ImportWizard.vue'
import type { RegistryEntry } from '@yzen-ui/shared'

vi.mock('../../api', () => ({
  importComponent: vi.fn(),
  fetchCategories: vi.fn(),
  fetchPlatforms: vi.fn(),
  fetchRegistry: vi.fn(),
  saveRegistry: vi.fn(),
}))

import { importComponent, fetchCategories, fetchPlatforms, fetchRegistry, saveRegistry } from '../../api'
const mockedImport = vi.mocked(importComponent)
const mockedFetchCats = vi.mocked(fetchCategories)
const mockedFetchPlats = vi.mocked(fetchPlatforms)
const mockedFetchReg = vi.mocked(fetchRegistry)
const mockedSave = vi.mocked(saveRegistry)

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
  tags: [{ zh: '基础', en: 'Basic' }],
  order: 1,
  visible: true,
  source: 'components/button',
  variants: [{ id: 'solid', label: { zh: '实心', en: 'Solid' }, props: {} }],
}

const SFC = '<template><div>hi</div></template>\n<script setup lang="ts">\nconst x = 1\n</script>'

// 表单字段顺序：key / 分类 select / 端 select / name zh / name en / desc zh / desc en / tag zh / tag en / textarea
async function fillForm(wrapper: ReturnType<typeof mount>, key: string) {
  const inputs = wrapper.findAll('.wizard__input')
  await inputs[0].setValue(key)
  await inputs[3].setValue('我的组件')
  await inputs[4].setValue('My Widget')
  await inputs[5].setValue('我的描述')
  await inputs[6].setValue('My Description')
  await inputs[7].setValue('标签')
  await inputs[8].setValue('Tag')
  await wrapper.find('.wizard__textarea').setValue(SFC)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedFetchCats.mockResolvedValue(CATEGORIES)
  mockedFetchPlats.mockResolvedValue(PLATFORMS)
  mockedFetchReg.mockResolvedValue([ENTRY])
  mockedImport.mockResolvedValue({ ok: true, name: 'MyWidget' })
  mockedSave.mockResolvedValue({ ok: true })
})

describe('ImportWizard', () => {
  it('renders metadata fields alongside the source editor', async () => {
    const wrapper = mount(ImportWizard)
    await flushPromises()
    // key + 分类 + 端 + name/desc/tag 双语 = 9 个输入
    expect(wrapper.findAll('.wizard__input').length).toBe(9)
    // 分类/端下拉由数据驱动（显示双语 label）
    const options = wrapper.findAll('.wizard__field select option')
    expect(options.map((o) => o.text())).toEqual(['基础组件', 'AI 场景', '移动端', 'PC 端'])
  })

  it('publishes in one step: creates files + writes the registry entry', async () => {
    const wrapper = mount(ImportWizard)
    await flushPromises()
    await fillForm(wrapper, 'my-widget')
    await wrapper.find('.wizard__import').trigger('click')
    await flushPromises()

    expect(mockedImport).toHaveBeenCalledWith('my-widget', SFC)
    expect(mockedSave).toHaveBeenCalledTimes(1)
    const saved = mockedSave.mock.calls[0][0]
    expect(saved).toHaveLength(2)
    const created = saved[1]
    expect(created.key).toBe('my-widget')
    expect(created.name.zh).toBe('我的组件')
    expect(created.name.en).toBe('My Widget')
    expect(created.category).toBe('basic') // 默认第一个分类
    expect(created.order).toBe(2) // max(1) + 1
    expect(created.visible).toBe(true)
    expect(created.variants).toEqual([
      { id: 'default', label: { zh: '默认', en: 'Default' }, props: {} },
    ])
    expect(wrapper.text()).toContain('已收录到展示站')
  })

  it('blocks publishing when bilingual metadata is incomplete', async () => {
    const wrapper = mount(ImportWizard)
    await flushPromises()
    const inputs = wrapper.findAll('.wizard__input')
    await inputs[0].setValue('my-widget')
    await inputs[2].setValue('只有中文') // name.en 留空
    await wrapper.find('.wizard__textarea').setValue(SFC)
    await wrapper.find('.wizard__import').trigger('click')
    await flushPromises()
    expect(mockedImport).not.toHaveBeenCalled()
    expect(mockedSave).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('名称 / 描述 / 标签需中英文都填写')
  })

  it('surfaces import API errors', async () => {
    mockedImport.mockResolvedValue({ ok: false, error: '组件目录已存在: components/my-widget' })
    const wrapper = mount(ImportWizard)
    await flushPromises()
    await fillForm(wrapper, 'my-widget')
    await wrapper.find('.wizard__import').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('组件目录已存在')
    expect(mockedSave).not.toHaveBeenCalled()
  })
})
