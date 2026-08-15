#!/usr/bin/env node
// yz-mcp：MCP stdio server 入口（Node 22.18+ type stripping 直接加载 TS）
import { main } from '../src/server.ts'

await main()
