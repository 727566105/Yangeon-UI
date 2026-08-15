// 平台（端）数据层：registry/platforms.json（Console 管理端维护）→ 展示站端切换器。
import platformsJson from '../../../registry/platforms.json'
import type { Platform } from '@yzen-ui/shared'

export const platforms: Platform[] = [...(platformsJson as Platform[])].sort(
  (a, b) => a.order - b.order,
)

export const platformMap: Record<string, Platform> = Object.fromEntries(
  platforms.map((p) => [p.key, p]),
)
