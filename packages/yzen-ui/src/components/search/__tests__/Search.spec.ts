import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Search from '../Search.vue'

const items = ['预测今晚极光强度', '检索太阳风数据源', '对比两晚观测曲线']

describe('YzSearch', () => {
  it('renders input with placeholder, kbd hint and all items when query empty', () => {
    const wrapper = mount(Search, { props: { items } })
    expect(wrapper.find('.yz-search__input').attributes('placeholder')).toBe('搜索指令…')
    expect(wrapper.find('.yz-search__kbd').text()).toBe('⌘K')
    expect(wrapper.findAll('.yz-search__result')).toHaveLength(3)
    expect(wrapper.find('.yz-search__empty').exists()).toBe(false)
  })

  it('typing filters items and emits update:modelValue', async () => {
    const wrapper = mount(Search, { props: { items } })
    await wrapper.find('.yz-search__input').setValue('极光')
    expect(wrapper.findAll('.yz-search__result')).toHaveLength(1)
    expect(wrapper.find('.yz-search__result').text()).toBe('预测今晚极光强度')
    expect(wrapper.emitted('update:modelValue')).toEqual([['极光']])
  })

  it('no match shows empty state; clear button resets and emits clear', async () => {
    const wrapper = mount(Search, { props: { items } })
    await wrapper.find('.yz-search__input').setValue('磁暴')
    expect(wrapper.find('.yz-search__empty').exists()).toBe(true)
    expect(wrapper.find('.yz-search__empty-title').text()).toBe('未找到匹配指令')
    expect(wrapper.find('.yz-search__empty-hint').text()).toContain('磁暴')
    expect(wrapper.find('.yz-search__kbd').exists()).toBe(false)
    await wrapper.find('.yz-search__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['磁暴'], ['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.findAll('.yz-search__result')).toHaveLength(3)
    expect(wrapper.find('.yz-search__kbd').exists()).toBe(true)
  })

  it('picking a result emits select', async () => {
    const wrapper = mount(Search, { props: { items } })
    await wrapper.find('.yz-search__result').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['预测今晚极光强度']])
  })

  it('⌘K and / shortcuts focus the input and emit shortcut', async () => {
    // attachTo：happy-dom 中未挂载的 input 无法获得焦点
    const wrapper = mount(Search, { props: { items }, attachTo: document.body })
    const input = wrapper.find('.yz-search__input')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.emitted('shortcut')).toEqual([['cmd-k']])

    ;(document.activeElement as HTMLElement)?.blur()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }))
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.emitted('shortcut')).toEqual([['cmd-k'], ['slash']])
    wrapper.unmount()
  })
})
