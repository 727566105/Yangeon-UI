import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PromptBar from '../PromptBar.vue'

describe('YzPromptBar', () => {
  it('renders placeholder, model label and disabled send when empty', () => {
    const wrapper = mount(PromptBar, {
      props: { placeholder: 'Ask Aurora…', model: 'Aurora 1' },
    })
    const textarea = wrapper.find('.yz-prompt-bar__input')
    expect(textarea.attributes('placeholder')).toBe('Ask Aurora…')
    expect(wrapper.find('.yz-prompt-bar__model-name').text()).toBe('Aurora 1')
    expect(wrapper.find('.yz-prompt-bar__send').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.yz-prompt-bar__send').text()).toBe('')
  })

  it('typing enables send and emits update:modelValue', async () => {
    const wrapper = mount(PromptBar)
    const textarea = wrapper.find('.yz-prompt-bar__input')
    await textarea.setValue('分析今晚极光')
    expect(wrapper.find('.yz-prompt-bar__send').attributes('disabled')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toEqual([['分析今晚极光']])
  })

  it('send emits trimmed text, clears input and disables again', async () => {
    const wrapper = mount(PromptBar)
    await wrapper.find('.yz-prompt-bar__input').setValue(' 预测磁暴  ')
    await wrapper.find('.yz-prompt-bar__send').trigger('click')
    expect(wrapper.emitted('send')).toEqual([['预测磁暴']])
    expect((wrapper.find('.yz-prompt-bar__input').element as HTMLTextAreaElement).value).toBe('')
    expect(wrapper.find('.yz-prompt-bar__send').attributes('disabled')).toBeDefined()
  })

  it('supports pill shape and dictation toggle', async () => {
    const wrapper = mount(PromptBar, { props: { shape: 'pill' } })
    expect(wrapper.classes()).toContain('yz-prompt-bar--pill')
    const dict = wrapper.find('.yz-prompt-bar__btn[aria-pressed]')
    await dict.trigger('click')
    expect(dict.attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('dictate')).toEqual([[true]])
    await dict.trigger('click')
    expect(wrapper.emitted('dictate')).toEqual([[true], [false]])
  })
})
