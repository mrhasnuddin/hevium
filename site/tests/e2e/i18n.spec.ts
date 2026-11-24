import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from './fixtures';

// The page in eight languages: English at the root and one folder for each of the others. Every page says
// what language it is in, points to the other seven, and carries its words, its search listing and its
// questions in its own language.
const HOME = 'https://hevium.xyz/';
const LANGS = [
  { code: 'en', tag: 'en', short: 'EN', og: 'en_US' },
  { code: 'ms', tag: 'ms', short: 'BM', og: 'ms_MY' },
  { code: 'id', tag: 'id', short: 'ID', og: 'id_ID' },
  { code: 'vi', tag: 'vi', short: 'VN', og: 'vi_VN' },
  { code: 'zh-cn', tag: 'zh-Hans', short: 'CN', og: 'zh_CN' },
  { code: 'zh-tw', tag: 'zh-Hant', short: 'TW', og: 'zh_TW' },
  { code: 'ja', tag: 'ja', short: 'JP', og: 'ja_JP' },
  { code: 'ko', tag: 'ko', short: 'KR', og: 'ko_KR' },
];
const at = (code: string) => (code === 'en' ? '/' : `/${code}/`);
type Words = {
  META: { title: string; description: string };
  HERO: { title: string };
  SECTIONS: Record<string, { title: string; eyebrow?: string }>;
  FAQ: { q: string; a: string }[];
  UI: Record<string, string>;
};
const words = (code: string) => JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/content/locales', `${code}.json`), 'utf8')) as Words;
const squeeze = (line: string | null) => (line ?? '').replace(/\s+/g, ' ').trim();

test.describe('languages', () => {
  for (const { code, tag, og } of LANGS.filter((lang) => lang.code !== 'en')) {
    test(`${code}: the page is in its language, from its title to its last button`, async ({ page }) => {
      const copy = words(code);
      await page.goto(at(code));
      await expect(page.locator('html')).toHaveAttribute('lang', tag);
      await expect(page).toHaveTitle(copy.META.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', copy.META.description);
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', og);
      expect(squeeze(await page.locator('h1').textContent())).toBe(copy.HERO.title);
      for (const id of ['chains', 'trust', 'final']) expect(squeeze(await page.locator(`#${id} h2`).first().textContent()), id).toBe(copy.SECTIONS[id].title);
      await expect(page.locator('#final .btn-primary')).toHaveText(copy.UI.launchApp);
      // the way into the app is the same in every language
      await expect(page.locator('#final .btn-primary')).toHaveAttribute('href', 'https://app.hevium.xyz/');
      // the questions a search engine or an assistant reads are in the page's language
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      const graph = blocks.flatMap((block) => JSON.parse(block)['@graph'] ?? [JSON.parse(block)]) as { '@type': string; inLanguage?: string; mainEntity?: { name: string }[] }[];
      expect(graph.find((node) => node['@type'] === 'FAQPage')!.mainEntity!.map((entry) => entry.name)).toEqual(copy.FAQ.map((entry) => entry.q));
      expect(graph.find((node) => node['@type'] === 'WebPage')!.inLanguage).toBe(tag);
    });

    test(`${code}: stands inside the screen on a phone, a tablet and a desktop`, async ({ page }) => {
      for (const [width, height] of [[360, 780], [820, 1180], [1440, 900]]) {
        await page.setViewportSize({ width, height });
        await page.goto(at(code));
        expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px`).toBeLessThanOrEqual(width);
        // nothing a visitor presses is cut off or spills out of the bar
        const bar = (await page.locator('header nav').boundingBox())!;
        for (const button of await page.locator('header nav').locator('a:visible, button:visible, summary:visible').all()) {
          const box = (await button.boundingBox())!;
          expect(box.x, `${width}px`).toBeGreaterThanOrEqual(bar.x);
          expect(box.x + box.width, `${width}px`).toBeLessThanOrEqual(bar.x + bar.width + 0.5);
        }
      }
    });
  }

  for (const code of ['en', 'ja']) {
    test(`${code}: names its own address and the address of every other language`, async ({ page }) => {
      await page.goto(at(code));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', HOME + at(code).slice(1));
      const others = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) => links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]));
      expect(Object.fromEntries(others)).toEqual({ ...Object.fromEntries(LANGS.map((lang) => [lang.tag, HOME + at(lang.code).slice(1)])), 'x-default': HOME });
      expect(await page.locator('meta[property="og:locale:alternate"]').count()).toBe(7);
    });
  }

  test('offers the eight languages from the bar, marks the one in use, and changes the page', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('[data-lang-switch] button');
    await expect(button).toHaveText('EN');
    await expect(button).toHaveAccessibleName(/Language/);
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(36);
    const list = page.locator('#lang-menu');
    await expect(list).toBeHidden();
    await button.click();
    await expect(list).toBeVisible();
    await expect(list.locator('a')).toHaveCount(8);
    await expect(list.locator('a[aria-current]')).toHaveCount(1);
    await expect(list.locator('a[aria-current]')).toHaveAttribute('hreflang', 'en');
    for (const { code, tag } of LANGS) await expect(list.locator(`a[hreflang="${tag}"]`)).toHaveAttribute('href', at(code));
    // the list stays inside the screen, with rows a finger can press
    const [box, screen] = [(await list.boundingBox())!, page.viewportSize()!];
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(screen.width);
    expect((await list.locator('a').first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await list.locator('a[hreflang="ja"]').click();
    await expect(page).toHaveURL(/\/ja\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.locator('[data-lang-switch] button')).toHaveText('JP');
    await expect(page.locator('#lang-menu a[aria-current]')).toHaveAttribute('hreflang', 'ja');
    await page.keyboard.press('Escape');
  });

  test('keeps the solution tabs in reach on a phone where their names are longer', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const code of ['ms', 'vi', 'ja']) {
      await page.goto(at(code));
      const tabs = page.locator('[data-tabs] a');
      await page.locator('[data-tabs]').evaluate((bar) => bar.scrollIntoView({ block: 'center' }));
      const inside = async (n: number) => {
        const box = (await tabs.nth(n).boundingBox())!;
        return box.x >= 0 && box.x + box.width <= 360;
      };
      expect(await inside(0), `${code}: the first tab`).toBe(true); // the row starts at its start, not cut at both ends
      for (const n of [3, 0, 2]) {
        await tabs.nth(n).click();
        await expect(tabs.nth(n)).toHaveAttribute('aria-current', 'true');
        await expect.poll(() => inside(n), `${code}: tab ${n + 1}`).toBe(true);
      }
    }
    // where the row fits, it stands in the middle as before
    await page.goto('/');
    const [first, last] = [(await page.locator('[data-tabs] a').first().boundingBox())!, (await page.locator('[data-tabs] a').last().boundingBox())!];
    expect(Math.abs(first.x - (360 - last.x - last.width))).toBeLessThan(2);
  });

  test('changes language in place: the page is not loaded again, the visitor stays where they were, and back works', async ({ page }) => {
    const ja = words('ja');
    await page.goto('/');
    await page.evaluate(() => Object.assign(window, { stayed: true })); // lost if the page is loaded again
    // measured once the page has settled: its fonts are in and nothing is still arriving to move it
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const stayed = () => page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed === true);
    const head = page.locator('#chains h2');
    const top = () => head.evaluate((el) => el.getBoundingClientRect().top);
    // The visitor is reading this headline: it lies across the line the page is held by, two fifths of the way
    // down the screen. They came to it from below, which also brings back the bar that goes away on the way down.
    await page.locator('#trust').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
    await head.evaluate((el) => scrollBy({ top: el.getBoundingClientRect().top - (innerHeight * 0.4 - 16), behavior: 'instant' }));
    await expect(page.locator('header nav')).not.toHaveAttribute('data-hidden', 'true');
    const english = squeeze(await head.textContent());
    // Pressed where they stand, as a finger or a mouse presses them. Playwright's own click first brings its
    // target "into view", which can move the page under a bar that is fixed to the screen.
    const press = async (target: string) => {
      const box = (await page.locator(target).boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    };
    await page.waitForTimeout(400); // the bar has slid back in
    await press('[data-lang-switch] button');
    await expect(page.locator('#lang-menu')).toBeVisible();
    await page.waitForTimeout(300); // and the list has opened
    const before = await top();
    await press('#lang-menu a[hreflang="ja"]');
    await expect(page).toHaveURL(/\/ja\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page).toHaveTitle(ja.META.title);
    await expect(page.locator('#lang-menu')).toBeHidden();
    await expect(page.locator('[data-lang-switch] button')).toHaveText('JP');
    expect(await stayed()).toBe(true);
    // every part of the page is in the new language, the parts drawn before any script ran as well
    expect(squeeze(await page.locator('h1').textContent())).toBe(ja.HERO.title);
    expect(squeeze(await head.textContent())).toBe(ja.SECTIONS.chains.title);
    await expect(page.locator('#final .btn-primary')).toHaveText(ja.UI.launchApp);
    await expect(page.locator('#trust details summary').first()).toContainText(ja.FAQ[0].q);
    // the headline they were reading has not moved, now or once everything above it has settled
    expect(Math.abs((await top()) - before)).toBeLessThan(3);
    await page.waitForTimeout(1000);
    expect(Math.abs((await top()) - before)).toBeLessThan(3);
    // back and forward change the words the same way
    await page.goBack();
    await expect(page).toHaveURL(/:4321\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(squeeze(await head.textContent())).toBe(english);
    await page.goForward();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    expect(squeeze(await head.textContent())).toBe(ja.SECTIONS.chains.title);
    expect(await stayed()).toBe(true);
  });

  test('keeps the open engine and the address of the part when the language changes', async ({ page }) => {
    await page.goto('/ms/#earn');
    await page.locator('[data-lang-switch] button').click();
    await page.locator('#lang-menu a[hreflang="ko"]').click();
    await expect(page).toHaveURL(/\/ko\/#earn$/);
    await expect(page.locator('#earn h2')).toHaveText(words('ko').SECTIONS.earn.title);
  });

  test('an address that is no language is not a page', async ({ request }) => {
    expect((await request.get('/fr/')).status()).toBe(404);
  });

  test('lists every language in the sitemap, and lets every crawler in', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const { code, tag } of LANGS) {
      expect(sitemap).toContain(`<loc>${HOME}${at(code).slice(1)}</loc>`);
      expect(sitemap).toContain(`hreflang="${tag}" href="${HOME}${at(code).slice(1)}"`);
    }
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const rules = await robots.text();
    expect(rules).toMatch(/User-agent: \*\s+Allow: \//);
    expect(rules).not.toMatch(/^Disallow: \/\s*$/m);
    expect(rules).toContain(`Sitemap: ${HOME}sitemap.xml`);
    for (const crawler of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) expect(rules).toContain(crawler);
    const llms = await (await request.get('/llms.txt')).text();
    for (const { code } of LANGS) expect(llms).toContain(`${HOME}${at(code).slice(1)}`);
    expect(llms).toContain('https://www.threads.com/@hevium.xyz');
  });

  test('breaks a Chinese, Japanese or Korean headline by its own rules, with no tracking pulled tight', async ({ page }) => {
    for (const code of ['zh-cn', 'ja', 'ko']) {
      await page.goto(at(code));
      await expect(page.locator('h1')).toHaveCSS('letter-spacing', /^(normal|0px)$/);
      await expect(page.locator('#final h2')).toHaveCSS('letter-spacing', /^(normal|0px)$/);
    }
    await expect(page.locator('html')).toHaveCSS('word-break', 'keep-all'); // Korean, the last one loaded
    await page.goto('/');
    await expect(page.locator('h1')).not.toHaveCSS('letter-spacing', /^(normal|0px)$/);
  });
});
