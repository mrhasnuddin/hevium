import { test as base, expect } from '@playwright/test';

// The entrance loader shows once per session. Marking the session as loaded lets specs skip it.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hevium:loaded', '1');
      } catch {}
    });
    await use(page);
  },
});

export { expect };
