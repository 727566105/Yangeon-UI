import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useResolvedDark } from '../theme'
import type { OrbTheme } from '../types'

/**
 * happy-dom 的 MutationObserver 回调不会自动调度，需 waitUntilComplete() 冲刷；
 * 兜底真实时钟（非 happy-dom 环境）
 */
const settle = async () => {
  const hd = (window as unknown as { happyDOM?: { waitUntilComplete?: () => Promise<void> } }).happyDOM
  if (hd?.waitUntilComplete) {
    await hd.waitUntilComplete()
  }
  await new Promise((r) => setTimeout(r, 5))
}

// 宿主组件：暴露 useResolvedDark 的响应式结果（挂在 body 下，祖先链含 documentElement）
const Host = defineComponent({
  props: { mode: { type: String, default: 'auto' } },
  setup(props) {
    const theme = ref<OrbTheme>(props.mode as OrbTheme)
    const host = ref<Element | null>(null)
    const dark = useResolvedDark(theme, host)
    return { dark, theme, host }
  },
  template: '<div ref="host" class="theme-host" />',
})

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.classList.remove('dark', 'light')
})

describe('useResolvedDark', () => {
  it('follows ancestor data-theme flips live (auto mode)', async () => {
    document.documentElement.dataset.theme = 'light'
    const wrapper = mount(Host, { attachTo: document.body })
    await settle()
    expect(wrapper.vm.dark).toBe(false)

    // 应用级切换：data-theme 翻转 → MutationObserver 触发 → dark 联动
    document.documentElement.dataset.theme = 'dark'
    await settle()
    expect(wrapper.vm.dark).toBe(true)

    document.documentElement.dataset.theme = 'light'
    await settle()
    expect(wrapper.vm.dark).toBe(false)
    wrapper.unmount()
  })

  it('follows .dark class flips on the document root', async () => {
    const wrapper = mount(Host, { attachTo: document.body })
    await settle()
    document.documentElement.classList.add('dark')
    await settle()
    expect(wrapper.vm.dark).toBe(true)
    document.documentElement.classList.remove('dark')
    await settle()
    expect(wrapper.vm.dark).toBe(false)
    wrapper.unmount()
  })

  it('pins dark/light when the theme prop is explicit', async () => {
    document.documentElement.dataset.theme = 'light'
    const pinned = mount(Host, { props: { mode: 'dark' }, attachTo: document.body })
    await settle()
    expect(pinned.vm.dark).toBe(true)
    document.documentElement.dataset.theme = 'dark'
    await settle()
    // 显式 dark 不受祖先影响
    expect(pinned.vm.dark).toBe(true)
    pinned.unmount()
  })
})
