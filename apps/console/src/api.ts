// 本地 API 封装（对应 server/registryApi.ts 的中间件路由）
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

export async function fetchRegistry(): Promise<RegistryEntry[]> {
  const res = await fetch('/api/registry')
  if (!res.ok) throw new Error(`GET /api/registry: ${res.status}`)
  return res.json() as Promise<RegistryEntry[]>
}

export async function saveRegistry(
  entries: RegistryEntry[],
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const res = await fetch('/api/registry', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  })
  return res.json() as Promise<{ ok: true } | { ok: false; errors: string[] }>
}

export async function fetchComponents(): Promise<string[]> {
  const res = await fetch('/api/components')
  if (!res.ok) throw new Error(`GET /api/components: ${res.status}`)
  return res.json() as Promise<string[]>
}

export async function importComponent(
  key: string,
  componentSource: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, componentSource }),
  })
  return res.json() as Promise<{ ok: true; name: string } | { ok: false; error: string }>
}

export async function fetchCategories(): Promise<RegistryCategory[]> {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error(`GET /api/categories: ${res.status}`)
  return res.json() as Promise<RegistryCategory[]>
}

export async function saveCategories(
  categories: RegistryCategory[],
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const res = await fetch('/api/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categories),
  })
  return res.json() as Promise<{ ok: true } | { ok: false; errors: string[] }>
}
