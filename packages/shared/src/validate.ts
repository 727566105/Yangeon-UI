// Registry 校验（PRD 5.3 构建期防漂移）：双端共用——
// Console 保存前校验、Showcase 构建/测试时校验、本地 API 写盘前服务端校验。
import type { Platform, RegistryCategory, RegistryEntry } from './types'

const KEY_RE = /^[a-z0-9-]+$/

export function validateCategories(
  categories: RegistryCategory[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const keys = new Set<string>()
  const orders = new Set<number>()
  for (const c of categories) {
    if (!KEY_RE.test(c.key)) errors.push(`分类 key 格式非法（仅允许小写字母/数字/连字符）: ${c.key}`)
    if (keys.has(c.key)) errors.push(`重复分类 key: ${c.key}`)
    keys.add(c.key)
    if (!c.label?.zh || !c.label?.en) errors.push(`分类 ${c.key ?? '?'} 的 label 缺少双语文案`)
    if (!Number.isInteger(c.order)) errors.push(`分类 ${c.key ?? '?'} 的 order 必须为整数`)
    if (orders.has(c.order)) errors.push(`分类 order 重复: ${c.order}`)
    orders.add(c.order)
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}

export function validatePlatforms(
  platforms: Platform[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const keys = new Set<string>()
  const orders = new Set<number>()
  for (const p of platforms) {
    if (!KEY_RE.test(p.key)) errors.push(`平台 key 格式非法（仅允许小写字母/数字/连字符）: ${p.key}`)
    if (keys.has(p.key)) errors.push(`重复平台 key: ${p.key}`)
    keys.add(p.key)
    if (!p.label?.zh || !p.label?.en) errors.push(`平台 ${p.key ?? '?'} 的 label 缺少双语文案`)
    if (!Number.isInteger(p.order)) errors.push(`平台 ${p.key ?? '?'} 的 order 必须为整数`)
    if (orders.has(p.order)) errors.push(`平台 order 重复: ${p.order}`)
    orders.add(p.order)
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}

export function validateRegistry(
  entries: RegistryEntry[],
  available: string[],
  categories?: RegistryCategory[],
  platforms?: Platform[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const keys = new Set<string>()
  const orders = new Set<number>()
  const categoryKeys = new Set(categories?.map((c) => c.key) ?? [])
  const platformKeys = new Set(platforms?.map((p) => p.key) ?? [])
  for (const e of entries) {
    if (keys.has(e.key)) errors.push(`重复组件 key: ${e.key}`)
    keys.add(e.key)
    if (!available.includes(e.key)) errors.push(`registry 引用了不存在的组件: ${e.key} (source: ${e.source})`)
    if (categories && !categoryKeys.has(e.category)) {
      errors.push(`组件 ${e.key} 引用了不存在的分类: ${e.category}`)
    }
    if (!e.platform) errors.push(`组件 ${e.key} 缺少 platform 字段`)
    if (platforms && !platformKeys.has(e.platform)) {
      errors.push(`组件 ${e.key} 引用了不存在的平台: ${e.platform}`)
    }
    if (!Number.isInteger(e.order)) errors.push(`order 必须为整数: ${e.key}`)
    if (orders.has(e.order)) errors.push(`order 重复: ${e.order} (${e.key})`)
    orders.add(e.order)
    if (e.variants.length === 0) errors.push(`组件 ${e.key} 至少需要一个变体`)
    // 双语文案完整性：name/description/tags/variant label 的 zh 与 en 必须都非空
    if (!e.name?.zh || !e.name?.en) errors.push(`组件 ${e.key} 的 name 缺少双语文案`)
    if (!e.description?.zh || !e.description?.en) errors.push(`组件 ${e.key} 的 description 缺少双语文案`)
    if (!Array.isArray(e.tags) || e.tags.length === 0) errors.push(`组件 ${e.key} 至少需要一个标签`)
    e.tags?.forEach((t, i) => {
      if (!t?.zh || !t?.en) errors.push(`组件 ${e.key} 的 tags[${i}] 缺少双语文案`)
    })
    const variantIds = new Set<string>()
    for (const v of e.variants) {
      if (!v.id) errors.push(`组件 ${e.key} 存在无 id 的变体`)
      if (variantIds.has(v.id)) errors.push(`组件 ${e.key} 存在重复变体 id: ${v.id}`)
      variantIds.add(v.id)
      if (!v.label?.zh || !v.label?.en) errors.push(`组件 ${e.key} 变体 ${v.id ?? '?'} 缺少双语 label`)
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}
