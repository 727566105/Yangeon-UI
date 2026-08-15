import registryJson from '../../../registry/registry.json'
import { buildComponentMap, validateRegistry } from '@yzen-ui/shared'
import type { ComponentMap, RegistryEntry } from '@yzen-ui/shared'

// 类型/校验/组件映射由 @yzen-ui/shared 提供（PRD 9.3 双端共享契约）；
// 本文件只负责「读取 registry.json + 可见性过滤 + 排序」的应用侧组装。
export type { LocalizedText, Variant, RegistryEntry } from '@yzen-ui/shared'
export { validateRegistry }

export const registryEntries: RegistryEntry[] = (registryJson as RegistryEntry[])
  .filter((e) => e.visible)
  .sort((a, b) => a.order - b.order)

export const componentMap: ComponentMap = buildComponentMap()
