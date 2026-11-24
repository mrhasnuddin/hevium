import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { read, snapshot } from './pixels';

// Scrolls the statement to a place on screen and answers how much of it is lit, from 0 to 1, with
// how bright each figure beside it is. `below`: its top edge at the bottom of the screen.
// `centred`: its middle at the middle of the screen. `partway`: three quarters of the way from the
// first to the second, which is in the middle of the reading.
const readAt = (page: Page, where: 'below' | 'partway' | 'centred') =>
  page.evaluate(async (where) => {
    const statement = document.getElementById('what-is-hevium')!;
    // Where it is laid out on the page, whatever the sheet round it is doing.
    let top = 0;
    for (let el: HTMLElement | null = statement; el; el = el.offsetParent as HTMLElement | null) top += el.offsetTop;
    const below = top - innerHeight;
    const centred = top + statement.offsetHeight / 2 - innerHeight / 2;
    window.scrollTo(0, { below, centred, partway: below + (centred - below) * 0.75 }[where]);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    return {
      lit: Number(getComputedStyle(statement).getPropertyValue('--statement-read') || NaN),
      figures: [...document.querySelectorAll('#about dd')].map((dd) => Number(getComputedStyle(dd.parentElement!).opacity)),
    };
  }, where);

test.describe('statement section', () => {
  test('opens its section, under its own heading, ahead of the problem', async ({ page }) => {
    await page.goto('/');
    const about = page.locator('section#about');
    await expect(about.locator('h2')).toHaveText('What is Hevium');
    await expect(about.locator('h2')).toHaveCount(1);
    await expect(about.locator('#what-is-hevium')).toContainText('non-custodial');
    await expect(page.locator('#problem #what-is-hevium')).toHaveCount(0);
    await expect(about.locator('dd')).toHaveText(['6', '1.0%', '20%']);
    const [statement, problem] = await Promise.all([about.locator('#what-is-hevium').boundingBox(), page.locator('#problem').boundingBox()]);
    expect(statement!.y + statement!.height).toBeLessThanOrEqual(problem!.y);
  });

  test('lights up as it is scrolled through, and each figure lights with its words', async ({ page }) => {
    await page.goto('/');
    const before = await readAt(page, 'below');
    expect(before.lit).toBe(0);
    for (const figure of before.figures) expect(figure).toBeLessThan(0.5);
    const mid = await readAt(page, 'partway');
    expect(mid.lit).toBeGreaterThan(0.2);
    expect(mid.lit).toBeLessThan(0.8);
    expect(mid.figures[0]).toBe(1); // "six chains" is read by now
    expect(mid.figures[2]).toBeLessThan(0.5); // "20%" is not
    const after = await readAt(page, 'centred');
    expect(after.lit).toBe(1);
    expect(after.figures).toEqual([1, 1, 1]);
  });

  // Records every text each figure shows from now on, in window.__shown.
  const watchFigures = (page: Page) =>
    page.evaluate(() => {
      const shown: string[][] = [[], [], []];
      (window as unknown as { __shown: string[][] }).__shown = shown;
      document.querySelectorAll('#about dd').forEach((dd, i) => {
        new MutationObserver(() => shown[i].push(dd.textContent!)).observe(dd, { childList: true, characterData: true, subtree: true });
      });
    });
  const shownFigures = (page: Page) => page.evaluate(() => (window as unknown as { __shown: string[][] }).__shown);

  test('keeps each figure out of sight until its words are read', async ({ page }) => {
    await page.goto('/');
    await readAt(page, 'below');
    const hidden = await page.locator('#about dd').evaluateAll((dds) => dds.map((dd) => getComputedStyle(dd).opacity));
    expect(hidden).toEqual(['0', '0', '0']);
    // out of sight, it still holds its finished figure, never a zero
    await expect(page.locator('#about dd')).toHaveText(['6', '1.0%', '20%']);
  });

  test('counts each figure up from zero as it lights, and ends on the figure', async ({ page }) => {
    await page.goto('/');
    await readAt(page, 'below');
    await watchFigures(page);
    await readAt(page, 'centred');
    // each has counted and come to rest on its figure (the figure also stands there before the count starts)
    await expect.poll(async () => (await shownFigures(page)).map((shown) => shown.at(-1)), { timeout: 5000 }).toEqual(['6', '1.0%', '20%']);
    await expect(page.locator('#about dd')).toHaveText(['6', '1.0%', '20%']);
    const [chains, fee, share] = await shownFigures(page);
    for (const [shown, last, shape] of [[chains, '6', /^\d$/], [fee, '1.0%', /^\d\.\d%$/], [share, '20%', /^\d{1,2}%$/]] as const) {
      expect(shown.length, `${last} counted`).toBeGreaterThan(2);
      expect(parseFloat(shown[0])).toBeLessThan(parseFloat(last) / 2); // it started low
      for (const text of shown) expect(text).toMatch(shape);
      const numbers = shown.map(parseFloat);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b)); // it only ever went up
      expect(shown.at(-1)).toBe(last);
    }
  });

  test('with reduced motion the figures do not count', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await readAt(page, 'below');
    await watchFigures(page);
    await readAt(page, 'centred');
    await page.waitForTimeout(1200);
    expect(await shownFigures(page)).toEqual([[], [], []]);
    await expect(page.locator('#about dd')).toHaveText(['6', '1.0%', '20%']);
  });

  test('with reduced motion is lit wherever it stands', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const before = await readAt(page, 'below');
    expect(before.lit).toBe(1);
    expect(before.figures).toEqual([1, 1, 1]);
  });

  test('is lit and readable without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#about h2')).toBeVisible();
    await expect(page.locator('#what-is-hevium')).toBeVisible();
    await expect(page.locator('#about dd')).toHaveCount(3);
    await context.close();
  });

  for (const width of [320, 768, 1440]) {
    test(`keeps its figures inside the screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(page.locator('#about dd')).toHaveCount(3);
      for (const figure of await page.locator('#about dd').all()) {
        const box = (await figure.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
    });
  }
});

test.describe('statement section, its eyebrow and its stars', () => {
  test('opens with the page\'s eyebrow, the same pill every other section wears, as its heading', async ({ page }) => {
    await page.goto('/');
    const look = (selector: string) =>
      page.locator(selector).evaluate((el) => {
        const s = getComputedStyle(el);
        return { fill: s.backgroundColor, edge: `${s.borderTopWidth} ${s.borderTopColor}`, round: s.borderTopLeftRadius, type: `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`, letters: s.textTransform };
      });
    await expect(page.locator('#about h2')).toHaveClass(/eyebrow/);
    const about = await look('#about h2');
    expect(about).toEqual(await look('#stocks .eyebrow'));
    expect(about.fill).toBe('rgb(14, 17, 23)');
    expect(about.letters).toBe('none');
  });

  test('leads every eyebrow with the Hevium star, not a dot', async ({ page }) => {
    await page.goto('/');
    const marks = await page.locator('.eyebrow').evaluateAll((els) =>
      // those that are laid out: an engine inside the solution's frame leaves its eyebrow to the lit pill
      els.filter((el) => el.getClientRects().length > 0).map((el) => {
        const s = getComputedStyle(el, '::before');
        return {
          star: /data:image\/svg\+xml/.test(s.getPropertyValue('mask-image') || s.getPropertyValue('-webkit-mask-image')),
          round: s.borderTopLeftRadius,
          leans: parseFloat(s.width) > parseFloat(s.height), // the mark is wider than it is tall
        };
      }),
    );
    expect(marks.length).toBeGreaterThanOrEqual(2); // What is Hevium, the chains
    for (const mark of marks) expect(mark).toEqual({ star: true, round: '0px', leans: true });
  });

  test('lays star pixels behind the statement, where the characters were', async ({ page }) => {
    await page.goto('/');
    const field = page.locator('#about canvas[data-pixel-field]');
    await expect(field).toHaveAttribute('aria-hidden', 'true');
    await expect(field).toHaveCSS('pointer-events', 'none'); // the words over it can still be selected
    await field.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(field)).drawn).toBeGreaterThan(300);
    const frame = await read(field);
    expect(frame.drawn).toBeLessThan(frame.total * 0.3); // a sparse field, mostly empty
    const characters = await page.locator('#what-is-hevium').evaluate((p) => [getComputedStyle(p, '::before').content, getComputedStyle(p, '::after').content]);
    expect(characters).toEqual(['none', 'none']);
    // the field lies under the statement, and adds nothing to its words
    const [stars, words] = [(await field.boundingBox())!, (await page.locator('#what-is-hevium').boundingBox())!];
    expect(Math.abs(stars.x - words.x)).toBeLessThan(2);
    expect(Math.abs(stars.width - words.width)).toBeLessThan(2);
    await expect(page.locator('#what-is-hevium')).toHaveText(/^Hevium is .*referrer\.$/);
  });

  test('keeps the stars shimmering', async ({ page }) => {
    await page.goto('/');
    const field = page.locator('#about canvas[data-pixel-field]');
    await field.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(field)).drawn).toBeGreaterThan(300);
    const before = await snapshot(field);
    await expect.poll(async () => (await snapshot(field)) !== before).toBe(true);
  });

  test('pulls the stars toward the pointer, though they lie behind the words', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // a still field, so the pointer is the only thing moving it
    await page.goto('/');
    const field = page.locator('#about canvas[data-pixel-field]');
    await field.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await read(field)).drawn).toBeGreaterThan(300);
    const atRest = await snapshot(field);
    await page.waitForTimeout(300);
    expect(await snapshot(field)).toBe(atRest);

    const box = (await page.locator('#what-is-hevium').boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6);
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.6, { steps: 4 });
    await expect.poll(async () => (await snapshot(field)) !== atRest).toBe(true);

    await page.mouse.move(2, 2);
    await expect.poll(() => snapshot(field)).toBe(atRest);
  });
});
