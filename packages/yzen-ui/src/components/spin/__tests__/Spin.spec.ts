import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Spin from '../Spin.vue'

describe('YzSpin', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders the classic 4-dot spinner with staggered delays when percent <= 0', () => {
    const wrapper = mount(Spin, { props: { percent: 0 } })
    expect(wrapper.classes()).toContain('yz-spin')
    const items = wrapper.findAll('.yz-spin__item')
    expect(items).toHaveLength(4)
    // 旋转点结构（45° 基准 + 405° 循环动画在 scoped CSS，ego 实测验证 animationName）
    expect(wrapper.find('.yz-spin__dot').exists()).toBe(true)
    // percent=0：旋转点可见，无进度环
    expect(wrapper.find('.yz-spin__dot-holder--hidden').exists()).toBe(false)
    expect(wrapper.find('.yz-spin__progress').exists()).toBe(false)
  })

  it('renders an SVG progress ring and hides the dots when percent > 0', () => {
    const wrapper = mount(Spin, { props: { percent: 40 } })
    expect(wrapper.find('.yz-spin__dot-holder--hidden').exists()).toBe(true)
    const svg = wrapper.find('.yz-spin__progress svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('role')).toBe('progressbar')
    expect(svg.attributes('aria-valuenow')).toBe('40')
    // 40% → dasharray 40% + 60%，dashoffset 固定 1/4 周长（顶部起点）
    const circle = wrapper.findAll('.yz-spin__circle')[1]
    const style = circle.attributes('style') ?? ''
    const C = 50 * 2 * Math.PI
    expect(style).toContain(`stroke-dasharray: ${(C * 40) / 100}px ${(C * 60) / 100}px`)
    expect(style).toContain(`stroke-dashoffset: ${C / 4}px`)
  })

  it('clamps out-of-range percents to 0-100 for the ring', () => {
    const over = mount(Spin, { props: { percent: 150 } })
    expect(over.find('.yz-spin__progress svg').attributes('aria-valuenow')).toBe('100')
    const under = mount(Spin, { props: { percent: -50 } })
    expect(under.find('.yz-spin__progress').exists()).toBe(false)
    expect(under.find('.yz-spin__dot-holder--hidden').exists()).toBe(false)
  })

  it('auto mode advances a mock percent with the antd decelerating buckets', async () => {
    const wrapper = mount(Spin, { props: { percent: 'auto' } })
    expect(wrapper.find('.yz-spin__progress svg').exists()).toBe(false)
    // 200ms 一跳：0 → 0 + 100*0.05 = 5 → 5 + 95*0.05 = 9.75 → …（首桶 30 前 step 0.05）
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.find('.yz-spin__progress svg').attributes('aria-valuenow')).toBe('5')
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.find('.yz-spin__progress svg').attributes('aria-valuenow')).toBe('9.75')
    // 超过 30 进第二桶（step 0.03），单调不减
    vi.advanceTimersByTime(200 * 100)
    await nextTick()
    const now = Number(wrapper.find('.yz-spin__progress svg').attributes('aria-valuenow'))
    expect(now).toBeGreaterThan(9.75)
    expect(now).toBeLessThanOrEqual(100)
  })

  it('does not render the indicator when spinning=false', () => {
    const wrapper = mount(Spin, { props: { spinning: false } })
    expect(wrapper.find('.yz-spin__section').exists()).toBe(false)
    expect(wrapper.find('.yz-spin__dot-holder').exists()).toBe(false)
  })

  it('applies size classes and renders the tip text', () => {
    const wrapper = mount(Spin, { props: { size: 'large', tip: '加载中…', percent: 0 } })
    expect(wrapper.classes()).toContain('yz-spin--large')
    expect(wrapper.find('.yz-spin__tip').text()).toBe('加载中…')
    const small = mount(Spin, { props: { size: 'small' } })
    expect(small.classes()).toContain('yz-spin--small')
  })

  it('container mode wraps slot content and masks it while spinning', () => {
    const wrapper = mount(Spin, {
      props: { tip: 'Loading' },
      slots: { default: '<div class="inner">content</div>' },
    })
    // 容器模式：standalone 类不出现，内容在 container 内
    expect(wrapper.classes()).not.toContain('yz-spin--standalone')
    const container = wrapper.find('.yz-spin__container')
    expect(container.exists()).toBe(true)
    expect(container.find('.inner').text()).toBe('content')
    // spinning（默认 true）：内容半透明 + 遮罩类；覆盖层 nested 绝对定位
    expect(container.classes()).toContain('yz-spin__container--spinning')
    expect(wrapper.find('.yz-spin__section--nested').exists()).toBe(true)
    // description 显示在覆盖层
    expect(wrapper.find('.yz-spin__tip').text()).toBe('Loading')
  })

  it('container mode unmasks content and hides the overlay when spinning=false', () => {
    const wrapper = mount(Spin, {
      props: { spinning: false },
      slots: { default: '<div class="inner">x</div>' },
    })
    expect(wrapper.find('.yz-spin__container--spinning').exists()).toBe(false)
    expect(wrapper.find('.yz-spin__section').exists()).toBe(false)
    // 内容仍然渲染（仅指示器隐藏）
    expect(wrapper.find('.inner').text()).toBe('x')
  })

  it('standalone mode (no slot) keeps inline centering without container', () => {
    const wrapper = mount(Spin)
    expect(wrapper.classes()).toContain('yz-spin--standalone')
    expect(wrapper.find('.yz-spin__container').exists()).toBe(false)
    expect(wrapper.find('.yz-spin__section--nested').exists()).toBe(false)
  })
})
