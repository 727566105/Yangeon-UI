import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffTable from '../DiffTable.vue'
import type { DiffRow } from '../DiffTable.vue'

describe('YzDiffTable', () => {
  it('renders card title, column headers, rows with chips and mono suppliers', () => {
    const wrapper = mount(DiffTable)
    expect(wrapper.find('.yz-diff-table__bar-title').text()).toBe('观测任务调整建议')
    expect(wrapper.findAll('.yz-diff-table__th').map((n) => n.text())).toEqual([
      '观测任务',
      '类别',
      '数据源',
    ])
    expect(wrapper.findAll('.yz-diff-table__row')).toHaveLength(3)
    expect(wrapper.find('.yz-diff-table__cell--name').text()).toBe('北境极光校准')
    expect(wrapper.find('.yz-diff-table__dot--accent').exists()).toBe(true)
    expect(wrapper.find('.yz-diff-table__dot--ink').exists()).toBe(true)
    expect(wrapper.find('.yz-diff-table__cell--supplier').text()).toBe('aurora-scoops')
    // 建议插入行默认折叠
    expect(wrapper.find('.yz-diff-table__bar-toggle').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.yz-diff-table__collapse--open').exists()).toBe(false)
  })

  it('expands the proposed insert row: collapse opens, emits update:expanded + expand', async () => {
    const wrapper = mount(DiffTable)
    const toggle = wrapper.find('.yz-diff-table__bar-toggle')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.yz-diff-table__collapse--open').exists()).toBe(true)
    expect(wrapper.find('.yz-diff-table__proposed-name').text()).toBe('春分峰值预报')
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
    expect(wrapper.emitted('expand')).toEqual([[true]])
    // 再点折叠（双向过渡）
    await toggle.trigger('click')
    expect(wrapper.emitted('update:expanded')).toEqual([[true], [false]])
    expect(wrapper.find('.yz-diff-table__collapse--open').exists()).toBe(false)
  })

  it('toggles row applied state: emits update:rows + toggle, strikes supplier', async () => {
    const wrapper = mount(DiffTable)
    const firstRow = wrapper.findAll('.yz-diff-table__row')[0]
    await firstRow.trigger('click')
    expect(firstRow.classes()).toContain('yz-diff-table__row--applied')
    const updated = wrapper.emitted('update:rows')![0][0] as DiffRow[]
    expect(updated[0].applied).toBe(true)
    expect(updated[1].applied).toBeUndefined()
    expect(wrapper.emitted('toggle')).toEqual([[{ id: 'r1', applied: true }]])
    // 再次点击撤销
    await firstRow.trigger('click')
    const reverted = wrapper.emitted('update:rows')![1][0] as DiffRow[]
    expect(reverted[0].applied).toBe(false)
    expect(wrapper.emitted('toggle')).toEqual([
      [{ id: 'r1', applied: true }],
      [{ id: 'r1', applied: false }],
    ])
  })

  it('honors controlled props: rows with applied and expanded=true render accordingly', () => {
    const rows: DiffRow[] = [
      { id: 'x1', name: '甲', category: '重点', supplier: 's1', applied: true },
      { id: 'x2', name: '乙', category: '存档', supplier: 's2' },
    ]
    const wrapper = mount(DiffTable, { props: { rows, expanded: true } })
    expect(wrapper.find('.yz-diff-table__row--applied').exists()).toBe(true)
    expect(wrapper.find('.yz-diff-table__collapse--open').exists()).toBe(true)
    // proposed: null 时隐藏切换按钮与建议行
    const noProposed = mount(DiffTable, { props: { rows, proposed: null } })
    expect(noProposed.find('.yz-diff-table__bar-toggle').exists()).toBe(false)
    expect(noProposed.find('.yz-diff-table__proposed').exists()).toBe(false)
  })

  it('guards empty rows: renders empty hint without runtime errors', () => {
    const wrapper = mount(DiffTable, { props: { rows: [], proposed: null } })
    expect(wrapper.find('.yz-diff-table__empty').text()).toBe('暂无待处理的变更')
    expect(wrapper.findAll('.yz-diff-table__row')).toHaveLength(1)
  })
})
