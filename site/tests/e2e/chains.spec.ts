import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const NAMES = ['Base', 'Robinhood Chain', 'BNB Chain', 'Solana', 'Elysium', 'HyperEVM'];
const rows = (page: Page) => page.locator('#chains [data-chains] > li');
// Which chains are lit, by their place in the list.
const lit = (page: Page) => rows(page).evaluateAll((found) => found.flatMap((row, i) => (row.hasAttribute('data-on') ? [i] : [])));
const wide = (page: Page) => page.viewportSize()!.width >= 1024; // where the lanes are drawn

test.describe('chains section', () => {
  test('opens with the shared head', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#chains');
    await expect(section.locator('.eyebrow')).toHaveText('Six chains');
    await expect(section.locator('h2')).toHaveText('One terminal, six chains.');
    await expect(section.locator('h2 .hl')).toHaveText('six chains');
    await expect(section.locator('header .lead')).toContainText('Sign in with Google');
  });

  test('names the six chains in order, each with the app\'s own logo, who it suits and what trades there', async ({ page }) => {
    await page.goto('/');
    await expect(rows(page)).toHaveCount(6);
    await expect(rows(page).locator('[data-name]')).toHaveText(NAMES);
    for (const row of await rows(page).all()) {
      await expect(row.locator('img[data-logo]')).toHaveAttribute('src', /^\/chains\/[a-z]+\.(svg|png|webp)$/);
      await expect(row.locator('img[data-logo]')).toHaveAttribute('alt', '');
      await expect(row.locator('[data-suits]')).toHaveText(/\w+ \w+/);
      expect(await row.locator('[data-token]').count()).toBeGreaterThanOrEqual(2);
      for (const token of await row.locator('[data-token] img').all()) await expect(token).toHaveAttribute('src', /^\/(tokens|chains)\//);
    }
    await expect(rows(page).nth(0).locator('[data-token]')).toHaveText(['ETH', 'USDC', 'USD+', 'COIN']);
    await expect(rows(page).nth(1).locator('[data-token]')).toHaveText(['NVDA', 'TSLA', 'AAPL', 'SPY']);
  });

  test('gives the three steps in order', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#chains [data-steps] li [data-step]')).toHaveText(['Sign in', 'Pick a chain', 'Trade']);
  });

  test('sets the steps as three connected pills under the supporting line: centred, on one row, and still', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#chains');
    // they stand between the head and the diagram, not inside either
    expect(await section.locator('.container').evaluate((container) => [...container.children].map((part) => part.tagName))).toEqual(['HEADER', 'OL', 'FIGURE', 'DIV']);
    await expect(section.locator('figure [data-steps]')).toHaveCount(0);
    const pills = section.locator('[data-steps] [data-pill]');
    await expect(pills).toHaveCount(3);
    await expect(section.locator('[data-steps] [data-n]')).toHaveText(['01', '02', '03']);
    await expect(pills.first()).toHaveCSS('border-top-left-radius', '999px');
    const boxes = await Promise.all((await pills.all()).map(async (pill) => (await pill.boundingBox())!));
    const [lead, figure, row] = [(await section.locator('header .lead').boundingBox())!, (await section.locator('figure').boundingBox())!, (await section.locator('[data-steps]').boundingBox())!];
    for (const [n, box] of boxes.entries()) {
      expect(Math.abs(box.y - boxes[0].y), `pill ${n} is on the one row`).toBeLessThan(1);
      if (n) expect(box.x, `pill ${n} stands clear of the one before`).toBeGreaterThan(boxes[n - 1].x + boxes[n - 1].width + 4);
    }
    expect(boxes[0].y).toBeGreaterThanOrEqual(lead.y + lead.height); // under the supporting line
    expect(boxes[0].y - (lead.y + lead.height)).toBeLessThan(40); // and close to it
    expect(boxes[0].y + boxes[0].height).toBeLessThanOrEqual(figure.y); // over the diagram
    expect(Math.abs(boxes[0].x + (boxes[2].x + boxes[2].width) - (2 * row.x + row.width))).toBeLessThan(3); // centred
    // a line joins each pill to the one before it
    const joins = await section.locator('[data-steps] li').evaluateAll((items) => items.map((item) => getComputedStyle(item, '::before').content));
    expect(joins).toEqual(['none', '""', '""']);
    // nothing about them moves: the diagram is the moving part
    await page.waitForTimeout(300);
    expect(await section.locator('[data-steps]').evaluate((steps) => steps.getAnimations({ subtree: true }).length)).toBe(0);
  });

  test('turns the hub to its filled look under the pointer: the brand gradient, with the mark in black', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'hover is a mouse\'s');
    await page.goto('/');
    const look = () =>
      page.locator('#chains [data-hub]').evaluate((hub) => ({
        fill: Number(getComputedStyle(hub).getPropertyValue('--hub-fill')),
        disc: getComputedStyle(hub.querySelector('[data-disc]')!).backgroundImage,
        black: Number(getComputedStyle(hub.querySelector('[data-mark]')!, '::after').opacity),
      }));
    const rest = await look();
    expect(rest.fill).toBe(0);
    expect(rest.black).toBe(0);
    await page.locator('#chains [data-hub]').hover();
    await expect.poll(async () => (await look()).fill).toBe(1);
    const over = await look();
    expect(over.black).toBe(1);
    expect(over.disc).not.toBe(rest.disc); // the fill has changed
    // it holds through a turn, though the disc itself is made afresh
    await page.waitForTimeout(3400);
    expect((await look()).black).toBe(1);
    await page.mouse.move(2, 2);
    await expect.poll(async () => (await look()).fill).toBe(0);
  });

  test('draws its lanes at the weight the other sections draw their lines', async ({ page }) => {
    test.skip(!wide(page), 'a narrow screen draws a rail');
    await page.goto('/');
    const weights = await page.evaluate(() => ['#chains [data-lane]', '#agents figure polyline', '#stocks [data-ring] ~ * polyline, #stocks polyline'].map((selector) => getComputedStyle(document.querySelector(selector)!).strokeWidth));
    expect(weights).toEqual(['2px', '2px', '2px']);
  });

  test('is where the hero\'s How it works button lands, with the section at the top of the screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="#how"]')).toHaveCount(1);
    await expect(page.locator('#chains #how')).toHaveCount(1);
    await page.goto('/#how');
    await expect.poll(() => page.locator('#chains').evaluate((section) => Math.abs(section.getBoundingClientRect().top))).toBeLessThan(4);
  });

  test('is one figure: a hub, a lane to each chain hidden from screen readers, and the piece told in words', async ({ page }) => {
    await page.goto('/');
    const figure = page.locator('#chains figure');
    await expect(figure).toHaveCount(1);
    await expect(figure.locator('[data-hub]')).toBeVisible();
    await expect(figure.locator('[data-lane]')).toHaveCount(6);
    for (const svg of await figure.locator('svg').all()) await expect(svg).toHaveAttribute('aria-hidden', 'true');
    for (const name of NAMES) await expect(figure.locator('figcaption')).toContainText(name);
  });

  test('runs each lane from the middle of the hub to its own chain\'s logo', async ({ page }) => {
    test.skip(!wide(page), 'a narrow screen draws one rail down the page instead of lanes');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const ends = await page.locator('#chains figure').evaluate((figure) => {
      const middle = (el: Element) => {
        const box = el.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2, left: box.left };
      };
      const hub = middle(figure.querySelector('[data-hub] [data-disc]')!);
      const logos = [...figure.querySelectorAll('[data-chains] > li img[data-logo]')].map(middle);
      return [...figure.querySelectorAll<SVGPathElement>('[data-lane]')].map((lane, i) => {
        const at = (length: number) => lane.getPointAtLength(length).matrixTransform(lane.getScreenCTM()!);
        const [from, to] = [at(0), at(lane.getTotalLength())];
        return { fromX: from.x - hub.x, fromY: from.y - hub.y, toY: to.y - logos[i].y, short: logos[i].left - to.x };
      });
    });
    for (const [n, end] of ends.entries()) {
      expect(Math.abs(end.fromX), `lane ${n} starts in the hub`).toBeLessThan(4);
      expect(Math.abs(end.fromY), `lane ${n} starts in the hub`).toBeLessThan(4);
      expect(Math.abs(end.toY), `lane ${n} ends level with its logo`).toBeLessThan(4);
      expect(end.short, `lane ${n} stops just short of its logo`).toBeGreaterThanOrEqual(0);
      expect(end.short, `lane ${n} stops just short of its logo`).toBeLessThan(32);
    }
  });

  test('lights one chain at a time, with its lane, and lands a buy on it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // the lit state, with nothing in flight
    await page.goto('/');
    await expect.poll(() => lit(page)).toEqual([0]);
    await expect(page.locator('#chains [data-lane][data-on]')).toHaveCount(1);
    const tag = rows(page).nth(0).locator('.trade-tag');
    await expect(tag).toHaveText('B');
    await expect(tag).toHaveCSS('opacity', '1');
    await expect(rows(page).nth(2).locator('.trade-tag')).toHaveCSS('opacity', '0');
  });

  test('sends the pulse to the chain the pointer goes to', async ({ page, hasTouch }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect.poll(() => lit(page)).toEqual([0]);
    if (hasTouch) await rows(page).nth(3).tap();
    else await rows(page).nth(3).hover();
    await expect.poll(() => lit(page)).toEqual([3]);
    expect(await page.locator('#chains [data-lane]').evaluateAll((lanes) => lanes.flatMap((lane, i) => (lane.hasAttribute('data-on') ? [i] : [])))).toEqual([3]);
  });

  test('moves from chain to chain by itself, and holds while the pointer stays on one', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'a pointer that stays is a mouse');
    await page.goto('/');
    await expect.poll(() => lit(page)).toEqual([0]);
    await expect.poll(() => lit(page), { timeout: 8000 }).toEqual([1]);
    await rows(page).nth(4).hover();
    await expect.poll(() => lit(page)).toEqual([4]);
    await page.waitForTimeout(3400); // longer than one chain's turn
    expect(await lit(page)).toEqual([4]);
  });

  test('with reduced motion nothing moves by itself: the first chain stays lit', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect.poll(() => lit(page)).toEqual([0]);
    await page.waitForTimeout(3400);
    expect(await lit(page)).toEqual([0]);
    const running = await page.locator('#chains').evaluate((section) => section.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length);
    expect(running).toBe(0);
  });

  for (const width of [360, 768, 1440]) {
    test(`keeps every chain and its tokens inside the screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await expect.poll(() => lit(page)).toEqual([0]); // the page's script has settled
      for (const part of await page.locator('#chains [data-chains] > li, #chains [data-token], #chains [data-hub], #chains [data-steps] li').all()) {
        const box = (await part.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 0.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }

  test('ends in a button into the app, tagged as coming from this section', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#chains').getByRole('link', { name: 'Start trading' });
    const url = new URL((await cta.getAttribute('href'))!);
    expect(url.origin).toBe('https://app.hevium.xyz');
    await expect(cta).toHaveAttribute('data-placement', 'chains');
    await expect(cta).toHaveClass(/\bbtn\b/);
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });

  test('reads without JavaScript: the head, the steps, all six chains at full strength and the button', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#chains h2')).toBeVisible();
    await expect(rows(page).locator('[data-name]')).toHaveText(NAMES);
    await expect(page.locator('#chains [data-steps] li [data-step]')).toHaveText(['Sign in', 'Pick a chain', 'Trade']);
    expect(await lit(page)).toEqual([]); // nothing is dimmed, because nothing takes turns
    for (const logo of await rows(page).locator('img[data-logo]').all()) await expect(logo).toHaveCSS('opacity', '1');
    await expect(page.locator('#chains').getByRole('link', { name: 'Start trading' })).toHaveAttribute('href', 'https://app.hevium.xyz/');
    await context.close();
  });
});
