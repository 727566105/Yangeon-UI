import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from '../Input.vue'

describe('YzInput', () => {
  it('renders input with placeholder and value', () => {
    const wrapper = mount(Input, { props: { modelValue: 'hello', placeholder: 'Ask AI…' } })
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Ask AI…')
    expect(input.element.value).toBe('hello')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(Input)
    await wrapper.find('input').setValue('new')
    expect(wrapper.emitted('update:modelValue')).toEqual([['new']])
  })

  it('clears value and emits clear when clearable clicked', async () => {
    const wrapper = mount(Input, { props: { modelValue: 'abc', clearable: true } })
    await wrapper.find('.yz-input__clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })

  it('does not render clear button when empty or not clearable', () => {
    expect(mount(Input, { props: { modelValue: '', clearable: true } }).find('.yz-input__clear').exists()).toBe(false)
    expect(mount(Input, { props: { modelValue: 'x' } }).find('.yz-input__clear').exists()).toBe(false)
  })

  it('disabled input is not editable', async () => {
    const wrapper = mount(Input, { props: { disabled: true } })
    await wrapper.find('input').setValue('x')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders prefix and suffix slots', () => {
    const wrapper = mount(Input, {
      slots: { prefix: '<span class="p">$</span>', suffix: '<span class="s">px</span>' },
    })
    expect(wrapper.find('.p').exists()).toBe(true)
    expect(wrapper.find('.s').exists()).toBe(true)
  })
})
