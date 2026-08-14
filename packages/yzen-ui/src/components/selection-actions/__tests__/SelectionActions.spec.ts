import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SelectionActions from '../SelectionActions.vue'

describe('YzSelectionActions', () => {
  it('renders actions and hidden bar by default', () => {
    const wrapper = mount(SelectionActions)
    expect(wrapper.findAll('.yz-selection-actions__btn')).toHaveLength(5)
    expect(wrapper.find('.yz-selection-actions__bar--open').exists()).toBe(false)
    expect(wrapper.find('.yz-selection-actions__text').text()).toContain('Pistachio')
  })

  it('shows bar when open with position applied', () => {
    const wrapper = mount(SelectionActions, { props: { open: true, position: { x: 120, y: 40 } } })
    const bar = wrapper.find('.yz-selection-actions__bar')
    expect(bar.classes()).toContain('yz-selection-actions__bar--open')
    expect(bar.attributes('style')).toContain('left: 120px')
    expect(bar.attributes('style')).toContain('top: 40px')
  })

  it('emits action on action button click', async () => {
    const wrapper = mount(SelectionActions, { props: { open: true } })
    await wrapper.findAll('.yz-selection-actions__btn')[0].trigger('click')
    expect(wrapper.emitted('action')).toEqual([['Explain']])
  })

  it('emits update:modelValue on input and submit when text present', async () => {
    const wrapper = mount(SelectionActions, { props: { open: true } })
    await wrapper.find('input').setValue('make it shorter')
    expect(wrapper.emitted('update:modelValue')).toEqual([['make it shorter']])
    // 受控模式：模拟父级 v-model 回传后发送可用
    await wrapper.setProps({ modelValue: 'make it shorter' })
    expect(wrapper.find('.yz-selection-actions__send--off').exists()).toBe(false)
    await wrapper.find('.yz-selection-actions__send').trigger('click')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('disables send when text empty', () => {
    const wrapper = mount(SelectionActions, { props: { open: true, modelValue: '' } })
    expect(wrapper.find('.yz-selection-actions__send--off').exists()).toBe(true)
  })
})
