// Registry 数据契约（PRD 5.2）：Console 写入、Showcase 构建期读取渲染的组件注册表结构。
// 组件元信息 = 数据字段（category/order/visible/source/variants）+ 双语文案（name/description/tags/label）。
export interface LocalizedText {
  zh: string
  en: string
}

export interface Variant {
  /** 变体标识（同 entry 内唯一） */
  id: string
  label: LocalizedText
  props: Record<string, unknown>
}

export interface RegistryEntry {
  key: string
  name: LocalizedText
  description: LocalizedText
  category: string
  /** 平台（端）归属：引用 platforms.json 的 key（mobile/desktop 等，Console 可管理） */
  platform: string
  tags: LocalizedText[]
  order: number
  visible: boolean
  source: string
  variants: Variant[]
}

export type RegistryJson = RegistryEntry[]

// 组件分类（分组）：独立数据文件 registry/categories.json，Console 可增删改排序，
// 展示站侧栏分组与 Console 下拉均数据驱动。
export interface RegistryCategory {
  key: string
  label: LocalizedText
  order: number
}

export type CategoriesJson = RegistryCategory[]

// 平台（端）：独立数据文件 registry/platforms.json，Console 可增删改排序，
// 展示站全局端切换器与 Console 下拉均数据驱动。
export interface Platform {
  key: string
  label: LocalizedText
  order: number
}

export type PlatformsJson = Platform[]
