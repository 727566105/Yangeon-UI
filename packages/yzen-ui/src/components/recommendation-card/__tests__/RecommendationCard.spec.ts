import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecommendationCard from '../RecommendationCard.vue'

describe('YzRecommendationCard', () => {
  it('renders title, suggestion with code chips and confidence meter', () => {
    const wrapper = mount(RecommendationCard)
    expect(wrapper.find('.yz-recommendation-card__title').text()).toBe(
      'Want me to place this restock order?',
    )
    // 建议正文：文本与 code 段交替
    expect(wrapper.find('.yz-recommendation-card__suggestion').text()).toContain(
      'Reorder waffle cones from cone_king with lead time 7_days.',
    )
    expect(wrapper.findAll('.yz-recommendation-card__code')).toHaveLength(2)
    expect(wrapper.find('.yz-recommendation-card__code').text()).toBe('cone_king')
    // 置信度 3 根绿条 + 标签
    expect(wrapper.find('.yz-recommendation-card__confidence-label').text()).toBe(
      'High confidence',
    )
    const confidenceOn = wrapper
      .findAll('.yz-recommendation-card__bar--confidence')
      .filter((n) => n.classes().includes('yz-recommendation-card__bar--on'))
    expect(confidenceOn).toHaveLength(3)
  })

  it('starts collapsed and expands on Alternatives click, syncing emits', async () => {
    const wrapper = mount(RecommendationCard)
    const btn = wrapper.find('.yz-recommendation-card__btn--ghost')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.yz-recommendation-card__collapse--open').exists()).toBe(false)
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.yz-recommendation-card__collapse--open').exists()).toBe(true)
    expect(wrapper.emitted('toggle')).toEqual([[true]])
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
    // 折叠区渲染备选方案与计量条
    const options = wrapper.findAll('.yz-recommendation-card__option')
    expect(options).toHaveLength(2)
    expect(options[0].text()).toContain('Switch to vanilla_madagascar')
    expect(options[0].text()).toContain('Needs review')
  })

  it('renders expanded state from prop and emits accept', async () => {
    const wrapper = mount(RecommendationCard, { props: { expanded: true } })
    expect(wrapper.find('.yz-recommendation-card__collapse--open').exists()).toBe(true)
    await wrapper.find('.yz-recommendation-card__btn--accent').trigger('click')
    expect(wrapper.emitted('accept')).toHaveLength(1)
  })

  it('renders custom confidence level and emits option payload', async () => {
    const wrapper = mount(RecommendationCard, {
      props: { confidenceLevel: 1, confidenceLabel: 'Low confidence', expanded: true },
    })
    expect(wrapper.find('.yz-recommendation-card__confidence-label').text()).toBe(
      'Low confidence',
    )
    const confidenceOn = wrapper
      .findAll('.yz-recommendation-card__bar--confidence')
      .filter((n) => n.classes().includes('yz-recommendation-card__bar--on'))
    expect(confidenceOn).toHaveLength(1)
    await wrapper.findAll('.yz-recommendation-card__option')[0].trigger('click')
    const payload = wrapper.emitted('option')![0][0] as { index: number }
    expect(payload.index).toBe(0)
  })
})
