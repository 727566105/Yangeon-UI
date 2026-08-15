// ProjectContext 类型定义（registry-core 项目感知层）
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

/** 组件清单精简项（供 list_components / yz components list，控制 AI 上下文占用） */
export interface ComponentSummary {
  key: string
  nameZh: string
  nameEn: string
  category: string
  order: number
  visible: boolean
  variantCount: number
}

/** 组件详情（get_component 返回全量） */
export interface ComponentDetail extends RegistryEntry {
  /** 组件实现文件名（如 Button.vue）；缺失时为空 */
  componentFile: string
  /** demo 壳文件是否存在 */
  hasDemo: boolean
}

/** 组件清单筛选参数 */
export interface ComponentFilter {
  category?: string
  keyword?: string
  limit?: number
}

/** 设计 token 分组（按 tokens-*.scss 注释块） */
export interface TokenGroup {
  group: string
  tokens: { name: string; value: string }[]
}

/** 主题 token 全集（浅色默认 + 深色覆盖） */
export interface DesignTokens {
  light: TokenGroup[]
  dark: TokenGroup[]
}

/** 项目结构概览 */
export interface ProjectInfo {
  root: string
  apps: string[]
  packages: string[]
  hasRegistry: boolean
  hasDocs: boolean
  componentCount: number
  categoryCount: number
}

/** 项目文档条目 */
export interface DocInfo {
  name: string
  path: string
  content: string
}
