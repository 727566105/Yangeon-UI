import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SiteSidebar from '../SiteSidebar.vue'
import { setLocale } from '../../i18n'
import { registryEntries } from '../../registry'
import { platforms } from '../../platforms'

beforeEach(() => {
  window.localStorage.clear()
  setLocale('zh')
})

afterEach(() => {
  window.location.hash = ''
})

describe('SiteSidebar', () => {
  it('renders Chinese copy by default, including registry-driven nav names', () => {
    const wrapper = mount(SiteSidebar, { props: { activeKey: null, platforms, activePlatform: 'desktop', entries: registryEntries } })
    expect(wrapper.find('.sidebar__title').text()).toBe('Yzen-UI for AI-native interfaces.')
    // 分类分组与注册表条目名（来自 i18n messages）
    expect(wrapper.text()).toContain('基础组件')
    expect(wrapper.text()).toContain('Button 按钮')
    expect(wrapper.text()).toContain('Sidebar Nav 侧边导航')
    expect(wrapper.find('.theme-switch').attributes('aria-label')).toBe('主题切换')
    // 语言切换控件存在且默认中文高亮
    const langButtons = wrapper.findAll('.lang-switch__item')
    expect(langButtons.length).toBe(2)
    expect(langButtons[0].classes()).toContain('lang-switch__item--active')
  })

  it('switches the whole sidebar to English on click without reload', async () => {
    const wrapper = mount(SiteSidebar, { props: { activeKey: null, platforms, activePlatform: 'desktop', entries: registryEntries } })
    const enButton = wrapper.findAll('.lang-switch__item')[1]
    await enButton.trigger('click')
    expect(wrapper.find('.sidebar__title').text()).toBe('Yzen-UI for AI-native interfaces.')
    expect(wrapper.text()).toContain('Basic')
    expect(wrapper.text()).toContain('Button')
    expect(wrapper.text()).toContain('Sidebar Nav')
    expect(wrapper.find('.theme-switch').attributes('aria-label')).toBe('Toggle theme')
    expect(window.localStorage.getItem('yz-locale')).toBe('en')
    // 切回中文
    await wrapper.findAll('.lang-switch__item')[0].trigger('click')
    expect(wrapper.text()).toContain('基础组件')
    expect(wrapper.text()).toContain('Button 按钮')
  })

  it('scrolls to top when clicking the nav item whose hash matches current location (user at page bottom)', async () => {
    // 场景：URL 已带 #section-button（用户曾定位到该区块），滑动到页面最底部后再点该导航项。
    // 浏览器对「同 hash 锚点点击」不产生滚动（hash 未变化），必须手动 scrollIntoView 回顶。
    const scrollIntoView = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView
    window.location.hash = '#section-button'

    // attachTo: 挂载到 document，并模拟真实页面的目标区块节点（真实页面由 ComponentSection 渲染）
    const section = document.createElement('section')
    section.id = 'section-button'
    document.body.appendChild(section)
    const wrapper = mount(SiteSidebar, { props: { activeKey: 'button', platforms, activePlatform: 'desktop', entries: registryEntries }, attachTo: document.body })
    await wrapper.find('a[href="#section-button"]').trigger('click')

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    section.remove()
  })

  it('keeps default anchor navigation when clicking a nav item with a different hash', async () => {
    // hash 不同的导航项走浏览器默认锚点跳转，不拦截
    const scrollIntoView = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView
    window.location.hash = '#section-button'

    const wrapper = mount(SiteSidebar, { props: { activeKey: 'button', platforms, activePlatform: 'desktop', entries: registryEntries } })
    await wrapper.find('a[href="#section-card"]').trigger('click')

    expect(scrollIntoView).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
