import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Thinking from '../Thinking.vue'

const steps = [
  { type: 'thinking' as const, time: '00:00', title: '解析请求' },
  { type: 'search' as const, time: '00:01', title: '检索太阳风数据库' },
  { type: 'success' as const, time: '00:02', title: '子任务完成' },
]

describe('YzThinking', () => {
  it('renders toggle with shimmer label and collapsed steps', () => {
    const wrapper = mount(Thinking, { props: { steps } })
    expect(wrapper.find('.yz-thinking__toggle').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.yz-thinking__label').text()).toBe('Thinking')
    expect(wrapper.findAll('.yz-thinking__step')).toHaveLength(3)
    expect(wrapper.find('.yz-thinking__collapse--open').exists()).toBe(false)
  })

  it('expands on click and emits toggle + update:expanded', async () => {
    const wrapper = mount(Thinking, { props: { steps } })
    await wrapper.find('.yz-thinking__toggle').trigger('click')
    expect(wrapper.find('.yz-thinking__toggle').attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.yz-thinking__collapse--open').exists()).toBe(true)
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
  })

  it('renders open state when expanded prop is true', () => {
    const wrapper = mount(Thinking, { props: { steps, expanded: true } })
    expect(wrapper.find('.yz-thinking__collapse--open').exists()).toBe(true)
    expect(wrapper.find('.yz-thinking__chevron--open').exists()).toBe(true)
  })

  it('renders mono timestamps and per-type dots', () => {
    const wrapper = mount(Thinking, { props: { steps } })
    const times = wrapper.findAll('.yz-thinking__time').map((n) => n.text())
    expect(times).toEqual(['00:00', '00:01', '00:02'])
    expect(wrapper.find('.yz-thinking__dot--search').exists()).toBe(true)
    expect(wrapper.find('.yz-thinking__dot--success').exists()).toBe(true)
  })
})
