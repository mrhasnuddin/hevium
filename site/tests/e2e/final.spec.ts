import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const tokens = (page: Page) => page.locator('#final [data-coins] [data-token]');
const coins = (page: Page) => page.locator('#final [data-token] img[data-logo]');
// Whether two boxes share any ground.
const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// The final call to action, after three references the user sent: the mark, a headline, one line and one
// button in the middle, with the page's logos gathered round as coins. Kept simple at the user's request.
test.describe('final call to action', () => {
  test('closes the page with the mark, a headline with one accent phrase, one line, and the way into the app', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('section#final');
    expect(await page.locator('main section').evaluateAll((sections) => sections.at(-1)!.id)).toBe('final');
    await expect(section.locator('h2')).toHaveText('Start trading in one terminal.');
    await expect(section.locator('h2 .hl')).toHaveText('one terminal');
    await expect(section.locator('header .lead')).toContainText('six chains');
    await expect(section.locator('.eyebrow')).toHaveCount(0); // the mark stands where a section's eyebrow would
    // the mark: the Hevium star, wider than it is tall, in the brand gradient, standing over the headline
    const mark = section.locator('[data-mark]');
    const [star, head] = [(await mark.boundingBox())!, (await section.locator('h2').boundingBox())!];
    expect(star.width).toBeGreaterThan(star.height);
    expect(star.width).toBeGreaterThanOrEqual(72);
    expect(star.y + star.height).toBeLessThanOrEqual(head.y);
    expect(await mark.evaluate((el) => /data:image\/svg\+xml/.test(getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage))).toBe(true);
    // the one button, in the brand gradient, tagged as coming from here, and nothing beside it
    const cta = section.getByRole('link', { name: 'Launch app' });
    await expect(cta).toHaveClass(/\bbtn-primary\b/);
    const url = new URL((await cta.getAttribute('href'))!);
    expect(url.origin).toBe('https://app.hevium.xyz');
    await expect(cta).toHaveAttribute('data-placement', 'final');
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(section.getByRole('link')).toHaveCount(1);
  });

  test('stands in the middle of the screen', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator('#final').evaluate((section) => section.scrollIntoView({ block: 'start' }));
    for (const part of ['[data-mark]', 'h2', 'header .lead', '.btn-primary']) {
      const box = (await page.locator(`#final ${part}`).boundingBox())!;
      if (part !== '.btn-primary') expect(Math.abs(box.x + box.width / 2 - 720), part).toBeLessThan(2);
      expect(box.y, part).toBeGreaterThan(72);
      expect(box.y + box.height, part).toBeLessThan(900);
    }
  });

  for (const [width, height] of [[1440, 900], [1024, 768]]) {
    test(`gathers the page's logos round the words as coins, clear of them, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await expect(page.locator('#final [data-coins]').first()).toHaveAttribute('aria-hidden', 'true');
      await expect(coins(page)).toHaveCount(12);
      const srcs = await coins(page).evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')!));
      for (const src of srcs) expect(src).toMatch(/^\/(chains|tokens)\//);
      expect(srcs.filter((src) => src.includes('/chains/')).length).toBe(6); // all six chains
      expect(new Set(srcs).size).toBe(12);
      const words = await Promise.all(['[data-mark]', 'h2', 'header .lead', '[data-actions]'].map(async (part) => (await page.locator(`#final ${part}`).boundingBox())!));
      const section = (await page.locator('#final').boundingBox())!;
      for (const coin of await coins(page).all()) await expect(coin).toHaveCSS('border-top-left-radius', '50%');
      for (const token of await tokens(page).all()) {
        const box = (await token.boundingBox())!;
        expect(Math.abs(box.width - box.height)).toBeLessThan(1); // round
        for (const part of words) expect(overlap(box, part)).toBe(false);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y).toBeGreaterThanOrEqual(section.y);
        expect(box.y + box.height).toBeLessThanOrEqual(section.y + section.height);
      }
    });
  }

  test('draws each as the Stocks token: a rim of star pixels with the logo in its middle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('#final').evaluate((section) => section.scrollIntoView());
    await expect(tokens(page)).toHaveCount(12);
    await expect(page.locator('#final [data-token] [data-pixels="ready"][data-scene="coin"]')).toHaveCount(12);
    for (const token of await tokens(page).all()) {
      const [whole, logo] = [(await token.boundingBox())!, (await token.locator('img[data-logo]').boundingBox())!];
      expect(logo.width / whole.width).toBeGreaterThan(0.5);
      expect(logo.width / whole.width).toBeLessThan(0.6);
      expect(logo.width).toBeGreaterThanOrEqual(40); // a logo that can be read
      expect(Math.abs(logo.x + logo.width / 2 - (whole.x + whole.width / 2))).toBeLessThan(1);
      expect(Math.abs(logo.y + logo.height / 2 - (whole.y + whole.height / 2))).toBeLessThan(1);
    }
  });

  test('turns a token over under the pointer, to the Hevium mark, and back when the pointer leaves', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('#final').evaluate((section) => section.scrollIntoView());
    const token = tokens(page).nth(2);
    // a quarter turn or more shows the back: the first number of the matrix is the cosine of the turn
    const turned = () => token.locator('[data-flip]').evaluate((el) => Number(getComputedStyle(el).transform.match(/-?[\d.]+/g)?.[1] ?? 1));
    expect(await turned()).toBe(1);
    await token.hover();
    await expect.poll(turned).toBe(-1);
    await expect(token.locator('[data-back]')).toHaveCSS('backface-visibility', 'hidden');
    await expect(token.locator('img[data-logo]')).toHaveCSS('backface-visibility', 'hidden');
    await page.mouse.move(720, 450);
    await expect.poll(turned).toBe(1);
  });

  test('answers a click with rings from the token and a wave across the stars, as the hero floor answers a landing', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator('#final').evaluate((section) => section.scrollIntoView());
    const field = page.locator('#final [data-pixel-field]');
    await expect(field).toHaveAttribute('data-pixels', 'ready');
    const token = tokens(page).nth(2);
    await expect(token.locator('[data-pulse]')).toHaveCount(0);
    // forced: a token that drifts is never "stable", which is all a plain click waits for
    await token.click({ force: true });
    await expect(token.locator('[data-pulse]')).toHaveCount(1);
    await expect(field).toHaveAttribute('data-waves', '1');
    await token.click({ force: true });
    await expect(field).toHaveAttribute('data-waves', '2');
    await expect(field).toHaveAttribute('data-waves', '0', { timeout: 5000 }); // the waves die away
    // with reduced motion nothing is thrown across the screen
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('#final').evaluate((section) => section.scrollIntoView());
    await expect(field).toHaveAttribute('data-pixels', 'ready');
    await tokens(page).nth(2).click();
    await page.waitForTimeout(200);
    expect(await field.getAttribute('data-waves')).not.toBe('1');
    await expect(tokens(page).nth(2).locator('[data-pulse]')).toBeHidden();
  });

  test('lets the coins drift, and holds them still with reduced motion', async ({ page }) => {
    const drifting = () => page.locator('#final').evaluate((section) => section.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running' && ((animation as CSSAnimation).animationName ?? '').includes('drift')).length);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    // a section rests while it is off screen, so it is brought up first, as a visitor would bring it
    await page.locator('#final').evaluate((section) => section.scrollIntoView());
    await expect.poll(drifting).toBe(12);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await drifting()).toBe(0);
  });

  test('on a phone leaves the coins out and keeps the words and the button inside the screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    for (const side of await page.locator('#final [data-coins]').all()) await expect(side).toBeHidden();
    for (const part of ['[data-mark]', 'h2', 'header .lead', '.btn-primary']) {
      const box = (await page.locator(`#final ${part}`).boundingBox())!;
      expect(box.x, part).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, part).toBeLessThanOrEqual(360);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('reads without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#final h2')).toBeVisible();
    await expect(page.locator('#final').getByRole('link', { name: 'Launch app' })).toHaveAttribute('href', 'https://app.hevium.xyz/');
    await context.close();
  });
});
