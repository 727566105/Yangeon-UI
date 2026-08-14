import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../Icon.vue'

describe('YzIcon', () => {
  it('renders svg with given name', () => {
    const wrapper = mount(Icon, { props: { name: 'sparkles' } })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(wrapper.classes()).toContain('yz-icon')
  })

  it('applies size and strokeWidth', () => {
    const wrapper = mount(Icon, { props: { name: 'search', size: 20, strokeWidth: 2 } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('20')
    expect(svg.attributes('height')).toBe('20')
    expect(svg.attributes('stroke-width')).toBe('2')
  })

  it('renders unknown name as fallback without crash', () => {
    // @ts-expect-error 测试非法 name 容错
    const wrapper = mount(Icon, { props: { name: 'not-a-real-icon' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
