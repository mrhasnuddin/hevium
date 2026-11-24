import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// The page is one canvas: nothing rules one section off from the next, and nothing is boxed in.
test.describe('one continuous canvas', () => {
  test('no section draws a border across the page', async ({ page }) => {
    await page.goto('/');
    const borders = await page.locator('main section').evaluateAll((sections) =>
      sections.map((s) => `${s.id} ${getComputedStyle(s).borderTopWidth} ${getComputedStyle(s).borderBottomWidth}`),
    );
    expect(borders.filter((b) => !b.endsWith(' 0px 0px'))).toEqual([]);
  });

  test('every section fills the 1600px container from edge to edge', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 }); // wide enough for the cap to apply
    await page.goto('/');
    const sections = await page.locator('main section:has(> .container)').evaluateAll((found) =>
      found.map((section) => {
        const container = section.querySelector(':scope > .container')!;
        const style = getComputedStyle(container);
        const inner = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        // the width each part is laid out at, whatever a scroll animation is doing to it
        const short = [...container.children].filter((part) => Math.abs((part as HTMLElement).offsetWidth - inner) > 1).map((part) => part.tagName);
        return `${section.id} ${Math.round(container.getBoundingClientRect().width)} ${short.join(',') || 'full'}`;
      }),
    );
    expect(sections).toEqual(['about 1600 full', 'stocks 1600 full', 'launch 1600 full', 'agents 1600 full', 'earn 1600 full', 'chains 1600 full', 'trust 1600 full', 'final 1600 full']);
  });

  test('the statement stands on the canvas, with no sheet, lines or boxed figures', async ({ page }) => {
    await page.goto('/');
    const drawn = await page.locator('#about').evaluate((about) => {
      const found: string[] = [];
      // the statement is the section's first part; the problem's cards, further down, are boxes by design
      const statement = about.querySelector(':scope > .container > :first-child')!;
      for (const el of [about, statement, ...statement.querySelectorAll('*')]) {
        if (el.matches('.eyebrow')) continue; // the page's eyebrow is a pill wherever it stands
        const style = getComputedStyle(el);
        const borders = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
        if (borders.some((w) => parseFloat(w) > 0)) found.push(`${el.tagName} border`);
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') found.push(`${el.tagName} fill`);
        for (const pseudo of ['::before', '::after']) {
          if (getComputedStyle(el, pseudo).content !== 'none') found.push(el.tagName + pseudo);
        }
      }
      return found;
    });
    // What is left is texture: film grain over the section. The stars behind the statement are a canvas.
    expect(drawn).toEqual(['SECTION::after']);
  });

  test('every section with a headline opens the same way: an eyebrow, the headline, one supporting line', async ({ page }) => {
    await page.goto('/');
    for (const id of ['stocks', 'launch', 'agents', 'earn', 'chains', 'trust']) {
      const parts = await page.locator(`#${id} header.section-head`).evaluate((head) => [...head.children].map((el) => `${el.tagName} ${el.className}`));
      expect(parts, id).toEqual(['P eyebrow', 'H2 display-md', 'P lead']);
    }
  });
});

// The ring's tickers in their order round it: ten stocks and funds with the three digital dollars among them.
const TICKERS = ['NVDA', 'TSLA', 'USD+', 'AAPL', 'SPY', 'COIN', 'USDC', 'AMZN', 'MSFT', 'PLTR', 'USDG', 'AMD', 'DIS'];
const ring = (page: Page) => page.locator('#stocks [data-ring] li');
// The ticker at the front of the ring is the one drawn largest.
const front = (page: Page) =>
  ring(page).evaluateAll((items) => items.reduce((a, b) => (b.getBoundingClientRect().height > a.getBoundingClientRect().height ? b : a)).textContent);
// A colour as [r, g, b], whichever way the browser writes it.
const rgb = (colour: string) => {
  const parts = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  return colour.startsWith('color(') ? parts.map((v) => Math.round(v * 255)) : parts;
};
// The app's own icon for each ticker, in the ring's order.
const LOGOS = ['nvda.svg', 'tsla.svg', 'usdplus.svg', 'aapl.svg', 'spy.svg', 'coin.svg', 'usdc.svg', 'amzn.svg', 'msft.svg', 'pltr.svg', 'usdg.png', 'amd.svg', 'dis.png'];
const logos = (page: Page) => page.locator('#stocks [data-coin] img[data-logo]');
// Which of a stack is showing: the places of those drawn at full strength.
const showing = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.flatMap((el, i) => (Number(getComputedStyle(el).opacity) > 0.99 ? [i] : [])));
const colourOf = (page: Page, n: number) => ring(page).nth(n).evaluate((li) => getComputedStyle(li).color);

test.describe('stocks section', () => {
  test('has one headline, with its accent phrase', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('section#stocks');
    await expect(section.locator('h2')).toHaveCount(1);
    await expect(section.locator('h2')).toHaveText('Meme speed meets Wall Street.');
    await expect(section.locator('h2 .hl')).toHaveText('Wall Street');
  });

  test('opens with the shared head, centred, over one piece and no cards of text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#stocks .section-head')).toHaveCSS('text-align', 'center');
    await expect(page.locator('#stocks figure')).toHaveCount(1);
    await expect(page.locator('#stocks h3')).toHaveCount(0);
  });

  test('shows thirteen tickers as text in one ring, stocks and digital dollars together', async ({ page }) => {
    await page.goto('/');
    await expect(ring(page)).toHaveText(TICKERS);
    // the drawings have nothing in them to read
    expect(await page.locator('#stocks svg').evaluateAll((svgs) => svgs.map((svg) => svg.getAttribute('aria-hidden')))).toEqual(['true']);
    await expect(page.locator('#stocks [data-coin] [data-pixels] img')).toHaveAttribute('src', /\/art\/coin\.svg$/);
  });

  test('holds each ticker\'s own logo for the coin, as the app shows it', async ({ page }) => {
    await page.goto('/');
    expect(await logos(page).evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')))).toEqual(LOGOS.map((file) => `/tokens/${file}`));
    // the ring names each ticker in text, so the pictures say nothing more
    expect(await logos(page).evaluateAll((imgs) => imgs.map((img) => img.getAttribute('alt')))).toEqual(LOGOS.map(() => ''));
  });

  test('at rest the coin carries NVDA\'s logo at its centre, round, inside its rim', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await showing(page, '#stocks [data-coin] img[data-logo]')).toEqual([0]);
    const [coin, logo] = [(await page.locator('#stocks [data-coin]').boundingBox())!, (await logos(page).first().boundingBox())!];
    expect(Math.abs(logo.x + logo.width / 2 - (coin.x + coin.width / 2))).toBeLessThan(2);
    expect(Math.abs(logo.y + logo.height / 2 - (coin.y + coin.height / 2))).toBeLessThan(2);
    expect(Math.round(logo.width)).toBe(Math.round(logo.height));
    expect(logo.width).toBeGreaterThan(coin.width * 0.4);
    expect(logo.width).toBeLessThan(coin.width * 0.65);
    await expect(logos(page).first()).toHaveCSS('border-top-left-radius', '50%');
  });

  test('changes the coin\'s logo to match the ticker at the front', async ({ page }) => {
    await page.goto('/');
    await page.locator('#stocks figure').scrollIntoViewIfNeeded();
    const matches = async () => {
      const [shown] = await showing(page, '#stocks [data-coin] img[data-logo]');
      return shown === TICKERS.indexOf((await front(page))!) ? shown : -1;
    };
    await expect.poll(matches, { timeout: 8000 }).toBeGreaterThanOrEqual(0);
    const first = await matches();
    await expect.poll(matches, { timeout: 12_000 }).toBe((first + 1) % TICKERS.length);
  });

  test('gives each pair a price line of its own, and shows only the front ticker\'s', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const lines = await page.locator('#stocks [data-line] polyline').evaluateAll((els) => els.map((el) => el.getAttribute('points')));
    expect(lines).toHaveLength(13);
    expect(new Set(lines).size).toBe(13);
    expect(await showing(page, '#stocks [data-line] polyline')).toEqual([0]);
  });

  test('describes the ring in words, for a screen reader and a crawler', async ({ page }) => {
    await page.goto('/');
    const caption = page.locator('#stocks figure figcaption');
    await expect(caption).toContainText('USD+');
    await expect(caption).toContainText('pair');
  });

  test('at rest shows NVDA paired: at the front and lit, the coin on it, the price line drawn', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await front(page)).toBe('NVDA');
    expect(rgb(await colourOf(page, 0))).toEqual([151, 251, 227]);
    expect(rgb(await colourOf(page, 1))).not.toEqual([151, 251, 227]); // only the paired ticker is mint

    const ticker = (await ring(page).first().boundingBox())!;
    const coin = (await page.locator('#stocks [data-coin]').boundingBox())!;
    expect(Math.abs(coin.x + coin.width / 2 - (ticker.x + ticker.width / 2))).toBeLessThan(2);
    // it rests on the ticker's head
    expect(coin.y + coin.height).toBeGreaterThan(ticker.y - 4);
    expect(coin.y + coin.height).toBeLessThan(ticker.y + ticker.height * 0.3);

    const line = page.locator('#stocks [data-line]');
    expect(parseFloat(await line.locator('polyline').first().evaluate((el) => getComputedStyle(el).strokeDashoffset))).toBe(0);
    await expect(line).toHaveCSS('opacity', '1');
    expect((await line.boundingBox())!.y).toBeGreaterThan(ticker.y + ticker.height * 0.7); // under the ticker
  });

  test('draws the far side of the ring small and dim, behind the near side', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const look = (n: number) =>
      ring(page).nth(n).evaluate((li) => ({ height: li.getBoundingClientRect().height, opacity: Number(getComputedStyle(li).opacity), z: Number(getComputedStyle(li).zIndex) }));
    const [near, far] = [await look(0), await look(6)]; // the sixth and seventh stand at the back
    expect(near.opacity).toBe(1);
    expect(far.opacity).toBeLessThan(0.3);
    expect(near.height).toBeGreaterThan(far.height * 2);
    expect(near.z).toBeGreaterThan(far.z);
  });

  test('brings the next ticker to the front, one after another', async ({ page }) => {
    await page.goto('/');
    await page.locator('#stocks figure').scrollIntoViewIfNeeded();
    const first = TICKERS.indexOf((await front(page))!);
    await expect.poll(async () => TICKERS.indexOf((await front(page))!), { timeout: 12_000 }).toBe((first + 1) % TICKERS.length);
  });

  for (const width of [360, 768, 1440]) {
    test(`keeps the whole ring inside the screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await expect(ring(page)).toHaveCount(13);
      for (const ticker of await ring(page).all()) {
        const box = (await ticker.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
    });
  }

  test('says how many pairs there are', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#stocks').getByText('stock and dollar pairs')).toHaveText('17+ stock and dollar pairs');
  });

  test('ends in a link to the terminal, tagged as coming from this section', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#stocks').getByRole('link', { name: 'Open the terminal' });
    const href = await cta.getAttribute('href');
    const url = new URL(href!);
    expect(url.origin).toBe('https://app.hevium.xyz');
    expect(url.pathname).toBe('/terminal');
    await expect(cta).toHaveAttribute('data-placement', 'stocks');
  });

  test('makes the way into the terminal a button, not an underlined text link', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('#stocks').getByRole('link', { name: 'Open the terminal' });
    await expect(cta).toHaveClass(/\bbtn\b/);
    await expect(cta).toHaveCSS('text-decoration-line', 'none');
    await expect(cta).toHaveCSS('border-top-left-radius', '10px');
    expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });

  test('is where the nav bar\'s Stocks link leads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a[href="#stocks"]')).toHaveCount(1);
    await page.goto('/#stocks');
    await expect(page.locator('#stocks h2')).toBeInViewport();
  });

  test('reads without JavaScript: the ring, the plain coin, the logos and the button are all there', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#stocks h2')).toBeVisible();
    await expect(ring(page)).toHaveText(TICKERS);
    await expect(page.locator('#stocks [data-coin] [data-pixels] img')).toHaveCount(1);
    await expect(logos(page)).toHaveCount(13);
    await expect(page.locator('#stocks').getByRole('link', { name: 'Open the terminal' })).toHaveAttribute('href', 'https://app.hevium.xyz/terminal');
    await context.close();
  });
});
