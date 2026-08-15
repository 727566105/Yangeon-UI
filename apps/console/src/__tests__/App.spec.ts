import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('../api', () => ({
  fetchRegistry: vi.fn(),
  fetchCategories: vi.fn(),
  fetchPlatforms: vi.fn(),
  getToken: vi.fn(),
  setToken: vi.fn(),
  logout: vi.fn(),
  AuthError: class AuthError extends Error {},
}))

import { fetchRegistry, fetchCategories, fetchPlatforms, getToken, logout } from '../api'
const mockedFetch = vi.mocked(fetchRegistry)
const mockedCats = vi.mocked(fetchCategories)
const mockedPlats = vi.mocked(fetchPlatforms)
const mockedLogout = vi.mocked(logout)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.mocked(getToken).mockReturnValue('test-token')
  mockedFetch.mockResolvedValue([])
  mockedCats.mockResolvedValue([])
  mockedPlats.mockResolvedValue([])
})

describe('App navigation', () => {
  it('renders the dev access nav item and opens the DevGuide page', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const devBtn = wrapper.findAll('.console__nav-item').find((b) => b.text() === '开发接入')
    expect(devBtn).toBeTruthy()
    expect(devBtn!.classes()).not.toContain('console__nav-item--active')
    // 点击 → DevGuide 页面渲染 + 导航激活
    await devBtn!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.dev__title').text()).toBe('开发接入 · CLI / MCP')
    expect(wrapper.findAll('.dev__card')).toHaveLength(2)
    expect(devBtn!.classes()).toContain('console__nav-item--active')
  })

  it('skips data reload when switching to the static dev page', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const callsAfterMount = mockedFetch.mock.calls.length
    const devBtn = wrapper.findAll('.console__nav-item').find((b) => b.text() === '开发接入')!
    await devBtn.trigger('click')
    await flushPromises()
    // 静态说明页不依赖数据：不应触发额外的 registry 请求
    expect(mockedFetch.mock.calls.length).toBe(callsAfterMount)
  })

  it('hides the import nav item but keeps the list entry reachable', async () => {
    const wrapper = mount(App)
    await flushPromises()
    const navTexts = wrapper.findAll('.console__nav-item').map((b) => b.text())
    // 导航不再包含「收录组件」
    expect(navTexts).not.toContain('收录组件')
    // 列表页「+ 收录新组件」仍能打开收录视图
    const addBtn = wrapper.find('.list__add')
    expect(addBtn.exists()).toBe(true)
    await addBtn.trigger('click')
    await flushPromises()
    expect(wrapper.find('.wizard').exists()).toBe(true)
  })

  it('asks for confirmation before logging out', async () => {
    mockedLogout.mockResolvedValue(undefined)
    // Teleport stub：确认弹窗渲染在组件树内，便于断言（真实环境挂 body）
    const wrapper = mount(App, { global: { stubs: { teleport: true } } })
    await flushPromises()
    // 初始无弹窗
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
    // 点「退出登录」→ 弹确认框，不立即登出
    const logoutBtn = wrapper.find('.console__logout')
    await logoutBtn.trigger('click')
    expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
    expect(wrapper.find('.confirm-dialog__title').text()).toBe('确认退出登录？')
    expect(mockedLogout).not.toHaveBeenCalled()
    // 点「取消」→ 弹窗关闭，仍保持登录
    const cancelBtn = wrapper.findAll('.confirm-dialog__btn')[0]
    await cancelBtn.trigger('click')
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
    expect(mockedLogout).not.toHaveBeenCalled()
    // 再次打开并点「退出登录」→ 真正登出
    await logoutBtn.trigger('click')
    const confirmBtn = wrapper.findAll('.confirm-dialog__btn')[1]
    expect(confirmBtn.text()).toBe('退出登录')
    await confirmBtn.trigger('click')
    expect(mockedLogout).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
  })

  it('closes the dialog on Escape even when focus is outside it', async () => {
    const wrapper = mount(App, { global: { stubs: { teleport: true } } })
    await flushPromises()
    await wrapper.find('.console__logout').trigger('click')
    expect(wrapper.find('.confirm-dialog').exists()).toBe(true)
    // window 级 Esc（焦点在弹窗外也能关闭）
    // happy-dom 的 KeyboardEvent 构造不初始化 key，须手动注入（真实浏览器正常）
    const e = new KeyboardEvent('keydown', { key: 'Escape' })
    Object.defineProperty(e, 'key', { value: 'Escape' })
    window.dispatchEvent(e)
    await flushPromises()
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
    expect(mockedLogout).not.toHaveBeenCalled()
  })

  it('recovers to the login view even when the logout API rejects', async () => {
    mockedLogout.mockRejectedValue(new Error('network down'))
    const wrapper = mount(App, { global: { stubs: { teleport: true } } })
    await flushPromises()
    await wrapper.find('.console__logout').trigger('click')
    await wrapper.findAll('.confirm-dialog__btn')[1].trigger('click')
    await flushPromises()
    // 弹窗关闭 + 回落登录页（finally 保证），不因 API 失败卡死
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)
    expect(wrapper.find('.login, input[type="password"]').exists()).toBe(true)
  })
})
