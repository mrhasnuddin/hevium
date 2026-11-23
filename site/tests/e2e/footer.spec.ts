import { expect, test } from './fixtures';

test.describe('footer', () => {
  test('follows the three-band editorial layout: statement + two columns, monumental wordmark, bottom bar', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer[data-footer]');
    await expect(footer).toHaveCount(1);
    await expect(footer.locator('[data-statement]')).toHaveText('One terminal. Five chains.');
    await expect(footer.locator('[data-footer-links] h3')).toHaveText(['Product', 'Resources']);
    await expect(footer.locator('[data-wordmark] img')).toHaveAttribute('src', /\/brand\/hevium-wordmark-white\.svg$/);
    await expect(footer.locator('a[href="#top"] img')).toHaveAttribute('src', /\/brand\/hevium-logo-dark\.svg$/);
    await expect(footer.locator('[data-risk]')).toContainText('non-custodial');
    await expect(footer.locator('[data-risk]')).toContainText('investment advice');
    // open legal links in SITE.legal are empty, so the footer omits them
    await expect(footer.getByRole('link', { name: 'Terms' })).toHaveCount(0);
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveCount(0);
  });

  test('resolves every internal anchor to a section and opens external links safely in a new tab', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer[data-footer]');
    for (const [label, href] of [
      ['Docs', 'https://docs.hevium.xyz/'],
      ['MCP server', 'https://mcp.hevium.xyz/'],
      ['X (@heviumxyz)', 'https://x.com/heviumxyz'],
      ['Brand kit', 'https://hevium.xyz/brand/'],
    ]) {
      const link = footer.getByRole('link', { name: label });
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
    const anchors = await footer.locator('[data-footer-links] a[href^="#"]').evaluateAll((els) => els.map((el) => el.getAttribute('href')!.slice(1)));
    for (const id of anchors) await expect(page.locator(`#${id}`)).toHaveCount(1);
  });

  test('spans the monumental wordmark across the container and gives bottom controls 44px targets', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const footer = page.locator('footer[data-footer]');
    const [container, wordmark] = [
      (await footer.locator('.container').boundingBox())!,
      (await footer.locator('[data-wordmark] img').boundingBox())!,
    ];
    expect(wordmark.width).toBeGreaterThan(container.width * 0.85);
    await footer.locator('[data-wordmark]').scrollIntoViewIfNeeded();
    const pixels = footer.locator('[data-wordmark] [data-pixels]');
    await expect(pixels).toHaveAttribute('data-pixels', 'ready');
    const inkSum = await pixels.locator('canvas').evaluate((canvas) => {
      const el = canvas as HTMLCanvasElement;
      const ctx = el.getContext('2d')!;
      const data = ctx.getImageData(0, 0, el.width, el.height).data;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) sum += data[i];
      return sum;
    });
    expect(inkSum).toBeGreaterThan(0);
    for (const link of await footer.locator('a[aria-label]').all()) {
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  for (const width of [320, 360, 768, 1440, 1920]) {
    test(`causes no sideways scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.locator('footer[data-footer]').scrollIntoViewIfNeeded();
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll).toBeLessThanOrEqual(client);
    });
  }

  test('reads completely without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    const footer = page.locator('footer[data-footer]');
    await expect(footer).toBeVisible();
    await expect(footer.locator('[data-statement]')).toBeVisible();
    await expect(footer.locator('[data-risk]')).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://docs.hevium.xyz/');
    await context.close();
  });
});
