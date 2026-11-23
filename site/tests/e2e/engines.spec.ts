import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const IDS = ['stocks', 'launch', 'agents', 'earn'];
const NAMES = ['Stocks', 'Launch', 'Agents', 'Earn'];
const pills = (page: Page) => page.locator('#engines [data-tabs] a[data-pill]');
// The engine the pills mark as the current one.
const current = (page: Page) => pills(page).evaluateAll((all) => all.filter((pill) => pill.getAttribute('aria-current') === 'true').map((pill) => pill.getAttribute('href')));
// Which engines are laid out, by id.
const showing = (page: Page) =>
  page.locator('#engines > section').evaluateAll((sections) => sections.filter((section) => section.getClientRects().length > 0).map((section) => section.id));
const open = async (page: Page, width: number, height: number, path = '/') => {
  await page.setViewportSize({ width, height });
  await page.goto(path);
  await expect(page.locator('#engines')).toHaveAttribute('data-live', '');
  // and the page's own script has taken over: only then does a pill say which engine is the current one
  await expect.poll(async () => (await current(page)).length).toBe(1);
};
const phone = (page: Page, path = '/') => open(page, 360, 780, path);

// The solution and its four engines are one frame: the solution's head with a row of four pills, then Stocks,
// Launch, Agents and Earn. On a wide screen the head stays put while the four slide up under it. On a narrow
// one the pills are tabs, so a phone does not scroll through all four.
test.describe('the solution frame', () => {
  test('opens with the solution: a label, a headline, a line, and a pill for each engine in page order', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#about #solution')).toHaveCount(0); // it frames the engines now, not the first section
    const head = page.locator('#engines #solution');
    await expect(head.locator('.eyebrow')).toHaveText('The solution');
    await expect(head.locator('h2')).toHaveText('One terminal. Four engines.');
    await expect(head.locator('h2 .hl')).toHaveText('Four engines');
    await expect(head.locator('.lead')).toHaveText('Hevium puts stock pairs, fair launches, AI agents and referral fees in one terminal.');
    await expect(pills(page).locator('[data-n]')).toHaveText(['01', '02', '03', '04']);
    await expect(pills(page).locator('[data-name]')).toHaveText(NAMES);
    expect(await pills(page).evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(IDS.map((id) => `#${id}`));
    expect(await page.locator('#engines > section').evaluateAll((sections) => sections.map((section) => section.id))).toEqual(IDS);
    expect(await page.locator('#engines [data-tabs] li').evaluateAll((items) => items.map((item) => getComputedStyle(item, '::before').content))).toEqual(['none', '""', '""', '""']);
    expect(await pills(page).first().evaluate((pill) => parseFloat(getComputedStyle(pill, '::after').height))).toBeGreaterThanOrEqual(44);
  });

  test('draws no box round itself: the frame has no edge and no fill of its own', async ({ page }) => {
    await page.goto('/');
    const look = await page.locator('#engines').evaluate((frame) => {
      const style = getComputedStyle(frame);
      return `${style.borderTopWidth} ${style.backgroundColor} ${style.boxShadow}`;
    });
    expect(look).toBe('0px rgba(0, 0, 0, 0) none');
  });
});

for (const [width, height] of [[1440, 900], [1280, 720], [1920, 1080], [1024, 768]]) {
  test.describe(`the solution frame at ${width} by ${height}`, () => {
    test('holds its head in place while the four engines slide up under it, then lets go after Earn', async ({ page }) => {
      await open(page, width, height);
      const head = page.locator('#engines #solution h2');
      const row = page.locator('#engines [data-tabs]');
      const pinned = async () => [(await head.boundingBox())!.y, (await row.boundingBox())!.y].map(Math.round);
      await page.locator('#stocks').evaluate((section) => window.scrollTo(0, scrollY + section.getBoundingClientRect().top - 400));
      let at: number[] | null = null;
      for (const id of IDS) {
        // each engine in turn, brought to where its link lands it
        await page.locator(`#${id}`).evaluate((section) => section.scrollIntoView({ block: 'start' }));
        const now = await pinned();
        at ??= now;
        // to the pixel, give or take the rounding of a half pixel
        for (const n of [0, 1]) expect(Math.abs(now[n] - at[n]), `the head with ${id} under it`).toBeLessThanOrEqual(1);
        await expect(head).toBeInViewport();
        // the head stands clear of the nav bar, and the engine starts under the pills
        const [nav, pillRow, engine] = [(await page.locator('header nav').boundingBox())!, (await row.boundingBox())!, (await page.locator(`#${id}`).boundingBox())!];
        expect(now[0]).toBeGreaterThanOrEqual(nav.y + nav.height);
        expect(Math.abs(engine.y - (pillRow.y + pillRow.height))).toBeLessThan(2);
        // and the head with one engine is one screen: the engine ends at the foot of the screen
        expect(Math.abs(engine.y + engine.height - height)).toBeLessThan(2);
      }
      // past the last engine the head goes with it
      await page.locator('#chains').evaluate((section) => section.scrollIntoView({ block: 'start' }));
      const gone = (await head.boundingBox())!;
      expect(gone.y + gone.height).toBeLessThanOrEqual(1); // off the top of the screen
    });

    test('fits each engine under the head: its headline, its piece and its button all in view', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, width, height);
      for (const id of IDS) {
        await page.locator(`#${id}`).evaluate((section) => section.scrollIntoView({ block: 'start' }));
        const fit = await page.locator(`#${id}`).evaluate((section) => {
          const box = section.getBoundingClientRect();
          let top = Infinity;
          let bottom = -Infinity;
          for (const el of section.querySelectorAll<HTMLElement>('.container *')) {
            if (el.matches('canvas[data-pixel-field], .sr-only')) continue;
            const part = el.getBoundingClientRect();
            if (part.width < 1 || part.height < 1) continue;
            top = Math.min(top, part.top);
            bottom = Math.max(bottom, part.bottom);
          }
          return { top: Math.round(top - box.top), over: Math.round(bottom - box.bottom) };
        });
        expect(fit.top, `${id} starts inside its panel`).toBeGreaterThanOrEqual(0);
        expect(fit.over, `${id} ends inside its panel`).toBeLessThanOrEqual(0);
        await expect(page.locator(`#${id} h2`)).toBeInViewport();
        await expect(page.locator(`#${id} .btn`).first()).toBeInViewport();
      }
    });
  });
}

test.describe('the solution frame on a wide screen', () => {
  test('lights the pill of the engine in view as the page is scrolled', async ({ page }) => {
    await open(page, 1440, 900);
    for (const id of [...IDS, 'agents', 'stocks']) {
      await page.locator(`#${id}`).evaluate((section) => section.scrollIntoView({ block: 'start' }));
      await expect.poll(() => current(page)).toEqual([`#${id}`]);
    }
    const lit = pills(page).nth(0);
    expect(await lit.evaluate((pill) => getComputedStyle(pill).backgroundImage)).toContain('gradient');
    await expect(lit).toHaveCSS('color', 'rgb(7, 8, 11)');
    expect(await pills(page).nth(1).evaluate((pill) => getComputedStyle(pill).backgroundImage)).toBe('none');
  });

  test('a pill takes the visitor to its engine, which lands under the head', async ({ page }) => {
    await open(page, 1440, 900);
    await page.locator('#stocks').evaluate((section) => section.scrollIntoView({ block: 'start' }));
    await pills(page).nth(2).click();
    await expect(page).toHaveURL(/#agents$/);
    await expect.poll(() => current(page)).toEqual(['#agents']);
    const [row, engine] = [(await page.locator('#engines [data-tabs]').boundingBox())!, (await page.locator('#agents').boundingBox())!];
    expect(Math.abs(engine.y - (row.y + row.height))).toBeLessThan(2);
    expect(await showing(page)).toEqual(IDS); // all four stay in the page: nothing is put away
  });

  test('each engine drops its own eyebrow, which the lit pill now says, and steps its headline down a size', async ({ page }) => {
    await open(page, 1440, 900);
    for (const id of IDS) await expect(page.locator(`#${id} .eyebrow`)).toBeHidden();
    const size = (selector: string) => page.locator(selector).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(await size('#stocks h2')).toBeLessThan(await size('#solution h2'));
    await expect(page.locator('#engines [data-next]')).toBeHidden(); // the way on is the scroll
  });

  test('keeps the engines out of sight where they pass under the head', async ({ page }) => {
    await open(page, 1440, 900);
    await page.locator('#launch').evaluate((section) => window.scrollTo(0, scrollY + section.getBoundingClientRect().top - 500)); // Stocks is half way under the head
    const head = (await page.locator('#engines #solution h2').boundingBox())!;
    const onTop = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('#solution, [data-top]') !== null, [head.x + head.width / 2, head.y + head.height / 2]);
    expect(onTop).toBe(true);
    const fill = await page.locator('#engines [data-top]').evaluate((top) => getComputedStyle(top).backgroundColor);
    expect(fill).toBe('rgb(7, 8, 11)'); // the page's own colour, so no box shows
  });
});

test.describe('the solution frame on a phone', () => {
  test('shows one engine at a time, Stocks first, with the pills as its tabs', async ({ page }) => {
    await phone(page);
    await expect(page.locator('#engines [data-tabs]')).toBeVisible();
    expect(await current(page)).toEqual(['#stocks']);
    expect(await showing(page)).toEqual(['stocks']);
    await expect(page.locator('#stocks h2')).toBeVisible();
    await expect(page.locator('#stocks .eyebrow')).toBeHidden(); // the tab says which engine this is
  });

  test('a pill shows its engine and puts the others away', async ({ page }) => {
    await phone(page);
    for (const [n, id] of IDS.entries()) {
      await pills(page).nth(n).click();
      expect(await showing(page)).toEqual([id]);
      expect(await current(page)).toEqual([`#${id}`]);
      await expect(page.locator(`#${id} h2`)).toBeVisible();
    }
  });

  test('marks the open tab with the brand fill, all four on one row inside the screen', async ({ page }) => {
    await phone(page);
    await pills(page).nth(2).click();
    await expect(pills(page).nth(2)).toHaveCSS('color', 'rgb(7, 8, 11)');
    expect(await pills(page).nth(2).evaluate((pill) => getComputedStyle(pill).backgroundImage)).toContain('gradient');
    expect(await pills(page).nth(0).evaluate((pill) => getComputedStyle(pill).backgroundImage)).toBe('none');
    const boxes = await Promise.all((await pills(page).all()).map(async (pill) => (await pill.boundingBox())!));
    for (const box of boxes) {
      expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(1);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
  });

  test('keeps the tabs in reach under the nav bar while a panel is read', async ({ page }) => {
    await phone(page);
    await pills(page).nth(3).click(); // Earn, the tallest
    await page.locator('#earn').evaluate((earn) => window.scrollTo(0, scrollY + earn.getBoundingClientRect().top + earn.getBoundingClientRect().height * 0.6));
    await expect(page.locator('header nav')).toHaveAttribute('data-hidden', 'true');
    await expect.poll(async () => {
      const row = (await page.locator('#engines [data-tabs]').boundingBox())!;
      return row.y >= 0 && row.y < 32;
    }).toBe(true);
    await page.evaluate(() => window.scrollBy(0, -120));
    await expect(page.locator('header nav')).not.toHaveAttribute('data-hidden', 'true');
    await expect.poll(async () => {
      const [nav, row] = [(await page.locator('header nav').boundingBox())!, (await page.locator('#engines [data-tabs]').boundingBox())!];
      return row.y >= nav.y + nav.height && row.y < nav.y + nav.height + 24;
    }).toBe(true);
  });

  test('brings the top of the new panel into view when a tab is chosen from far down another', async ({ page }) => {
    await phone(page);
    await pills(page).nth(3).click();
    await page.locator('#earn').evaluate((earn) => window.scrollTo(0, scrollY + earn.getBoundingClientRect().top + earn.getBoundingClientRect().height * 0.6));
    await pills(page).nth(0).click();
    expect(await showing(page)).toEqual(['stocks']);
    await expect(page.locator('#stocks h2')).toBeInViewport();
    await expect(page.locator('#engines [data-tabs]')).toBeInViewport();
  });

  test('ends each panel with a way on to the next engine', async ({ page }) => {
    await phone(page);
    const next = page.locator('#engines [data-next]');
    for (const [n, name] of NAMES.slice(1).entries()) {
      await expect(next).toHaveText(`Next: ${name}`);
      await next.click();
      expect(await showing(page)).toEqual([IDS[n + 1]]);
      await expect(page.locator(`#${IDS[n + 1]} h2`)).toBeInViewport();
    }
    // after Earn, the last, the way on leaves the frame
    await expect(next).toHaveText('Next: Five chains');
    await next.click();
    await expect(page.locator('#chains h2')).toBeInViewport();
  });

  test('opens the engine a link names: on arrival, and when the address changes later', async ({ page }) => {
    await phone(page, '/#agents');
    expect(await showing(page)).toEqual(['agents']);
    expect(await current(page)).toEqual(['#agents']);
    await expect(page.locator('#agents h2')).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => (location.hash = '#earn')); // what a link in the nav bar does
    await expect.poll(() => showing(page)).toEqual(['earn']);
    await expect(page.locator('#earn h2')).toBeInViewport();
    await pills(page).nth(0).click(); // a tab pressed after that still wins
    expect(await showing(page)).toEqual(['stocks']);
  });

  test('is in its tabs before the page\'s script has loaded, so nothing below it jumps', async ({ page }) => {
    await page.route('**/_next/static/**/*.js', (route) => route.abort()); // the page's own script never arrives
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/#launch');
    await expect(page.locator('#engines')).toHaveAttribute('data-live', '');
    expect(await showing(page)).toEqual(['launch']);
    expect(await pills(page).nth(1).evaluate((pill) => getComputedStyle(pill).backgroundImage)).toContain('gradient'); // and its tab is lit
  });

  test('lets the new panel fade in, and not with reduced motion', async ({ page }) => {
    const running = () => page.locator('#engines > section').evaluateAll((sections) => sections.flatMap((section) => section.getAnimations().map((animation) => (animation as CSSAnimation).animationName ?? '')).filter((name) => /panel/.test(name)).length);
    await phone(page);
    await pills(page).nth(1).click();
    expect(await running()).toBe(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await pills(page).nth(2).click();
    expect(await running()).toBe(0);
  });

  test('a swipe across a panel moves to the next engine, but not one that starts on the share cards', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'a swipe is a finger\'s');
    const swipe = (selector: string, dx: number) =>
      page.locator(selector).first().evaluate((el, dx) => {
        const box = el.getBoundingClientRect();
        const at = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: box.top + Math.min(box.height / 2, 200) });
        const from = box.left + box.width / 2 - dx / 2;
        el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [at(from)], changedTouches: [at(from)] }));
        el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [at(from + dx)] }));
      }, dx);
    await phone(page);
    await swipe('#stocks h2', -160); // to the left: on to the next
    await expect.poll(() => showing(page)).toEqual(['launch']);
    await swipe('#launch h2', 160); // to the right: back
    await expect.poll(() => showing(page)).toEqual(['stocks']);
    await swipe('#stocks h2', 160); // nothing before the first
    expect(await showing(page)).toEqual(['stocks']);
    await pills(page).nth(3).click();
    await swipe('#earn [data-cards]', 160); // the cards are dragged sideways themselves
    expect(await showing(page)).toEqual(['earn']);
  });

  test('with scripts off the four stand one after another, and the pills are links to them', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 360, height: 780 } });
    const page = await context.newPage();
    await page.goto('/');
    expect(await showing(page)).toEqual(IDS);
    await expect(page.locator('#engines [data-tabs]')).toBeVisible();
    await expect(page.locator('#stocks .eyebrow')).toBeVisible();
    await pills(page).nth(1).click();
    await expect(page.locator('#launch h2')).toBeInViewport();
    await context.close();
  });
});
