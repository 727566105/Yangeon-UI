// MCP 工具定义（9 个只读 tools，开发消费型）：
// 全部复用 @yzen-ui/registry-core 项目感知层，handler 为纯函数（可直测）。
// 注意：MCP SDK 的 registerTool 不保证服务端参数校验，handler 内用 zod safeParse 防御，
// 无效参数返回明确错误而非静默忽略。
import { z } from 'zod'
import type { ProjectContext } from '@yzen-ui/registry-core'

export interface ToolDef {
  name: string
  description: string
  inputSchema: z.ZodTypeAny
  /** 返回文本（JSON 或人类可读） */
  handler: (ctx: ProjectContext, args: Record<string, unknown>) => string
}

const json = (v: unknown) => JSON.stringify(v, null, 2)

/** 参数防御包装：schema 校验失败返回错误文本，成功则执行 handler */
function guard<T>(
  schema: z.ZodType<T>,
  args: unknown,
  run: (parsed: T) => string,
): string {
  const result = schema.safeParse(args)
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join('.') || '参数'} ${i.message}`)
      .join('；')
    return `参数无效: ${detail}`
  }
  return run(result.data)
}

const emptySchema = z.object({})

export const tools: ToolDef[] = [
  {
    name: 'get_project_info',
    description:
      '项目结构概览：apps/packages 布局、组件数、分类数、registry/docs 是否存在。' +
      '实时反映当前项目状态。',
    inputSchema: emptySchema,
    handler: (ctx, args) => guard(emptySchema, args, () => json(ctx.getProjectInfo())),
  },
  {
    name: 'list_components',
    description:
      '组件清单（精简字段：key/名称/分类/排序/可见性/变体数）。' +
      '支持按分类、关键词筛选与条数限制；100+ 组件规模下请使用筛选避免全量返回。',
    inputSchema: z.object({
      category: z.string().optional().describe('按分类 key 筛选（如 ai / basic）'),
      keyword: z.string().optional().describe('按组件 key/名称/标签关键词筛选'),
      limit: z.number().int().positive().optional().describe('限制返回条数'),
    }),
    handler: (ctx, args) =>
      guard(
        z.object({
          category: z.string().optional(),
          keyword: z.string().optional(),
          limit: z.number().int().positive().optional(),
        }),
        args,
        (parsed) => json(ctx.listComponents(parsed)),
      ),
  },
  {
    name: 'get_component',
    description: '组件详情：完整元信息（名称/描述/分类/标签/变体）、实现文件名、是否有 demo。',
    inputSchema: z.object({ key: z.string().describe('组件 key，如 button / ai-loading') }),
    handler: (ctx, args) =>
      guard(z.object({ key: z.string() }), args, ({ key }) => {
        const detail = ctx.getComponent(key)
        return detail ? json(detail) : `组件不存在: ${key}`
      }),
  },
  {
    name: 'get_component_source',
    description:
      '组件实现源码（<Name>.vue 全文）。用于参考组件写法、复刻实现或检查 props/emits 定义。' +
      '编写符合组件库规范的代码前建议同时查询 get_style_guide。',
    inputSchema: z.object({ key: z.string().describe('组件 key') }),
    handler: (ctx, args) =>
      guard(z.object({ key: z.string() }), args, ({ key }) => ctx.readComponentSource(key) ?? `组件源码缺失: ${key}`),
  },
  {
    name: 'get_component_demo',
    description: '组件 demo 用法示例源码（薄壳 + 变体 props 用法）。',
    inputSchema: z.object({ key: z.string().describe('组件 key') }),
    handler: (ctx, args) =>
      guard(z.object({ key: z.string() }), args, ({ key }) => ctx.readDemoSource(key) ?? `demo 缺失: ${key}`),
  },
  {
    name: 'get_variants',
    description: '组件变体配置：变体 id、双语 label、props 预设（展示站变体切换与用法参考）。',
    inputSchema: z.object({ key: z.string().describe('组件 key') }),
    handler: (ctx, args) =>
      guard(z.object({ key: z.string() }), args, ({ key }) => {
        const detail = ctx.getComponent(key)
        return detail ? json(detail.variants) : `组件不存在: ${key}`
      }),
  },
  {
    name: 'get_design_tokens',
    description:
      '设计 token（--yz-* 变量）：浅色默认 + 深色覆盖，按颜色/形状/阴影/字体/动效分组。' +
      '编写样式时颜色/圆角/阴影/字体/动效一律引用这些 token，禁止硬编码。',
    inputSchema: emptySchema,
    handler: (ctx, args) => guard(emptySchema, args, () => json(ctx.getDesignTokens())),
  },
  {
    name: 'get_style_guide',
    description:
      '组件开发规范摘要：Yz 命名、yz-* 类名、--yz-* token 铁律、四文件模式、动画约定、' +
      '受控组件约束、组件库使用方式。编写组件库相关代码前应先查询本规范。',
    inputSchema: emptySchema,
    handler: (ctx, args) => guard(emptySchema, args, () => ctx.getStyleGuide()),
  },
  {
    name: 'get_project_docs',
    description: '项目文档（PRD/调研报告等）。省略 name 时列出全部，传 name 时按名称筛选并返回内容。',
    inputSchema: z.object({
      name: z.string().optional().describe('文档名称关键词（如 PRD）'),
    }),
    handler: (ctx, args) =>
      guard(z.object({ name: z.string().optional() }), args, ({ name }) => {
        const docs = ctx.readDocs(name)
        if (!docs.length) return '未找到文档'
        return docs
          .map(
            (d) =>
              `===== ${d.name} =====\n${d.content.slice(0, 3000)}${d.content.length > 3000 ? '\n…(截断)' : ''}`,
          )
          .join('\n\n')
      }),
  },
]
