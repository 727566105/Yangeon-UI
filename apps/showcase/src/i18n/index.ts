// 轻量 i18n 模块（自建，零依赖）：
// 模块级响应式单例 locale + 集中式 messages 配置（zh/en 结构由 en: Messages 类型约束一一对应）。
// 用法：const { t, locale, setLocale } = useI18n()；t('sidebar.brand') 点路径取值。
// 语言偏好持久化在 localStorage（'yz-locale'），并同步 <html lang> 与 document.title，
// 切换即时生效，无需刷新。
import { computed, ref } from 'vue'
import { zh } from './messages/zh'
import { en } from './messages/en'

export type Locale = 'zh' | 'en'
export type Messages = typeof zh

const STORAGE_KEY = 'yz-locale'

// 兼容测试环境（happy-dom 下 localStorage 仅挂 window，不暴露为裸全局）
function getStorage(): Storage | null {
  try {
    return (globalThis.localStorage as Storage | undefined) ?? window.localStorage ?? null
  } catch {
    return null
  }
}

function readInitial(): Locale {
  return getStorage()?.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh'
}

export const locale = ref<Locale>(readInitial())

const messages = computed<Messages>(() => (locale.value === 'en' ? en : zh))

function lookup(path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, messages.value)
}

/** 取当前语言下的字符串文案；key 缺失返回 ''（动态 key 不做字面量约束，结构一致性由 en: Messages 保证） */
export function t(path: string): string {
  const v = lookup(path)
  return typeof v === 'string' ? v : ''
}

/** 取当前语言下的字符串数组文案（如标签组）；非数组或缺失返回 [] */
export function tList(path: string): string[] {
  const v = lookup(path)
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : []
}

function syncDom() {
  document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  document.title = t('app.title')
}

export function setLocale(next: Locale) {
  if (locale.value === next) return
  locale.value = next
  getStorage()?.setItem(STORAGE_KEY, next)
  syncDom()
}

// 初始化同步一次（持久化过 en 时首屏即英文 lang/title）
syncDom()

export function useI18n() {
  return { locale, setLocale, t, tList }
}
