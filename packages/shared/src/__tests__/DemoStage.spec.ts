import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DemoStage from '../DemoStage.vue'

// 等待 defineAsyncComponent 解析（import → resolve → render）。
// 注意：首次动态 import 的 SFC 编译（冷启动）可能耗时数百 ms，固定 sleep 不可靠，
// 用轮询等待目标元素出现（最多 8s，冷启动 SFC 编译可能较慢）。
async function waitForElement(wrapper: ReturnType<typeof mount>, selector: string) {
  for (let i = 0; i < 80; i++) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 100))
    if (wrapper.find(selector).exists()) return true
  }
  return false
}

// 回归测试：demo 必须真实渲染（曾出现 loader 函数被当函数式组件调用，
// Promise 被字符串化渲染成 [object Promise] 的缺陷——DemoStage 继承此约束）
describe('DemoStage', () => {
  it('renders the demo shell for a real component', async () => {
    const wrapper = mount(DemoStage, {
      props: {
        entryKey: 'button',
        variantIndex: 0,
        variants: [{ id: 'solid', props: { type: 'solid' } }],
      },
    })
    expect(await waitForElement(wrapper, '.yz-button')).toBe(true)
    expect(wrapper.text()).not.toContain('[object Promise]')
  })

  it('passes variant props through to the demo', async () => {
    const wrapper = mount(DemoStage, {
      props: {
        entryKey: 'button',
        variantIndex: 1,
        variants: [
          { id: 'solid', props: { type: 'solid' } },
          { id: 'outline', props: { type: 'outline' } },
        ],
      },
    })
    expect(await waitForElement(wrapper, '.yz-button--outline')).toBe(true)
  })

  it('renders nothing (no crash) for an unknown entry key', async () => {
    const wrapper = mount(DemoStage, {
      props: {
        entryKey: 'ghost',
        variantIndex: 0,
        variants: [{ id: 'default', props: {} }],
      },
    })
    // 未知 key：loader 不存在，确认不渲染出 [object Promise]
    await flushPromises()
    await new Promise((r) => setTimeout(r, 200))
    expect(wrapper.text()).not.toContain('[object Promise]')
  })
})
