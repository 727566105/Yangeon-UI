import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ApprovalCard from '../ApprovalCard.vue'

const options = [
  { label: '启动全夜观测（4 站联动）' },
  { label: '仅监测 kp-index 峰值时段' },
]

describe('YzApprovalCard', () => {
  it('renders question, options, dots and disabled submit', () => {
    const wrapper = mount(ApprovalCard, { props: { options } })
    expect(wrapper.find('.yz-approval-card__question').text()).toContain('极光观测')
    expect(wrapper.findAll('.yz-approval-card__option')).toHaveLength(2)
    expect(wrapper.findAll('.yz-approval-card__dot-btn')).toHaveLength(3)
    expect(wrapper.find('.yz-approval-card__dot-btn--on').attributes('aria-current')).toBe('step')
    expect(wrapper.find('.yz-approval-card__submit').attributes('disabled')).toBeDefined()
  })

  it('picks an option: green dot, submit enabled, emits update:selected + update:custom', async () => {
    const wrapper = mount(ApprovalCard, { props: { options } })
    await wrapper.findAll('.yz-approval-card__option')[0].trigger('click')
    expect(wrapper.findAll('.yz-approval-card__option')[0].attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.yz-approval-card__radio--on').exists()).toBe(true)
    expect(wrapper.find('.yz-approval-card__submit').attributes('disabled')).toBeUndefined()
    expect(wrapper.emitted('update:selected')).toEqual([[0]])
    expect(wrapper.emitted('update:custom')).toEqual([['']])
  })

  it('typing a custom answer clears the selected option and emits both', async () => {
    const wrapper = mount(ApprovalCard, { props: { options } })
    await wrapper.findAll('.yz-approval-card__option')[1].trigger('click')
    await wrapper.find('.yz-approval-card__custom-input').setValue('仅监测南向 bz')
    expect(wrapper.emitted('update:custom')).toEqual([[''], ['仅监测南向 bz']])
    // 选中被互斥清除
    expect(wrapper.emitted('update:selected')).toEqual([[1], [null]])
    expect(wrapper.find('.yz-approval-card__option--on').exists()).toBe(false)
  })

  it('submit emits payload only when answered', async () => {
    const wrapper = mount(ApprovalCard, { props: { options } })
    await wrapper.find('.yz-approval-card__submit').trigger('click')
    expect(wrapper.emitted('submit')).toBeUndefined()
    await wrapper.findAll('.yz-approval-card__option')[0].trigger('click')
    await wrapper.find('.yz-approval-card__submit').trigger('click')
    expect(wrapper.emitted('submit')).toEqual([[{ option: 0, custom: '' }]])
  })

  it('approved status shows green check badge and approved submit button', () => {
    const wrapper = mount(ApprovalCard, { props: { options, status: 'approved', selected: 0 } })
    expect(wrapper.find('.yz-approval-card__radio--approved').exists()).toBe(true)
    expect(wrapper.find('.yz-approval-card__radio-check').exists()).toBe(true)
    expect(wrapper.find('.yz-approval-card__submit--approved').exists()).toBe(true)
    expect(wrapper.find('.yz-approval-card__submit').attributes('aria-label')).toBe('Approved')
  })

  it('navigates pages and dismisses with emits', async () => {
    const wrapper = mount(ApprovalCard, { props: { options } })
    await wrapper.findAll('.yz-approval-card__dot-btn')[1].trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[1]])
    expect(wrapper.findAll('.yz-approval-card__dot-btn')[1].attributes('aria-current')).toBe('step')
    await wrapper.find('.yz-approval-card__dismiss').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
