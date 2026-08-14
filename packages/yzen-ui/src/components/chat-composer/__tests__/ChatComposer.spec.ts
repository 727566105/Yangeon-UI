import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatComposer from '../ChatComposer.vue'
import type { ChatMessage } from '../ChatComposer.vue'

const messages: ChatMessage[] = [
  { role: 'user', text: '对比今晚与上周的极光峰值强度' },
  { role: 'assistant', label: '观测数据', tag: 'kp-index · bz', duration: '4s', text: 'kp 峰值 5.4，bz 均值 -6.2nT。' },
]

describe('YzChatComposer', () => {
  it('renders tabs, messages and composer with placeholder', () => {
    const wrapper = mount(ChatComposer, { props: { messages } })
    expect(wrapper.findAll('.yz-chat-composer__tab')).toHaveLength(2)
    expect(wrapper.find('.yz-chat-composer__tab--active').text()).toBe('观测')
    expect(wrapper.findAll('.yz-chat-composer__msg')).toHaveLength(2)
    expect(wrapper.find('.yz-chat-composer__bubble').text()).toBe('对比今晚与上周的极光峰值强度')
    expect(wrapper.find('.yz-chat-composer__input').attributes('placeholder')).toBe('输入观测指令，或 @ 传感器…')
    expect(wrapper.find('.yz-chat-composer__send').attributes('disabled')).toBeDefined()
  })

  it('typing emits update:modelValue and enables send', async () => {
    const wrapper = mount(ChatComposer, { props: { messages } })
    const input = wrapper.find('.yz-chat-composer__input')
    await input.setValue('预测明晚磁暴')
    expect(wrapper.emitted('update:modelValue')).toEqual([['预测明晚磁暴']])
    expect(wrapper.find('.yz-chat-composer__send').attributes('disabled')).toBeUndefined()
  })

  it('send appends user message, clears input and emits send + empty update', async () => {
    const wrapper = mount(ChatComposer, { props: { messages, replyText: null } })
    await wrapper.find('.yz-chat-composer__input').setValue(' 对比 3 月峰值  ')
    await wrapper.find('.yz-chat-composer__send').trigger('click')
    expect(wrapper.emitted('send')).toEqual([['对比 3 月峰值']])
    expect((wrapper.find('.yz-chat-composer__input').element as HTMLInputElement).value).toBe('')
    // 清空同步 emit
    expect(wrapper.emitted('update:modelValue')).toEqual([[' 对比 3 月峰值  '], ['']])
    expect(wrapper.findAll('.yz-chat-composer__msg--user')).toHaveLength(2)
  })

  it('switches tabs with tab/update:tab emits', async () => {
    const wrapper = mount(ChatComposer, { props: { messages } })
    const second = wrapper.findAll('.yz-chat-composer__tab')[1]
    await second.trigger('click')
    expect(second.attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('tab')).toEqual([['sensors']])
    expect(wrapper.emitted('update:tab')).toEqual([['sensors']])
  })

  it('appends assistant reply after delay and emits reply', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ChatComposer, {
      props: { messages, replyText: '正在比对历史数据…', replyDelay: 800 },
    })
    await wrapper.find('.yz-chat-composer__input').setValue('预测明晚磁暴')
    await wrapper.find('.yz-chat-composer__send').trigger('click')
    expect(wrapper.findAll('.yz-chat-composer__msg--assistant')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(800)
    const assistants = wrapper.findAll('.yz-chat-composer__msg--assistant')
    expect(assistants).toHaveLength(2)
    // 追加的回复是最后一条助手消息
    expect(assistants[1].find('.yz-chat-composer__assistant-text').text()).toBe('正在比对历史数据…')
    expect(wrapper.emitted('reply')).toHaveLength(1)
    vi.useRealTimers()
    wrapper.unmount()
  })
})
