// Console 轻量 i18n（与 showcase 同模式：模块级响应式单例 + 集中文案 + localStorage 持久化）
import { computed, ref } from 'vue'
import { zh } from './messages/zh'
import { en } from './messages/en'

export type Locale = 'zh' | 'en'
export type Messages = typeof zh

// 注册表双语文案结构（registry.json 中 name/description/tags/variant label 的类型）
export interface LocalizedText {
  zh: string
  en: string
}

const STORAGE_KEY = 'yz-locale'

// 与 showcase 共用 yz-locale：两个应用语言偏好互通
function getStorage(): Storage | null {
  try {
    return (globalThis.localStorage as Storage | undefined) ?? window.localStorage ?? null
  } catch {
    return null
  }
}

export const locale = ref<Locale>(
  getStorage()?.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh',
)

const messages = computed<Messages>(() => (locale.value === 'en' ? en : zh))

export function t(path: string): string {
  const v = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, messages.value)
  return typeof v === 'string' ? v : ''
}

export function setLocale(next: Locale) {
  if (locale.value === next) return
  locale.value = next
  getStorage()?.setItem(STORAGE_KEY, next)
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
}

/** 取注册表双语文案在当前语言下的值；locale 异常时回退 zh */
export function localized(text: LocalizedText): string {
  return text[locale.value] ?? text.zh ?? ''
}

document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'

export function useI18n() {
  return { locale, setLocale, t, localized }
}
