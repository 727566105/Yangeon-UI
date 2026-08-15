import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SiteSidebar from '../SiteSidebar.vue'
import { setLocale } from '../../i18n'

beforeEach(() => {
  window.localStorage.clear()
  setLocale('zh')
})

describe('SiteSidebar', () => {
  it('renders Chinese copy by default, including registry-driven nav names', () => {
    const wrapper = mount(SiteSidebar, { props: { activeKey: null } })
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
    const wrapper = mount(SiteSidebar, { props: { activeKey: null } })
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
})
