import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { registryApiPlugin } from './server/registryApi'

// Console 管理端（PRD 7.x）：本地 Vite 应用 + dev server 中间件（本地 registry API）。
// 监听 0.0.0.0 允许局域网设备访问（个人工具；API 无鉴权——仅在可信网络使用，
// 安全边界调整记录见 PRD 修订记录 2026-08-15）；端口 5174 与 showcase(5173) 区分。
// alias 数组形式：子路径（纯 TS 模块，供 server/node 场景）精确映射在前，
// 主入口（含 DemoStage.vue，仅 client 可用）在前缀匹配时不会被误吞。
export default defineConfig({
  plugins: [vue(), registryApiPlugin()],
  resolve: {
    alias: [
      {
        find: '@yzen-ui/shared/types',
        replacement: resolve(__dirname, '../../packages/shared/src/types.ts'),
      },
      {
        find: '@yzen-ui/shared/validate',
        replacement: resolve(__dirname, '../../packages/shared/src/validate.ts'),
      },
      {
        find: '@yzen-ui/shared',
        replacement: resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
      {
        find: 'yzen-ui',
        replacement: resolve(__dirname, '../../packages/yzen-ui/src/index.ts'),
      },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
})
