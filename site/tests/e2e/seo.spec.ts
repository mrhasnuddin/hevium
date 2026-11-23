import { expect, test } from './fixtures';

const HOME = 'https://hevium.xyz/home/';
const TITLE = 'Hevium: Multi-Chain Stock and Fair-Launch Terminal';

// What a search engine, a link preview and an answer engine are given, beyond the page's own words.
test.describe('search and answer engines', () => {
  test('names the page: a title, a description and its one address', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(TITLE);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toMatch(/five chains/);
    expect(description!.length).toBeGreaterThanOrEqual(110);
    expect(description!.length).toBeLessThanOrEqual(160);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', HOME);
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBe(0);
  });

  test('gives a shared link its preview: title, line, address and a 1200 by 630 picture', async ({ page, request }) => {
    await page.goto('/');
    const tag = (name: string) => page.locator(`meta[property="${name}"], meta[name="${name}"]`).first().getAttribute('content');
    expect(await tag('og:title')).toBe(TITLE);
    expect(await tag('og:description')).toBe(await tag('description'));
    expect(await tag('og:url')).toBe(HOME);
    expect(await tag('og:type')).toBe('website');
    expect(await tag('og:site_name')).toBe('Hevium');
    expect(await tag('twitter:card')).toBe('summary_large_image');
    expect(await tag('twitter:site')).toBe('@heviumxyz');
    const image = (await tag('og:image'))!;
    expect(image).toBe(`${HOME}og.png`);
    expect(await tag('twitter:image')).toBe(image);
    expect(await tag('og:image:width')).toBe('1200');
    expect(await tag('og:image:height')).toBe('630');
    expect(await tag('og:image:alt')).toBeTruthy();
    // the file itself, as this build serves it
    expect((await request.get('/og.png')).status()).toBe(200);
    const size = await page.evaluate(async () => {
      const picture = new Image();
      picture.src = '/og.png';
      await picture.decode();
      return [picture.naturalWidth, picture.naturalHeight];
    });
    expect(size).toEqual([1200, 630]);
  });

  test('has an icon for the tab and one for a home screen', async ({ page, request }) => {
    await page.goto('/');
    for (const rel of ['icon', 'apple-touch-icon']) {
      const href = await page.locator(`link[rel="${rel}"]`).first().getAttribute('href');
      expect(href, rel).toBeTruthy();
      expect((await request.get(href!)).status(), rel).toBe(200);
    }
  });

  test('says in structured data who Hevium is, and repeats the questions exactly as the page answers them', async ({ page }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.flatMap((script) => JSON.parse(script.textContent!)['@graph'] ?? JSON.parse(script.textContent!)));
    const of = (type: string) => blocks.find((block: { '@type': string }) => block['@type'] === type);
    expect(of('Organization')).toMatchObject({ name: 'Hevium', url: 'https://hevium.xyz/', sameAs: ['https://x.com/heviumxyz'] });
    expect(of('Organization').logo).toMatch(/^https:\/\/hevium\.xyz\/home\/.+\.(png|svg)$/);
    expect(of('WebSite')).toMatchObject({ name: 'Hevium', url: HOME });
    expect(of('WebPage')).toMatchObject({ url: HOME, name: TITLE });
    const faq = of('FAQPage');
    const shown = await page.locator('#faq details').evaluateAll((items) => items.map((item) => [item.querySelector('[data-question]')!.textContent, item.querySelector('[data-answer]')!.textContent]));
    expect(shown).toHaveLength(8);
    expect(faq.mainEntity.map((entry: { name: string; acceptedAnswer: { text: string } }) => [entry.name, entry.acceptedAnswer.text])).toEqual(shown);
    for (const entry of faq.mainEntity) expect([entry['@type'], entry.acceptedAnswer['@type']]).toEqual(['Question', 'Answer']);
  });

  test('lists the page in a sitemap', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain(`<loc>${HOME}</loc>`);
  });

  test('serves llms.txt: what Hevium is, its facts and its questions, in plain text', async ({ page, request }) => {
    const file = await request.get('/llms.txt');
    expect(file.status()).toBe(200);
    const text = await file.text();
    expect(text).toMatch(/^# Hevium\n/);
    expect(text).toContain('Hevium is a non-custodial trading terminal and fair-launch launchpad on five chains');
    for (const link of ['https://hevium.xyz/', 'https://docs.hevium.xyz/', 'https://mcp.hevium.xyz/']) expect(text).toContain(link);
    await page.goto('/');
    for (const question of await page.locator('#faq [data-question]').allTextContents()) expect(text, question).toContain(question);
    // the same lines the page keeps out
    expect(text).not.toMatch(/valuation|warrant|use of funds|run-rate|investor|revenue share|[–—]/i);
  });
});
