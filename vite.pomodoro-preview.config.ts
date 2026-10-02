import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('./previews/pomodoro', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      siyuan: fileURLToPath(
        new URL('./tests/stubs/siyuan.ts', import.meta.url),
      ),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5178,
    strictPort: true,
  },
})
