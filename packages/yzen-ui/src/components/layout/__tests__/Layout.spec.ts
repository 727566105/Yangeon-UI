import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { YzContainer, YzRow, YzCol } from '../index'

describe('YzContainer', () => {
  it('renders container with max-width class', () => {
    const wrapper = mount(YzContainer, { slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('yz-container')
    expect(wrapper.classes()).toContain('yz-container--fixed')
  })
  it('fluid variant removes fixed width', () => {
    const wrapper = mount(YzContainer, { props: { fluid: true } })
    expect(wrapper.classes()).toContain('yz-container--fluid')
  })
})

describe('YzRow', () => {
  it('renders row with gutter gap', () => {
    const wrapper = mount(YzRow, { props: { gutter: 16 }, slots: { default: '<div class="c"/>' } })
    expect(wrapper.classes()).toContain('yz-row')
    expect((wrapper.element as HTMLElement).style.gap).toBe('16px')
  })
  it('tuple gutter sets row and column gap', () => {
    const wrapper = mount(YzRow, { props: { gutter: [12, 24] } })
    expect((wrapper.element as HTMLElement).style.gap).toBe('12px 24px')
  })
})

describe('YzCol', () => {
  it('renders col with span width class', () => {
    const wrapper = mount(YzCol, { props: { span: 8 } })
    expect(wrapper.classes()).toContain('yz-col')
    expect(wrapper.classes()).toContain('yz-col--8')
  })
  it('applies offset class', () => {
    const wrapper = mount(YzCol, { props: { offset: 4 } })
    expect(wrapper.classes()).toContain('yz-col--offset-4')
  })
  it('applies responsive classes', () => {
    const wrapper = mount(YzCol, { props: { md: 12, lg: 6 } })
    expect(wrapper.classes()).toContain('yz-col--md-12')
    expect(wrapper.classes()).toContain('yz-col--lg-6')
  })
})
