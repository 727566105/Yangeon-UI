import registryJson from '../../../registry/registry.json'
import type { Component } from 'vue'

export interface Variant {
  label: string
  props: Record<string, unknown>
}

export interface RegistryEntry {
  key: string
  name: string
  description: string
  category: string
  tags: string[]
  order: number
  visible: boolean
  source: string
  variants: Variant[]
}

// 组件注册：目录约定 + import.meta.glob（构建期，eager；registry.ts 位于 apps/showcase/src/，到仓库根 3 级）
// 注意：组件库各目录 index.ts 均为命名导出（无 default），故不使用 import: 'default'；
// 组件名/主组件从模块命名空间中提取（优先 default，其次首个组件形态的导出）。
const componentModules = import.meta.glob(
  '../../../packages/yzen-ui/src/components/*/index.ts',
  { eager: true },
)

export type ComponentMap = Record<string, Component>

function isComponentLike(v: unknown): v is Component {
  return typeof v === 'object' && v !== null && ('render' in v || 'setup' in v || '__name' in v)
}

export function buildComponentMap(): ComponentMap {
  const map: ComponentMap = {}
  for (const [path, mod] of Object.entries(componentModules)) {
    const match = path.match(/components\/([^/]+)\/index\.ts$/)
    if (!match) continue
    const ns = mod as Record<string, unknown>
    const comp = (isComponentLike(ns.default) ? ns.default : undefined)
      ?? Object.values(ns).find(isComponentLike)
    if (comp) map[match[1]] = comp
  }
  return map
}

export function validateRegistry(
  entries: RegistryEntry[],
  available: string[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const keys = new Set<string>()
  for (const e of entries) {
    if (keys.has(e.key)) errors.push(`重复组件 key: ${e.key}`)
    keys.add(e.key)
    if (!available.includes(e.key)) errors.push(`registry 引用了不存在的组件: ${e.key} (source: ${e.source})`)
    if (!Number.isInteger(e.order)) errors.push(`order 必须为整数: ${e.key}`)
    if (e.variants.length === 0) errors.push(`组件 ${e.key} 至少需要一个变体`)
    for (const v of e.variants) {
      if (!v.label) errors.push(`组件 ${e.key} 存在无 label 的变体`)
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}

export const registryEntries: RegistryEntry[] = (registryJson as RegistryEntry[])
  .filter((e) => e.visible)
  .sort((a, b) => a.order - b.order)

export const componentMap = buildComponentMap()

export const CATEGORY_LABELS: Record<string, string> = {
  basic: '基础组件',
  ai: 'AI 场景',
  advanced: '进阶组件',
}
