// 测试环境存储垫片：Node 26 自带实验性 localStorage 全局（未传 --localstorage-file 时
// 访问返回 undefined 并告警），会遮蔽 happy-dom 的实现，导致 vitest 环境里
// window.localStorage / localStorage 均不可用（实测 happy-dom 16.8.1 + vitest 3.2.7）。
// 这里在 setup 阶段安装确定性的内存实现，保证 i18n / 组件代码在测试中可读写存储。
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number) {
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
}

const shim = new MemoryStorage()
const win = globalThis as unknown as { window?: { localStorage?: unknown } }

if (win.window && !win.window.localStorage) {
  Object.defineProperty(win.window, 'localStorage', { value: shim, configurable: true })
}
try {
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true })
} catch {
  /* Node 内置属性不可覆盖时忽略（浏览器运行不受影响） */
}
