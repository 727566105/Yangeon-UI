import { computed } from 'vue'
import { registryEntriesFor } from './registry'
import { categories } from './categories'

/** 分组（按分类）：传入平台（端）过滤后的条目列表，侧栏分组跟随端切换 */
export function useGroups(entries: () => ReturnType<typeof registryEntriesFor>) {
  return computed(() => {
    const list = entries()
    const groups: Record<string, typeof list> = {}
    for (const e of list) {
      ;(groups[e.category] ??= []).push(e)
    }
    // 分组顺序按分类表 order（Console 可自定义），而非 registry 出现序
    const ordered: Record<string, typeof list> = {}
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
