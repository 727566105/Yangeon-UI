// YzBorderBeam 纯逻辑：渐变构建（与 antd BorderBeam util 同语义，便于单测）

/** 渐变 stop（percent 为 0-100 输入范围） */
export interface BorderBeamStop {
  color: string
  percent: number
}

/** 可见光束段上限：尾部 30% 留给淡出，保证光束有可见尾巴 */
const MAX_BEAM_COLOR_STOP_PERCENT = 70

function normalizeColor(value?: string | BorderBeamStop[]): BorderBeamStop[] {
  return typeof value === 'string' ? [{ color: value, percent: 0 }] : (value ?? [])
}

function fillGradientEnd(items: BorderBeamStop[]): BorderBeamStop[] {
  const last = items[items.length - 1]
  // 先 clamp 再判断：percent 130 应视为 100（不补重复 stop），antd 原版会补出重复色标
  if (!last || clampPercent(last.percent) === 100) return items
  return [...items, { ...last, percent: 100 }]
}

const clampPercent = (percent: number) => Math.min(Math.max(percent, 0), 100)

/** 0-100 的 stop 等比缩放到可见光束段（不硬截断，保持色点分布比例） */
function mapStopPercent(percent: number): number {
  return Number(((clampPercent(percent) / 100) * MAX_BEAM_COLOR_STOP_PERCENT).toFixed(2))
}

/** 构建光束渐变：linear-gradient(to left, stops..., transparent) */
export function getBorderBeamGradient(
  value?: string | BorderBeamStop[],
): string | undefined {
  const stops = fillGradientEnd(normalizeColor(value)).map((s) => ({
    ...s,
    percent: mapStopPercent(s.percent),
  }))
  if (!stops.length) return undefined
  return `linear-gradient(to left, ${stops.map((s) => `${s.color} ${s.percent}%`).join(', ')}, transparent)`
}
