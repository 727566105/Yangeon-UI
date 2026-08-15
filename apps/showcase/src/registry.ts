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

/** 按平台（端）过滤后的条目：展示站端切换器驱动（visible + platform + order 排序） */
export function registryEntriesFor(platform: string): RegistryEntry[] {
  return registryEntries.filter((e) => e.platform === platform)
}

export const componentMap: ComponentMap = buildComponentMap()
