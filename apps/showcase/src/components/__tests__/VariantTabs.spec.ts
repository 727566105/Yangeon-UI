import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VariantTabs from '../VariantTabs.vue'
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

describe('VariantTabs', () => {
  it('renders one tab per group with the group title', () => {
    const wrapper = mount(VariantTabs, { props: { variants: GROUPS, modelValue: 0 } })
    const tabs = wrapper.findAll('.variant-tabs__tab')
    expect(tabs.map((t) => t.text())).toEqual(['样式 A', '样式 B'])
  })

  it('marks the segment containing modelValue as active', () => {
    const wrapper = mount(VariantTabs, { props: { variants: GROUPS, modelValue: 3 } })
    const tabs = wrapper.findAll('.variant-tabs__tab')
    expect(tabs[0].classes()).not.toContain('variant-tabs__tab--active')
    expect(tabs[1].classes()).toContain('variant-tabs__tab--active')
    expect(tabs[1].attributes('aria-selected')).toBe('true')
  })

  it('emits the first variant index of the segment when a tab is clicked', async () => {
    const wrapper = mount(VariantTabs, { props: { variants: GROUPS, modelValue: 0 } })
    await wrapper.findAll('.variant-tabs__tab')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([2]) // B 段第一个 = 全局 index 2
  })

  it('remembers the last selected variant per segment when switching away and back', async () => {
    const wrapper = mount(VariantTabs, { props: { variants: GROUPS, modelValue: 2 } })
    // 在 B 段内切到 index 3
    await wrapper.setProps({ modelValue: 3 })
    // 切回 A 段（index 0），再点回 B tab → 恢复 3，而不是回到段首 2
    await wrapper.setProps({ modelValue: 0 })
    await wrapper.findAll('.variant-tabs__tab')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([3])
  })

  it('renders no tabs for an empty variant list', () => {
    const wrapper = mount(VariantTabs, { props: { variants: [], modelValue: 0 } })
    expect(wrapper.findAll('.variant-tabs__tab')).toHaveLength(0)
  })

  it('splits non-consecutive groups into separate tabs', () => {
    const wrapper = mount(VariantTabs, {
      props: {
        variants: [
          { id: 'a1', label: 'A1', group: '样式 A', props: {} },
          { id: 'b1', label: 'B1', group: '样式 B', props: {} },
          { id: 'a2', label: 'A2', group: '样式 A', props: {} },
        ],
        modelValue: 0,
      },
    })
    const tabs = wrapper.findAll('.variant-tabs__tab')
    expect(tabs.map((t) => t.text())).toEqual(['样式 A', '样式 B', '样式 A'])
    expect(tabs[0].classes()).toContain('variant-tabs__tab--active')
  })
})
