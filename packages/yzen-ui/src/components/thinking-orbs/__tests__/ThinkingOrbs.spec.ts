import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ThinkingOrbs from '../ThinkingOrbs.vue'

// happy-dom 下 canvas.getContext('2d') 返回 null，组件守卫后直接返回，
// 因此冒烟测试聚焦 DOM 层契约：canvas 元素 / role / aria-label / 尺寸。
describe('YzThinkingOrbs', () => {
  it('renders a canvas with img role and the default label', () => {
    const wrapper = mount(ThinkingOrbs)
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
    expect(canvas.attributes('role')).toBe('img')
    expect(canvas.attributes('aria-label')).toBe('Working…')
    expect(canvas.attributes('style')).toContain('width: 64px')
    expect(canvas.attributes('style')).toContain('height: 64px')
  })

  it('honors a custom aria-label passed through attrs', () => {
    const wrapper = mount(ThinkingOrbs, { attrs: { 'aria-label': '正在思考' } })
    expect(wrapper.find('canvas').attributes('aria-label')).toBe('正在思考')
  })

  it('switches the label and canvas size by state/size props', () => {
    const wrapper = mount(ThinkingOrbs, { props: { state: 'searching' } })
    expect(wrapper.find('canvas').attributes('aria-label')).toBe('Searching…')
    expect(wrapper.find('canvas').attributes('style')).toContain('width: 64px')

    const small = mount(ThinkingOrbs, { props: { state: 'breathing', size: 20 } })
    expect(small.find('canvas').attributes('aria-label')).toBe('Thinking…')
    expect(small.find('canvas').attributes('style')).toContain('width: 20px')
  })

  it('scales the backing buffer to the size times dpr', async () => {
    const wrapper = mount(ThinkingOrbs, { props: { size: 64 } })
    // onMounted 挂载后才设 buffer 尺寸（setup 阶段 canvasRef 尚未绑定）
    await flushPromises()
    const canvas = wrapper.find('canvas').element as HTMLCanvasElement
    // happy-dom 下 devicePixelRatio=1
    expect(canvas.width).toBe(64)
    expect(canvas.height).toBe(64)
  })
})
