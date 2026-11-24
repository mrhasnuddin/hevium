import { expect, test } from './fixtures';
import { read, snapshot } from './pixels';

const WALLS = ['Crypto-only', 'Sniper bots', 'Humans only'];
const FACTS = ['Live on 5 chains', '0% insider allocation'];

test.describe('problem section', () => {
  test('is a part of the What is Hevium section: a label, a headline, three cards and two facts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main > section#problem')).toHaveCount(0); // no longer a section of its own
    const block = page.locator('section#about #problem');
    await expect(block).toHaveCount(1);
    await expect(block.locator('.eyebrow')).toHaveText('The problem'); // the same pill every head wears
    await expect(block.locator('h3')).toHaveText('First-generation launchpads hit three walls.');
    await expect(block.locator('h3 .hl')).toHaveText('three walls');
    await expect(block.locator('article h4')).toHaveText(WALLS);
    for (const detail of ['gas tokens', 'exit', 'spending limits']) await expect(block.locator('article', { hasText: detail })).toHaveCount(1);
    await expect(block.locator('.card-stat')).toHaveText(FACTS);
    // it stands under the statement
    const [statement, problem] = [(await page.locator('#what-is-hevium').boundingBox())!, (await block.boundingBox())!];
    expect(problem.y).toBeGreaterThanOrEqual(statement.y + statement.height);
  });

  test('lays the cards out as the reference does: fact over card, card over fact, one tall card', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 }); // the three columns are for 1024px and up
    await page.goto('/');
    const box = async (selector: string, n = 0) => (await page.locator(`#problem ${selector}`).nth(n).boundingBox())!;
    const [crypto, bots, humans] = [await box('article', 0), await box('article', 1), await box('article', 2)];
    const [chains, insiders] = [await box('.card-stat', 0), await box('.card-stat', 1)];
    // three columns, left to right
    expect(crypto.x).toBeLessThan(bots.x);
    expect(bots.x).toBeLessThan(humans.x);
    expect(Math.abs(crypto.width - humans.width)).toBeLessThan(2);
    // left column: the fact sits over the card. Middle column: the card sits over the fact.
    expect(chains.x).toBe(crypto.x);
    expect(chains.y + chains.height).toBeLessThanOrEqual(crypto.y);
    expect(insiders.x).toBe(bots.x);
    expect(bots.y + bots.height).toBeLessThanOrEqual(insiders.y);
    // the right card runs the full height of the other two columns
    expect(Math.abs(humans.y - chains.y)).toBeLessThan(2);
    expect(Math.abs(humans.y + humans.height - (insiders.y + insiders.height))).toBeLessThan(2);
    // 16px between columns and between a card and its fact
    expect(Math.round(bots.x - (crypto.x + crypto.width))).toBe(16);
    expect(Math.round(crypto.y - (chains.y + chains.height))).toBe(16);
  });

  test('draws its cards with the design system card: an 8px frame, 20px outside and 16px inside', async ({ page }) => {
    await page.goto('/');
    const card = await page.locator('#problem article').first().evaluate((el) => {
      const frame = getComputedStyle(el);
      const body = getComputedStyle(el.querySelector('.card-body')!);
      return { frame: frame.padding, outer: frame.borderRadius, inner: body.borderRadius, differs: frame.backgroundColor !== body.backgroundColor };
    });
    expect(card).toEqual({ frame: '8px', outer: '20px', inner: '16px', differs: true });
  });

  test('colours its cards from the design system: a Carbon frame round an Obsidian well, both with a hairline', async ({ page }) => {
    await page.goto('/');
    const card = await page.locator('#problem article').first().evaluate((el) => {
      const frame = getComputedStyle(el);
      const body = getComputedStyle(el.querySelector('.card-body')!);
      return {
        frame: frame.backgroundColor,
        frameEdge: `${frame.borderTopWidth} ${frame.borderTopColor}`,
        well: body.backgroundColor,
        wellEdge: `${body.borderTopWidth} ${body.borderTopColor}`,
      };
    });
    expect(card).toEqual({
      frame: 'rgb(14, 17, 23)',
      frameEdge: '1px rgba(255, 255, 255, 0.08)',
      well: 'rgb(7, 8, 11)',
      wellEdge: '1px rgba(255, 255, 255, 0.08)',
    });
  });

  test('shows the five chains by their logos, as the app does, with their names for a screen reader', async ({ page }) => {
    await page.goto('/');
    const logos = page.locator('#problem .card-stat').first().locator('img');
    expect(await logos.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('alt')))).toEqual(['Base', 'Robinhood Chain', 'BNB Chain', 'Solana', 'Elysium']);
    expect(await logos.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')))).toEqual([
      '/chains/base.svg',
      '/chains/robinhood.webp',
      '/chains/bnb.svg',
      '/chains/solana.png',
      '/chains/elysium.svg',
    ]);
    // each a round mark the same size, with room reserved before it loads
    for (const logo of await logos.all()) {
      const box = (await logo.boundingBox())!;
      expect(Math.round(box.width)).toBe(Math.round(box.height));
      expect(box.width).toBeGreaterThanOrEqual(24);
    }
  });

  test('gives each card its own object, drawn in pixels', async ({ page }) => {
    await page.goto('/');
    const art = page.locator('#problem article [data-pixels]');
    await expect(art).toHaveCount(3);
    expect(await art.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.scene))).toEqual(['vault', 'bot', 'click']);
    for (const canvas of await page.locator('#problem article canvas').all()) {
      await canvas.scrollIntoViewIfNeeded();
      await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(300);
      // pixels with gaps between them, never a solid picture
      const frame = await read(canvas);
      expect(frame.drawn).toBeLessThan(frame.total * 0.7);
    }
  });

  test('keeps the objects moving on their own', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#problem article canvas').first();
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(300);
    const before = await snapshot(canvas);
    await expect.poll(async () => (await snapshot(canvas)) !== before).toBe(true);
  });

  test('pulls the pixels toward the pointer and lets them go back', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // a still object, so the pointer is the only thing moving it
    await page.goto('/');
    const canvas = page.locator('#problem article canvas').first();
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(300);
    const atRest = await snapshot(canvas);
    await page.waitForTimeout(300);
    expect(await snapshot(canvas)).toBe(atRest); // with reduced motion it does not move by itself

    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.5, { steps: 4 });
    await expect.poll(async () => (await snapshot(canvas)) !== atRest).toBe(true);

    await page.mouse.move(2, 2);
    await expect.poll(async () => await snapshot(canvas)).toBe(atRest);
  });

  test('hides the plain picture once the pixels are drawn, and keeps both out of the reading order', async ({ page }) => {
    await page.goto('/');
    const art = page.locator('#problem article [data-pixels]').first();
    await art.scrollIntoViewIfNeeded();
    await expect(art).toHaveAttribute('data-pixels', 'ready');
    await expect(art.locator('img')).toHaveCSS('opacity', '0');
    await expect(art.locator('img')).toHaveAttribute('alt', '');
    await expect(art.locator('canvas')).toHaveAttribute('aria-hidden', 'true');
  });

  test('reads without JavaScript, with the plain pictures in place', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#problem h3')).toBeVisible();
    await expect(page.locator('#problem article h4')).toHaveText(WALLS);
    await expect(page.locator('#problem .card-stat')).toHaveText(FACTS);
    for (const img of await page.locator('#problem article img').all()) {
      await expect(img).toBeVisible();
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    }
    await context.close();
  });

  test('stacks into one column on a phone, every card inside the screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    let last = -1;
    for (const card of await page.locator('#problem .card').all()) {
      const box = (await card.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
      expect(box.y).toBeGreaterThan(last); // each below the one before
      last = box.y;
    }
  });
});
