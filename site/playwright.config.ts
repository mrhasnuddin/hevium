import { defineConfig } from '@playwright/test';

// The `e2e` script builds first, so the server below always serves the current export.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'line',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'pnpm exec serve out -l 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 360, height: 780 }, hasTouch: true } },
  ],
});
