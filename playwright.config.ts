import { defineConfig, devices } from '@playwright/test';

const config = defineConfig({
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: 'pnpm build:svelte && pnpm preview',
    port: 4173,
    timeout: 600_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  testDir: 'tests'
});

export default config;
