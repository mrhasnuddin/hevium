import { expect, test } from './fixtures';

// Rules that hold across the whole page, checked in one place.
test.describe('polish', () => {
  test('gives every section button the full row on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const seen = new Set<string>();
    // the four product sections are tabs at this width, so each is opened in turn
    for (const path of ['/', '/#stocks', '/#launch', '/#agents', '/#earn']) {
      await page.goto('about:blank');
      await page.goto(path);
      if (path !== '/') await expect(page.locator(path.slice(1))).toBeVisible();
      const buttons = await page.locator('main .btn:not(.btn-sm)').evaluateAll((all) => {
        const gutter = parseFloat(getComputedStyle(document.querySelector('main .container')!).paddingLeft);
        return all
          .filter((el) => (el as HTMLElement).offsetWidth)
          .map((el) => ({ name: el.textContent!.trim(), left: el.getBoundingClientRect().left - gutter, right: innerWidth - gutter - el.getBoundingClientRect().right }));
      });
      for (const button of buttons) {
        seen.add(button.name);
        expect(Math.abs(button.left), `${button.name}, left`).toBeLessThan(1);
        expect(Math.abs(button.right), `${button.name}, right`).toBeLessThan(1);
      }
    }
    for (const name of ['Launch app', 'How it works', 'Open the terminal', 'Launch a token', 'Connect an agent', 'Become an affiliate', 'Start trading', 'Next: Launch']) expect([...seen], name).toContain(name);
  });

  test('leaves a button its own width from 640px', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/');
    for (const button of await page.locator('main .btn:not(.btn-sm):visible').all()) expect((await button.boundingBox())!.width).toBeLessThan(320);
  });

  test('ends each product section and the chains in one tonal button, in the middle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    for (const id of ['stocks', 'launch', 'agents', 'earn', 'chains']) {
      const foot = page.locator(`#${id} .section-foot`);
      await expect(foot, id).toHaveCount(1);
      await expect(foot.locator('a'), id).toHaveCount(1);
      await expect(foot.locator('a'), id).toHaveClass(/\bbtn-tonal\b/);
      const [button, row] = [(await foot.locator('a').boundingBox())!, (await page.locator(`#${id} > .container`).boundingBox())!];
      expect(Math.abs(button.x + button.width / 2 - (row.x + row.width / 2)), id).toBeLessThan(1);
    }
  });

  test('keeps text links and dates out of the sections: the ways out are buttons, the nav bar and the footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main a.link')).toHaveCount(0);
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/read the docs|last updated/i);
    // nothing on the page is said to be unfinished
    expect(text).not.toMatch(/in progress|not out yet|coming soon/i);
  });

  test('sets the three walls side by side from 768px and one under another below it', async ({ page }) => {
    const lefts = async () => new Set(await page.locator('#problem article').evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().left)))).size;
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('#problem article')).toHaveCount(3);
    expect(await lefts()).toBe(3);
    await page.setViewportSize({ width: 767, height: 1024 });
    expect(await lefts()).toBe(1);
  });

  test('opens every head with the same eyebrow: the pill with the star, never a bare label', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 }); // tall enough for the solution's head to show its eyebrow
    await page.goto('/');
    const pills = await page.locator('main .eyebrow').evaluateAll((all) =>
      // those that are laid out: an engine inside the solution's frame leaves its own to the lit pill
      all.filter((el) => el.getClientRects().length > 0).map((el) => {
        const [style, star] = [getComputedStyle(el), getComputedStyle(el, '::before')];
        return {
          text: el.textContent!.trim(),
          look: [style.fontFamily, style.fontSize, style.fontWeight, style.textTransform, style.letterSpacing, style.backgroundColor, style.borderTopLeftRadius, style.borderTopColor, style.paddingLeft, style.paddingTop, style.color].join(' | '),
          star: /data:image\/svg\+xml/.test(star.getPropertyValue('mask-image') || star.getPropertyValue('-webkit-mask-image')),
          // the room between the pill and the heading it opens
          gap: Math.round((el.nextElementSibling ?? el.parentElement!.nextElementSibling)!.getBoundingClientRect().top - el.getBoundingClientRect().bottom),
        };
      }),
    );
    expect(pills.map((pill) => pill.text)).toEqual(['What is Hevium', 'The problem', 'The solution', 'Six chains', 'Trust', 'FAQ']);
    expect(new Set(pills.map((pill) => pill.look)).size).toBe(1);
    for (const pill of pills) expect(pill.star, pill.text).toBe(true);
    // a headline stands the same distance under its eyebrow wherever it is (the statement is prose, not a headline)
    expect(new Set(pills.filter((pill) => pill.text !== 'What is Hevium').map((pill) => pill.gap)).size).toBe(1);
    await expect(page.locator('main [data-label]')).toHaveCount(0);
  });

  test('shows its mock data as the product at work, with nothing tagged a sample', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('body').textContent()).not.toMatch(/\bsample\b/i);
    expect(await page.locator('[aria-label*="ample" i]').count()).toBe(0);
  });

  test('draws its arrows as icons, with no arrow characters standing in for them', async ({ page }) => {
    await page.goto('/#earn');
    expect(await page.locator('body').innerText()).not.toMatch(/[←-⇿]/);
    // the two buttons that turn the Earn cards (the footer draws its own two icons)
    await expect(page.locator('#earn button svg.icon')).toHaveCount(2);
    // one weight for all of them: the drawn line's, in a 16-unit box
    for (const icon of await page.locator('svg.icon').all()) {
      await expect(icon).toHaveAttribute('viewBox', '0 0 16 16');
      await expect(icon).toHaveCSS('stroke-width', '2px');
    }
  });

  test('themes what the browser draws: dark controls and scrollbars, mint selection', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor)).not.toBe('auto');
  });

  test('rests the motion of a section that is off screen, and starts it again as the section comes up', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const trust = page.locator('#trust');
    await expect(trust).toHaveAttribute('data-away', '');
    await expect(page.locator('#top')).not.toHaveAttribute('data-away');
    // how many of its animations are running, of those it has
    const running = () =>
      trust.evaluate((section) => {
        const states = [...section.querySelectorAll('*')].map((el) => getComputedStyle(el)).filter((style) => style.animationName !== 'none').map((style) => style.animationPlayState);
        return [states.filter((state) => state.includes('running')).length, states.length];
      });
    const [none, all] = await running();
    expect(all).toBeGreaterThan(0);
    expect(none).toBe(0);
    await trust.evaluate((section) => section.scrollIntoView());
    await expect(trust).not.toHaveAttribute('data-away');
    expect((await running())[0]).toBeGreaterThan(0);
  });

  test('asks for a picture that stands in for a pixel drawing only when it is near the screen', async ({ page }) => {
    await page.goto('/');
    const pictures = page.locator('[data-pixels][data-scene] > img'); // the scenes; the footer's wordmark needs its picture at once, as its mask
    expect(await pictures.count()).toBeGreaterThan(5);
    for (const picture of await pictures.all()) await expect(picture).toHaveAttribute('loading', 'lazy');
    expect(await page.locator('link[rel="preload"][as="image"][href*="/art/"]').count()).toBe(0);
  });

  for (const width of [768, 820, 1000]) {
    test(`keeps a tablet's spacing whole at ${width}px: nothing spread to the edges or left hugging one side`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1180 });
      await page.goto('/');
      const middle = async (selector: string) => {
        const [part, row] = [(await page.locator(selector).boundingBox())!, (await page.locator(selector).locator('xpath=ancestor::*[contains(@class,"container")][1]').boundingBox())!];
        return Math.abs(part.x + part.width / 2 - (row.x + row.width / 2));
      };
      // the three figures stand side by side, each over what it counts
      const facts = await page.locator('#about dl > div').evaluateAll((rows) =>
        rows.map((row) => {
          // where the layout puts them: a row swells a little as the reading reaches it, which moves its drawn edges
          const [label, figure] = [row.querySelector('dt')!, row.querySelector('dd')!];
          const at = (el: HTMLElement) => ({ left: Math.round(el.offsetLeft + (row as HTMLElement).offsetLeft), top: Math.round(el.offsetTop + (row as HTMLElement).offsetTop) });
          return { top: at(figure).top, left: at(figure).left, labelLeft: at(label).left, under: at(label).top >= at(figure).top + figure.offsetHeight - 1 };
        }),
      );
      expect(new Set(facts.map((fact) => fact.top)).size).toBe(1);
      expect(new Set(facts.map((fact) => fact.left)).size).toBe(3);
      for (const fact of facts) expect([fact.under, fact.labelLeft]).toEqual([true, fact.left]);
      // the solution stands as far from the cards above it as any section stands from the one before
      const gaps = await page.evaluate(() => [getComputedStyle(document.querySelector('[data-top]')!).paddingTop, getComputedStyle(document.getElementById('chains')!).paddingTop]);
      expect(gaps[0]).toBe(gaps[1]);
      // what is narrower than the screen stands in the middle of it, as the heads and buttons do
      expect(await middle('#chains figure')).toBeLessThan(1);
      expect((await page.locator('#chains figure').boundingBox())!.width).toBeLessThan(width * 0.8);
      await page.goto('about:blank');
      await page.goto('/#agents');
      await expect(page.locator('#agents')).toBeVisible();
      expect(await middle('#agents [data-prompt]')).toBeLessThan(1);
      await page.goto('about:blank');
      await page.goto('/#earn');
      await expect(page.locator('#earn')).toBeVisible();
      expect(await middle('#earn [data-perks]')).toBeLessThan(1);
    });
  }

  for (const width of [320, 360, 768, 1024]) {
    test(`keeps each footer link on one line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const links = page.locator('[data-footer] [data-footer-links] a');
      expect(await links.count()).toBeGreaterThan(5);
      for (const link of await links.all()) expect((await link.boundingBox())!.height, await link.innerText()).toBeLessThan(50);
    });
  }
});
