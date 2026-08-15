import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'yzen-ui': resolve(__dirname, '../../packages/yzen-ui/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
