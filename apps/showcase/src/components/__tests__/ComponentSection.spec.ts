import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ComponentSection from '../ComponentSection.vue'
import { registryEntries, componentMap } from '../../registry'

// 等待 defineAsyncComponent 完整解析（import → resolve → render，需要宏任务）
async function settle() {
  await flushPromises()
  await new Promise((r) => setTimeout(r, 50))
  await flushPromises()
}

// 回归测试：demo 必须真实渲染（曾出现 loader 函数被当函数式组件调用，
// Promise 被字符串化渲染成 [object Promise] 的缺陷——须用 defineAsyncComponent 包装）
describe('ComponentSection demo rendering', () => {
  it('renders async demo component for ai-loading', async () => {
    const entry = registryEntries.find((e) => e.key === 'ai-loading')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    // 渲染出 YzAILoading 的网格，而非 [object Promise]
    expect(wrapper.find('.yz-ai-loading').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('[object Promise]')
  })

  it('renders async demo component for code-block', async () => {
    const entry = registryEntries.find((e) => e.key === 'code-block')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    expect(wrapper.find('.yz-code-block').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('[object Promise]')
  })
})
