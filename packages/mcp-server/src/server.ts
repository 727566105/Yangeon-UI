// MCP server（yzen-ui-mcp）：开发消费型接入，10 个只读 tools（组件内容 + 设计规范 + 项目文档）。
// stdio 传输：Claude Desktop / Cursor 等本地直连；零缓存实时读取，组件库扩展无需重启。
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { createProjectContext } from '@yzen-ui/registry-core'
import type { ProjectContext } from '@yzen-ui/registry-core'
import { tools } from './tools.ts'

export function createMcpServer(ctx: ProjectContext): McpServer {
  const server = new McpServer({ name: 'yzen-ui', version: '0.1.0' })
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => ({
        content: [{ type: 'text', text: tool.handler(ctx, (args ?? {}) as Record<string, unknown>) }],
      }),
    )
  }
  return server
}

export async function main() {
  const ctx = createProjectContext()
  const server = createMcpServer(ctx)
  await server.connect(new StdioServerTransport())
}
