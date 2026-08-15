// 本地 API 封装（对应 server/registryApi.ts 的中间件路由）。
// 除 login 外所有接口需携带登录 token（Authorization: Bearer）；401 时清 token 抛错，
// 由 App 层回退到登录页。
import type { Platform, RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

const TOKEN_KEY = 'yz-console-token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(password: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return res.json() as Promise<{ ok: true; token: string } | { ok: false; error: string }>
}

export async function logout() {
  try {
    await authFetch('/api/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}

// 带 token 的 fetch；401 时清除本地 token 并抛 AuthError
export class AuthError extends Error {
  constructor() {
    super('unauthorized')
    this.name = 'AuthError'
  }
}

async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 401) {
    clearToken()
    throw new AuthError()
  }
  return res
}

export async function fetchRegistry(): Promise<RegistryEntry[]> {
  const res = await authFetch('/api/registry')
  if (!res.ok) throw new Error(`GET /api/registry: ${res.status}`)
  return res.json() as Promise<RegistryEntry[]>
}

export async function saveRegistry(
  entries: RegistryEntry[],
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const res = await authFetch('/api/registry', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  })
  return res.json() as Promise<{ ok: true } | { ok: false; errors: string[] }>
}

export async function fetchComponents(): Promise<string[]> {
  const res = await authFetch('/api/components')
  if (!res.ok) throw new Error(`GET /api/components: ${res.status}`)
  return res.json() as Promise<string[]>
}

export async function importComponent(
  key: string,
  componentSource: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const res = await authFetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, componentSource }),
  })
  return res.json() as Promise<{ ok: true; name: string } | { ok: false; error: string }>
}

export async function fetchCategories(): Promise<RegistryCategory[]> {
  const res = await authFetch('/api/categories')
  if (!res.ok) throw new Error(`GET /api/categories: ${res.status}`)
  return res.json() as Promise<RegistryCategory[]>
}

export async function saveCategories(
  categories: RegistryCategory[],
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const res = await authFetch('/api/categories', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categories),
  })
  return res.json() as Promise<{ ok: true } | { ok: false; errors: string[] }>
}

export async function fetchPlatforms(): Promise<Platform[]> {
  const res = await authFetch('/api/platforms')
  if (!res.ok) throw new Error(`GET /api/platforms: ${res.status}`)
  return res.json() as Promise<Platform[]>
}

export async function savePlatforms(
  platforms: Platform[],
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const res = await authFetch('/api/platforms', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(platforms),
  })
  return res.json() as Promise<{ ok: true } | { ok: false; errors: string[] }>
}
