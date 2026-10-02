import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results/pomodoro',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5178',
    viewport: {
      width: 1280,
      height: 900,
    },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview:pomodoro',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
