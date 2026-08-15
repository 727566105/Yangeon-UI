import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Platforms from '../Platforms.vue'

vi.mock('../../api', () => ({
  fetchPlatforms: vi.fn(),
  savePlatforms: vi.fn(),
  fetchRegistry: vi.fn(),
}))

import { fetchPlatforms, savePlatforms, fetchRegistry } from '../../api'
const mockedFetch = vi.mocked(fetchPlatforms)
const mockedSave = vi.mocked(savePlatforms)
const mockedFetchReg = vi.mocked(fetchRegistry)

const PLATFORMS = [
  { key: 'mobile', label: { zh: '移动端', en: 'Mobile' }, order: 1 },
  { key: 'desktop', label: { zh: 'PC 端', en: 'Desktop' }, order: 2 },
]

const ENTRY = {
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
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedFetch.mockResolvedValue(PLATFORMS)
  mockedFetchReg.mockResolvedValue([ENTRY])
  mockedSave.mockResolvedValue({ ok: true })
})

describe('Platforms', () => {
  it('renders the platform list with usage counts', async () => {
    const wrapper = mount(Platforms)
    await flushPromises()
    const rows = wrapper.findAll('.plats__row')
    expect(rows).toHaveLength(2)
    // desktop 被 1 个组件使用，删除按钮禁用
    const desktop = rows[1]
    expect(desktop.findAll('input')[0].element).toHaveProperty('disabled', true)
    const del = desktop.findAll('.plats__mini').find((b) => b.text() === '✕')!
    expect((del.element as HTMLButtonElement).disabled).toBe(true)
    // mobile 未被使用，可删除
    const mobileDel = rows[0].findAll('.plats__mini').find((b) => b.text() === '✕')!
    expect((mobileDel.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('adds a platform and saves with renumbered order', async () => {
    const wrapper = mount(Platforms)
    await flushPromises()
    await wrapper.find('.plats__add').trigger('click')
    const rows = wrapper.findAll('.plats__row')
    expect(rows).toHaveLength(3)
    await rows[2].findAll('input')[1].setValue('平板')
    await rows[2].findAll('input')[2].setValue('Tablet')
    await rows[2].findAll('input')[0].setValue('tablet')
    await wrapper.find('.plats__save').trigger('click')
    await flushPromises()
    expect(mockedSave).toHaveBeenCalledTimes(1)
    const saved = mockedSave.mock.calls[0][0]
    expect(saved.map((p: { key: string; order: number }) => [p.key, p.order])).toEqual([
      ['mobile', 1],
      ['desktop', 2],
      ['tablet', 3],
    ])
  })
})
