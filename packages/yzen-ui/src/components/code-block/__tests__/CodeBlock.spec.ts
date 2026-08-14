import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeBlock from '../CodeBlock.vue'

describe('YzCodeBlock', () => {
  it('renders filename, language and code lines', () => {
    const wrapper = mount(CodeBlock, {
      props: { filename: 'model.ts', language: 'TypeScript', code: 'const a = 1\nconst b = 2', streaming: false },
    })
    expect(wrapper.find('.yz-code-block__filename').text()).toBe('model.ts')
    expect(wrapper.find('.yz-code-block__lang').text()).toBe('TypeScript')
    expect(wrapper.findAll('.yz-code-block__line')).toHaveLength(2)
  })

  it('applies stream class per line when streaming', () => {
    const wrapper = mount(CodeBlock, { props: { code: 'a\nb', streaming: true } })
    expect(wrapper.find('.yz-code-block__line--stream').exists()).toBe(true)
  })

  it('emits copy and shows Copied state', async () => {
    const wrapper = mount(CodeBlock, { props: { code: 'x = 1' } })
    await wrapper.find('.yz-code-block__copy').trigger('click')
    expect(wrapper.emitted('copy')).toHaveLength(1)
    expect(wrapper.find('.yz-code-block__copy').text()).toContain('Copied')
  })

  it('hides copy button when copyable is false', () => {
    const wrapper = mount(CodeBlock, { props: { copyable: false } })
    expect(wrapper.find('.yz-code-block__copy').exists()).toBe(false)
  })
})
