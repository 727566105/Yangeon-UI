import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProjectContext } from '../context'
import type { RegistryEntry } from '@yzen-ui/shared'

// 临时仓库根（registry/ + components/ + docs/ + theme/ 最小结构）
let root = ''

const CATEGORIES = [
  { key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 },
  { key: 'ai', label: { zh: 'AI 场景', en: 'AI' }, order: 2 },
]

function makeEntry(i: number, over: Partial<RegistryEntry> = {}): RegistryEntry {
  const key = i === 1 ? 'button' : `comp-${String(i).padStart(3, '0')}`
  return {
    key,
    name: { zh: `组件 ${i}`, en: `Component ${i}` },
    description: { zh: `描述 ${i}`, en: `Description ${i}` },
    category: i % 2 === 0 ? 'ai' : 'basic',
    tags: [{ zh: '标签', en: 'Tag' }],
    order: i,
    visible: i !== 100,
    source: `components/${key}`,
    variants: [{ id: 'default', label: { zh: '默认', en: 'Default' }, props: {} }],
    ...over,
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'yz-core-'))
  mkdirSync(join(root, 'registry'), { recursive: true })
  mkdirSync(join(root, 'packages/yzen-ui/src/components/button'), { recursive: true })
  mkdirSync(join(root, 'docs'), { recursive: true })
  mkdirSync(join(root, 'packages/yzen-ui/src/theme'), { recursive: true })
  writeFileSync(join(root, 'registry/categories.json'), JSON.stringify(CATEGORIES))
  writeFileSync(
    join(root, 'registry/registry.json'),
    JSON.stringify([makeEntry(1)], null, 2),
  )
  writeFileSync(
    join(root, 'packages/yzen-ui/src/components/button/Button.vue'),
    '<template><button class="yz-button"><slot /></button></template>\n',
  )
  writeFileSync(
    join(root, 'packages/yzen-ui/src/components/button/demo.vue'),
    '<template><YzButton /></template>\n',
  )
  writeFileSync(join(root, 'packages/yzen-ui/src/theme/tokens-light.scss'),
    '// 颜色\n--yz-page: #fafafb;\n--yz-ink: #1f2124;\n// 形状\n--yz-radius-window: 14px;\n')
  writeFileSync(join(root, 'packages/yzen-ui/src/theme/tokens-dark.scss'),
    '// 颜色\n--yz-page: #111318;\n')
  writeFileSync(join(root, 'docs/PRD.md'), '# PRD\n这是产品需求文档\n')
  writeFileSync(join(root, 'docs/research.md'), '# 调研\n这是调研文档\n')
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('ProjectContext', () => {
  it('reads project info (structure overview)', () => {
    const ctx = createProjectContext(root)
    const info = ctx.getProjectInfo()
    expect(info.root).toBe(root)
    expect(info.componentCount).toBe(1)
    expect(info.categoryCount).toBe(2)
    expect(info.hasRegistry).toBe(true)
    expect(info.hasDocs).toBe(true)
    expect(info.packages).toContain('yzen-ui')
  })

  it('lists components with summary fields and filtering', () => {
    const ctx = createProjectContext(root)
    const list = ctx.listComponents()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      key: 'button',
      nameZh: '组件 1',
      category: 'basic',
      order: 1,
      visible: true,
      variantCount: 1,
    })
    // 筛选：分类/keyword/limit
    expect(ctx.listComponents({ category: 'ai' })).toHaveLength(0)
    expect(ctx.listComponents({ keyword: '组件' })).toHaveLength(1)
    expect(ctx.listComponents({ keyword: '不存在的词' })).toHaveLength(0)
  })

  it('gets component detail and lazily reads sources', () => {
    const ctx = createProjectContext(root)
    const detail = ctx.getComponent('button')
    expect(detail).not.toBeNull()
    expect(detail?.componentFile).toBe('Button.vue')
    expect(detail?.hasDemo).toBe(true)
    expect(ctx.getComponent('ghost')).toBeNull()

    const source = ctx.readComponentSource('button')
    expect(source).toContain('yz-button')
    expect(ctx.readComponentSource('ghost')).toBeNull()
    const demo = ctx.readDemoSource('button')
    expect(demo).toContain('YzButton')
  })

  it('parses design tokens grouped by comment blocks', () => {
    const ctx = createProjectContext(root)
    const tokens = ctx.getDesignTokens()
    expect(tokens.light.length).toBeGreaterThanOrEqual(2)
    const colors = tokens.light.find((g) => g.group === '颜色')
    expect(colors?.tokens.some((t) => t.name === '--yz-page')).toBe(true)
    expect(tokens.dark[0]?.tokens.some((t) => t.name === '--yz-page')).toBe(true)
  })

  it('returns the style guide', () => {
    const ctx = createProjectContext(root)
    expect(ctx.getStyleGuide()).toContain('Yz 前缀')
    expect(ctx.getStyleGuide()).toContain('四文件')
  })

  it('reads docs by name filter', () => {
    const ctx = createProjectContext(root)
    const all = ctx.readDocs()
    expect(all.map((d) => d.name)).toEqual(['PRD.md', 'research.md'])
    expect(ctx.readDocs('PRD')[0].content).toContain('产品需求')
  })

  it('handles 100+ components: filtering, limit and hidden flag', () => {
    const entries = Array.from({ length: 120 }, (_, i) => makeEntry(i + 1))
    writeFileSync(join(root, 'registry/registry.json'), JSON.stringify(entries))
    const ctx = createProjectContext(root)
    const all = ctx.listComponents()
    expect(all).toHaveLength(120)
    // 分类筛选
    const ai = ctx.listComponents({ category: 'ai' })
    expect(ai).toHaveLength(60)
    // limit
    expect(ctx.listComponents({ limit: 10 })).toHaveLength(10)
    // 隐藏组件标记（entry 100 visible=false）
    expect(all.find((c) => c.key === 'comp-100')?.visible).toBe(false)
    // keyword
    expect(ctx.listComponents({ keyword: 'button' })).toHaveLength(1)
  })

  it('is zero-cache: new components are visible immediately (dynamic project awareness)', () => {
    const ctx = createProjectContext(root)
    expect(ctx.getComponent('new-comp')).toBeNull()

    // 模拟组件库扩展：新增组件目录 + registry 条目（不重建 context）
    mkdirSync(join(root, 'packages/yzen-ui/src/components/new-comp'))
    writeFileSync(
      join(root, 'packages/yzen-ui/src/components/new-comp/NewComp.vue'),
      '<template><div class="yz-new">new</div></template>\n',
    )
    writeFileSync(
      join(root, 'packages/yzen-ui/src/components/new-comp/demo.vue'),
      '<template><NewComp /></template>\n',
    )
    const entries = [...(JSON.parse(readFileSync(join(root, 'registry/registry.json'), 'utf8')))]
    entries.push(makeEntry(2, { key: 'new-comp', name: { zh: '新组件', en: 'New Comp' } }))
    writeFileSync(join(root, 'registry/registry.json'), JSON.stringify(entries))

    // 同一 ctx 实例再次查询：立即可见（零缓存）
    const list = ctx.listComponents()
    expect(list.some((c) => c.key === 'new-comp')).toBe(true)
    const detail = ctx.getComponent('new-comp')
    expect(detail?.name.zh).toBe('新组件')
    expect(ctx.readComponentSource('new-comp')).toContain('yz-new')
  })
})
