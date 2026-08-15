// @yzen-ui/registry-core —— 项目感知层（开发消费型 CLI/MCP 的共享数据访问层）
export { createProjectContext } from './context.ts'
export type { ProjectContext } from './context.ts'
export { findRepoRoot } from './root.ts'
export { parseTokens, readThemeTokens } from './tokens.ts'
export { STYLE_GUIDE } from './styleGuide.ts'
export type {
  ComponentSummary,
  ComponentDetail,
  ComponentFilter,
  TokenGroup,
  DesignTokens,
  ProjectInfo,
  DocInfo,
} from './types.ts'
