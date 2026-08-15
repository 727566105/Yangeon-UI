// 分类数据层：registry/categories.json（Console 管理端维护）→ 展示站分组标题与顺序。
import categoriesJson from '../../../registry/categories.json'
import type { RegistryCategory } from '@yzen-ui/shared'

export const categories: RegistryCategory[] = [...(categoriesJson as RegistryCategory[])].sort(
  (a, b) => a.order - b.order,
)

export const categoryMap: Record<string, RegistryCategory> = Object.fromEntries(
  categories.map((c) => [c.key, c]),
)
