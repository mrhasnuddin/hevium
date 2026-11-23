import { test as base, expect } from '@playwright/test';

// The opening (loader, hand-off, reveal) and the sections' entrances are switched off for the specs, so they
// measure the page where it stands; entrance.spec.ts runs with them on.
// This one keeps WebGL, for the specs that are about the live hero scene.
export const liveTest = base.extend({
  // Named `run`, not Playwright's usual `use`, which the React lint rule mistakes for the `use` hook.
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hevium:loaded', 'off');
      } catch {}
    });
    await run(page);
  },
});

// Every other spec runs without WebGL2, so the hero shows its poster. These tests run on a software
// renderer, where the live scene would keep the page busy for whole seconds at a time.
export const test = liveTest.extend({
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return kind === 'webgl2' ? null : getContext.call(this, kind as '2d', ...(rest as []));
      } as typeof getContext;
    });
    await run(page);
  },
});

export { expect };
