import { defineConfig } from '@playwright/test';

// The `e2e` script builds first, so the server below always serves the current export.
//
// The hero's 3D scene only loads where the browser can draw it on a GPU, and the bundled test
// browser draws in software. So the tests of the live scene, tagged @gpu, run in the installed
// Chrome with the GPU on. On a machine without a GPU they skip themselves.
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
    { name: 'desktop', grepInvert: /@gpu/, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', grepInvert: /@gpu/, use: { viewport: { width: 360, height: 780 }, hasTouch: true } },
    {
      name: 'gpu',
      grep: /@gpu/,
      use: {
        viewport: { width: 1440, height: 900 },
        channel: 'chrome',
        launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])] },
      },
    },
  ],
});
