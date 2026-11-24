import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// The sample cards, in the order they lie at first, front card first.
const CARDS = ['NVDA', 'TSLA', 'USDC', 'COIN', 'AAPL'];
const cards = (page: Page) => page.locator('#earn [data-cards] li');
const front = (page: Page) => page.locator('#earn [data-cards] li[data-front]');
const nameField = (page: Page) => page.locator('#earn').getByLabel('Put your name on it');
// Presses on the front card and lets go `dx` pixels to the right.
const drag = async (page: Page, dx: number) => {
  const box = (await front(page).boundingBox())!;
  const [x, y] = [box.x + box.width * 0.3, box.y + box.height * 0.5];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y, { steps: 4 });
  await page.mouse.move(x + dx, y, { steps: 4 });
  await page.mouse.up();
};

test.describe('earn section', () => {
  test('opens with the shared head: its eyebrow, a headline with one accent phrase, one supporting line', async ({ page }) => {
    await page.goto('/#earn');
    const section = page.locator('section#earn');
    await expect(section.locator('.eyebrow')).toHaveText('Earn');
    await expect(section.locator('h2')).toHaveCount(1);
    await expect(section.locator('h2')).toHaveText('Bring traders. Keep 20% of the fee.');
    await expect(section.locator('h2 .hl')).toHaveText('20% of the fee');
    await expect(section.locator('header .lead')).toContainText('1.0% fee');
    await expect(section.locator('header .lead')).toContainText('link');
    // it follows Agents in the page (on a phone only the open one is laid out)
    const order = await page.locator('#engines > section').evaluateAll((sections) => sections.map((section) => section.id));
    expect(order.indexOf('earn')).toBe(order.indexOf('agents') + 1);
  });

  test('says the perks in words: the share of the fee, how it is paid, and the link and cards that bring it', async ({ page }) => {
    await page.goto('/#earn');
    const perks = page.locator('#earn [data-perks]');
    await expect(perks.locator('dt')).toHaveText(['20% of the fee', 'Paid on-chain', 'Your link, your cards']);
    await expect(perks.locator('dd').nth(0)).toContainText('1.0% fee');
    await expect(perks.locator('dd').nth(1)).toContainText('same transaction');
    await expect(perks.locator('dd').nth(1)).toContainText('claim');
    await expect(perks.locator('dd').nth(2)).toContainText('callout');
    await expect(perks.locator('dd').nth(2)).toContainText('app.hevium.xyz/?ref=you'); // the visitor's own link, once they type a name
  });

  test('lays out five sample cards in the shape of a PnL card: brand, pair, stat rows, and a referral panel at the foot', async ({ page }) => {
    await page.goto('/#earn');
    await expect(cards(page)).toHaveCount(5);
    await expect(front(page)).toHaveCount(1);
    await expect(front(page)).toContainText('NVDA');
    for (const [n, ticker] of CARDS.entries()) {
      const card = cards(page).nth(n);
      await expect(card).toContainText('Hevium');
      await expect(card).toContainText(`${ticker} pair`);
      await expect(card.locator('img[data-logo]')).toHaveAttribute('src', new RegExp(`^/tokens/${ticker.toLowerCase()}\\.`));
      await expect(card.locator('dl dt')).toHaveCount(4);
      await expect(card.locator('dl dt').nth(0)).toHaveText('Referred volume');
      await expect(card.locator('dl dt').nth(1)).toHaveText('Total PnL');
      // the two sides of the trade are a letter each, with the word there for a screen reader
      await expect(card.locator('[data-side="buy"]')).toHaveText('B');
      await expect(card.locator('[data-side="sell"]')).toHaveText('S');
      await expect(card.locator('dl dt').nth(2)).toContainText('Bought');
      await expect(card.locator('dl dt').nth(3)).toContainText('Sold');
      await expect(card.locator('[data-result]')).toHaveText(/^\+\d{1,2}%$/);
      await expect(card).toContainText("@you's referral link");
      await expect(card).toContainText('app.hevium.xyz/?ref=you');
      await expect(card).not.toContainText(/sample/i); // shown as a card, with no tag calling it a sample
    }
    await expect(page.locator('#earn .section-foot > *')).toHaveCount(1); // the button alone, with no line beside it
  });

  test('marks what was bought with a B in the brand colour and what was sold with a red S, side by side on one line', async ({ page }) => {
    await page.goto('/#earn');
    const card = front(page);
    const [buy, sell] = [card.locator('[data-side="buy"]'), card.locator('[data-side="sell"]')];
    await expect(buy).toHaveCSS('background-color', 'rgb(151, 251, 227)');
    await expect(sell).toHaveCSS('background-color', 'rgb(255, 99, 126)');
    const [b, s] = [(await buy.boundingBox())!, (await sell.boundingBox())!];
    expect(Math.abs(b.y - s.y)).toBeLessThan(2); // one line
    expect(s.x).toBeGreaterThan(b.x + b.width); // B first, then S
    // each amount stands straight after its letter: bought, a rule, then sold
    await expect(card.locator('[data-trade]')).toHaveText(/^B\s*Bought\s*\$[\d,]+\s*S\s*Sold\s*\$[\d,]+$/);
    const rule = await card.locator('[data-trade] dt').nth(1).evaluate((el) => getComputedStyle(el).borderLeftWidth);
    expect(parseFloat(rule)).toBeGreaterThan(0);
  });

  test('sets each plus sign level with the middle of the figures it stands before', async ({ page }) => {
    await page.goto('/#earn');
    // In this face a plus is drawn lower than the middle of a figure. Each sign is lifted by the difference.
    const off = await front(page).evaluate(async (card) => {
      const signs = [...card.querySelectorAll<HTMLElement>('[data-sign]')];
      // the face itself must be in before its signs are measured, or the stand-in face's shapes are measured instead
      await Promise.all(signs.map((sign) => document.fonts.load(`${getComputedStyle(sign).fontWeight} 100px ${getComputedStyle(sign).fontFamily}`, '+0123456789')));
      return signs.map((sign) => {
        const style = getComputedStyle(sign);
        const ctx = document.createElement('canvas').getContext('2d')!;
        ctx.font = `${style.fontWeight} 100px ${style.fontFamily}`;
        const middle = (text: string) => {
          const ink = ctx.measureText(text);
          return (ink.actualBoundingBoxDescent - ink.actualBoundingBoxAscent) / 200; // in ems, below the baseline positive
        };
        const lift = parseFloat(style.translate.split(' ')[1] ?? '0') / parseFloat(style.fontSize);
        return { text: sign.textContent, off: Math.abs(middle('+') + lift - middle('0123456789')) };
      });
    });
    expect(off.map((sign) => sign.text)).toEqual(['+', '+', '+']); // the fee, the PnL and its percentage
    for (const sign of off) expect(sign.off).toBeLessThan(0.02);
  });

  test('makes the referral fee the thing a card shows off: a highlighted figure larger than any other on it, 0.20% of the volume beside it', async ({ page }) => {
    await page.goto('/#earn');
    for (const card of await cards(page).all()) {
      await expect(card.locator('[data-fee]')).toHaveText(/^\+\$[\d,]+$/);
      const sizes = await card.evaluate((el) => {
        const size = (part: Element | null) => parseFloat(getComputedStyle(part!).fontSize);
        return { fee: size(el.querySelector('[data-fee]')), others: [...el.querySelectorAll('dd, [data-pair]')].map(size) };
      });
      expect(sizes.fee).toBeGreaterThan(Math.max(...sizes.others) * 1.3);
      // the figures on a card agree with each other
      const dollars = async (selector: string) => Number((await card.locator(selector).textContent())!.replace(/[^\d]/g, ''));
      expect(await dollars('[data-fee]')).toBe((await dollars('[data-volume]')) / 500);
    }
  });

  test('puts the visitor\'s name on every card and in its link as they type, tidied to what a link can hold', async ({ page }) => {
    await page.goto('/#earn');
    await nameField(page).fill('Dean');
    for (const card of await cards(page).all()) {
      await expect(card).toContainText('@dean');
      await expect(card).toContainText('app.hevium.xyz/?ref=dean');
    }
    await expect(page.locator('#earn [data-perks]')).toContainText('app.hevium.xyz/?ref=dean');
    await nameField(page).fill('De an! 99');
    await expect(front(page)).toContainText('app.hevium.xyz/?ref=dean99');
    await nameField(page).fill('');
    await expect(front(page)).toContainText('app.hevium.xyz/?ref=you');
  });

  test('turns the stack with its two buttons, and says which card is in front', async ({ page }) => {
    await page.goto('/#earn');
    const section = page.locator('#earn');
    await section.getByRole('button', { name: 'Next card' }).click();
    await expect(front(page)).toContainText('TSLA');
    await expect(section.locator('[data-count]')).toHaveText('2 / 5');
    await expect(section.locator('[aria-live="polite"]')).toHaveText('Card 2 of 5: TSLA pair');
    await section.getByRole('button', { name: 'Previous card' }).click();
    await section.getByRole('button', { name: 'Previous card' }).click();
    await expect(front(page)).toContainText('AAPL'); // round to the last
    await expect(section.locator('[data-count]')).toHaveText('5 / 5');
  });

  test('sends the front card to the back when it is tapped, and brings a card behind to the front when that is tapped', async ({ page }) => {
    await page.goto('/#earn');
    await front(page).scrollIntoViewIfNeeded();
    await front(page).click({ position: { x: 20, y: 20 } });
    await expect(front(page)).toContainText('TSLA');
    // the card that now lies last shows only at the edge of the stack, once it has slid there: find a point that is its own
    const edge = () =>
      cards(page).first().evaluate((card) => {
        const box = card.getBoundingClientRect();
        const y = box.top + box.height / 2;
        for (let x = box.right - 2; x > box.left; x -= 3) if (document.elementFromPoint(x, y)?.closest('li') === card) return { x, y };
        return null;
      });
    await expect.poll(edge, 'some of the last card shows').not.toBeNull();
    await page.waitForTimeout(500); // until it has stopped moving
    const point = (await edge())!;
    await page.mouse.click(point.x - 3, point.y);
    await expect(front(page)).toContainText('NVDA');
  });

  test('lets the front card be thrown: a long drag sends it to the back, a short one lets it fall back', async ({ page }) => {
    await page.goto('/#earn');
    await front(page).scrollIntoViewIfNeeded();
    await drag(page, 30);
    await expect(front(page)).toContainText('NVDA');
    await drag(page, 220);
    await expect(front(page)).toContainText('TSLA');
    await drag(page, -220);
    await expect(front(page)).toContainText('USDC');
  });

  test('tilts the front card toward a mouse over it, and sets it level again when the mouse leaves', async ({ page, hasTouch }) => {
    test.skip(!!hasTouch, 'a finger does not hover');
    await page.goto('/#earn');
    await front(page).scrollIntoViewIfNeeded();
    const tilt = () => front(page).evaluate((card) => (card as HTMLElement).style.getPropertyValue('--ry'));
    const box = (await front(page).boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await expect.poll(tilt).toMatch(/^-\d/); // leaning to the left, where the mouse is
    await page.mouse.move(2, 2);
    await expect.poll(tilt).toBe('');
  });

  test('with reduced motion the stack still turns, and the card does not tilt', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#earn');
    await front(page).scrollIntoViewIfNeeded();
    const box = (await front(page).boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
    expect(await front(page).evaluate((card) => (card as HTMLElement).style.getPropertyValue('--ry'))).toBe('');
    await page.locator('#earn').getByRole('button', { name: 'Next card' }).click();
    await expect(front(page)).toContainText('TSLA');
  });

  test('shows where the fee goes: a bar split four parts to one, 0.80% to the protocol and 0.20% to you', async ({ page }) => {
    await page.goto('/#earn');
    const bar = page.locator('#earn [data-split]');
    await expect(bar).toContainText('0.80% protocol');
    await expect(bar).toContainText('0.20% you');
    const [whole, yours] = [(await bar.locator('[data-bar]').boundingBox())!, (await bar.locator('[data-you]').boundingBox())!];
    expect(yours.width / whole.width).toBeGreaterThan(0.19);
    expect(yours.width / whole.width).toBeLessThan(0.21);
  });

  test('keeps the cards, the field and the buttons inside a 360px screen, with 44px to press', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/#earn');
    for (const part of [...(await cards(page).all()), nameField(page), page.locator('#earn').getByRole('button', { name: 'Next card' })]) {
      const box = (await part.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
    expect((await nameField(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await page.locator('#earn').getByRole('button', { name: 'Next card' }).boundingBox())!.height).toBeGreaterThanOrEqual(40);
  });

  test('ends in a button into the app, tagged as coming from this section', async ({ page }) => {
    await page.goto('/#earn');
    const cta = page.locator('#earn').getByRole('link', { name: 'Become an affiliate' });
    await expect(cta).toHaveClass(/\bbtn\b/);
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const url = new URL((await cta.getAttribute('href'))!);
    expect(url.origin).toBe('https://app.hevium.xyz');
    expect(url.pathname).toBe('/invite');
    await expect(cta).toHaveAttribute('data-placement', 'earn');
  });

  test('is where the nav bar\'s Earn link leads', async ({ page }) => {
    await page.goto('/#earn');
    await expect(page.locator('nav a[href="#earn"]')).toHaveCount(1);
    await page.goto('/#earn');
    await expect(page.locator('#earn h2')).toBeInViewport();
  });

  for (const width of [360, 1440]) {
    test(`is as tall before the page's script runs as after, so nothing below it jumps, at ${width}px`, async ({ browser, baseURL }) => {
      const height = async (scripted: boolean) => {
        const context = await browser.newContext({ baseURL, viewport: { width, height: 640 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        // without its script the page is as it is first drawn: built, and marked by the one script written into it
        if (!scripted) await page.route('**/_next/static/**/*.js', (route) => route.abort());
        await page.goto('/#earn');
        if (scripted) await expect(page.locator('#earn input')).toBeVisible(); // the script has run
        else await expect(page.locator('#engines')).toHaveAttribute('data-live', '');
        const tall = (await page.locator('#earn').boundingBox())!.height;
        await context.close();
        return tall;
      };
      expect(Math.abs((await height(true)) - (await height(false)))).toBeLessThan(1);
    });
  }

  test('reads without JavaScript: the five cards and the fee split, with no dead field or buttons', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/#earn');
    await expect(page.locator('#earn h2')).toBeVisible();
    await expect(cards(page)).toHaveCount(5);
    await expect(front(page)).toContainText('app.hevium.xyz/?ref=you');
    await expect(page.locator('#earn [data-split]')).toContainText('0.20% you');
    // the field and the buttons need the script, so without it they are out of sight and out of reach
    for (const control of await page.locator('#earn input, #earn button').all()) await expect(control).toBeHidden();
    await expect(page.locator('#earn').getByRole('link', { name: 'Become an affiliate' })).toHaveAttribute('href', 'https://app.hevium.xyz/invite');
    await context.close();
  });
});
