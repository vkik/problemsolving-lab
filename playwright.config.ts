import { defineConfig, devices } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL ?? `http://localhost:4173${process.env.BASE_PATH ?? '/problemsolving-lab/'}`

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE,
    // Use system Chrome when available (local); CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: 'chrome' }),
    trace: 'retain-on-failure',
    acceptDownloads: true,
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...(process.env.CI ? {} : { channel: 'chrome' }) } }],
  // Set E2E_BASE_URL to test an already-running or deployed site (e.g. the live GitHub Pages URL).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run build && npm run preview', url: BASE, reuseExistingServer: !process.env.CI, timeout: 180_000 },
})
