import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProjectContext } from '@yzen-ui/registry-core'
import { tools } from '../tools'
import { createMcpServer } from '../server'

let root = ''
let ctx: ReturnType<typeof createProjectContext>

function call(name: string, args: Record<string, unknown> = {}): string {
  const tool = tools.find((t) => t.name === name)!
  return tool.handler(ctx, args)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'yz-mcp-'))
  mkdirSync(join(root, 'registry'), { recursive: true })
  mkdirSync(join(root, 'packages/yzen-ui/src/components/button'), { recursive: true })
  mkdirSync(join(root, 'docs'), { recursive: true })
  mkdirSync(join(root, 'packages/yzen-ui/src/theme'), { recursive: true })
  writeFileSync(
    join(root, 'registry/registry.json'),
    JSON.stringify([
      {
        key: 'button',
        name: { zh: 'Button 按钮', en: 'Button' },
        description: { zh: '按钮', en: 'A button' },
        category: 'basic',
        platform: 'desktop',
        tags: [{ zh: '基础', en: 'Basic' }],
        order: 1,
        visible: true,
        source: 'components/button',
        variants: [{ id: 'solid', label: { zh: '实心', en: 'Solid' }, props: {} }],
      },
    ]),
  )
  writeFileSync(
    join(root, 'registry/categories.json'),
    JSON.stringify([{ key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 }]),
  )
  writeFileSync(
    join(root, 'registry/platforms.json'),
    JSON.stringify([
      { key: 'mobile', label: { zh: '移动端', en: 'Mobile' }, order: 1 },
      { key: 'desktop', label: { zh: 'PC 端', en: 'Desktop' }, order: 2 },
    ]),
  )
  writeFileSync(
    join(root, 'packages/yzen-ui/src/components/button/Button.vue'),
    '<template><button class="yz-button"><slot /></button></template>\n',
  )
  writeFileSync(join(root, 'packages/yzen-ui/src/components/button/demo.vue'), '<template><YzButton /></template>\n')
  writeFileSync(join(root, 'docs/PRD.md'), '# PRD 文档内容\n')
  writeFileSync(join(root, 'packages/yzen-ui/src/theme/tokens-light.scss'), '// 颜色\n--yz-page: #fafafb;\n')
  ctx = createProjectContext(root)
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('MCP tools', () => {
  it('registers all 10 read-only tools on the server', () => {
    expect(tools).toHaveLength(10)
    const names = tools.map((t) => t.name)
    expect(names).toEqual([
      'get_project_info',
      'list_components',
      'list_platforms',
      'get_component',
      'get_component_source',
      'get_component_demo',
      'get_variants',
      'get_design_tokens',
      'get_style_guide',
      'get_project_docs',
    ])
    // createMcpServer 不抛错
    expect(() => createMcpServer(ctx)).not.toThrow()
  })

  it('get_project_info returns structure overview', () => {
    const info = JSON.parse(call('get_project_info'))
    expect(info.componentCount).toBe(1)
    expect(info.hasRegistry).toBe(true)
  })

  it('list_components supports filtering', () => {
    expect(JSON.parse(call('list_components'))).toHaveLength(1)
    expect(JSON.parse(call('list_components', { category: 'ai' }))).toHaveLength(0)
    expect(JSON.parse(call('list_components', { keyword: 'button' }))).toHaveLength(1)
    // 平台筛选：desktop 命中、mobile 空
    expect(JSON.parse(call('list_components', { platform: 'desktop' }))).toHaveLength(1)
    expect(JSON.parse(call('list_components', { platform: 'mobile' }))).toHaveLength(0)
  })

  it('list_platforms returns platform summaries with component counts', () => {
    const list = JSON.parse(call('list_platforms')) as Array<{ key: string; componentCount: number }>
    expect(list).toEqual([
      { key: 'mobile', labelZh: '移动端', labelEn: 'Mobile', order: 1, componentCount: 0 },
      { key: 'desktop', labelZh: 'PC 端', labelEn: 'Desktop', order: 2, componentCount: 1 },
    ])
  })

  it('get_component / source / demo / variants', () => {
    expect(JSON.parse(call('get_component', { key: 'button' })).name.zh).toBe('Button 按钮')
    expect(call('get_component', { key: 'ghost' })).toContain('组件不存在')
    expect(call('get_component_source', { key: 'button' })).toContain('yz-button')
    expect(call('get_component_demo', { key: 'button' })).toContain('YzButton')
    expect(JSON.parse(call('get_variants', { key: 'button' }))[0].label.zh).toBe('实心')
  })

  it('get_design_tokens returns grouped tokens', () => {
    const tokens = JSON.parse(call('get_design_tokens'))
    expect(tokens.light[0].tokens[0].name).toBe('--yz-page')
  })

  it('get_style_guide returns the guide', () => {
    expect(call('get_style_guide')).toContain('Yz 前缀')
  })

  it('get_project_docs lists and filters docs', () => {
    const all = call('get_project_docs')
    expect(all).toContain('PRD.md')
    const filtered = call('get_project_docs', { name: 'PRD' })
    expect(filtered).toContain('PRD 文档内容')
  })
})

describe('MCP tool argument guards', () => {
  it('rejects invalid argument types with a clear error', () => {
    // key 传数字（非字符串）
    expect(call('get_component', { key: 123 as never })).toContain('参数无效')
    // limit 传字符串（非正整数）
    expect(call('list_components', { limit: 'abc' as never })).toContain('参数无效')
    // limit 传负数
    expect(call('list_components', { limit: -1 })).toContain('参数无效')
    // platform 传数字（非字符串）
    expect(call('list_components', { platform: 123 as never })).toContain('参数无效')
  })

  it('accepts valid arguments', () => {
    expect(call('list_components', { limit: 1 })).not.toContain('参数无效')
    expect(JSON.parse(call('list_components', { limit: 1 }))).toHaveLength(1)
  })
})

describe('MCP docs truncation', () => {
  it('get_project_docs truncates over-long documents', () => {
    writeFileSync(join(root, 'docs/big.md'), 'B'.repeat(4000))
    const out = call('get_project_docs', { name: 'big' })
    expect(out).toContain('===== big.md =====')
    expect(out).toContain('…(截断)')
    expect(out.length).toBeLessThan(3100)
    // 列表场景也应包含 big.md 条目
    expect(call('get_project_docs')).toContain('big.md')
  })
})
