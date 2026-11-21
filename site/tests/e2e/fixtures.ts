import { test as base, expect } from '@playwright/test';

// The entrance loader shows once per session. Marking the session as loaded lets specs skip it.
export const test = base.extend({
  // Named `run`, not Playwright's usual `use`, which the React lint rule mistakes for the `use` hook.
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hevium:loaded', '1');
      } catch {}
    });
    await run(page);
  },
});

export { expect };
