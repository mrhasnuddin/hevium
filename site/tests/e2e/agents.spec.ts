import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const replies = (page: Page) => page.locator('#agents [data-prompt] [data-reply]');
const marks = (page: Page) => page.locator('#agents figure [data-mark]');

// Stops the session at one moment, given as a share of it from 0 to 1, so that moment can be looked at.
const stopAt = (page: Page, when: number) =>
  page.locator('#agents [data-session]').evaluate((stage, when) => {
    const run = stage.getAnimations().find((animation) => (animation as CSSAnimation).animationName.includes('session'))!;
    run.pause();
    run.currentTime = when * Number(run.effect!.getComputedTiming().duration); // however long a session is set to run
  }, when);

// How many trade replies the prompt card shows, and how many marks the chart shows, at this moment.
const tally = (page: Page) =>
  page.locator('#agents').evaluate((section) => {
    const shown = (el: Element) => Number(getComputedStyle(el).opacity) > 0.5;
    return {
      answered: [...section.querySelectorAll('[data-prompt] [data-reply]')].filter(shown).length,
      marked: [...section.querySelectorAll('figure [data-mark]')].filter(shown).length,
    };
  });

test.describe('agents section', () => {
  test('opens with the shared head: its eyebrow, a headline with one accent phrase, one supporting line', async ({ page }) => {
    await page.goto('/#agents');
    const section = page.locator('section#agents');
    await expect(section.locator('.eyebrow')).toHaveText('Agents');
    await expect(section.locator('h2')).toHaveCount(1);
    await expect(section.locator('h2')).toHaveText('Built for 24/7 AI orderflow.');
    await expect(section.locator('h2 .hl')).toHaveText('24/7');
    await expect(section.locator('header .lead')).toContainText('MCP');
    // it follows Launch in the page (on a phone only the open one is laid out)
    const order = await page.locator('#engines > section').evaluateAll((sections) => sections.map((section) => section.id));
    expect(order.indexOf('agents')).toBe(order.indexOf('launch') + 1);
  });

  test('shows the four MCP clients, a natural-language prompt bubble, three buys and one held reply', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // the whole session, finished
    await page.goto('/#agents');
    await expect(page.locator('#agents [data-clients] li')).toHaveText(['Claude', 'Gemini', 'Cursor', 'Codex']);
    await expect(page.locator('#agents [data-bubble]')).toContainText('0.1 ETH');
    await expect(page.locator('#agents [data-bubble]')).toContainText('0.3');
    await expect(replies(page)).toHaveCount(4);
    await expect(replies(page).filter({ hasText: /Bought 0\.1 ETH/ })).toHaveCount(3);
    await expect(replies(page).filter({ hasText: /Held 0\.1 ETH/ })).toHaveCount(1);
    // shown as the product at work, with no tag calling it a sample
    await expect(page.locator('#agents')).not.toContainText(/sample/i);
  });

  test('shows the prompt bubble and every reply in full when nothing may move', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#agents');
    await expect(page.locator('#agents [data-bubble]')).toHaveCSS('opacity', '1');
    const hidden = await replies(page).evaluateAll((rows) => rows.filter((row) => Number(getComputedStyle(row).opacity) < 0.99).length);
    expect(hidden).toBe(0);
  });

  test('runs the prompt session by itself', async ({ page }) => {
    await page.goto('/#agents');
    const prompt = page.locator('#agents [data-prompt]');
    await prompt.scrollIntoViewIfNeeded();
    const progress = () => prompt.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--agent-t')));
    const first = await progress();
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThanOrEqual(1);
    await expect.poll(async () => Math.abs((await progress()) - first)).toBeGreaterThan(0.02);
  });

  test('draws a line chart beside the prompt card, as a figure with a description and the hours of a day under it', async ({ page }) => {
    await page.goto('/#agents');
    const chart = page.locator('#agents figure');
    await expect(chart).toHaveCount(1);
    await expect(chart.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(chart.locator('svg polyline')).toHaveCount(1);
    await expect(chart.locator('figcaption')).toContainText('chart');
    await expect(chart.locator('figcaption')).toContainText('buy');
    await expect(chart.locator('[data-hours] li')).toHaveText(['00:00', '06:00', '12:00', '18:00', '24:00']);
  });

  test('marks every trade on the line: a B with its amount for each that went through, and the held one in amber', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // the whole session, finished
    await page.goto('/#agents');
    await expect(marks(page)).toHaveCount(4);
    for (const n of [0, 1, 2]) {
      await expect(marks(page).nth(n).locator('.trade-tag')).toHaveText('B');
      await expect(marks(page).nth(n).locator('.trade-tag')).toHaveCSS('background-color', 'rgb(151, 251, 227)');
      await expect(marks(page).nth(n)).toContainText('0.1 ETH');
    }
    await expect(marks(page).nth(3)).toContainText('held');
    await expect(marks(page).nth(3).locator('.trade-tag')).toHaveCSS('background-color', 'rgb(255, 185, 0)');
    // they stand along the line in the order they were made, each inside the plot
    const plot = (await page.locator('#agents figure [data-plot]').boundingBox())!;
    let last = plot.x;
    for (const mark of await marks(page).locator('.trade-tag').all()) {
      const box = (await mark.boundingBox())!;
      expect(box.x).toBeGreaterThan(last);
      expect(box.y).toBeGreaterThanOrEqual(plot.y - 1);
      expect(box.y + box.height).toBeLessThanOrEqual(plot.y + plot.height + 1);
      last = box.x;
    }
  });

  test('lands each prompt reply and its chart mark at the exact same moment, after the user prompt sends', async ({ page }) => {
    await page.goto('/#agents');
    await page.locator('#agents figure').scrollIntoViewIfNeeded();
    // while typing, the bubble has not landed yet
    await stopAt(page, 0.12);
    await expect(page.locator('#agents [data-bubble]')).toHaveCSS('opacity', '0');
    expect(await tally(page)).toEqual({ answered: 0, marked: 0 });
    // after submit, the bubble is visible before the first buy
    await stopAt(page, 0.3);
    await expect(page.locator('#agents [data-bubble]')).toHaveCSS('opacity', '1');
    expect(await tally(page)).toEqual({ answered: 0, marked: 0 });
    // after each of the three buys and the fourth held trade
    for (const [when, trades] of [[0.45, 1], [0.58, 2], [0.72, 3], [0.88, 4]]) {
      await stopAt(page, when);
      expect(await tally(page), `at ${when}`).toEqual({ answered: trades, marked: trades });
    }
  });

  test('draws the line only as far as the session has run', async ({ page }) => {
    await page.goto('/#agents');
    const drawn = () =>
      page.locator('#agents figure svg').evaluate((svg) => {
        const hidden = getComputedStyle(svg).clipPath.match(/inset\(\S+ ([\d.]+)%/);
        return hidden ? 100 - Number(hidden[1]) : 100;
      });
    await stopAt(page, 0.1);
    const early = await drawn();
    await stopAt(page, 0.7);
    const later = await drawn();
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(15);
    expect(later).toBeGreaterThan(early + 40);
    await stopAt(page, 0.999);
    expect(await drawn()).toBeGreaterThan(99);
  });

  test("keeps the two limits in words under the chart, and fills the day's budget as the buys land", async ({ page }) => {
    await page.goto('/#agents');
    await expect(page.locator('#agents dl dt')).toHaveText(['per trade', 'per day']);
    await expect(page.locator('#agents dl dd')).toHaveText(['0.1 ETH', '0.3 ETH']);
    const spent = async () => {
      const [track, fill] = [(await page.locator('#agents [data-budget]').boundingBox())!, await page.locator('#agents [data-budget] span').boundingBox()];
      return Math.round(((fill?.width ?? 0) / track.width) * 100);
    };
    await stopAt(page, 0.3);
    expect(await spent()).toBe(0);
    await stopAt(page, 0.58);
    expect(await spent()).toBe(67);
    await stopAt(page, 0.88);
    expect(await spent()).toBe(100);
  });

  test('ends in one button, to the MCP page in a new tab', async ({ page }) => {
    await page.goto('/#agents');
    const connect = page.locator('#agents').getByRole('link', { name: 'Connect an agent' });
    await expect(connect).toHaveClass(/\bbtn\b/);
    await expect(connect).toHaveAttribute('href', 'https://mcp.hevium.xyz/');
    await expect(connect).toHaveAttribute('target', '_blank');
    await expect(connect).toHaveAttribute('rel', /noopener/);
    expect((await connect.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('#agents').getByRole('link')).toHaveCount(1);
  });

  test("is where the nav bar's Agents link leads", async ({ page }) => {
    await page.goto('/#agents');
    await expect(page.locator('nav a[href="#agents"]')).toHaveCount(1);
    await page.goto('/#agents');
    await expect(page.locator('#agents h2')).toBeInViewport();
  });

  test('keeps the prompt card and every reply inside a 360px screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#agents');
    const card = (await page.locator('#agents [data-prompt]').boundingBox())!;
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(360);
    for (const row of await replies(page).all()) {
      const box = (await row.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
  });

  test('reads without JavaScript: the head, the prompt, every reply, the chart with its marks and both links', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/#agents');
    await expect(page.locator('#agents h2')).toBeVisible();
    await expect(page.locator('#agents [data-bubble]')).toBeVisible();
    await expect(replies(page)).toHaveCount(4);
    await expect(page.locator('#agents figure svg polyline')).toHaveCount(1);
    await expect(marks(page)).toHaveCount(4);
    await expect(page.locator('#agents').getByRole('link', { name: 'Connect an agent' })).toHaveAttribute('href', 'https://mcp.hevium.xyz/');
    await context.close();
  });
});
