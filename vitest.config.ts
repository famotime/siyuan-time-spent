import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      siyuan: fileURLToPath(
        new URL('./tests/stubs/siyuan.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/pomodoro/**/*.test.ts'],
    clearMocks: true,
  },
})
