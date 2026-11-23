import { expect, test } from './fixtures';

test.describe('nav bar and hero', () => {
  test('has one headline, with its accent phrase', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('The multi-chain stock & fair-launch terminal.');
    await expect(page.locator('h1 .hl')).toHaveText('stock & fair-launch');
  });

  test('puts the headline and Launch app inside the first screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('[data-hero]').getByRole('link', { name: 'Launch app' })).toBeInViewport({ ratio: 1 });
  });

  test('fills the first screen, with the nav bar floating over it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const hero = (await page.locator('[data-hero]').boundingBox())!;
    expect([hero.y, hero.height]).toEqual([0, 800]);
    const bar = (await page.locator('nav').boundingBox())!;
    expect(bar.y).toBeGreaterThan(0);
    expect(bar.y + bar.height).toBeLessThan((await page.locator('h1').boundingBox())!.y);
    // hides on scroll down and reappears on scroll up
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(page.locator('nav')).toHaveAttribute('data-hidden', 'true');
    await expect.poll(async () => {
      const box = (await page.locator('nav').boundingBox())!;
      return box.y + box.height;
    }).toBeLessThanOrEqual(0);
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(page.locator('nav')).not.toHaveAttribute('data-hidden', 'true');
    await expect.poll(async () => Math.round((await page.locator('nav').boundingBox())!.y)).toBe(Math.round(bar.y));
  });

  test('stays visible at the top and reveals when a link inside a hidden bar takes focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => window.scrollTo(0, 600));
      await expect(page.locator('nav')).toHaveAttribute('data-hidden', 'true', { timeout: 300 });
    }).toPass();
    await page.locator('nav > a[href="#top"]').focus();
    await expect(page.locator('nav')).not.toHaveAttribute('data-hidden', 'true');
    await expect.poll(async () => (await page.locator('nav').boundingBox())!.y).toBeGreaterThan(0);
    await page.locator('nav > a[href="#top"]').blur();
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(page.locator('nav')).toHaveAttribute('data-hidden', 'true');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('nav')).not.toHaveAttribute('data-hidden', 'true');
    await expect.poll(async () => (await page.locator('nav').boundingBox())!.y).toBeGreaterThan(0);
  });

  for (const [width, height] of [[844, 390], [1280, 500]]) {
    test(`keeps the nav bar clear of the headline at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const bar = (await page.locator('nav').boundingBox())!;
      expect(bar.y + bar.height).toBeLessThan((await page.locator('h1').boundingBox())!.y);
    });
  }

  test('gives the small Launch app button 44px to press', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 }); // below 1024px it is in the menu, at full size
    await page.goto('/');
    const button = page.locator('nav').getByRole('link', { name: 'Launch app' });
    const box = (await button.boundingBox())!;
    expect(box.height).toBeLessThan(44); // it looks smaller than it presses
    // 22px above and below its middle still lands on it
    for (const y of [box.y + box.height / 2 - 21.5, box.y + box.height / 2 + 21.5])
      expect(await button.evaluate((el, [x, y]) => el.contains(document.elementFromPoint(x, y)), [box.x + box.width / 2, y])).toBe(true);
  });

  test('tags each link into the app with where it sits', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const placement = async (scope: string) =>
      new URL((await page.locator(scope).getByRole('link', { name: 'Launch app' }).getAttribute('href'))!).searchParams.get('utm_content');
    expect(await placement('nav')).toBe('nav');
    expect(await placement('[data-hero]')).toBe('hero');
  });

  test('carries a referral code into every Launch app link, and drops a hostile one', async ({ page }) => {
    await page.goto('/?ref=dean_01');
    // all of them, shown or not: the nav bar's, the menu's, the hero's and the final call to action's
    const links = page.locator('a', { hasText: 'Launch app' });
    await expect(links).toHaveCount(4);
    for (const link of await links.all()) await expect(link).toHaveAttribute('href', /[?&]ref=dean_01(&|$)/);
    await page.goto('/?ref=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    await page.waitForLoadState('networkidle');
    for (const link of await links.all()) expect(await link.getAttribute('href')).not.toMatch(/ref=|script/i);
  });

  test('lists the rearranged nav items, expands Solution into its four engines as plain links, and opens Docs in a new tab', async ({ page, hasTouch }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('nav ul [data-nav-item]')).toHaveText(['Problem', 'Solution', 'Chains', 'Trust', 'FAQ', 'Docs']);
    const docs = page.locator('nav ul a[data-nav-item]', { hasText: 'Docs' });
    await expect(docs).toHaveAttribute('target', '_blank');
    await expect(docs).toHaveAttribute('rel', /noopener/);

    // Solution opens a mega-dropdown with the four engines: a name and a line each, and no picture
    const solution = page.locator('nav ul summary[data-nav-item]');
    if (hasTouch) await solution.click();
    else await solution.hover();
    const panel = page.locator('nav [data-solution-menu]');
    await expect(panel).toBeVisible();
    const engines = panel.locator('[data-engine]');
    await expect(engines).toHaveCount(4);
    await expect(engines.locator('span:first-child')).toHaveText(['Stocks', 'Launch', 'Agents', 'Earn']);
    await expect(engines.locator('svg, img, canvas')).toHaveCount(0);
    for (const engine of await engines.all()) await expect(engine.locator('span')).toHaveCount(2);

    // Choosing an engine shuts the dropdown and navigates there
    await engines.nth(2).click();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#agents$/);
  });

  test('shows the nav links from 1024px up, and gives each target 44px to press', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');
    for (const target of await page.locator('nav > a:first-child, nav ul [data-nav-item]').all()) {
      await expect(target).toBeVisible();
      expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    // Launch app stands in the bar, once
    await expect(page.locator('nav').getByRole('link', { name: 'Launch app' })).toHaveCount(1);
    await page.setViewportSize({ width: 1023, height: 800 });
    await expect(page.locator('nav ul')).toBeHidden();
    // below 1024px the bar is the logo and the menu button: Launch app has gone into the menu
    await expect(page.locator('nav').getByRole('link', { name: 'Launch app' })).toHaveCount(0);
    await expect(page.locator('nav').getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  test('rounds the bar to run with its button, not into a pill', async ({ page }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const { bar, button, gapX, gapY, height } = await page.evaluate(() => {
        const nav = document.querySelector('nav')!;
        // the last control in the bar: Launch app on a wide screen, the menu button on a narrow one
        const last = [...nav.querySelectorAll<HTMLElement>('.btn')].filter((el) => el.offsetWidth).at(-1)!;
        const [outer, inner] = [nav.getBoundingClientRect(), last.getBoundingClientRect()];
        return {
          bar: parseFloat(getComputedStyle(nav).borderTopRightRadius),
          button: parseFloat(getComputedStyle(last).borderTopRightRadius),
          gapX: outer.right - inner.right,
          gapY: inner.top - outer.top,
          height: outer.height,
        };
      });
      expect(bar, `${width}`).toBeLessThan(height / 2); // a pill would round the whole end
      expect(gapX, `${width}`).toBeCloseTo(gapY, 0); // the same room beside the button as above it
      expect(bar, `${width}`).toBeCloseTo(button + gapX, 0); // so the two corners run side by side
    }
  });

  test('folds the links into a menu below 1024px, with Solution expanding inline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    const menu = page.locator('nav').getByRole('button', { name: 'Menu' });
    const links = page.locator('nav ul');
    await expect(menu).toBeVisible();
    expect((await menu.boundingBox())!.width).toBeGreaterThanOrEqual(40);
    await expect(links).toBeHidden();

    await expect(page.locator('nav').getByRole('link', { name: 'Launch app' })).toHaveCount(0); // not in the bar

    await menu.click();
    await expect(page.locator('nav ul [data-nav-item]')).toHaveText(['Problem', 'Solution', 'Chains', 'Trust', 'FAQ', 'Docs']);
    for (const item of await page.locator('nav ul [data-nav-item]').all()) {
      await expect(item).toBeVisible();
      expect(Math.round((await item.boundingBox())!.height)).toBeGreaterThanOrEqual(44);
    }

    // Expanding Solution reveals the four engines inline, as plain links
    await page.locator('nav ul summary[data-nav-item]').click();
    await expect(page.locator('nav [data-solution-menu] [data-engine]')).toHaveCount(4);
    await expect(page.locator('nav [data-solution-menu] [data-engine] svg')).toHaveCount(0);
    await page.locator('nav ul summary[data-nav-item]').click();

    // Launch app is the menu's last row: the primary button, as wide as the links, tagged as the nav's
    const launch = page.locator('nav ul').getByRole('link', { name: 'Launch app' });
    await expect(launch).toHaveClass(/\bbtn-primary\b/);
    await expect(launch).toHaveAttribute('href', /utm_content=nav/);
    const [button, row, last] = [(await launch.boundingBox())!, (await page.locator('nav ul [data-nav-item]').first().boundingBox())!, (await page.locator('nav ul [data-nav-item]').last().boundingBox())!];
    expect(button.x).toBeCloseTo(row.x, 0);
    expect(button.width).toBeCloseTo(row.width, 0);
    expect(button.y).toBeGreaterThanOrEqual(last.y + last.height);
    // the panel hangs under the bar, as wide as the bar
    const [bar, panel] = [(await page.locator('nav').boundingBox())!, (await links.boundingBox())!];
    expect(panel.y).toBeGreaterThanOrEqual(bar.y + bar.height);
    expect(panel.x).toBeCloseTo(bar.x, 0);
    expect(panel.width).toBeCloseTo(bar.width, 0);

    await page.keyboard.press('Escape');
    await expect(links).toBeHidden();

    await menu.click();
    await page.mouse.click(195, 700); // a tap on the page outside the panel
    await expect(links).toBeHidden();

    // choosing a link shuts the menu and goes there (this part needs the page's script, so it may take a second try)
    await expect(async () => {
      if (await links.isHidden()) await menu.click();
      await page.locator('nav ul a[data-nav-item]', { hasText: 'FAQ' }).click();
      await expect(links).toBeHidden({ timeout: 1000 });
    }).toPass();
    await expect(page).toHaveURL(/#faq$/);
  });

  test('has no menu button from 1024px up, and shuts an open menu when the screen widens', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto('/');
    const menu = page.locator('nav').getByRole('button', { name: 'Menu' });
    await expect(async () => {
      if (await page.locator('nav ul').isHidden()) await menu.click();
      await page.setViewportSize({ width: 1024, height: 800 });
      await expect(menu).toBeHidden();
      // back in the bar, in a row between the logo and the button
      const tops = await page.locator('nav ul [data-nav-item]').evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(1);
      const [bar, list] = [(await page.locator('nav').boundingBox())!, (await page.locator('nav ul').boundingBox())!];
      expect(list.y).toBeGreaterThanOrEqual(bar.y);
      expect(list.y + list.height).toBeLessThanOrEqual(bar.y + bar.height);
      await page.setViewportSize({ width: 1000, height: 800 });
    }).toPass();
  });

  test('opens the menu and Solution accordion with no script', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 800 } });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('nav').getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('nav ul [data-nav-item]')).toHaveCount(6);
    await expect(page.locator('nav ul [data-nav-item]').first()).toBeVisible();
    await page.locator('nav ul summary[data-nav-item]').click();
    await expect(page.locator('nav [data-solution-menu] [data-engine]')).toHaveCount(4);
    await expect(page.locator('nav ul').getByRole('link', { name: 'Launch app' })).toBeVisible();
    await context.close();
  });

  for (const width of [320, 360, 768, 1024, 1280, 1600, 1920]) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const [scroll, client, container] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
        document.querySelector('.container')!.getBoundingClientRect().width,
      ]);
      expect(scroll).toBeLessThanOrEqual(client);
      expect(container).toBeLessThanOrEqual(1600);
    });
  }

  test('reads without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Launch app' }).first()).toHaveAttribute('href', /^https:\/\/hevium\.xyz\/\?utm_source=landing/);
    await expect(page.locator('[data-hero-art] img')).toBeVisible();
    await context.close();
  });
});
