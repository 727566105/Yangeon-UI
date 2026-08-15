import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from '../Tabs.vue'

const ITEMS = [
  { key: '1', label: 'Tab 1', content: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', content: 'Content of Tab Pane 2' },
  { key: '3', label: 'Tab 3', content: 'Content of Tab Pane 3' },
]

describe('YzTabs', () => {
  it('renders tab labels and the first tab active by default (uncontrolled)', () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS } })
    const tabs = wrapper.findAll('.yz-tabs__tab')
    expect(tabs.map((t) => t.text())).toEqual(['Tab 1', 'Tab 2', 'Tab 3'])
    expect(tabs[0].classes()).toContain('yz-tabs__tab--active')
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    // 默认面板内容 = 第一个 tab
    expect(wrapper.find('.yz-tabs__panel').text()).toBe('Content of Tab Pane 1')
    // 指示器元素存在
    expect(wrapper.find('.yz-tabs__indicator').exists()).toBe(true)
  })

  it('switches the active tab and panel on click (uncontrolled)', async () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS } })
    await wrapper.findAll('.yz-tabs__tab')[2].trigger('click')
    expect(wrapper.find('.yz-tabs__tab--active').text()).toBe('Tab 3')
    expect(wrapper.find('.yz-tabs__panel').text()).toBe('Content of Tab Pane 3')
    expect(wrapper.emitted('change')).toEqual([['3']])
    // 非受控模式不 emit update:activeKey
    expect(wrapper.emitted('update:activeKey')).toBeUndefined()
  })

  it('works in controlled mode (v-model:activeKey)', async () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS, activeKey: '2' } })
    expect(wrapper.find('.yz-tabs__tab--active').text()).toBe('Tab 2')
    await wrapper.findAll('.yz-tabs__tab')[0].trigger('click')
    expect(wrapper.emitted('update:activeKey')).toEqual([['1']])
    expect(wrapper.emitted('change')).toEqual([['1']])
  })

  it('applies the align class and default center', () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS } })
    expect(wrapper.find('.yz-tabs').classes()).toContain('yz-tabs--center')
    const start = mount(Tabs, { props: { items: ITEMS, align: 'start' } })
    expect(start.find('.yz-tabs').classes()).toContain('yz-tabs--start')
    const end = mount(Tabs, { props: { items: ITEMS, align: 'end' } })
    expect(end.find('.yz-tabs').classes()).toContain('yz-tabs--end')
  })

  it('renders an empty nav and panel for an empty item list', () => {
    const wrapper = mount(Tabs, { props: { items: [] } })
    expect(wrapper.findAll('.yz-tabs__tab')).toHaveLength(0)
    expect(wrapper.find('.yz-tabs__panel').text()).toBe('')
  })

  it('applies the type class and hides the indicator for card tabs', () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS, type: 'card' } })
    expect(wrapper.find('.yz-tabs').classes()).toContain('yz-tabs--card')
    expect(wrapper.find('.yz-tabs__nav').classes()).toContain('yz-tabs__nav--card')
    // card 类型无下划线指示器
    expect(wrapper.find('.yz-tabs__indicator').exists()).toBe(false)
    // 无编辑控件
    expect(wrapper.find('.yz-tabs__add').exists()).toBe(false)
    expect(wrapper.find('.yz-tabs__close').exists()).toBe(false)
  })

  it('applies the size class', () => {
    const small = mount(Tabs, { props: { items: ITEMS, size: 'small' } })
    expect(small.find('.yz-tabs').classes()).toContain('yz-tabs--small')
    const large = mount(Tabs, { props: { items: ITEMS, size: 'large' } })
    expect(large.find('.yz-tabs').classes()).toContain('yz-tabs--large')
    const medium = mount(Tabs, { props: { items: ITEMS } })
    expect(medium.find('.yz-tabs').classes()).toContain('yz-tabs--medium')
  })

  it('renders editable-card with add and close controls', async () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS, type: 'editable-card' } })
    // 每个 tab 一个关闭按钮 + 末尾一个添加按钮
    expect(wrapper.findAll('.yz-tabs__close')).toHaveLength(3)
    expect(wrapper.find('.yz-tabs__add').exists()).toBe(true)
    // 点关闭 → emit remove(key)
    await wrapper.findAll('.yz-tabs__close')[1].trigger('click')
    expect(wrapper.emitted('remove')).toEqual([['2']])
    // 点添加 → emit add
    await wrapper.find('.yz-tabs__add').trigger('click')
    expect(wrapper.emitted('add')).toBeTruthy()
  })

  it('still switches tabs when clicking inside an editable tab (close is stop-modified)', async () => {
    const wrapper = mount(Tabs, { props: { items: ITEMS, type: 'editable-card' } })
    // 点标签本体（非关闭钮）→ change
    await wrapper.findAll('.yz-tabs__tab')[2].trigger('click')
    expect(wrapper.emitted('change')).toEqual([['3']])
    // 点关闭钮 → 只 emit remove，不 emit change
    await wrapper.findAll('.yz-tabs__close')[2].trigger('click')
    expect(wrapper.emitted('change')).toEqual([['3']])
    expect(wrapper.emitted('remove')).toEqual([['3']])
  })
})
