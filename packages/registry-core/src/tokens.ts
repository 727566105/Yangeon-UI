// 设计 token 解析：从 theme/tokens-light.scss（:root）与 tokens-dark.scss（html[data-theme="dark"]）
// 提取 --yz-* 变量，按注释块分组（颜色/形状/阴影/字体/动效等）。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DesignTokens, TokenGroup } from './types'

// 按注释块分组的 scss 片段：// 分组注释 → 后续 --yz-* 变量行
// 注意：正则都不能用 g flag——str.match(g) 返回的数组不含捕获组
const GROUP_RE = /^\s*\/\/\s*(.+)$/
const TOKEN_RE = /--([a-z0-9-]+)\s*:\s*([^;]+);/

function parseGroups(scss: string): TokenGroup[] {
  const groups: TokenGroup[] = []
  let current: TokenGroup | null = null
  const lines = scss.split('\n')
  for (const line of lines) {
    const groupMatch = line.match(GROUP_RE)
    if (groupMatch) {
      current = { group: groupMatch[1].trim(), tokens: [] }
      groups.push(current)
      continue
    }
    const tokenMatch = line.match(TOKEN_RE)
    if (tokenMatch) {
      // 无注释分组的变量（如 tokens-dark.scss 的覆盖段）归入默认组
      if (!current) {
        current = { group: '默认', tokens: [] }
        groups.push(current)
      }
      current.tokens.push({ name: `--${tokenMatch[1]}`, value: tokenMatch[2].trim() })
    }
  }
  return groups.filter((g) => g.tokens.length > 0)
}

export function parseTokens(scssLight: string, scssDark: string): DesignTokens {
  return { light: parseGroups(scssLight), dark: parseGroups(scssDark) }
}

export function readThemeTokens(root: string): DesignTokens {
  const lightPath = join(root, 'packages/yzen-ui/src/theme/tokens-light.scss')
  const darkPath = join(root, 'packages/yzen-ui/src/theme/tokens-dark.scss')
  const light = readFileSync(lightPath, 'utf8')
  let dark = ''
  try {
    dark = readFileSync(darkPath, 'utf8')
  } catch {
    /* dark 缺失时为空 */
  }
  return parseTokens(light, dark)
}
