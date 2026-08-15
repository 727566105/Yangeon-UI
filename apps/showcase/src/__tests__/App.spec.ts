import { describe, it, expect, vi, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'

// App 冒烟：端切换后内容区只渲染对应端组件（组件内部不渲染 demo，避免 glob 开销）
vi.mock('../components/ComponentSection.vue', () => ({
  default: {
    name: 'MockComponentSection',
    props: ['entry', 'component', 'index'],
    template: '<section :id="`section-${entry.key}`" class="mock-section">{{ entry.key }}</section>',
  },
}))

afterEach(() => {
  window.localStorage.clear()
})

describe('App', () => {
  it('renders desktop sections by default (first platform with components)', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const sections = wrapper.findAll('.mock-section')
    expect(sections.length).toBeGreaterThan(0)
    // 全部为 desktop 组件
    expect(sections.length).toBeLessThanOrEqual(26)
  })

  it('switches the whole page to the mobile platform (empty state)', async () => {
    const wrapper = mount(App)
    await flushPromises()
    // 点侧栏 platform-switch 的「移动端」按钮
    const mobileBtn = wrapper
      .findAll('.platform-switch__item')
      .find((b) => b.text() === '移动端')
    expect(mobileBtn).toBeTruthy()
    await mobileBtn!.trigger('click')
    await flushPromises()
    // 切换后区块只渲染 mobile 端组件（当前无移动端组件 → 空态提示；有则只显示移动端）
    const sections = wrapper.findAll('.mock-section')
    if (sections.length === 0) {
      expect(wrapper.find('.shell__empty').exists()).toBe(true)
    } else {
      expect(wrapper.find('.shell__empty').exists()).toBe(false)
    }
    expect(window.localStorage.getItem('yz-platform')).toBe('mobile')
  })

  it('persists the platform choice across mounts', async () => {
    window.localStorage.setItem('yz-platform', 'desktop')
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.findAll('.mock-section').length).toBeGreaterThan(0)
  })
  it('degrades gracefully when localStorage is unavailable', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const wrapper = mount(App)
    await flushPromises()
    // 读失败 → 默认第一个有组件的端（desktop），不崩溃
    expect(wrapper.findAll('.mock-section').length).toBeGreaterThan(0)
    // 写失败 → 切换仍生效（仅持久化跳过）
    const mobileBtn = wrapper.findAll('.platform-switch__item').find((b) => b.text() === '移动端')
    await mobileBtn!.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.mock-section').length).toBe(0)
    getItem.mockRestore()
    setItem.mockRestore()
  })
})

