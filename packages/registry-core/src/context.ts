// ProjectContext 项目感知层（registry-core）：
// 以仓库根为锚，动态发现并读取组件库资产（registry/组件源码/demo/规范/文档/项目结构）。
// 设计约束（调研文档 0.1/0.2）：
// - 零缓存：每次调用直接读文件系统，跟随组件库扩展实时反映最新状态
// - 按需读取：源码/demo 按 key 懒读；listComponents 返回精简字段 + 筛选，适配 100+ 组件规模
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared'
import { findRepoRoot } from './root'
import { readThemeTokens } from './tokens'
import { STYLE_GUIDE } from './styleGuide'
import type {
  ComponentDetail,
  ComponentFilter,
  ComponentSummary,
  DesignTokens,
  DocInfo,
  ProjectInfo,
} from './types'

const REGISTRY_REL = 'registry/registry.json'
const CATEGORIES_REL = 'registry/categories.json'
const COMPONENTS_REL = 'packages/yzen-ui/src/components'

export interface ProjectContext {
  root: string
  getProjectInfo(): ProjectInfo
  listComponents(filter?: ComponentFilter): ComponentSummary[]
  getComponent(key: string): ComponentDetail | null
  readComponentSource(key: string): string | null
  readDemoSource(key: string): string | null
  getDesignTokens(): DesignTokens
  getStyleGuide(): string
  readDocs(name?: string): DocInfo[]
}

export function createProjectContext(root?: string): ProjectContext {
  const resolved = root ?? findRepoRoot() ?? process.cwd()

  function readJson<T>(rel: string): T | null {
    const path = join(resolved, rel)
    if (!existsSync(path)) return null
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as T
    } catch {
      return null
    }
  }

  function registry(): RegistryEntry[] {
    return readJson<RegistryEntry[]>(REGISTRY_REL) ?? []
  }

  function categories(): RegistryCategory[] {
    return readJson<RegistryCategory[]>(CATEGORIES_REL) ?? []
  }

  function componentKeys(): string[] {
    const dir = join(resolved, COMPONENTS_REL)
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  }

  /** 组件目录内的实现文件（排除 demo.vue；取第一个 *.vue） */
  function componentFile(key: string): string {
    const dir = join(resolved, COMPONENTS_REL, key)
    if (!existsSync(dir)) return ''
    return readdirSync(dir).find((f) => f.endsWith('.vue') && f !== 'demo.vue') ?? ''
  }

  function getProjectInfo(): ProjectInfo {
    const apps = listDirs('apps')
    const packages = listDirs('packages')
    return {
      root: resolved,
      apps,
      packages,
      hasRegistry: existsSync(join(resolved, 'registry/registry.json')),
      hasDocs: existsSync(join(resolved, 'docs')),
      componentCount: componentKeys().length,
      categoryCount: categories().length,
    }
  }

  function listDirs(rel: string): string[] {
    const dir = join(resolved, rel)
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  }

  function listComponents(filter: ComponentFilter = {}): ComponentSummary[] {
    const { category, keyword, limit } = filter
    const q = keyword?.trim().toLowerCase() ?? ''
    const out: ComponentSummary[] = []
    for (const e of registry()) {
      if (category && e.category !== category) continue
      if (q) {
        const hay = `${e.key} ${e.name.zh} ${e.name.en} ${e.tags.map((t) => t.zh + t.en).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      out.push({
        key: e.key,
        nameZh: e.name.zh,
        nameEn: e.name.en,
        category: e.category,
        order: e.order,
        visible: e.visible,
        variantCount: e.variants.length,
      })
    }
    out.sort((a, b) => a.order - b.order)
    return limit && limit > 0 ? out.slice(0, limit) : out
  }

  function getComponent(key: string): ComponentDetail | null {
    const e = registry().find((x) => x.key === key)
    if (!e) return null
    const dir = join(resolved, COMPONENTS_REL, key)
    return {
      ...e,
      componentFile: componentFile(key),
      hasDemo: existsSync(join(dir, 'demo.vue')),
    }
  }

  function readComponentSource(key: string): string | null {
    const file = componentFile(key)
    if (!file) return null
    try {
      return readFileSync(join(resolved, COMPONENTS_REL, key, file), 'utf8')
    } catch {
      return null
    }
  }

  function readDemoSource(key: string): string | null {
    const path = join(resolved, COMPONENTS_REL, key, 'demo.vue')
    if (!existsSync(path)) return null
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return null
    }
  }

  function readDocs(name?: string): DocInfo[] {
    const dir = join(resolved, 'docs')
    if (!existsSync(dir)) return []
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()
    const wanted = name ? files.filter((f) => f.toLowerCase().includes(name.toLowerCase())) : files
    return wanted.map((f) => {
      const full = join(dir, f)
      try {
        return { name: f, path: full, content: readFileSync(full, 'utf8') }
      } catch {
        return { name: f, path: full, content: '' }
      }
    })
  }

  return {
    root: resolved,
    getProjectInfo,
    listComponents,
    getComponent,
    readComponentSource,
    readDemoSource,
    getDesignTokens: () => readThemeTokens(resolved),
    getStyleGuide: () => STYLE_GUIDE,
    readDocs,
  }
}
