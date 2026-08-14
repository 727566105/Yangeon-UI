import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StreamingText from '../StreamingText.vue'

const text = '今夜极光 kp-index 5.7'

describe('YzStreamingText', () => {
  it('renders full text, sources and follow-ups when streaming is off', () => {
    const wrapper = mount(StreamingText, { props: { streaming: false, text } })
    expect(wrapper.find('.yz-streaming-text__content').text()).toBe(text)
    expect(wrapper.find('.yz-streaming-text__sources-count').text()).toBe('3 sources')
    expect(wrapper.findAll('.yz-streaming-text__followup')).toHaveLength(2)
    expect(wrapper.find('.yz-streaming-text__actions--visible').exists()).toBe(true)
  })

  it('reveals text progressively with fake timers and emits done once', async () => {
    vi.useFakeTimers()
    const wrapper = mount(StreamingText, {
      props: { text, streaming: true, speed: 20, chunkSize: 1 },
    })
    // 初始只有光标，无正文
    expect(wrapper.find('.yz-streaming-text__content').text()).toBe('')
    await vi.advanceTimersByTimeAsync(40)
    expect(wrapper.find('.yz-streaming-text__content').text()).toBe('今夜')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('.yz-streaming-text__content').text()).toBe(text)
    expect(wrapper.emitted('done')).toHaveLength(1)
    // 完成后光标隐藏、操作区淡入
    expect(wrapper.find('.yz-streaming-text__caret--done').exists()).toBe(true)
    expect(wrapper.find('.yz-streaming-text__actions--visible').exists()).toBe(true)
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('toggles sources panel and syncs controlled state', async () => {
    const wrapper = mount(StreamingText, { props: { streaming: false, text } })
    const btn = wrapper.find('.yz-streaming-text__sources-btn')
    expect(btn.attributes('aria-expanded')).toBe('false')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.yz-streaming-text__collapse--open').exists()).toBe(true)
    expect(wrapper.emitted('toggle')).toEqual([[true]])
    expect(wrapper.emitted('update:sourcesOpen')).toEqual([[true]])
  })

  it('emits followup text and toggles like state', async () => {
    const wrapper = mount(StreamingText, { props: { streaming: false, text } })
    await wrapper.find('.yz-streaming-text__followup').trigger('click')
    expect(wrapper.emitted('followup')).toEqual([['明晚极光可见概率如何？']])
    const like = wrapper.find('.yz-streaming-text__action[aria-label="有帮助"]')
    await like.trigger('click')
    expect(like.attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('like')).toEqual([[true]])
    await like.trigger('click')
    expect(wrapper.emitted('like')).toEqual([[true], [false]])
  })
})
