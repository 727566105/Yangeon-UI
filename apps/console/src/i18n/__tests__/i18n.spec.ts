import { describe, it, expect, beforeEach } from 'vitest'
import { locale, setLocale, t, useI18n } from '../index'
import { zh } from '../messages/zh'
import { en } from '../messages/en'

beforeEach(() => {
  window.localStorage.clear()
  setLocale('zh')
})

describe('console i18n', () => {
  it('defaults to zh', () => {
    expect(locale.value).toBe('zh')
    expect(t('app.title')).toBe('Yzen Console · 组件管理')
  })

  it('stays zh even when a stale en preference exists in localStorage', () => {
    // 管理端固定中文：残留的 yz-locale 偏好不应影响（已移除该存储键的读取）
    window.localStorage.setItem('yz-locale', 'en')
    expect(locale.value).toBe('zh')
    expect(t('nav.dev')).toBe('开发接入')
  })

  it('switches language reactively', () => {
    const { t: tt } = useI18n()
    setLocale('en')
    expect(tt('app.title')).toBe('Yzen Console · Component Manager')
    expect(tt('nav.import')).toBe('Import')
    setLocale('zh')
    expect(tt('nav.import')).toBe('收录组件')
  })

  it('zh and en message trees are structurally identical', () => {
    function keyPaths(obj: unknown, prefix = ''): string[] {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
          keyPaths(v, prefix ? `${prefix}.${k}` : k),
        )
      }
      return [prefix]
    }
    expect(keyPaths(zh).sort()).toEqual(keyPaths(en).sort())
  })

  it('all leaves are non-empty', () => {
    function leaves(obj: unknown): string[] {
      if (Array.isArray(obj)) return obj.flatMap((v) => (typeof v === 'string' ? [v] : leaves(v)))
      if (obj && typeof obj === 'object') {
        return Object.values(obj as Record<string, unknown>).flatMap((v) => leaves(v))
      }
      return typeof obj === 'string' ? [obj] : []
    }
    expect(leaves(zh).filter((s) => s.trim() === '')).toEqual([])
    expect(leaves(en).filter((s) => s.trim() === '')).toEqual([])
  })
})
