import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Login from '../Login.vue'

vi.mock('../../api', () => ({
  login: vi.fn(),
  setToken: vi.fn(),
}))

import { login, setToken } from '../../api'
const mockedLogin = vi.mocked(login)
const mockedSetToken = vi.mocked(setToken)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login', () => {
  it('renders the password form', () => {
    const wrapper = mount(Login)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('.login__btn').exists()).toBe(true)
  })

  it('emits logged-in on success and stores nothing locally (api handles token)', async () => {
    mockedLogin.mockResolvedValue({ ok: true, token: 'tok-123' })
    const wrapper = mount(Login)
    await wrapper.find('input[type="password"]').setValue('yzenui')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockedLogin).toHaveBeenCalledWith('yzenui')
    expect(mockedSetToken).toHaveBeenCalledWith('tok-123')
    expect(wrapper.emitted('logged-in')).toBeTruthy()
  })

  it('shows an error on wrong password and does not emit', async () => {
    mockedLogin.mockResolvedValue({ ok: false, error: 'invalid password' })
    const wrapper = mount(Login)
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('logged-in')).toBeFalsy()
    expect(wrapper.text()).toContain('密码错误')
  })

  it('disables submit when the password is empty', () => {
    const wrapper = mount(Login)
    expect((wrapper.find('.login__btn').element as HTMLButtonElement).disabled).toBe(true)
  })
})
