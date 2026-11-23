import { expect, test as base } from '@playwright/test';
import { test as still } from './fixtures';

// These run with the entrance on: the session is not marked, as every other spec's is. There is no WebGL2,
// so the hero keeps its poster and says it is ready at once, which is the short beat a phone gets.
const test = base.extend({
  // Named `run`, not Playwright's usual `use`, which the React lint rule mistakes for the `use` hook.
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

const HEADLINE = 'The multi-chain stock & fair-launch terminal.';

test.describe('the opening: loader, hand-off and reveal', () => {
  test('covers the page from the first paint with the mark and a percent, then hands the finished hero over', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    const cover = page.locator('[data-cover]');
    await expect(page.locator('html')).toHaveAttribute('data-entrance', 'load');
    await expect(cover).toBeVisible();
    await expect(cover.locator('canvas')).toBeVisible();
    await expect(cover.locator('[data-percent]')).toHaveText(/^\d{1,3}%$/);
    await expect(cover).toHaveAttribute('aria-hidden', 'true');
    // the headline is in the page under it all along
    await expect(page.locator('h1')).toHaveText(HEADLINE);

    await expect(cover).toBeHidden({ timeout: 6000 });
    await expect(page.locator('html')).not.toHaveAttribute('data-entrance');
    // the hero as it always is: one heading with its accent phrase and nothing left wrapped round its lines
    await expect(page.locator('h1')).toHaveText(HEADLINE);
    await expect(page.locator('h1 .hl')).toHaveText('stock & fair-launch');
    await expect(page.locator('h1 > *')).toHaveCount(1);
    for (const part of ['h1', '[data-hero] .btn-primary', 'header nav']) {
      await expect(page.locator(part)).toBeVisible();
      await expect(page.locator(part)).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('[data-hero-art] img')).toHaveCSS('opacity', '1'); // the mark it landed on
    expect(await page.locator('header nav').evaluate((nav) => nav.style.cssText)).toBe(''); // nothing left behind on it
  });

  test('plays again on a refresh, and not on coming back to the page another way', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-cover]')).toBeHidden({ timeout: 6000 });
    await page.reload({ waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-entrance', 'load');
    await expect(page.locator('[data-cover]')).toBeVisible();
    await expect(page.locator('[data-cover]')).toBeHidden({ timeout: 6000 });
    // a visit that is neither the first nor a refresh: the headline's rise alone
    await page.goto('/?again', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-entrance', 'rise');
    await expect(page.locator('[data-cover]')).toBeHidden();
    await expect(page.locator('h1')).toHaveCSS('opacity', '1');
  });

  test('is short where there is no scene to wait for', async ({ page }) => {
    await page.goto('/');
    const began = Date.now();
    await expect(page.locator('[data-cover]')).toBeHidden({ timeout: 6000 });
    expect(Date.now() - began).toBeLessThan(2500); // the beat and the hand-off, with room for a busy machine
  });

  test('leaves the page alone with scripts off', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[data-cover]')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-enter]')).toHaveCount(0);
    await context.close();
  });

  test('leaves the page alone with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-entrance');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion');
    await expect(page.locator('[data-cover]')).toBeHidden();
    await page.waitForLoadState('load');
    await expect(page.locator('[data-enter]')).toHaveCount(0);
  });

  test('plays no loader on a page opened at a section', async ({ page }) => {
    await page.goto('/#faq', { waitUntil: 'commit' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).not.toHaveAttribute('data-entrance');
    await expect(page.locator('[data-cover]')).toBeHidden();
  });

  test('lifts the cover by itself if the page script never arrives', async ({ page }) => {
    await page.route('**/_next/static/chunks/**', (route) => (route.request().resourceType() === 'script' ? route.abort() : route.continue()));
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('[data-cover]')).toBeVisible();
    await expect(page.locator('[data-cover]')).toBeHidden({ timeout: 7000 });
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('section entrances', () => {
  test('holds a section back until it comes into view, then lets it in once', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('[data-cover]')).toBeHidden({ timeout: 6000 });
    const head = page.locator('#chains .section-head');
    await expect(head).toHaveAttribute('data-enter', '');
    await expect(head).not.toHaveAttribute('data-seen');
    await expect(head.locator('h2')).toHaveCSS('opacity', '0');
    await page.locator('#chains').evaluate((section) => section.scrollIntoView());
    await expect(head).toHaveAttribute('data-seen', '');
    await expect(head.locator('h2')).toHaveCSS('opacity', '1');
    // the piece has a move of its own: the chains come in after their lanes
    const figure = page.locator('#chains figure');
    await expect(figure).toHaveAttribute('data-seen', '');
    await expect(figure.locator('li').last()).toHaveCSS('opacity', '1');
    // once: scrolling away and back does not take it out again
    await page.evaluate(() => scrollTo(0, 0));
    await expect(head).toHaveAttribute('data-seen', '');
  });

  test('lets every part in by the time the page has been read to the end', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-cover]')).toBeHidden({ timeout: 6000 });
    expect(await page.locator('[data-enter]').count()).toBeGreaterThan(8);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) {
        scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 120));
      }
      scrollTo(0, document.documentElement.scrollHeight);
    });
    // those that are laid out: a tab that was never opened waits for its turn
    await expect.poll(() => page.locator('[data-enter]:not([data-seen])').evaluateAll((parts) => parts.filter((part) => part.getClientRects().length > 0).length)).toBe(0);
    // and nothing an entrance holds back is left faint
    await page.waitForTimeout(1200);
    const held = '.section-head > *, #problem .card, [data-tabs] li, [data-ring], #launch figure dl > div, [data-clients] > li, [data-prompt] .card, [data-session] figure, [data-cards], [data-hub], #chains figure li, [data-bento] > li, #faq details, #final [data-coins], #final [data-actions]';
    const faint = await page.locator(held).evaluateAll((parts) => parts.filter((part) => part.getClientRects().length > 0 && getComputedStyle(part).opacity !== '1').length);
    expect(faint).toBe(0);
  });
});

still.describe('the other specs', () => {
  still('run with the opening and the entrances switched off, so they measure the page where it stands', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-entrance');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion');
    await expect(page.locator('[data-cover]')).toBeHidden();
    await expect(page.locator('[data-enter]')).toHaveCount(0);
  });
});
