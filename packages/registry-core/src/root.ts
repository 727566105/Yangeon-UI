// 仓库根发现：显式 root 优先，否则从 cwd 向上查找 pnpm-workspace.yaml（monorepo 锚点）。
import { existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'

export function findRepoRoot(start?: string): string | null {
  let dir = resolve(start ?? process.cwd())
  for (;;) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dir.split(sep).slice(0, -1).join(sep)
    // 已到文件系统根或路径耗尽（parent 为空串）：无锚点
    if (parent === dir || parent === '') return null
    dir = parent
  }
}
