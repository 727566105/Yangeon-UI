import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ComponentSection from '../ComponentSection.vue'
import { registryEntries, componentMap } from '../../registry'
import { setLocale } from '../../i18n'

beforeEach(() => {
  localStorage.clear()
  setLocale('zh')
})

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

// 区块头文案（标题/标签/描述/变体名）跟随语言切换，且默认中文
describe('ComponentSection i18n copy', () => {
  it('renders Chinese header copy by default', async () => {
    const entry = registryEntries.find((e) => e.key === 'button')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    expect(wrapper.find('.component-section__name').text()).toBe('Button 按钮')
    expect(wrapper.text()).toContain('发光、渐变、AI 加载状态一应俱全的按钮')
    // 描述截断时 title 携带完整文案
    expect(wrapper.find('.component-section__desc').attributes('title')).toBe('发光、渐变、AI 加载状态一应俱全的按钮')
    expect(wrapper.find('.component-section__tag').text()).toBe('基础')
    expect(wrapper.find('.component-section__action').attributes('aria-label')).toBe('复制代码')
    // 变体名随语言本地化（zh: 实心/AI 加载）
    expect(wrapper.find('.variant-switcher').text()).toContain('实心')
    expect(wrapper.find('.variant-switcher').text()).toContain('AI 加载')
  })

  it('switches header copy to English after setLocale("en")', async () => {
    const entry = registryEntries.find((e) => e.key === 'button')!
    setLocale('en')
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    expect(wrapper.find('.component-section__name').text()).toBe('Button')
    expect(wrapper.text()).toContain('Glow, gradient and AI loading states in one button')
    expect(wrapper.find('.component-section__tag').text()).toBe('Basic')
    expect(wrapper.find('.component-section__action').attributes('aria-label')).toBe('Copy code')
    expect(wrapper.find('.variant-switcher').text()).toContain('Solid')
    expect(wrapper.find('.variant-switcher').text()).toContain('AI Loading')
  })

  it('variant switcher labels follow language switches reactively', async () => {
    const entry = registryEntries.find((e) => e.key === 'button')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    expect(wrapper.find('.variant-switcher').text()).toContain('实心')
    // 不重新挂载，仅切语言——变体切换器必须跟着切换
    setLocale('en')
    await settle()
    expect(wrapper.find('.variant-switcher').text()).toContain('Solid')
    expect(wrapper.find('.variant-switcher').text()).not.toContain('实心')
    setLocale('zh')
    await settle()
    expect(wrapper.find('.variant-switcher').text()).toContain('实心')
  })

  it('falls back to the variant id when the localized label is empty', async () => {
    const entry = registryEntries.find((e) => e.key === 'button')!
    // 模拟缺失变体 label 的 entry（双语文案均为空串）
    const noLabelEntry: typeof entry = {
      ...entry,
      variants: entry.variants.map((v) => ({ ...v, label: { zh: '', en: '' } })),
    }
    const wrapper = mount(ComponentSection, {
      props: { entry: noLabelEntry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    const buttonTexts = wrapper.findAll('.variant-switcher__item').map((b) => b.text())
    expect(buttonTexts).toEqual(noLabelEntry.variants.map((v) => v.id))
  })
})

// 查看代码弹窗：必须展示完整组件实现源码（<Name>.vue），而非 demo.vue 薄壳
describe('ComponentSection view code', () => {
  it('shows the full component implementation instead of the demo shell', async () => {
    const entry = registryEntries.find((e) => e.key === 'search')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    // 打开查看代码弹窗（第二个动作按钮）
    await wrapper.findAll('.component-section__action')[1].trigger('click')
    await settle()
    // 弹窗顶栏：本地化组件名标题 + mono 路径（指向完整实现文件，而非 demo 壳）
    expect(wrapper.find('.code-viewer__title').text()).toBe('Search 指令搜索')
    expect(wrapper.find('.code-viewer__path').text()).toBe('components/search/Search.vue')
    const source = wrapper.find('.code-viewer__pre').text()
    expect(source).toContain('yz-search')
    expect(source).toContain('defineProps')
    expect(source).not.toContain('YzSearch v-bind="active"')
  })

  it('falls back to an empty source when the component file is missing', async () => {
    const entry = registryEntries.find((e) => e.key === 'search')!
    const ghost: typeof entry = { ...entry, key: 'ghost', source: 'components/ghost' }
    const wrapper = mount(ComponentSection, {
      props: { entry: ghost, component: componentMap.search, index: 99 },
      global: { stubs: { teleport: true } },
    })
    await settle()
    await wrapper.findAll('.component-section__action')[1].trigger('click')
    await settle()
    expect(wrapper.find('.code-viewer__path').text()).toBe('components/ghost/')
    expect(wrapper.find('.code-viewer__pre').text()).toBe('')
  })

  it('modal title and buttons follow language switches while the modal is open', async () => {
    const entry = registryEntries.find((e) => e.key === 'button')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    await wrapper.findAll('.component-section__action')[1].trigger('click')
    await settle()
    expect(wrapper.find('.code-viewer__title').text()).toBe('Button 按钮')
    expect(wrapper.find('.code-viewer__copy-btn').text()).toContain('复制')
    // 不关闭弹窗，直接切语言——标题/按钮文案必须跟随
    setLocale('en')
    await settle()
    expect(wrapper.find('.code-viewer__title').text()).toBe('Button')
    expect(wrapper.find('.code-viewer__copy-btn').text()).toContain('Copy')
    expect(wrapper.find('.code-viewer__icon-btn').attributes('aria-label')).toBe('Close')
    setLocale('zh')
  })

  it('closes the modal when the backdrop is clicked', async () => {
    const entry = registryEntries.find((e) => e.key === 'button')!
    const wrapper = mount(ComponentSection, {
      props: { entry, component: componentMap[entry.key], index: entry.order },
      global: { stubs: { teleport: true } },
    })
    await settle()
    await wrapper.findAll('.component-section__action')[1].trigger('click')
    await settle()
    expect(wrapper.find('.code-viewer__panel').exists()).toBe(true)
    await wrapper.find('.code-viewer__backdrop').trigger('click')
    await settle()
    expect(wrapper.find('.code-viewer__panel').exists()).toBe(false)
  })
})
