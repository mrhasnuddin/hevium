import { expect, test } from './fixtures';

test.describe('problem section', () => {
  test('has one headline and names the three walls', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('section#problem');
    await expect(section.locator('h2')).toHaveCount(1);
    await expect(section.locator('h2')).toHaveText('First-generation launchpads hit three walls.');
    await expect(section.locator('h2 .hl')).toHaveText('three walls');
    await expect(section.locator('h3')).toHaveText(['Crypto-only', 'Sniper bots', 'Built for humans only']);
  });

  test('opens with a plain statement of what Hevium is', async ({ page }) => {
    await page.goto('/');
    const whatIs = page.locator('#what-is-hevium');
    await expect(whatIs).toContainText('non-custodial');
    const [statement, headline] = await Promise.all([
      whatIs.boundingBox(),
      page.locator('#problem h2').boundingBox(),
    ]);
    expect(statement!.y).toBeLessThan(headline!.y);
  });

  for (const width of [320, 768, 1440]) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const [scroll, client] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(client);
    });
  }

  test('reads without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#what-is-hevium')).toBeVisible();
    await expect(page.locator('#problem h2')).toBeVisible();
    await expect(page.locator('#problem h3')).toHaveCount(3);
    await context.close();
  });
});
