import { computed } from 'vue'
import { registryEntries } from './registry'

export function useGroups() {
  return computed(() => {
    const groups: Record<string, typeof registryEntries> = {}
    for (const e of registryEntries) {
      ;(groups[e.category] ??= []).push(e)
    }
    return groups
  })
}
