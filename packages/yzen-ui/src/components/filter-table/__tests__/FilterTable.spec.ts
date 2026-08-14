import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterTable from '../FilterTable.vue'
import type { FilterRow } from '../FilterTable.vue'

describe('YzFilterTable', () => {
  it('renders filter chips with counts and all data rows', () => {
    const wrapper = mount(FilterTable)
    const chips = wrapper.findAll('.yz-filter-table__chip')
    expect(chips).toHaveLength(4)
    // 全部 5 / 待办 2 / 进行中 2 / 已完成 1
    expect(chips[0].text()).toContain('全部')
    expect(chips[0].text()).toContain('5')
    expect(chips[1].text()).toContain('待办')
    expect(chips[1].text()).toContain('2')
    expect(chips[2].text()).toContain('进行中')
    expect(chips[2].text()).toContain('2')
    expect(chips[3].text()).toContain('已完成')
    expect(chips[3].text()).toContain('1')
    // 默认全部可见，首行内容与等宽日期
    expect(wrapper.findAll('.yz-filter-table__row-wrap')).toHaveLength(5)
    expect(wrapper.find('.yz-filter-table__cell--name').text()).toBe('校准极光相机阵列')
    expect(wrapper.find('.yz-filter-table__cell--date').text()).toBe('12-03')
    expect(wrapper.findAll('.yz-filter-table__status--todo')).toHaveLength(2)
    expect(wrapper.findAll('.yz-filter-table__status--progress')).toHaveLength(2)
    expect(wrapper.findAll('.yz-filter-table__status--done')).toHaveLength(1)
    // 首 chip 激活态
    expect(chips[0].attributes('aria-pressed')).toBe('true')
  })

  it('filters rows by status chip: hides others, emits update:modelValue + change', async () => {
    const wrapper = mount(FilterTable)
    const chips = wrapper.findAll('.yz-filter-table__chip')
    await chips[1].trigger('click') // 待办
    expect(chips[1].attributes('aria-pressed')).toBe('true')
    expect(chips[0].attributes('aria-pressed')).toBe('false')
    const wraps = wrapper.findAll('.yz-filter-table__row-wrap')
    expect(wraps.filter((w) => w.classes().includes('yz-filter-table__row-wrap--hidden'))).toHaveLength(3)
    expect(wrapper.findAll('.yz-filter-table__row-wrap:not(.yz-filter-table__row-wrap--hidden)')).toHaveLength(2)
    expect(wrapper.emitted('update:modelValue')).toEqual([['todo']])
    expect(wrapper.emitted('change')).toEqual([['todo']])
    // 点击相同 chip 不重复 emit
    await chips[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['todo']])
  })

  it('honors controlled modelValue and shows empty guard when nothing matches', () => {
    const wrapper = mount(FilterTable, { props: { modelValue: 'done' } })
    expect(wrapper.findAll('.yz-filter-table__row-wrap:not(.yz-filter-table__row-wrap--hidden)')).toHaveLength(1)
    expect(wrapper.find('.yz-filter-table__status--done').text()).toBe('已完成')
    // 无匹配筛选（不存在状态）→ 空守卫
    const empty = mount(FilterTable, { props: { modelValue: 'nope' } })
    expect(empty.find('.yz-filter-table__empty').text()).toBe('暂无匹配任务 · 0 条')
  })

  it('guards empty rows: zero counts and empty hint without runtime errors', () => {
    const wrapper = mount(FilterTable, { props: { rows: [] as FilterRow[] } })
    expect(wrapper.findAll('.yz-filter-table__chip')[0].text()).toContain('0')
    expect(wrapper.find('.yz-filter-table__empty').text()).toBe('暂无匹配任务 · 0 条')
    expect(wrapper.findAll('.yz-filter-table__row-wrap')).toHaveLength(0)
  })

  it('applies custom statuses and headers via props', () => {
    const wrapper = mount(FilterTable, {
      props: {
        headers: ['任务名', '日期', '状态', '负责人'],
        statuses: [{ key: 'todo', label: '待处理', dot: '#ff0000' }],
      },
    })
    expect(wrapper.find('.yz-filter-table__head-cell').text()).toBe('任务名')
    const chips = wrapper.findAll('.yz-filter-table__chip')
    expect(chips).toHaveLength(2)
    expect(chips[1].text()).toContain('待处理')
  })
})
