import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '../Card.vue'

describe('YzCard', () => {
  it('renders default card with slot content', () => {
    const wrapper = mount(Card, { slots: { default: '<p>content</p>' } })
    expect(wrapper.classes()).toContain('yz-card')
    expect(wrapper.classes()).toContain('yz-card--default')
    expect(wrapper.text()).toContain('content')
  })

  it('renders header and footer slots', () => {
    const wrapper = mount(Card, {
      slots: { header: '<h3>Title</h3>', default: 'body', footer: '<span>foot</span>' },
    })
    expect(wrapper.find('.yz-card__header').text()).toBe('Title')
    expect(wrapper.find('.yz-card__footer').text()).toBe('foot')
  })

  it('applies variant and hoverable classes', () => {
    const wrapper = mount(Card, { props: { variant: 'glass', hoverable: true, padded: false } })
    expect(wrapper.classes()).toContain('yz-card--glass')
    expect(wrapper.classes()).toContain('yz-card--hoverable')
    expect(wrapper.classes()).not.toContain('yz-card--padded')
  })
})
