import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { YzText as Text, YzTitle as Title } from '../index'

describe('YzText', () => {
  it('renders span with type/size/weight classes', () => {
    const wrapper = mount(Text, { props: { type: 'secondary', size: 'xs', weight: 500 } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('yz-text--secondary')
    expect(wrapper.classes()).toContain('yz-text--xs')
    expect(wrapper.classes()).toContain('yz-text--w500')
  })
  it('mono applies mono font class', () => {
    const wrapper = mount(Text, { props: { mono: true } })
    expect(wrapper.classes()).toContain('yz-text--mono')
  })
  it('ellipsis applies truncate class', () => {
    const wrapper = mount(Text, { props: { ellipsis: true } })
    expect(wrapper.classes()).toContain('yz-text--ellipsis')
  })
  it('renders custom tag', () => {
    const wrapper = mount(Text, { props: { tag: 'p' } })
    expect(wrapper.element.tagName).toBe('P')
  })
  it('type=accent uses accent color', () => {
    const wrapper = mount(Text, { props: { type: 'accent' } })
    expect(wrapper.classes()).toContain('yz-text--accent')
  })
})

describe('YzTitle', () => {
  it('renders h1-h4 by level', () => {
    expect(mount(Title, { props: { level: 1 } }).element.tagName).toBe('H1')
    expect(mount(Title, { props: { level: 4 } }).element.tagName).toBe('H4')
  })
})
