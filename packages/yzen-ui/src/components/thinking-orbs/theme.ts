// Theme resolution: explicit prop → ancestor data-theme/.dark|.light
// class (watched live) → prefers-color-scheme (subscribed live).
// Vue 移植版（原 React hooks 版见 thinking-orbs，MIT © Jakub Antalik 2026）。

import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { OrbTheme } from './types'

function ancestorTheme(el: Element | null): boolean | null {
  let node: Element | null = el
  while (node) {
    const attr = node.getAttribute('data-theme')
    if (attr === 'dark') return true
    if (attr === 'light') return false
    if (node.classList.contains('dark')) return true
    if (node.classList.contains('light')) return false
    node = node.parentElement
  }
  return null
}

function systemDark(): boolean {
  return typeof matchMedia === 'undefined' || matchMedia('(prefers-color-scheme: dark)').matches
}

/** Resolve the effective dark/light substrate for a mounted element（reactive）。 */
export function useResolvedDark(theme: Ref<OrbTheme>, hostRef: Ref<Element | null>): Ref<boolean> {
  const dark = ref(true)
  let cleanup: (() => void) | null = null

  const teardown = () => {
    cleanup?.()
    cleanup = null
  }

  watch(
    // hostRef 也作为依赖：immediate 首跑在 setup 阶段 host 尚未绑定（null），
    // 组件挂载后 host 变为非 null 时重跑，此时才挂上 MutationObserver——
    // 否则应用级 data-theme/.dark 翻转永远不会被监听（auto 主题失效）
    [theme, hostRef],
    ([mode]) => {
      // 每次 theme 分支/宿主变化重建监听（与 React useEffect 依赖数组语义一致）
      teardown()
      if (mode === 'dark') {
        dark.value = true
        return
      }
      if (mode === 'light') {
        dark.value = false
        return
      }

      const resolve = () => {
        const fromTree = ancestorTheme(hostRef.value)
        dark.value = fromTree ?? systemDark()
      }
      resolve()

      // live OS/browser theme switches
      const mq =
        typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null
      mq?.addEventListener('change', resolve)

      // live app-level toggles: watch class/data-theme flips on ancestors
      let mo: MutationObserver | null = null
      if (typeof MutationObserver !== 'undefined' && hostRef.value) {
        mo = new MutationObserver(resolve)
        mo.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-theme'],
          subtree: true,
        })
      }

      cleanup = () => {
        mq?.removeEventListener('change', resolve)
        mo?.disconnect()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(teardown)
  return dark
}

/** Live `prefers-reduced-motion` — reduced users get a static frame. */
export function useReducedMotion(): Ref<boolean> {
  const reduced = ref(false)
  let mq: MediaQueryList | null = null
  const on = (e: MediaQueryListEvent) => (reduced.value = e.matches)

  watch(
    () => true,
    () => {
      if (typeof matchMedia === 'undefined') return
      mq = matchMedia('(prefers-reduced-motion: reduce)')
      reduced.value = mq.matches
      mq.addEventListener('change', on)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => mq?.removeEventListener('change', on))
  return reduced
}
