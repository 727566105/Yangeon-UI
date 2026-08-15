// 本地文件 API（Vite dev server 中间件形态，PRD 5.3 / 可行性研究方案 B）：
// 读写仓库内 registry/registry.json 与组件目录，供 Console 前端调用。
// 安全纪律（PRD 7.6/10.4）：仅监听 127.0.0.1（vite.config 限制）、无鉴权（个人本机工具）、
// 写盘前服务端 validateRegistry 校验 + 临时文件原子替换、组件 key 白名单防路径穿越。
import { readFileSync, writeFileSync, readdirSync, mkdirSync, renameSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { validateRegistry, validateCategories } from '@yzen-ui/shared/validate'
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared/types'

// 仓库根：apps/console/server/registryApi.ts -> 仓库根 3 级
const REPO_ROOT = resolve(__dirname, '../../..')

// 组件 key 白名单（防路径穿越：只允许小写字母/数字/连字符）
const KEY_RE = /^[a-z0-9-]+$/

export interface RegistryApi {
  readRegistry(): RegistryEntry[]
  listComponentKeys(): string[]
  writeRegistry(entries: RegistryEntry[]): { ok: true } | { ok: false; errors: string[] }
  importComponent(
    key: string,
    componentSource: string,
  ): { ok: true; name: string } | { ok: false; error: string }
  readCategories(): RegistryCategory[]
  writeCategories(
    categories: RegistryCategory[],
  ): { ok: true } | { ok: false; errors: string[] }
}

/** 工厂：注入仓库根路径（测试用临时目录；默认真实仓库） */
export function createRegistryApi(root: string = REPO_ROOT): RegistryApi {
  const REGISTRY_PATH = join(root, 'registry/registry.json')
  const CATEGORIES_PATH = join(root, 'registry/categories.json')
  const COMPONENTS_DIR = join(root, 'packages/yzen-ui/src/components')

  function readRegistry(): RegistryEntry[] {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as RegistryEntry[]
  }

  function readCategories(): RegistryCategory[] {
    return JSON.parse(readFileSync(CATEGORIES_PATH, 'utf8')) as RegistryCategory[]
  }

  function listComponentKeys(): string[] {
    if (!existsSync(COMPONENTS_DIR)) return []
    return readdirSync(COMPONENTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  }

  /** 校验通过则原子写盘（temp + rename），失败返回错误列表 */
  function writeRegistry(
    entries: RegistryEntry[],
  ): { ok: true } | { ok: false; errors: string[] } {
    // 服务端校验：组件存在性 + 分类存在性（防组件引用不存在分类）
    const result = validateRegistry(entries, listComponentKeys(), readCategories())
    if (!result.ok) return result
    const tmp = `${REGISTRY_PATH}.tmp`
    writeFileSync(tmp, JSON.stringify(entries, null, 2) + '\n', 'utf8')
    renameSync(tmp, REGISTRY_PATH)
    return { ok: true }
  }

  /** 分类写入：validateCategories + 使用中的分类禁止删除 + 原子写盘 */
  function writeCategories(
    categories: RegistryCategory[],
  ): { ok: true } | { ok: false; errors: string[] } {
    const result = validateCategories(categories)
    if (!result.ok) return result
    // 统计各分类的组件使用数，被删除且有使用的分类拒绝
    const usage = new Map<string, number>()
    for (const e of readRegistry()) {
      usage.set(e.category, (usage.get(e.category) ?? 0) + 1)
    }
    const newKeys = new Set(categories.map((c) => c.key))
    const inUseDeleted = [...usage.entries()].filter(
      ([key, count]) => count > 0 && !newKeys.has(key),
    )
    if (inUseDeleted.length) {
      return {
        ok: false,
        errors: inUseDeleted.map(([key, count]) => `分类 ${key} 正被 ${count} 个组件使用，不能删除`),
      }
    }
    const tmp = `${CATEGORIES_PATH}.tmp`
    writeFileSync(tmp, JSON.stringify(categories, null, 2) + '\n', 'utf8')
    renameSync(tmp, CATEGORIES_PATH)
    return { ok: true }
  }

  /** 收录组件：校验 key 白名单 + 目录不存在，生成四文件（<Name>.vue + index.ts + demo.vue 壳） */
  function importComponent(
    key: string,
    componentSource: string,
  ): { ok: true; name: string } | { ok: false; error: string } {
    if (!KEY_RE.test(key)) {
      return { ok: false, error: `非法 key（仅允许小写字母/数字/连字符）: ${key}` }
    }
    const dir = join(COMPONENTS_DIR, key)
    if (existsSync(dir)) return { ok: false, error: `组件目录已存在: components/${key}` }
    if (!componentSource.includes('<template')) {
      return { ok: false, error: '组件源码必须包含 <template>' }
    }
    const name = keyToComponentName(key)
    const idxTs = `export { default as Yz${name} } from './${name}.vue'\n`
    // demo 壳直接相对导入组件文件（不依赖 yzen-ui 根入口 index.ts 的静态导出列表——
    // 根入口不会自动包含 Console 新收录的组件）
    const demoVue = `<script setup lang="ts">
import { computed } from 'vue'
import Yz${name} from './${name}.vue'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <Yz${name} v-bind="active" />
</template>
`
    mkdirSync(dir)
    writeFileSync(join(dir, `${name}.vue`), componentSource, 'utf8')
    writeFileSync(join(dir, 'index.ts'), idxTs, 'utf8')
    writeFileSync(join(dir, 'demo.vue'), demoVue, 'utf8')
    return { ok: true, name }
  }

  return { readRegistry, listComponentKeys, writeRegistry, importComponent, readCategories, writeCategories }
}

/** key 转 PascalCase 组件名：'my-widget' -> 'MyWidget' */
export function keyToComponentName(key: string): string {
  return key
    .split('-')
    .map((seg) => (seg ? seg[0]!.toUpperCase() + seg.slice(1) : seg))
    .join('')
}

export const defaultApi = createRegistryApi()

// ---------- HTTP 中间件 ----------

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => (data += chunk.toString('utf8')))
    req.on('end', () => resolveBody(data))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

type NextFn = (err?: unknown) => void

// ---------- 登录鉴权（个人工具级：单密码 + 内存 token 会话） ----------

// 密码来源：环境变量 YZ_CONSOLE_PASSWORD；未配置时用默认值并在启动时打印提醒。
// token 仅存内存（dev server 重启即失效，需重新登录）。
const DEFAULT_PASSWORD = 'yzenui'
export function resolvePassword(): string {
  return process.env.YZ_CONSOLE_PASSWORD?.trim() || DEFAULT_PASSWORD
}

const validTokens = new Set<string>()

export function issueToken(password: string): string | null {
  if (password !== resolvePassword()) return null
  const token = crypto.randomUUID()
  validTokens.add(token)
  return token
}

export function isValidToken(token: string | undefined | null): boolean {
  return !!token && validTokens.has(token)
}

export function clearToken(token: string) {
  validTokens.delete(token)
}

function extractToken(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  return undefined
}

export function registryApiMiddleware(api: RegistryApi = defaultApi): (req: IncomingMessage, res: ServerResponse, next: NextFn) => void {
  return async (req, res, next) => {
    try {
      const url = (req.url ?? '').split('?')[0]

      // 只处理 /api/* 请求；页面与静态资源交给 Vite 后续中间件
      if (!url.startsWith('/api/')) {
        next()
        return
      }

      // 登录与登出不要求 token
      if (req.method === 'POST' && url === '/api/login') {
        const body = JSON.parse((await readBody(req)) || '{}') as { password?: string }
        const token = issueToken(body.password ?? '')
        if (token) {
          sendJson(res, 200, { ok: true, token })
        } else {
          sendJson(res, 401, { ok: false, error: 'invalid password' })
        }
        return
      }
      if (req.method === 'POST' && url === '/api/logout') {
        const token = extractToken(req)
        if (token) clearToken(token)
        sendJson(res, 200, { ok: true })
        return
      }

      // 其余 /api/* 全部要求有效 token
      if (!isValidToken(extractToken(req))) {
        sendJson(res, 401, { ok: false, error: 'unauthorized' })
        return
      }

      if (req.method === 'GET' && url === '/api/registry') {
        sendJson(res, 200, api.readRegistry())
        return
      }
      if (req.method === 'PUT' && url === '/api/registry') {
        const body = JSON.parse((await readBody(req)) || '[]') as RegistryEntry[]
        const result = api.writeRegistry(body)
        sendJson(res, result.ok ? 200 : 422, result)
        return
      }
      if (req.method === 'GET' && url === '/api/components') {
        sendJson(res, 200, api.listComponentKeys())
        return
      }
      if (req.method === 'POST' && url === '/api/import') {
        const body = JSON.parse((await readBody(req)) || '{}') as {
          key?: string
          componentSource?: string
        }
        const result = api.importComponent(body.key ?? '', body.componentSource ?? '')
        sendJson(res, result.ok ? 201 : 422, result)
        return
      }
      if (req.method === 'GET' && url === '/api/categories') {
        sendJson(res, 200, api.readCategories())
        return
      }
      if (req.method === 'PUT' && url === '/api/categories') {
        const body = JSON.parse((await readBody(req)) || '[]') as RegistryCategory[]
        const result = api.writeCategories(body)
        sendJson(res, result.ok ? 200 : 422, result)
        return
      }
      next()
    } catch (e) {
      sendJson(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  }
}

/** Vite 插件：dev server 挂载本地 API（PRD 7.6 本地运行形态） */
export function registryApiPlugin(): Plugin {
  return {
    name: 'yzen-console-registry-api',
    configureServer(server) {
      if (!process.env.YZ_CONSOLE_PASSWORD) {
        console.warn(
          `[console] ⚠️ 未配置 YZ_CONSOLE_PASSWORD，登录密码使用默认值 "${DEFAULT_PASSWORD}"。` +
            '局域网访问场景建议设置环境变量修改密码。',
        )
      }
      server.middlewares.use(registryApiMiddleware())
    },
  }
}
