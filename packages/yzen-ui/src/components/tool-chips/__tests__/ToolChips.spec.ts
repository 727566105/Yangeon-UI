import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToolChips from '../ToolChips.vue'

const calls = [
  { type: 'edit' as const, name: 'src/aurora/plasma.ts' },
  { type: 'call' as const, name: 'model.predict(flux)', status: 'running' as const },
]

describe('YzToolChips', () => {
  it('renders tabular summary and chip list', () => {
    const wrapper = mount(ToolChips, { props: { calls, messages: 3 } })
    expect(wrapper.find('.yz-tool-chips__summary').text()).toBe('2 tool calls, 3 messages')
    expect(wrapper.findAll('.yz-tool-chips__chip')).toHaveLength(2)
    expect(wrapper.find('.yz-tool-chips__chip-name').text()).toBe('src/aurora/plasma.ts')
  })

  it('collapses on click and emits toggle + update:expanded', async () => {
    const wrapper = mount(ToolChips, { props: { calls } })
    expect(wrapper.find('.yz-tool-chips__toggle').attributes('aria-expanded')).toBe('true')
    await wrapper.find('.yz-tool-chips__toggle').trigger('click')
    expect(wrapper.find('.yz-tool-chips__toggle').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.yz-tool-chips__collapse--open').exists()).toBe(false)
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('update:expanded')).toEqual([[false]])
  })

  it('renders running status with spinner icon', () => {
    const wrapper = mount(ToolChips, { props: { calls } })
    expect(wrapper.find('.yz-tool-chips__spinner').exists()).toBe(true)
    expect(wrapper.findAll('.yz-tool-chips__chip-status .yz-icon').length).toBe(2)
  })
})
