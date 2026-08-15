// 变体分段（二维切换）的纯计算逻辑，VariantSwitcher 与 VariantTabs 共享：
// 连续同组变体归一段（组标题 + 段内按钮），按钮保持全局 index（指向原数组位置）
export interface DisplayVariant {
  id: string
  label: string
  /** 可选分组标题（已本地化）；无 group 的变体归入默认段（不显示标题） */
  group?: string
  props: Record<string, unknown>
}

export interface VariantSegment {
  group: string | null
  items: { v: DisplayVariant; index: number }[]
}

export function buildVariantSegments(variants: DisplayVariant[]): VariantSegment[] {
  const segs: VariantSegment[] = []
  for (const [i, v] of variants.entries()) {
    const key = v.group ?? ''
    const last = segs[segs.length - 1]
    // 注意：段内 group 存 null（无分组），比较时须统一到 '' 再比，否则每个无分组变体都被拆成独立段
    if (!last || (last.group ?? '') !== key) {
      segs.push({ group: v.group ?? null, items: [{ v, index: i }] })
    } else {
      last.items.push({ v, index: i })
    }
  }
  return segs
}
