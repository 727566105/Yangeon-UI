import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VariantSwitcher from '../VariantSwitcher.vue'
import { setLocale } from '../../i18n'

beforeEach(() => {
  setLocale('zh')
})

const GROUPS = [
  { id: 'a-plain', label: '纯文本', group: '样式 A', props: {} },
  { id: 'a-links', label: '链接跳转', group: '样式 A', props: {} },
  { id: 'b-plain', label: '纯文本', group: '样式 B', props: {} },
  { id: 'b-links', label: '链接跳转', group: '样式 B', props: {} },
]

describe('VariantSwitcher', () => {
  it('renders flat buttons when variants have no group', () => {
    const wrapper = mount(VariantSwitcher, {
      props: {
        variants: [
          { id: 'a', label: 'A', props: {} },
          { id: 'b', label: 'B', props: {} },
        ],
        modelValue: 0,
      },
    })
    expect(wrapper.findAll('.variant-switcher__item')).toHaveLength(2)
    expect(wrapper.findAll('.variant-switcher__group')).toHaveLength(0)
  })

  it('renders only the active segment when multiple groups exist (tabs take over)', async () => {
    const wrapper = mount(VariantSwitcher, {
      props: { variants: GROUPS, modelValue: 0 },
    })
    // 多样式时组标题由 VariantTabs 承担，这里不再渲染标题
    expect(wrapper.findAll('.variant-switcher__group')).toHaveLength(0)
    // 只渲染激活段（样式 A）的按钮
    const btns = wrapper.findAll('.variant-switcher__item')
    expect(btns.map((b) => b.text())).toEqual(['纯文本', '链接跳转'])
    // 点击段内第 2 个 → emit 全局索引 1（不因段内渲染而偏移）
    await btns[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
  })

  it('follows modelValue across segments (active segment switches)', async () => {
    const wrapper = mount(VariantSwitcher, {
      props: { variants: GROUPS, modelValue: 0 },
    })
    await wrapper.setProps({ modelValue: 2 }) // 切到样式 B
    const btns = wrapper.findAll('.variant-switcher__item')
    expect(btns.map((b) => b.text())).toEqual(['纯文本', '链接跳转']) // B 段按钮
    // 全局 index 2 = B 段第 1 个，高亮跟随
    expect(btns[0].classes()).toContain('variant-switcher__item--active')
  })

  it('highlights the active variant by global index', () => {
    const wrapper = mount(VariantSwitcher, {
      props: { variants: GROUPS, modelValue: 2 },
    })
    const active = wrapper.find('.variant-switcher__item--active')
    expect(active.text()).toBe('纯文本') // 全局 index 2 = B 组第 1 个
  })

  it('renders an empty switcher for an empty variant list', () => {
    const wrapper = mount(VariantSwitcher, { props: { variants: [], modelValue: 0 } })
    expect(wrapper.findAll('.variant-switcher__item')).toHaveLength(0)
  })

  it('renders only the active segment for non-consecutive groups', () => {
    const wrapper = mount(VariantSwitcher, {
      props: {
        variants: [
          { id: 'a1', label: 'A1', group: '样式 A', props: {} },
          { id: 'b1', label: 'B1', group: '样式 B', props: {} },
          { id: 'a2', label: 'A2', group: '样式 A', props: {} },
        ],
        modelValue: 0,
      },
    })
    // 交叉组按连续段拆分；激活段（A1）只有 1 个按钮，其余段由 tabs 承载
    expect(wrapper.findAll('.variant-switcher__item').map((b) => b.text())).toEqual(['A1'])
  })

  it('keeps the group header next to pills for a single segment with a group', () => {
    const wrapper = mount(VariantSwitcher, {
      props: {
        variants: [
          { id: 'a', label: 'A', group: '样式 X', props: {} },
          { id: 'b', label: 'B', group: '样式 X', props: {} },
        ],
        modelValue: 0,
      },
    })
    // 单段（仅一个分组）无 tab 栏：标题保留在胶囊左侧
    expect(wrapper.findAll('.variant-switcher__group').map((g) => g.text())).toEqual(['样式 X'])
    expect(wrapper.findAll('.variant-switcher__item')).toHaveLength(2)
  })
})
