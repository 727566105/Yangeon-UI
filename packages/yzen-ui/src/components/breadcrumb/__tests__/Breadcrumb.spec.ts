import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumb from '../Breadcrumb.vue'

const ITEMS = [
  { title: 'Home', href: '#' },
  { title: 'Application Center', href: '#' },
  { title: 'An Application' },
]

describe('YzBreadcrumb', () => {
  it('renders items in order with the default slash separator', () => {
    const wrapper = mount(Breadcrumb, { props: { items: ITEMS } })
    const texts = wrapper.findAll('.yz-breadcrumb__text, .yz-breadcrumb__link').map((n) => n.text())
    expect(texts).toEqual(['Home', 'Application Center', 'An Application'])
    // 分隔符数量 = 项数 - 1
    expect(wrapper.findAll('.yz-breadcrumb__sep').length).toBe(2)
    expect(wrapper.find('.yz-breadcrumb__sep').text()).toBe('/')
  })

  it('renders href items as links and the last item as bold text', () => {
    const wrapper = mount(Breadcrumb, { props: { items: ITEMS } })
    const links = wrapper.findAll('a.yz-breadcrumb__link')
    expect(links).toHaveLength(2)
    expect(links[0].attributes('href')).toBe('#')
    // 最后一项纯文本 + 加粗样式类
    const last = wrapper.find('.yz-breadcrumb__text--last')
    expect(last.text()).toBe('An Application')
  })

  it('uses a custom separator', () => {
    const wrapper = mount(Breadcrumb, { props: { items: ITEMS, separator: '›' } })
    expect(wrapper.find('.yz-breadcrumb__sep').text()).toBe('›')
  })

  it('collapses the middle with an ellipsis when maxCount is exceeded', () => {
    const many = [
      { title: '首页', href: '#' },
      { title: '产品', href: '#' },
      { title: '数据中心', href: '#' },
      { title: '任务列表', href: '#' },
      { title: '任务详情' },
    ]
    const wrapper = mount(Breadcrumb, { props: { items: many, maxCount: 3 } })
    // 首 + 省略 + 末 1 项
    const texts = wrapper.findAll('.yz-breadcrumb__text, .yz-breadcrumb__link').map((n) => n.text())
    expect(texts).toEqual(['首页', '任务详情'])
    // 省略号带后置分隔符（首页 / … / 任务详情）
    expect(wrapper.find('.yz-breadcrumb__ellipsis').text()).toContain('…')
    // 分隔符共 2 个（首页→省略、省略→末项）
    expect(wrapper.findAll('.yz-breadcrumb__sep').length).toBe(2)
  })

  it('renders an empty nav for empty items (guard)', () => {
    const wrapper = mount(Breadcrumb, { props: { items: [] } })
    expect(wrapper.find('nav.yz-breadcrumb').exists()).toBe(true)
    expect(wrapper.findAll('.yz-breadcrumb__item').length).toBe(0)
  })
  it('applies style B emphasis classes (accent links + last highlight)', () => {
    const wrapper = mount(Breadcrumb, { props: { items: ITEMS, style: 'b', separator: '›' } })
    expect(wrapper.find('nav').classes()).toContain('yz-breadcrumb--b')
    expect(wrapper.find('.yz-breadcrumb__sep').text()).toBe('›')
    const link = wrapper.find('a.yz-breadcrumb__link')
    expect(link.classes()).toContain('yz-breadcrumb__link')
    // 末项仍是加粗态
    expect(wrapper.find('.yz-breadcrumb__text--last').exists()).toBe(true)
  })

  it('defaults to style a', () => {
    const wrapper = mount(Breadcrumb, { props: { items: ITEMS } })
    expect(wrapper.find('nav').classes()).toContain('yz-breadcrumb--a')
  })
  it('collapses everything except the first item when maxCount is 1', () => {
    const wrapper = mount(Breadcrumb, { props: { items: ITEMS, maxCount: 1 } })
    const texts = wrapper.findAll('.yz-breadcrumb__text, .yz-breadcrumb__link').map((n) => n.text())
    expect(texts).toEqual(['Home'])
    expect(wrapper.find('.yz-breadcrumb__ellipsis').exists()).toBe(true)
  })

  it('degrades to style a classes for unknown style values (no crash)', () => {
    const wrapper = mount(Breadcrumb, {
      props: { items: ITEMS, style: 'c' as 'a' | 'b' },
    })
    expect(wrapper.find('nav').classes()).toContain('yz-breadcrumb--c')
    expect(wrapper.findAll('.yz-breadcrumb__item').length).toBe(3)
  })
})


