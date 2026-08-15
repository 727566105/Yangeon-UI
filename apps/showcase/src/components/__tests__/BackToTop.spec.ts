import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import BackToTop from '../BackToTop.vue'
import { setLocale } from '../../i18n'

let wrapper: VueWrapper | null = null

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
}

/** 等待一次 rAF（onScroll 内 rAF 节流后写回 visible） */
function nextFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()))
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.restoreAllMocks()
})

describe('BackToTop', () => {
  it('renders with localized aria-label and stays hidden at the top', async () => {
    setLocale('zh')
    setScrollY(0)
    wrapper = mount(BackToTop)
    const btn = wrapper.find('.back-to-top')
    expect(btn.attributes('aria-label')).toBe('返回顶部')
    expect(btn.classes()).not.toContain('back-to-top--visible')
  })

  it('becomes visible after scrolling past the threshold and aria-label follows English locale', async () => {
    setLocale('en')
    setScrollY(600)
    window.dispatchEvent(new Event('scroll'))
    wrapper = mount(BackToTop)
    await nextFrame()
    const btn = wrapper.find('.back-to-top')
    expect(btn.classes()).toContain('back-to-top--visible')
    expect(btn.attributes('aria-label')).toBe('Back to top')
  })

  it('hides again when scrolled back to the top', async () => {
    setScrollY(600)
    wrapper = mount(BackToTop)
    await nextFrame()
    expect(wrapper.find('.back-to-top').classes()).toContain('back-to-top--visible')
    setScrollY(0)
    window.dispatchEvent(new Event('scroll'))
    await nextFrame()
    expect(wrapper.find('.back-to-top').classes()).not.toContain('back-to-top--visible')
  })

  it('scrolls smoothly to the top on click', async () => {
    setScrollY(600)
    wrapper = mount(BackToTop)
    await nextFrame()
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    await wrapper.find('.back-to-top').trigger('click')
    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
