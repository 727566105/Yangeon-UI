import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
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
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
