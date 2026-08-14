import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarNav from '../SidebarNav.vue'
import type { NavGroup } from '../SidebarNav.vue'

describe('YzSidebarNav', () => {
  it('renders workspace header, search with kbd, new-task button and nav groups', () => {
    const wrapper = mount(SidebarNav)
    expect(wrapper.find('.yz-sidebar-nav__ws-name').text()).toBe('极光实验室')
    expect(wrapper.find('.yz-sidebar-nav__ws-avatar').text()).toBe('A')
    expect(wrapper.find('.yz-sidebar-nav__search-input').attributes('placeholder')).toBe('Quick search')
    expect(wrapper.find('.yz-sidebar-nav__search-kbd').text()).toBe('/')
    expect(wrapper.find('.yz-sidebar-nav__new-label').text()).toBe('新建观测任务')
    // 分组与图标
    expect(wrapper.findAll('.yz-sidebar-nav__group-label').map((n) => n.text())).toEqual([
      '工作区',
      '观测对象',
    ])
    expect(wrapper.findAll('.yz-sidebar-nav__item')).toHaveLength(5)
    expect(wrapper.findAll('.yz-sidebar-nav__item-svg')).toHaveLength(5)
    // 默认选中 tasks + pop-in 徽章
    expect(wrapper.find('.yz-sidebar-nav__item[aria-current="page"]').text()).toContain('智能任务')
    expect(wrapper.find('.yz-sidebar-nav__badge').text()).toBe('4')
    expect(wrapper.find('.yz-sidebar-nav__pill').exists()).toBe(true)
  })

  it('selects an item: emits update:modelValue + select, moves aria-current and pill', async () => {
    const wrapper = mount(SidebarNav)
    const suppliers = wrapper
      .findAll('.yz-sidebar-nav__item')
      .find((n) => n.text().includes('观测站'))!
    await suppliers.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['suppliers']])
    expect(wrapper.emitted('select')).toEqual([['suppliers']])
    expect(suppliers.attributes('aria-current')).toBe('page')
    expect(wrapper.find('.yz-sidebar-nav__item[aria-current="page"]').text()).toContain('观测站')
  })

  it('emits add for the row action without selecting the item', async () => {
    const wrapper = mount(SidebarNav)
    const add = wrapper.find('.yz-sidebar-nav__add')
    await add.trigger('click')
    expect(wrapper.emitted('add')).toEqual([['suppliers']])
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.find('.yz-sidebar-nav__item[aria-current="page"]').text()).toContain('智能任务')
  })

  it('filters items by search query and emits update:query', async () => {
    const wrapper = mount(SidebarNav)
    const input = wrapper.find('.yz-sidebar-nav__search-input')
    await input.setValue('观测')
    expect(wrapper.emitted('update:query')).toEqual([['观测']])
    expect(wrapper.findAll('.yz-sidebar-nav__item')).toHaveLength(1) // 仅 观测站
    expect(wrapper.find('.yz-sidebar-nav__item').text()).toContain('观测站')
    // 无匹配 → 空守卫
    await input.setValue('zzz')
    expect(wrapper.find('.yz-sidebar-nav__empty').text()).toBe('无匹配导航项')
    // 清空后恢复
    await input.setValue('')
    expect(wrapper.findAll('.yz-sidebar-nav__item')).toHaveLength(5)
    expect(wrapper.find('.yz-sidebar-nav__empty').exists()).toBe(false)
  })

  it('opens workspace menu, switches workspace with emits, closes menu', async () => {
    const wrapper = mount(SidebarNav)
    const wsBtn = wrapper.find('.yz-sidebar-nav__ws-btn')
    expect(wsBtn.attributes('aria-expanded')).toBe('false')
    await wsBtn.trigger('click')
    expect(wsBtn.attributes('aria-expanded')).toBe('true')
    const items = wrapper.findAll('.yz-sidebar-nav__ws-item')
    expect(items).toHaveLength(2)
    await items[1].trigger('click')
    expect(wrapper.emitted('update:workspace')).toEqual([['storm']])
    expect(wrapper.emitted('change-workspace')).toEqual([['storm']])
    expect(wrapper.find('.yz-sidebar-nav__ws-name').text()).toBe('磁暴监测组')
    expect(wrapper.find('.yz-sidebar-nav__ws-btn').attributes('aria-expanded')).toBe('false')
  })

  it('emits create for the new-task button and slash shortcut focuses search', async () => {
    // attachTo：happy-dom 中未挂载的 input 无法获得焦点
    const wrapper = mount(SidebarNav, { attachTo: document.body })
    await wrapper.find('.yz-sidebar-nav__new').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
    // "/" 全局快捷键聚焦搜索框
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }))
    expect(wrapper.emitted('shortcut')).toEqual([['slash']])
    const input = wrapper.find('.yz-sidebar-nav__search-input').element as HTMLInputElement
    expect(document.activeElement).toBe(input)
    // 输入态下 "/" 不拦截
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
    expect(wrapper.emitted('shortcut')).toEqual([['slash']])
    wrapper.unmount()
  })

  it('guards empty groups and unknown workspace without runtime errors', () => {
    const wrapper = mount(SidebarNav, {
      props: { items: [] as NavGroup[], workspace: 'ghost', workspaces: [] },
    })
    expect(wrapper.find('.yz-sidebar-nav__empty').text()).toBe('无匹配导航项')
    expect(wrapper.find('.yz-sidebar-nav__ws-name').text()).toBe('未命名工作区')
  })
})
