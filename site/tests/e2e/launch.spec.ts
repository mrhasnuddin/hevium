import { expect, test } from './fixtures';
import { drawnIn, read, snapshot } from './pixels';

// The inside of each bin, as fractions of the scene: [left, top, right, bottom]. The bins stand in thirds.
// It starts under the bin's rim, clear of the rail's short drop into each bin (the third bin's is there and never used).
const BINS: [number, number, number, number][] = [0, 1, 2].map((n) => [n / 3 + 0.05, 0.74, (n + 1) / 3 - 0.05, 0.95]);

test.describe('launch section', () => {
  test('opens with the shared head: its eyebrow, a headline with one accent phrase, one supporting line', async ({ page }) => {
    await page.goto('/#launch');
    const section = page.locator('section#launch');
    await expect(section.locator('.eyebrow')).toHaveText('Launch');
    await expect(section.locator('h2')).toHaveCount(1);
    await expect(section.locator('h2')).toHaveText('A fair launch in 15 seconds.');
    await expect(section.locator('h2 .hl')).toHaveText('15 seconds');
    await expect(section.locator('header .lead')).toContainText('sniper bots');
    // it follows Stocks in the page (on a phone only the open one is laid out)
    const order = await page.locator('#engines > section').evaluateAll((sections) => sections.map((section) => section.id));
    expect(order.indexOf('launch')).toBe(order.indexOf('stocks') + 1);
  });

  test('has one piece under the head: the coin press, as a figure with a description', async ({ page }) => {
    await page.goto('/#launch');
    await expect(page.locator('#launch figure')).toHaveCount(1);
    await expect(page.locator('#launch h3')).toHaveCount(0);
    const caption = page.locator('#launch figure figcaption');
    for (const word of ['press', 'fifteen', 'insiders', 'bots']) await expect(caption).toContainText(word);
    const art = page.locator('#launch figure [data-pixels]');
    await expect(art).toHaveAttribute('data-scene', 'press');
    await expect(art.locator('canvas')).toHaveAttribute('aria-hidden', 'true');
    await expect(art.locator('img')).toHaveAttribute('alt', '');
  });

  test('marks the three bins 80% public, 20% locked liquidity and 0% insiders', async ({ page }) => {
    await page.goto('/#launch');
    await expect(page.locator('#launch dl dd')).toHaveText(['80%', '20%', '0%']);
    await expect(page.locator('#launch dl dt')).toHaveText(['public', 'locked liquidity', 'insiders']);
  });

  test('draws the press in star pixels across the whole width', async ({ page }) => {
    await page.goto('/#launch');
    const canvas = page.locator('#launch figure canvas');
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(1500);
    const frame = await read(canvas);
    expect(frame.drawn).toBeLessThan(frame.total * 0.6); // pixels with gaps between them
    const [scene, figure] = [(await canvas.boundingBox())!, (await page.locator('#launch figure').boundingBox())!];
    expect(Math.abs(scene.width - figure.width)).toBeLessThan(2);
  });

  test('fills the first bin four times as full as the second, and leaves the third empty', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // a still, so no coin is on its way
    await page.goto('/#launch');
    const canvas = page.locator('#launch figure canvas');
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(1500);
    const [open, locked, insiders] = [await drawnIn(canvas, BINS[0]), await drawnIn(canvas, BINS[1]), await drawnIn(canvas, BINS[2])];
    expect(insiders).toBe(0);
    expect(locked).toBeGreaterThan(0);
    expect(open / locked).toBeGreaterThan(3);
    expect(open / locked).toBeLessThan(5.5);
  });

  test('on a wide screen marks each bin from inside: its figure stands in its own third, above the coins', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#launch');
    const scene = (await page.locator('#launch figure canvas').boundingBox())!;
    for (const [n, part] of (await page.locator('#launch dl > div').all()).entries()) {
      const box = (await part.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - (scene.x + (scene.width * (n + 0.5)) / 3)), `part ${n}`).toBeLessThan(3);
      const figure = (await part.locator('dd').boundingBox())!;
      expect(figure.y, `figure ${n} is below its bin's rim`).toBeGreaterThanOrEqual(scene.y + scene.height * 0.62 - 1);
      expect(figure.y + figure.height, `figure ${n} is above its coins`).toBeLessThanOrEqual(scene.y + scene.height * 0.8);
    }
  });

  test('on a phone stands each figure under its own bin', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/#launch');
    const scene = (await page.locator('#launch figure canvas').boundingBox())!;
    for (const [n, figure] of (await page.locator('#launch dl dd').all()).entries()) {
      const box = (await figure.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - (scene.x + (scene.width * (n + 0.5)) / 3)), `figure ${n}`).toBeLessThan(3);
      expect(box.y).toBeGreaterThan(scene.y + scene.height - 2);
    }
  });

  test('keeps the press working: the picture changes by itself', async ({ page }) => {
    await page.goto('/#launch');
    const canvas = page.locator('#launch figure canvas');
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(1500);
    const before = await snapshot(canvas);
    await expect.poll(async () => (await snapshot(canvas)) !== before).toBe(true);
  });

  test('ends in a button into the app, tagged as coming from this section', async ({ page }) => {
    await page.goto('/#launch');
    const cta = page.locator('#launch').getByRole('link', { name: 'Launch a token' });
    await expect(cta).toHaveClass(/\bbtn\b/);
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const url = new URL((await cta.getAttribute('href'))!);
    expect(url.origin).toBe('https://app.hevium.xyz');
    expect(url.pathname).toBe('/launch');
    await expect(cta).toHaveAttribute('data-placement', 'launch');
  });

  test('is where the nav bar\'s Launch link leads', async ({ page }) => {
    await page.goto('/#launch');
    await expect(page.locator('nav a[href="#launch"]')).toHaveCount(1);
    await page.goto('/#launch');
    await expect(page.locator('#launch h2')).toBeInViewport();
  });

  test('keeps the three figures inside a 360px screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/#launch');
    for (const part of await page.locator('#launch dl > div').all()) {
      const box = (await part.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
  });

  test('reads without JavaScript: the head, a plain picture of the press, the split and the button', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/#launch');
    await expect(page.locator('#launch h2')).toBeVisible();
    await expect(page.locator('#launch figure img')).toBeVisible();
    await expect(page.locator('#launch figure img')).toHaveAttribute('src', /\/art\/launch-press\.svg$/);
    await expect(page.locator('#launch dl dd')).toHaveText(['80%', '20%', '0%']);
    await expect(page.locator('#launch').getByRole('link', { name: 'Launch a token' })).toHaveAttribute('href', 'https://app.hevium.xyz/launch');
    await context.close();
  });
});
