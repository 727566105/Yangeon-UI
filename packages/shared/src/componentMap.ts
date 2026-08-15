// 组件映射：目录约定 + import.meta.glob（构建期，eager）。
// glob 路径相对本文件（packages/shared/src/）解析，双端（showcase/console）的 vite 都会编译。
// 组件库各目录 index.ts 均为命名导出（无 default），故不使用 import: 'default'；
// 组件名/主组件从模块命名空间中提取（优先 default，其次首个组件形态的导出）。
import type { Component } from 'vue'

const componentModules = import.meta.glob(
  '../../yzen-ui/src/components/*/index.ts',
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
