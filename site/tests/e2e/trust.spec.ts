import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { read, snapshot } from './pixels';

const CELLS = ['Your keys.', 'Fixed supply.', 'Locked liquidity.', 'Buyback vault.', 'Security audit.'];
const cells = (page: Page) => page.locator('#trust [data-bento] > li');
const QUESTIONS = [
  'Who holds my funds?',
  'How does a fair launch work?',
  'What happens to liquidity after a token graduates?',
  'What does trading cost?',
  'How do referral fees work?',
  'Can an AI agent trade for me?',
  'Has the code had a security audit?',
  'What are the risks?',
];
const items = (page: Page) => page.locator('#faq details');
const open = (page: Page) => items(page).evaluateAll((all) => all.flatMap((item, n) => ((item as HTMLDetailsElement).open ? [n] : [])));

// Guarantees and FAQ, merged into one section at the user's request. The guarantees are an animated bento, as
// the user asked with three references: five cells that mix star-pixel objects with small pieces of
// interface. Then the questions. It runs as long as it needs.
test.describe('trust section', () => {
  test('opens with the shared head', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('section#trust');
    await expect(section.locator('.section-head .eyebrow')).toHaveText('Trust'); // the FAQ part below has its own
    await expect(section.locator('h2')).toHaveText('Don\'t trust. Verify.');
    await expect(section.locator('h2 .hl')).toHaveText('Verify');
    await expect(section.locator('header .lead')).toContainText('on-chain');
    // it follows Five chains
    const order = await page.locator('main section').evaluateAll((sections) => sections.map((section) => section.id));
    expect(order.indexOf('trust')).toBeGreaterThan(order.indexOf('chains'));
  });

  test('lays the guarantees out as a bento on the design system\'s card: one wide cell over two rows of two', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(cells(page)).toHaveCount(5);
    const box = await Promise.all((await cells(page).all()).map(async (cell) => (await cell.boundingBox())!));
    const grid = (await page.locator('#trust [data-bento]').boundingBox())!;
    // the first runs the full width
    expect(Math.abs(box[0].width - grid.width)).toBeLessThan(1);
    // then a narrow one beside a wide one, and under them a wide one beside a narrow one
    for (const [left, right] of [[1, 2], [3, 4]]) {
      expect(Math.abs(box[left].y - box[right].y)).toBeLessThan(1);
      expect(Math.abs(box[left].height - box[right].height)).toBeLessThan(1);
      expect(Math.round(box[right].x - (box[left].x + box[left].width))).toBe(16);
    }
    expect(box[1].width).toBeLessThan(box[2].width);
    expect(box[3].width).toBeGreaterThan(box[4].width);
    expect(Math.abs(box[1].width - box[4].width)).toBeLessThan(2);
    expect(box[1].y).toBeGreaterThanOrEqual(box[0].y + box[0].height + 15);
    expect(box[3].y).toBeGreaterThanOrEqual(box[1].y + box[1].height + 15);
    // every cell is the card: a Carbon frame with a 20px corner round an Obsidian well
    for (const cell of await cells(page).all()) {
      await expect(cell).toHaveClass(/\bcard\b/);
      await expect(cell).toHaveCSS('border-top-left-radius', '20px');
      await expect(cell.locator('.card-body')).toHaveCSS('background-color', 'rgb(7, 8, 11)');
    }
  });

  test('names the four guarantees and the audit, each with a line, and the guarantees with the fact behind them', async ({ page }) => {
    await page.goto('/');
    await expect(cells(page).locator('h3')).toHaveText(CELLS);
    for (const cell of await cells(page).all()) await expect(cell.locator('[data-line]')).toHaveText(/\w+ \w+ \w+/);
    await expect(page.locator('#trust [data-bento] [data-proof]')).toContainText(['Non-custodial', '1,000,000,000', '0x0000...dEaD', '180-day']);
  });

  test('draws an object in star pixels in four of the cells, each its own', async ({ page }) => {
    await page.goto('/');
    const art = page.locator('#trust [data-bento] [data-scene]');
    await expect(art).toHaveCount(4);
    expect(await art.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.scene))).toEqual(['seal', 'lock', 'safe', 'shield']);
    for (const canvas of await page.locator('#trust [data-bento] [data-scene] canvas').all()) {
      await canvas.scrollIntoViewIfNeeded();
      await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(200);
      const frame = await read(canvas);
      expect(frame.drawn).toBeLessThan(frame.total * 0.7); // pixels with gaps between them, never a solid picture
    }
  });

  test('keeps the objects moving on their own, and still with reduced motion', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#trust [data-bento] [data-scene] canvas').first();
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(200);
    const before = await snapshot(canvas);
    await expect.poll(async () => (await snapshot(canvas)) !== before).toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(canvas)).drawn).toBeGreaterThan(200);
    const still = await snapshot(canvas);
    await page.waitForTimeout(300);
    expect(await snapshot(canvas)).toBe(still);
  });

  test('shows the facts as small pieces of interface: a feed of signed trades, the supply, a burn receipt, a vesting meter', async ({ page }) => {
    await page.goto('/');
    const bento = page.locator('#trust [data-bento]');
    // the feed: trades, each marked with the trade tag and signed by the visitor
    const feed = bento.locator('[data-feed]');
    await expect(feed).toHaveAttribute('aria-hidden', 'true');
    expect(await feed.locator('li').count()).toBeGreaterThanOrEqual(4);
    for (const row of await feed.locator('li').all()) {
      await expect(row.locator('.trade-tag')).toHaveText(/^[BS]$/);
      await expect(row).toContainText('signed by you');
    }
    // nothing in the bento is tagged as a sample, the receipt's rows included
    expect(await bento.textContent()).not.toMatch(/sample/i);
    await expect(bento.locator('[data-supply]')).toContainText('1,000,000,000');
    await expect(bento.locator('[data-receipt]')).toContainText('0x0000...dEaD');
    await expect(bento.locator('[data-receipt]')).toContainText('Burned');
    await expect(bento.locator('[data-vesting]')).toContainText('of 180');
  });

  test('moves the interface too, and stops it with reduced motion', async ({ page }) => {
    const moving = () =>
      page.locator('#trust [data-bento]').evaluate((bento) => {
        const names = bento.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').map((animation) => (animation as CSSAnimation).animationName ?? '');
        return ['feed', 'vest', 'receipt'].filter((part) => names.some((name) => name.includes(part)));
      });
    await page.goto('/');
    // a section rests while it is off screen, so it is brought up first, as a visitor would bring it
    await page.locator('#trust').evaluate((section) => section.scrollIntoView());
    await expect.poll(moving).toEqual(['feed', 'vest', 'receipt']);
    // the vesting meter fills as its day counts up
    const filled = () => page.locator('#trust [data-vesting] [data-fill]').evaluate((fill) => fill.getBoundingClientRect().width);
    const first = await filled();
    await expect.poll(async () => (await filled()) !== first).toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await moving()).toEqual([]);
    // at rest the receipt reads as done and the meter stands part way
    await expect(page.locator('#trust [data-receipt] [data-done]')).toHaveCSS('opacity', '1');
    expect(await filled()).toBeGreaterThan(10);
  });

  test('stacks into one column on a phone, every cell and its parts inside the screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    let last = -1;
    for (const cell of await cells(page).all()) {
      const box = (await cell.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
      expect(box.y).toBeGreaterThan(last);
      last = box.y;
    }
    for (const part of await page.locator('#trust [data-bento] :is([data-feed], [data-supply], [data-receipt], [data-vesting], [data-scene], h3)').all()) {
      const box = (await part.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('says the code is security audited, with a mint dot', async ({ page }) => {
    await page.goto('/');
    const note = page.locator('#trust [data-audit]');
    await expect(note).toHaveText('Security audited');
    const mint = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement('i'));
      probe.style.color = 'var(--color-accent)';
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    await expect(note.locator('[data-dot]')).toHaveCSS('background-color', mint);
  });
});

test.describe('faq', () => {
  test('is a part of the trust section, and where the nav bar\'s FAQ link lands, clear of the bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section#trust #faq')).toHaveCount(1);
    await expect(page.locator('nav a[href="#faq"]')).toHaveCount(1);
    await page.goto('/#faq');
    const first = items(page).first().locator('summary');
    await expect(first).toBeInViewport();
    const [nav, block] = [(await page.locator('header nav').boundingBox())!, (await page.locator('#faq').boundingBox())!];
    expect(block.y).toBeGreaterThanOrEqual(nav.y + nav.height);
    // just under the bar, unless the page ends before it can come that far up (it is the last section for now)
    const atEnd = await page.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 1);
    expect(block.y < nav.y + nav.height + 80 || atEnd).toBe(true);
  });

  test('asks eight questions as real text, each with its answer, the first one open', async ({ page }) => {
    await page.goto('/');
    await expect(items(page)).toHaveCount(8);
    await expect(items(page).locator('summary [data-question]')).toHaveText(QUESTIONS);
    for (const item of await items(page).all()) expect((await item.locator('[data-answer]').textContent())!.split(/\s+/).length).toBeGreaterThan(12);
    expect(await open(page)).toEqual([0]);
    await expect(items(page).first().locator('[data-answer]')).toBeVisible();
  });

  test('carries the facts the rest of the page leaves to it', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('#faq').textContent())!;
    for (const fact of ['graduates by itself', 'Curve sells', '0.50%', 'mcp.hevium.xyz', '1,000,000,000', 'dead address', 'can lose all of their value', 'not financial advice']) expect(text, fact).toContain(fact);
  });

  test('opens one question at a time', async ({ page }) => {
    await page.goto('/');
    await items(page).nth(3).locator('summary').click();
    expect(await open(page)).toEqual([3]);
    await expect(items(page).nth(3).locator('[data-answer]')).toBeVisible();
    await items(page).nth(5).locator('summary').click();
    expect(await open(page)).toEqual([5]);
    await items(page).nth(5).locator('summary').click(); // and closes on a second press
    expect(await open(page)).toEqual([]);
  });

  test('opens from the keyboard', async ({ page }) => {
    await page.goto('/');
    await items(page).nth(2).locator('summary').focus();
    await page.keyboard.press('Enter');
    expect(await open(page)).toEqual([2]);
  });

  test('stands on the canvas with no boxes and no lines, each question tall enough to press, its plus turning when open', async ({ page }) => {
    await page.goto('/');
    const drawn = await items(page).evaluateAll((all) =>
      all.flatMap((item) => [item, item.querySelector('summary')!].map((el) => {
        const style = getComputedStyle(el);
        return `${style.borderTopWidth} ${style.borderBottomWidth} ${style.backgroundColor}`;
      })),
    );
    expect(new Set(drawn)).toEqual(new Set(['0px 0px rgba(0, 0, 0, 0)']));
    for (const summary of await items(page).locator('summary').all()) expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const turn = (n: number) => items(page).nth(n).locator('[data-plus]').evaluate((plus) => getComputedStyle(plus).rotate);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await turn(0)).toBe('45deg');
    expect(await turn(1)).toBe('none');
  });

  test('ends on the last question, with no link out and no date under it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#faq a')).toHaveCount(0);
    await expect(page.locator('#faq time')).toHaveCount(0);
  });

  test('keeps every question inside the screen on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    for (const summary of await items(page).locator('summary').all()) {
      const box = (await summary.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('works without JavaScript: the questions open and close on their own', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#trust h2')).toBeVisible();
    await expect(cells(page).locator('h3')).toHaveText(CELLS);
    for (const img of await page.locator('#trust [data-bento] [data-scene] img').all()) {
      await expect(img).toBeVisible();
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
    }
    await expect(items(page).locator('summary [data-question]')).toHaveText(QUESTIONS);
    await expect(items(page).first().locator('[data-answer]')).toBeVisible();
    await items(page).nth(4).locator('summary').click();
    await expect(items(page).nth(4).locator('[data-answer]')).toBeVisible();
    await context.close();
  });
});
