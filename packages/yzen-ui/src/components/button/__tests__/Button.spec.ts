import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('YzButton', () => {
  it('renders default solid button with slot', () => {
    const wrapper = mount(Button, { slots: { default: 'Send' } })
    expect(wrapper.classes()).toContain('yz-button')
    expect(wrapper.classes()).toContain('yz-button--solid')
    expect(wrapper.classes()).toContain('yz-button--md')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Send')
  })

  it('applies type/size/block/rounded modifier classes', () => {
    const wrapper = mount(Button, { props: { type: 'glow', size: 'lg', block: true, rounded: true } })
    expect(wrapper.classes()).toContain('yz-button--glow')
    expect(wrapper.classes()).toContain('yz-button--lg')
    expect(wrapper.classes()).toContain('yz-button--block')
    expect(wrapper.classes()).toContain('yz-button--rounded')
  })

  it('emits click with mouse event', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('shows loading spinner and disables click when loading', async () => {
    const wrapper = mount(Button, { props: { loading: true } })
    expect(wrapper.find('.yz-button__spinner').exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('uses nativeType submit', () => {
    const wrapper = mount(Button, { props: { nativeType: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})
