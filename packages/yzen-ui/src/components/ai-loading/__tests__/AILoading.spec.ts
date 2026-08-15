import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AILoading from '../AILoading.vue'

describe('YzAILoading', () => {
  it('renders drive variant: 9 square cells with chevron wave delays', () => {
    const wrapper = mount(AILoading, { props: { variant: 'drive', timer: false } })
    expect(wrapper.classes()).toContain('yz-ai-loading')
    const cells = wrapper.findAll('.yz-ai-loading__cell')
    expect(cells).toHaveLength(9)
    // 全部非冻结（Drive 无 null 延迟）
    expect(wrapper.findAll('.yz-ai-loading__cell--frozen')).toHaveLength(0)
    // 方格子（无 round 类）
    expect(wrapper.findAll('.yz-ai-loading__cell--round')).toHaveLength(0)
    // chevron 波形延迟（源码: (c + |r-1|) * 90）：第一行 90/180/270（简写 animation 内 delay）
    const firstRowAnim = cells[0].attributes('style') ?? ''
    expect(firstRowAnim).toContain('yz-pixel-on 650ms ease-in-out 90ms infinite')
    expect(wrapper.find('.yz-ai-loading__shimmer').text()).toBe('Churning')
  })

  it('renders dots variant: same wave, round cells', () => {
    const wrapper = mount(AILoading, { props: { variant: 'dots', timer: false } })
    expect(wrapper.findAll('.yz-ai-loading__cell')).toHaveLength(9)
    expect(wrapper.findAll('.yz-ai-loading__cell--round')).toHaveLength(9)
  })

  it('renders orbit variant: comet lapping grid perimeter', () => {
    const wrapper = mount(AILoading, { props: { variant: 'orbit', timer: false } })
    const cells = wrapper.findAll('.yz-ai-loading__cell')
    expect(cells).toHaveLength(9)
    // 中心格冻结（OPBIT_ORDER 不含 4），其余 8 格绕行
    expect(wrapper.findAll('.yz-ai-loading__cell--frozen')).toHaveLength(1)
    expect(cells[4].classes()).toContain('yz-ai-loading__cell--frozen')
    // 绕行延迟 k*110，时长 950ms（简写 animation 内 delay）
    expect(cells[0].attributes('style') ?? '').toContain('yz-pixel-on 950ms ease-in-out 0ms infinite')
    expect(cells[1].attributes('style') ?? '').toContain('yz-pixel-on 950ms ease-in-out 110ms infinite')
    expect(wrapper.find('.yz-ai-loading__shimmer').text()).toBe('Churning')
  })

  it('formats elapsed under 60s as seconds', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AILoading, { props: { variant: 'drive', timer: true } })
    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.find('.yz-ai-loading__timer').text()).toBe('0.5s')
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('formats elapsed over 60s as Xm Y.Ys', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AILoading, { props: { variant: 'drive', timer: true } })
    await vi.advanceTimersByTimeAsync(61_500)
    expect(wrapper.find('.yz-ai-loading__timer').text()).toBe('1m 1.5s')
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('uses custom label', () => {
    const wrapper = mount(AILoading, { props: { variant: 'orbit', label: 'Analyzing' } })
    expect(wrapper.find('.yz-ai-loading__shimmer').text()).toBe('Analyzing')
  })
})
