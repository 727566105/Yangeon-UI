import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecordsTable from '../RecordsTable.vue'
import type { RecordRow } from '../RecordsTable.vue'

// 默认 7 行：强度值 very-strong=90, strong=70, weak=40, none=0, very-weak=20, strong=70, very-strong=90
describe('YzRecordsTable', () => {
  it('renders headers, all rows and computed tfoot summary from data', () => {
    const wrapper = mount(RecordsTable)
    const heads = wrapper.findAll('.yz-records-table__head')
    expect(heads).toHaveLength(5)
    expect(heads[0].text()).toContain('公司')
    expect(heads[2].text()).toContain('最近交互')
    expect(wrapper.findAll('.yz-records-table__row')).toHaveLength(7)
    // 首行名称与等宽数据元素
    expect(wrapper.find('.yz-records-table__name').text()).toBe('辉光穹顶观测站 — 特罗姆瑟')
    expect(wrapper.find('.yz-records-table__mark').text()).toBe('辉')
    expect(wrapper.find('.yz-records-table__cell--mono').text()).toBe('2 days ago')
    // tfoot 汇总与 rows 同源：count=7、links=5、average=(90+70+40+0+20+70+90)/7≈54%
    const footText = wrapper.find('.yz-records-table__foot-row').text()
    expect(footText).toContain('7')
    expect(footText).toContain('count')
    expect(footText).toContain('5')
    expect(footText).toContain('54')
    expect(footText).toContain('average')
    expect(footText).toContain('links')
    // Add calculation 按钮存在
    expect(wrapper.find('.yz-records-table__add-calculation').text()).toBe('Add calculation')
  })

  it('sorts rows by connection strength (desc) and toggles dir, emitting update + sort', async () => {
    const wrapper = mount(RecordsTable)
    const strengthBtn = wrapper.findAll('.yz-records-table__sort-btn')[1]
    const strengthTh = wrapper.findAll('.yz-records-table__head')[3]
    await strengthBtn.trigger('click')
    expect(strengthTh.attributes('aria-sort')).toBe('ascending')
    // 升序第一行应为强度 none（磁力计阵列 — 阿比斯库）
    expect(wrapper.find('.yz-records-table__row .yz-records-table__name').text()).toBe('磁力计阵列 — 阿比斯库')
    expect(wrapper.emitted('update:sortKey')).toEqual([['strength']])
    expect(wrapper.emitted('update:sortDir')).toEqual([['asc']])
    expect(wrapper.emitted('sort')).toEqual([['strength', 'asc']])
    // 再次点击 → 降序，第一行变为 very-strong
    await strengthBtn.trigger('click')
    expect(strengthTh.attributes('aria-sort')).toBe('descending')
    expect(wrapper.find('.yz-records-table__row .yz-records-table__name').text()).toBe('辉光穹顶观测站 — 特罗姆瑟')
    expect(wrapper.emitted('update:sortDir')).toEqual([['asc'], ['desc']])
  })

  it('sorts by lastInteraction days and honors controlled sortKey props', async () => {
    const wrapper = mount(RecordsTable, { props: { sortKey: 'lastInteraction', sortDir: 'asc' } })
    const first = wrapper.findAll('.yz-records-table__sort-btn')[0]
    const lastTh = wrapper.findAll('.yz-records-table__head')[2]
    expect(lastTh.attributes('aria-sort')).toBe('ascending')
    // 天数升序 → 2 days ago（辉光穹顶）排第一
    expect(wrapper.find('.yz-records-table__row .yz-records-table__name').text()).toBe('辉光穹顶观测站 — 特罗姆瑟')
    await first.trigger('click')
    expect(wrapper.emitted('update:sortDir')).toEqual([['desc']])
  })

  it('selects rows and toggles select-all with partial state, emitting update:selected', async () => {
    const wrapper = mount(RecordsTable)
    const rowChecks = wrapper.findAll('.yz-records-table__row .yz-records-table__check input')
    await rowChecks[0].setValue(true)
    expect(wrapper.emitted('update:selected')).toEqual([[['r1']]])
    await rowChecks[1].setValue(true)
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['r1', 'r2']])
    // 全选框进入半选态（DOM 属性 indeterminate）
    const allCheck = wrapper.find('.yz-records-table__head--company input').element as HTMLInputElement
    expect(allCheck.indeterminate).toBe(true)
    // 全选
    await wrapper.find('.yz-records-table__head--company input').setValue(true)
    const all = wrapper.emitted('update:selected')?.at(-1) as unknown[]
    expect(all[0]).toHaveLength(7)
    const allEl = wrapper.find('.yz-records-table__head--company input').element as HTMLInputElement
    expect(allEl.indeterminate).toBe(false)
    // 再点全选 → 清空
    await wrapper.find('.yz-records-table__head--company input').setValue(false)
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([[]])
  })

  it('guards empty rows: empty hint and zeroed summary without runtime errors', () => {
    const wrapper = mount(RecordsTable, { props: { rows: [] as RecordRow[] } })
    expect(wrapper.find('.yz-records-table__empty-row').text()).toBe('暂无观测记录 · 0 条')
    expect(wrapper.findAll('.yz-records-table__row')).toHaveLength(0)
    const footText = wrapper.find('.yz-records-table__foot-row').text()
    expect(footText).toContain('0')
    expect(footText).toContain('links')
  })

  it('applies custom headers and falls back strength labels for unknown keys', () => {
    const wrapper = mount(RecordsTable, {
      props: {
        headers: ['观测站', '分类', '最近交互', '连接强度', '链接'],
        rows: [
          {
            id: 'x1',
            name: '测试站',
            lastInteraction: '1 day ago',
            lastInteractionDays: 1,
            // @ts-expect-error 未知强度 key（B2 守卫走 none 兜底）
            strength: 'unknown',
          },
        ],
      },
    })
    expect(wrapper.find('.yz-records-table__head').text()).toContain('观测站')
    expect(wrapper.find('.yz-records-table__strength-label').text()).toBe('No communication')
    expect(wrapper.find('.yz-records-table__muted').text()).toBe('—')
  })
})
