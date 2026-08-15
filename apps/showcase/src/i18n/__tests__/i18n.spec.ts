import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { locale, setLocale, t, useI18n } from '../index'
import { zh } from '../messages/zh'
import { en } from '../messages/en'
import { registryEntries } from '../../registry'

// 模块级单例：每个用例前重置为中文默认态，避免用例间相互污染
// （happy-dom 下 localStorage 仅挂在 window 上，不暴露为裸全局）
beforeEach(() => {
  window.localStorage.clear()
  setLocale('zh')
})

describe('i18n', () => {
  it('defaults to zh (first visit shows Chinese)', () => {
    expect(locale.value).toBe('zh')
    expect(t('sidebar.brand')).toBe('Yzen-UI for AI-native interfaces.')
    expect(t('registry.entries.button.name')).toBe('Button 按钮')
  })

  it('switches language reactively without reload', () => {
    const { locale: l, t: tt } = useI18n()
    expect(tt('registry.entries.button.name')).toBe('Button 按钮')
    setLocale('en')
    expect(l.value).toBe('en')
    // computed messages 响应式：同一 t 调用链立刻返回英文
    expect(tt('registry.entries.button.name')).toBe('Button')
    expect(tt('sidebar.themeToggle')).toBe('Toggle theme')
    expect(tt('registry.entries.approval-card.variants.pending')).toBe('Pending')
    setLocale('zh')
    expect(tt('registry.entries.button.name')).toBe('Button 按钮')
  })

  it('persists the choice in localStorage and syncs <html lang>', () => {
    setLocale('en')
    expect(window.localStorage.getItem('yz-locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    setLocale('zh')
    expect(window.localStorage.getItem('yz-locale')).toBe('zh')
    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('syncs document.title with the app title', async () => {
    document.title = 'initial'
    setLocale('en')
    await nextTick()
    expect(document.title).toBe('Yzen-UI · AI-native UI Kit')
    setLocale('zh')
    await nextTick()
    expect(document.title).toBe('Yzen-UI · AI 科技风组件库')
  })

  it('returns empty string for a missing key instead of crashing', () => {
    expect(t('no.such.key')).toBe('')
    expect(t('registry.entries.button.nope')).toBe('')
  })

  it('zh and en message trees are structurally identical (one-to-one)', () => {
    function keyPaths(obj: unknown, prefix = ''): string[] {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
          keyPaths(v, prefix ? `${prefix}.${k}` : k),
        )
      }
      return [prefix]
    }
    const zhKeys = keyPaths(zh).sort()
    const enKeys = keyPaths(en).sort()
    expect(zhKeys).toEqual(enKeys)
  })

  it('all message leaves are non-empty in both languages (no blank translations)', () => {
    function leaves(obj: unknown): string[] {
      if (Array.isArray(obj)) return obj.flatMap((v) => (typeof v === 'string' ? [v] : leaves(v)))
      if (obj && typeof obj === 'object') {
        return Object.values(obj as Record<string, unknown>).flatMap((v) => leaves(v))
      }
      return typeof obj === 'string' ? [obj] : []
    }
    const blanks = leaves(zh).filter((s) => s.trim() === '')
    const enBlanks = leaves(en).filter((s) => s.trim() === '')
    expect(blanks).toEqual([])
    expect(enBlanks).toEqual([])
  })

  it('registry entries ↔ messages stay in sync (every key and variant id translated in both locales)', () => {
    // 防止未来 registry.json 新增组件/变体但漏翻译：message 缺失时变体名/标题会静默变空
    type EntryMsg = { variants: Record<string, string> }
    const zhEntries = zh.registry.entries as Record<string, EntryMsg>
    const enEntries = en.registry.entries as Record<string, EntryMsg>
    for (const e of registryEntries) {
      const zhEntry = zhEntries[e.key]
      const enEntry = enEntries[e.key]
      expect(zhEntry, `zh missing entry: ${e.key}`).toBeDefined()
      expect(enEntry, `en missing entry: ${e.key}`).toBeDefined()
      for (const v of e.variants) {
        expect(zhEntry.variants[v.id], `zh missing variant label: ${e.key}/${v.id}`).toBeTruthy()
        expect(enEntry.variants[v.id], `en missing variant label: ${e.key}/${v.id}`).toBeTruthy()
      }
    }
    // 反向：messages 里的条目都存在于 registry（无孤儿文案）
    const registryKeys = new Set(registryEntries.map((e) => e.key))
    for (const key of Object.keys(zh.registry.entries)) {
      expect(registryKeys.has(key), `orphan message entry: ${key}`).toBe(true)
    }
  })

  it('degrades gracefully when localStorage is unavailable (privacy mode)', () => {
    const g = globalThis as unknown as { localStorage?: unknown }
    const savedGlobal = g.localStorage
    const savedWindow = window.localStorage
    try {
      Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true })
      Object.defineProperty(window, 'localStorage', { value: undefined, configurable: true })
      // 不崩溃，语言仍可切换（只是不持久化）
      expect(() => setLocale('en')).not.toThrow()
      expect(locale.value).toBe('en')
      expect(t('sidebar.brand')).toBe('Yzen-UI for AI-native interfaces.')
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: savedGlobal, configurable: true })
      Object.defineProperty(window, 'localStorage', { value: savedWindow, configurable: true })
      setLocale('zh')
    }
  })

  it('falls back to zh messages for an unknown locale value at runtime', () => {
    setLocale('fr' as never)
    expect(locale.value).toBe('fr')
    // messages 计算：非 'en' 一律取 zh（TS 类型虽挡住，运行时仍需兜底）
    expect(t('registry.entries.button.name')).toBe('Button 按钮')
    setLocale('zh')
    expect(t('registry.entries.button.name')).toBe('Button 按钮')
  })
})
