import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AILoading from '../AILoading.vue'

describe('YzAILoading', () => {
  it('renders drive variant with pixels, shimmer and timer', () => {
    const wrapper = mount(AILoading, { props: { variant: 'drive', timer: false } })
    expect(wrapper.classes()).toContain('yz-ai-loading--drive')
    expect(wrapper.findAll('.yz-ai-loading__pixel')).toHaveLength(9)
    expect(wrapper.find('.yz-ai-loading__shimmer').text()).toBe('Churning')
    expect(wrapper.find('.yz-ai-loading__timer').text()).toBe('0.0s')
  })

  it('renders dots variant', () => {
    const wrapper = mount(AILoading, { props: { variant: 'dots', timer: false } })
    expect(wrapper.classes()).toContain('yz-ai-loading--dots')
    expect(wrapper.findAll('.yz-ai-loading__dot')).toHaveLength(3)
  })

  it('renders orbit variant with shimmer label', () => {
    const wrapper = mount(AILoading, { props: { variant: 'orbit', label: 'Analyzing' } })
    expect(wrapper.classes()).toContain('yz-ai-loading--orbit')
    expect(wrapper.find('.yz-ai-loading__orbit').exists()).toBe(true)
    expect(wrapper.find('.yz-ai-loading__shimmer').text()).toBe('Analyzing')
  })

  it('increments timer when enabled', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AILoading, { props: { variant: 'drive', timer: true } })
    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.find('.yz-ai-loading__timer').text()).toBe('0.5s')
    vi.useRealTimers()
    wrapper.unmount()
  })
})
