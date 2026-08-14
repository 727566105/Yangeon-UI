import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('YzButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Send' } })
    expect(wrapper.text()).toBe('Send')
  })
})
