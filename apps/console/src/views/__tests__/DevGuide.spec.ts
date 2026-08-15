import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DevGuide from '../DevGuide.vue'
import { setLocale } from '../../i18n'

beforeEach(() => {
  setLocale('zh')
})

describe('DevGuide', () => {
  it('renders CLI and MCP cards with the zh copy', () => {
    const wrapper = mount(DevGuide)
    expect(wrapper.find('.dev__title').text()).toBe('开发接入 · CLI / MCP')
    const codes = wrapper.findAll('.dev__code')
    expect(codes).toHaveLength(2) // CLI 命令块 + MCP 配置块
    // CLI 卡片：标题 + 运行方式 + 命令代码块
    expect(wrapper.text()).toContain('CLI · 命令行接入')
    expect(codes[0].text()).toContain('yz components list --platform desktop')
    expect(codes[0].text()).toContain('yz components get breadcrumb --variants')
    expect(wrapper.text()).toContain('组件清单（支持 --category / --platform / --keyword / --limit / --full 筛选）')
    // MCP 卡片：配置 JSON + 工具列表
    expect(wrapper.text()).toContain('MCP · 模型上下文协议')
    expect(codes[1].text()).toContain('"command": "yz-mcp"')
    expect(wrapper.find('.dev__tools').text()).toContain('list_components')
    expect(wrapper.find('.dev__tools').text()).toContain('get_project_info')
    expect(wrapper.text()).toContain('零缓存实时读取组件库注册表')
  })

  it('switches copy to English', () => {
    setLocale('en')
    const wrapper = mount(DevGuide)
    expect(wrapper.find('.dev__title').text()).toBe('Dev Access · CLI / MCP')
    expect(wrapper.text()).toContain('CLI · Command line access')
    expect(wrapper.text()).toContain('MCP · Model Context Protocol')
    // 代码块与工具名不随语言变化（字面内容）
    const codes = wrapper.findAll('.dev__code')
    expect(codes[0].text()).toContain('yz components list')
    expect(wrapper.find('.dev__tools').text()).toContain('get_design_tokens')
  })
})
