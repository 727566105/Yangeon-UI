import { computed } from 'vue'
import { registryEntries } from './registry'
import { categories } from './categories'

export function useGroups() {
  return computed(() => {
    const groups: Record<string, typeof registryEntries> = {}
    for (const e of registryEntries) {
      ;(groups[e.category] ??= []).push(e)
    }
    // 分组顺序按分类表 order（Console 可自定义），而非 registry 出现序
    const ordered: Record<string, typeof registryEntries> = {}
    for (const c of categories) {
      if (groups[c.key]) ordered[c.key] = groups[c.key]
    }
    // 分类表中不存在的分组兜底（防悬空）
    for (const key of Object.keys(groups)) {
      if (!ordered[key]) ordered[key] = groups[key]
    }
    return ordered
  })
}
