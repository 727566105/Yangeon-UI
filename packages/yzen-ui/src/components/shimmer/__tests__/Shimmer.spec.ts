import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Shimmer from '../Shimmer.vue'

describe('YzShimmer', () => {
  it('renders the default generating text with shimmer styles', () => {
    const wrapper = mount(Shimmer)
    expect(wrapper.classes()).toContain('yz-shimmer')
    expect(wrapper.classes()).toContain('yz-shimmer--md')
    expect(wrapper.text()).toBe('Generating response…')
    // 扫光：背景渐变 + bg-clip-text + 动画（scoped CSS，类即可验证存在）
    expect(wrapper.find('p').exists()).toBe(true)
  })

  it('renders custom text and size', () => {
    const wrapper = mount(Shimmer, { props: { text: 'Searching…', size: 'sm' } })
    expect(wrapper.text()).toBe('Searching…')
    expect(wrapper.classes()).toContain('yz-shimmer--sm')
  })

  it('applies a custom animation duration', () => {
    const wrapper = mount(Shimmer, { props: { duration: 2 } })
    expect(wrapper.attributes('style')).toContain('animation-duration: 2s')
  })
})
