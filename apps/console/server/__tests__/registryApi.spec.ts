import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRegistryApi, keyToComponentName } from '../registryApi'
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared/types'

// 每个用例独立的临时仓库根（registry/ + packages/yzen-ui/src/components/ 最小结构）
let root = ''
let api: ReturnType<typeof createRegistryApi>

const SAMPLE: RegistryEntry = {
  key: 'button',
  name: { zh: 'Button 按钮', en: 'Button' },
  description: { zh: '描述', en: 'Description' },
  category: 'basic',
  tags: [{ zh: '基础', en: 'Basic' }],
  order: 1,
  visible: true,
  source: 'components/button',
  variants: [{ id: 'solid', label: { zh: '实心', en: 'Solid' }, props: {} }],
}

const CATEGORIES: RegistryCategory[] = [
  { key: 'basic', label: { zh: '基础组件', en: 'Basic' }, order: 1 },
  { key: 'ai', label: { zh: 'AI 场景', en: 'AI' }, order: 2 },
]

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'yz-console-'))
  mkdirSync(join(root, 'registry'), { recursive: true })
  mkdirSync(join(root, 'packages/yzen-ui/src/components/button'), { recursive: true })
  writeFileSync(
    join(root, 'registry/registry.json'),
    JSON.stringify([SAMPLE], null, 2) + '\n',
    'utf8',
  )
  writeFileSync(
    join(root, 'registry/categories.json'),
    JSON.stringify(CATEGORIES, null, 2) + '\n',
    'utf8',
  )
  api = createRegistryApi(root)
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('registryApi', () => {
  it('reads registry.json', () => {
    const entries = api.readRegistry()
    expect(entries).toHaveLength(1)
    expect(entries[0].key).toBe('button')
  })

  it('lists component keys from the components dir', () => {
    expect(api.listComponentKeys()).toEqual(['button'])
  })

  it('writes registry after validation (atomic replace, no .tmp leftover)', () => {
    const modified: RegistryEntry = { ...SAMPLE, description: { zh: '新描述', en: 'New desc' } }
    const result = api.writeRegistry([modified])
    expect(result).toEqual({ ok: true })
    // 无 .tmp 残留（rename 原子替换）
    expect(existsSync(join(root, 'registry/registry.json.tmp'))).toBe(false)
    expect(api.readRegistry()[0].description.en).toBe('New desc')
  })

  it('rejects invalid registry with error list (no write)', () => {
    const bad: RegistryEntry = { ...SAMPLE, name: { zh: '', en: 'Button' } }
    const result = api.writeRegistry([bad])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join()).toContain('name 缺少双语文案')
    }
    // 文件未被破坏
    expect(api.readRegistry()[0].name.zh).toBe('Button 按钮')
  })

  it('rejects unknown component keys (registry drift guard)', () => {
    const ghost: RegistryEntry = { ...SAMPLE, key: 'ghost', source: 'components/ghost' }
    const result = api.writeRegistry([ghost])
    expect(result.ok).toBe(false)
  })

  it('keyToComponentName converts hyphen keys to PascalCase', () => {
    expect(keyToComponentName('my-widget')).toBe('MyWidget')
    expect(keyToComponentName('ai-loading')).toBe('AiLoading')
    expect(keyToComponentName('button')).toBe('Button')
  })

  it('importComponent generates the four-file component skeleton', () => {
    const source = '<template><div>hi</div></template>\n<script setup lang="ts">\nconst x = 1\n</script>'
    const result = api.importComponent('my-widget', source)
    expect(result).toEqual({ ok: true, name: 'MyWidget' })
    const dir = join(root, 'packages/yzen-ui/src/components/my-widget')
    expect(existsSync(join(dir, 'MyWidget.vue'))).toBe(true)
    expect(existsSync(join(dir, 'index.ts'))).toBe(true)
    expect(existsSync(join(dir, 'demo.vue'))).toBe(true)
    // index.ts 导出名 + demo 壳引用一致
    expect(readFileSync(join(dir, 'index.ts'), 'utf8')).toContain('YzMyWidget')
    expect(readFileSync(join(dir, 'demo.vue'), 'utf8')).toContain('YzMyWidget')
    // 目录结构与现有 25 组件一致（四文件 + __tests__ 可选）
    expect(readdirSync(dir).sort()).toEqual(['MyWidget.vue', 'demo.vue', 'index.ts'])
  })

  it('importComponent rejects bad keys and duplicates', () => {
    expect(api.importComponent('../evil', '<template></template>').ok).toBe(false)
    expect(api.importComponent('button', '<template></template>').ok).toBe(false)
    expect(api.importComponent('no-template', 'const x = 1').ok).toBe(false)
  })
})

describe('registryApi categories', () => {
  it('reads and writes categories atomically', () => {
    expect(api.readCategories()).toHaveLength(2)
    const modified: RegistryCategory[] = [
      ...CATEGORIES,
      { key: 'advanced', label: { zh: '进阶组件', en: 'Advanced' }, order: 3 },
    ]
    const result = api.writeCategories(modified)
    expect(result).toEqual({ ok: true })
    expect(existsSync(join(root, 'registry/categories.json.tmp'))).toBe(false)
    expect(api.readCategories()).toHaveLength(3)
  })

  it('rejects malformed categories (no write)', () => {
    const bad: RegistryCategory[] = [{ key: '', label: { zh: 'x', en: 'y' }, order: 1 }]
    const result = api.writeCategories(bad)
    expect(result.ok).toBe(false)
    expect(api.readCategories()).toHaveLength(2)
  })

  it('rejects deleting a category that is in use by components', () => {
    // button 使用 basic；只保留 ai → 拒绝
    const result = api.writeCategories([CATEGORIES[1]])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join()).toContain('basic')
      expect(result.errors.join()).toContain('1 个组件')
    }
  })

  it('allows deleting an unused category', () => {
    const result = api.writeCategories([CATEGORIES[1], CATEGORIES[0]])
    expect(result).toEqual({ ok: true })
  })

  it('writeRegistry rejects entries referencing unknown categories', () => {
    const ghost: RegistryEntry = { ...SAMPLE, key: 'input', category: 'ghost-cat' }
    const result = api.writeRegistry([SAMPLE, ghost])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.join()).toContain('ghost-cat')
    }
  })
})
