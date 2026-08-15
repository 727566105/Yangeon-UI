import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BorderBeam from '../BorderBeam.vue'
import { getBorderBeamGradient } from '../util'

describe('getBorderBeamGradient', () => {
  it('builds a two-stop fade gradient from a single color', () => {
    // 单色 → [0%] + fill end 100%，缩放到 0-70% 尾部淡出
    expect(getBorderBeamGradient('#1677ff')).toBe(
      'linear-gradient(to left, #1677ff 0%, #1677ff 70%, transparent)',
    )
  })

  it('scales authored stops into the 0-70 visible beam segment', () => {
    // antd demo 的 Ocean 预设：0/52/100 → 0/36.4/70
    expect(
      getBorderBeamGradient([
        { color: '#1677ff', percent: 0 },
        { color: '#36cfc9', percent: 52 },
        { color: '#95de64', percent: 100 },
      ]),
    ).toBe(
      'linear-gradient(to left, #1677ff 0%, #36cfc9 36.4%, #95de64 70%, transparent)',
    )
  })

  it('clamps out-of-range percents and keeps the last stop at the tail', () => {
    expect(
      getBorderBeamGradient([
        { color: '#7c3aed', percent: -10 },
        { color: '#06b6d4', percent: 57 },
        { color: '#67e8f9', percent: 130 },
      ]),
    ).toBe('linear-gradient(to left, #7c3aed 0%, #06b6d4 39.9%, #67e8f9 70%, transparent)')
  })

  it('returns undefined for empty input', () => {
    expect(getBorderBeamGradient()).toBeUndefined()
    expect(getBorderBeamGradient([])).toBeUndefined()
  })
})

describe('YzBorderBeam', () => {
  it('renders a single beam layer with slot content and exposes css vars', () => {
    const wrapper = mount(BorderBeam, {
      props: {
        color: [{ color: '#1677ff', percent: 0 }, { color: '#95de64', percent: 100 }],
        duration: 8,
        lineWidth: 2,
        size: 120,
        radius: 12,
      },
      slots: { default: '<div class="inner">card</div>' },
    })
    expect(wrapper.classes()).toContain('yz-border-beam')
    expect(wrapper.find('.inner').text()).toBe('card')
    // 光束层 aria-hidden + 单个光斑
    expect(wrapper.find('.yz-border-beam__layer').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.yz-border-beam__orb')).toHaveLength(1)
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('--yz-bb-gradient: linear-gradient(to left')
    expect(style).toContain('--yz-bb-duration: 8s')
    expect(style).toContain('--yz-bb-size: 120px')
    expect(style).toContain('--yz-bb-line-width: 2px')
    expect(style).toContain('--yz-bb-radius: 12px')
  })

  it('supports multiple beams with negative stagger delays', () => {
    const wrapper = mount(BorderBeam, {
      props: { color: '#1677ff', count: 2, duration: 6 },
      slots: { default: '<span>x</span>' },
    })
    const orbs = wrapper.findAll('.yz-border-beam__orb')
    expect(orbs).toHaveLength(2)
    // 首条无延迟（style 为 undefined），第 2 条 -3s（-duration*i/count）
    expect(orbs[0].attributes('style')).toBeUndefined()
    expect(orbs[1].attributes('style')).toContain('animation-delay: -3s')
  })

  it('clamps invalid counts to 1 and applies outset as negative inset', () => {
    const wrapper = mount(BorderBeam, {
      props: { color: 'red', count: 0, outset: 3 },
      slots: { default: '<i/>' },
    })
    expect(wrapper.findAll('.yz-border-beam__orb')).toHaveLength(1)
    expect(wrapper.attributes('style')).toContain('--yz-bb-inset: -3px')
  })
})
