import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContextCards from '../ContextCards.vue'

describe('YzContextCards', () => {
  it('renders header, count badge and chunk cards with default data', () => {
    const wrapper = mount(ContextCards)
    expect(wrapper.find('.yz-context-cards__label').text()).toBe('All chunks')
    expect(wrapper.find('.yz-context-cards__count').text()).toBe('32')
    expect(wrapper.findAll('.yz-context-cards__card')).toHaveLength(2)
    expect(wrapper.findAll('.yz-context-cards__bar-name').map((n) => n.text())).toEqual([
      'Vendor onboarding rule',
      'Seasonal demand row',
    ])
    // 等宽字符数与附件胶囊
    expect(wrapper.find('.yz-context-cards__bar-chars').text()).toBe('290 characters')
    expect(wrapper.findAll('.yz-context-cards__pill')).toHaveLength(2)
    expect(wrapper.find('.yz-context-cards__pill-tag--red').text()).toBe('PDF')
    expect(wrapper.find('.yz-context-cards__pill-tag--green').text()).toBe('CSV')
  })

  it('renders custom chunks and count from props', () => {
    const wrapper = mount(ContextCards, {
      props: {
        count: 7,
        chunks: [
          {
            title: 'Aurora forecast row',
            characters: '96 characters',
            body: 'kp-index 5+ expected over the pole array.',
            attachment: { tag: 'CSV', tone: 'orange', filename: 'forecast.csv' },
          },
        ],
      },
    })
    expect(wrapper.find('.yz-context-cards__count').text()).toBe('7')
    expect(wrapper.findAll('.yz-context-cards__card')).toHaveLength(1)
    expect(wrapper.find('.yz-context-cards__pill-tag--orange').exists()).toBe(true)
    // 无附件的分块不渲染胶囊
    const noAttach = mount(ContextCards, {
      props: { chunks: [{ title: 'x', characters: '1', body: 'y' }] },
    })
    expect(noAttach.find('.yz-context-cards__pill').exists()).toBe(false)
  })

  it('emits attachment payload when a pill is clicked', async () => {
    const wrapper = mount(ContextCards)
    await wrapper.find('.yz-context-cards__pill').trigger('click')
    expect(wrapper.emitted('attachment')).toHaveLength(1)
    const payload = wrapper.emitted('attachment')![0][0] as { index: number }
    expect(payload.index).toBe(0)
  })

  it('renders pills immediately without animation when animated is false', () => {
    const wrapper = mount(ContextCards, { props: { animated: false } })
    expect(wrapper.find('.yz-context-cards__card--animated').exists()).toBe(false)
    expect(wrapper.find('.yz-context-cards__pill--animated').exists()).toBe(false)
  })
})
