import { expect, test } from './fixtures';

test('static shell', async ({ page }) => {
  const fontHosts: string[] = [];
  page.on('request', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url());
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 8, 11)');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Plus.Jakarta.Sans/i);
  expect(fontHosts).toEqual([]);
});
