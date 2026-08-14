import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InsightCards from '../InsightCards.vue'

describe('YzInsightCards', () => {
  it('renders header, insight text with mention and codes, metrics and follow-up', () => {
    const wrapper = mount(InsightCards)
    expect(wrapper.find('.yz-insight-cards__name').text()).toBe('Insights')
    expect(wrapper.find('.yz-insight-cards__count').text()).toBe('3')
    // 提及 + 等宽数据代码段
    expect(wrapper.find('.yz-insight-cards__mention').text()).toBe('@Creamery')
    expect(wrapper.findAll('.yz-insight-cards__code').map((n) => n.text())).toEqual([
      '-6%',
      '-$2,453.44',
    ])
    // 指标两栏与 17px 主数值
    expect(wrapper.findAll('.yz-insight-cards__metric')).toHaveLength(2)
    expect(wrapper.find('.yz-insight-cards__value').text()).toBe('-4.41%')
    expect(wrapper.find('.yz-insight-cards__delta').text()).toBe('-$2,377.66')
    // 追问按钮
    expect(wrapper.find('.yz-insight-cards__ask').text()).toBe('Should I rebalance flavors?')
    // 图表渲染两条序列
    expect(wrapper.findAll('.yz-insight-cards__line')).toHaveLength(2)
  })

  it('pages through insights and emits update:activeIndex + change', async () => {
    const wrapper = mount(InsightCards)
    const prev = wrapper.find('.yz-insight-cards__nav-btn[aria-label="Previous insight"]')
    const next = wrapper.find('.yz-insight-cards__nav-btn[aria-label="Next insight"]')
    expect(prev.attributes('disabled')).toBeDefined()
    await next.trigger('click')
    expect(wrapper.emitted('update:activeIndex')).toEqual([[1]])
    expect(wrapper.emitted('change')).toEqual([[1]])
    expect(wrapper.find('.yz-insight-cards__mention').text()).toBe('@Polar Array')
    await next.trigger('click')
    await next.trigger('click')
    // 末页后 next 禁用，不再发事件
    expect(wrapper.emitted('update:activeIndex')).toEqual([[1], [2]])
    expect(next.attributes('disabled')).toBeDefined()
    await prev.trigger('click')
    expect(wrapper.emitted('update:activeIndex')).toEqual([[1], [2], [1]])
  })

  it('emits ask with current follow-up text and toggles chart series', async () => {
    const wrapper = mount(InsightCards)
    await wrapper.find('.yz-insight-cards__ask').trigger('click')
    expect(wrapper.emitted('ask')).toEqual([['Should I rebalance flavors?']])
    const legendBtns = wrapper.findAll('.yz-insight-cards__legend-btn')
    expect(legendBtns[0].attributes('aria-pressed')).toBe('true')
    await legendBtns[0].trigger('click')
    expect(wrapper.findAll('.yz-insight-cards__line')).toHaveLength(1)
    expect(legendBtns[0].attributes('aria-pressed')).toBe('false')
  })

  it('feeds live chart data with fake timers and stops on live=false', async () => {
    vi.useFakeTimers()
    const wrapper = mount(InsightCards, { props: { live: true } })
    const svg = wrapper.find('.yz-insight-cards__chart')
    expect(svg.attributes('data-tick')).toBe('0')
    await vi.advanceTimersByTimeAsync(1200)
    expect(svg.attributes('data-tick')).toBe('1')
    await vi.advanceTimersByTimeAsync(2400)
    expect(svg.attributes('data-tick')).toBe('3')
    // 关闭 live 后数据流停止
    await wrapper.setProps({ live: false })
    const tickAfter = svg.attributes('data-tick')
    await vi.advanceTimersByTimeAsync(3600)
    expect(svg.attributes('data-tick')).toBe(tickAfter)
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('renders static snapshot without timers when live is false', () => {
    vi.useFakeTimers()
    const wrapper = mount(InsightCards, { props: { live: false } })
    const svg = wrapper.find('.yz-insight-cards__chart')
    expect(svg.attributes('data-tick')).toBe('0')
    vi.advanceTimersByTime(5000)
    expect(svg.attributes('data-tick')).toBe('0')
    vi.useRealTimers()
    wrapper.unmount()
  })
})
