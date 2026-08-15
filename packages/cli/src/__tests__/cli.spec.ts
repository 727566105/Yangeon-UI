import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from '../cli'

// 临时仓库根 + 最小组件库结构
let root = ''
let output: string[] = []

function runCli(argv: string[]) {
  output = []
  run(argv, { root, stdout: (l) => output.push(l) })
  return output.join('\n')
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'yz-cli-'))
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
        tags: [{ zh: '基础', en: 'Basic' }],
        order: 1,
        visible: true,
        source: 'components/button',
        variants: [{ id: 'solid', label: { zh: '实心', en: 'Solid' }, props: {} }],
      },
    ]),
  )
  writeFileSync(join(root, 'registry/categories.json'), JSON.stringify([
    { key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 },
  ]))
  writeFileSync(
    join(root, 'packages/yzen-ui/src/components/button/Button.vue'),
    '<template><button class="yz-button"><slot /></button></template>\n',
  )
  writeFileSync(
    join(root, 'packages/yzen-ui/src/components/button/demo.vue'),
    '<template><YzButton /></template>\n',
  )
  writeFileSync(join(root, 'docs/PRD.md'), '# PRD 文档内容\n')
  writeFileSync(join(root, 'packages/yzen-ui/src/theme/tokens-light.scss'),
    '// 颜色\n--yz-page: #fafafb;\n')
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('yz CLI', () => {
  it('components list outputs summary JSON', () => {
    const text = runCli(['components', 'list'])
    const parsed = JSON.parse(text)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({ key: 'button', category: 'basic', variantCount: 1 })
  })

  it('components list filters by category and keyword', () => {
    expect(JSON.parse(runCli(['components', 'list', '--category', 'ai']))).toHaveLength(0)
    expect(JSON.parse(runCli(['components', 'list', '--keyword', 'button']))).toHaveLength(1)
  })

  it('components get returns detail / source / demo / variants', () => {
    const detail = JSON.parse(runCli(['components', 'get', 'button']))
    expect(detail.name.zh).toBe('Button 按钮')
    expect(detail.componentFile).toBe('Button.vue')

    const source = runCli(['components', 'get', 'button', '--source'])
    expect(source).toContain('yz-button')
    const demo = runCli(['components', 'get', 'button', '--demo'])
    expect(demo).toContain('YzButton')
    const variants = JSON.parse(runCli(['components', 'get', 'button', '--variants']))
    expect(variants[0].label.zh).toBe('实心')
  })

  it('components get reports missing component with exit code', () => {
    const text = runCli(['components', 'get', 'ghost'])
    expect(text).toContain('组件不存在')
    expect(process.exitCode).toBe(1)
  })

  it('tokens outputs grouped values (human and JSON)', () => {
    const human = runCli(['tokens'])
    expect(human).toContain('[颜色]')
    expect(human).toContain('--yz-page')
    const json = JSON.parse(runCli(['tokens', '--json']))
    expect(json.light[0].tokens[0].name).toBe('--yz-page')
  })

  it('style-guide prints the guide', () => {
    expect(runCli(['style-guide'])).toContain('Yz 前缀')
  })

  it('info prints project structure', () => {
    const text = runCli(['info'])
    expect(text).toContain('组件数: 1')
    expect(text).toContain('yzen-ui')
  })

  it('docs lists and reads by name', () => {
    const text = runCli(['docs', 'PRD'])
    expect(text).toContain('PRD 文档内容')
  })

  it('init generates the guide file', () => {
    runCli(['init', '--out', root])
    const guide = readFileSync(join(root, 'yz-guide.md'), 'utf8')
    expect(guide).toContain('pnpm add yzen-ui')
    expect(guide).toContain('YzButton')
  })
})

describe('yz CLI coverage', () => {
  it('components list --full outputs all fields (summary has none)', () => {
    const full = JSON.parse(runCli(['components', 'list', '--full']))
    expect(full).toHaveLength(1)
    expect(full[0].description).toEqual({ zh: '按钮', en: 'A button' })
    expect(full[0].variants).toHaveLength(1)
    expect(full[0].variants[0].id).toBe('solid')

    // 精简 summary 无 description（两级字段区分）
    const summary = JSON.parse(runCli(['components', 'list']))
    expect(summary).toHaveLength(1)
    expect(summary[0].description).toBeUndefined()
  })

  it('runs outside a workspace anchor with graceful degradation', () => {
    const outside = mkdtempSync(join(tmpdir(), 'yz-cli-out-'))
    try {
      // 无 pnpm-workspace.yaml 锚点、无任何结构：list 输出空数组，不崩溃
      const lines: string[] = []
      run(['components', 'list'], { root: outside, stdout: (l) => lines.push(l) })
      expect(JSON.parse(lines.join('\n'))).toEqual([])

      // info 输出结构行，组件数 0
      const infoLines: string[] = []
      run(['info'], { root: outside, stdout: (l) => infoLines.push(l) })
      const info = infoLines.join('\n')
      expect(info).toContain('apps:')
      expect(info).toContain('packages:')
      expect(info).toContain('组件数: 0')
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })
})
