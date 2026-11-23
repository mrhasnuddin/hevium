import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// For each section that keeps to the page's container: how tall it is, where the nav bar ends, and how far
// down from the section's own top its content starts and ends.
const measure = (page: Page) =>
  page.evaluate(() => {
    const nav = document.querySelector('header nav')!.getBoundingClientRect().bottom;
    return [...document.querySelectorAll<HTMLElement>('main section')]
      // an engine that is not the open tab on a narrow screen is not laid out at all
      .filter((section) => section.querySelector(':scope > .container') && section.getClientRects().length > 0)
      .map((section) => {
        const box = section.getBoundingClientRect();
        let top = Infinity;
        let bottom = -Infinity;
        for (const el of section.querySelectorAll<HTMLElement>('.container *')) {
          if (el.matches('canvas[data-pixel-field], .sr-only')) continue; // texture, and words that are not drawn
          if (el.closest('details:not([open])') && !el.closest('summary')) continue; // an answer that is shut
          const part = el.getBoundingClientRect();
          if (part.width < 1 || part.height < 1) continue;
          top = Math.min(top, part.top - box.top);
          bottom = Math.max(bottom, part.bottom - box.top);
        }
        return { id: section.id, height: Math.round(box.height), top: Math.round(top), bottom: Math.round(bottom), nav: Math.round(nav) };
      });
  });

const ENGINES = ['stocks', 'launch', 'agents', 'earn'];

test.describe('one screen to a section', () => {
  for (const [width, height] of [[1440, 900], [1280, 720], [1920, 1080], [1024, 768]]) {
    test(`at ${width} by ${height} each section is one screen, with its head, its piece and its button all in view`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' }); // so nothing is caught in mid flight
      await page.goto('/');
      const sections = await measure(page);
      expect(sections.map((section) => section.id)).toEqual(['about', 'stocks', 'launch', 'agents', 'earn', 'chains', 'trust', 'final']);
      for (const section of sections) {
        if (['about', 'trust'].includes(section.id)) {
          // two parts in one (what it is and the problem; the guarantees and the questions): each runs past one
          // screen and holds both its parts
          expect(section.height, `${section.id} runs long`).toBeGreaterThan(height);
          expect(section.bottom, `${section.id} holds its content`).toBeLessThanOrEqual(section.height);
          continue;
        }
        if (ENGINES.includes(section.id)) {
          // an engine shares its screen with the solution's head, which stays put over it (engines.spec.ts)
          expect(section.height, `${section.id} leaves room for the head`).toBeLessThan(height);
          expect(section.top, `${section.id} starts inside itself`).toBeGreaterThanOrEqual(0);
          expect(section.bottom, `${section.id} ends inside itself`).toBeLessThanOrEqual(section.height);
          continue;
        }
        expect(section.height, `${section.id} is one screen tall`).toBe(height);
        expect(section.top, `${section.id} starts clear of the nav bar`).toBeGreaterThanOrEqual(section.nav);
        expect(section.bottom, `${section.id} ends inside the screen`).toBeLessThanOrEqual(height);
      }
    });
  }

  // The exception: a small screen lets a section run as long as it needs.
  for (const [width, height, what] of [[360, 780, 'a phone'], [768, 1024, 'a tablet'], [1440, 640, 'a short wide screen']] as const) {
    test(`on ${what} a section runs as long as it needs and still holds all of its content`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      for (const section of await measure(page)) {
        expect(section.top, `${section.id} starts inside itself`).toBeGreaterThanOrEqual(0);
        expect(section.bottom, `${section.id} ends inside itself`).toBeLessThanOrEqual(section.height);
      }
    });
  }

  test('keeps the Problem objects square and inside their cards when the screen is short', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    for (const card of await page.locator('#problem article').all()) {
      const [body, art] = [(await card.locator('.card-body').boundingBox())!, (await card.locator('[data-pixels]').boundingBox())!];
      expect(Math.abs(art.width - art.height)).toBeLessThan(1.5);
      expect(art.width).toBeGreaterThan(80); // still big enough to read as an object
      expect(art.y).toBeGreaterThanOrEqual(body.y);
      expect(art.y + art.height).toBeLessThanOrEqual((await card.locator('.card-text').boundingBox())!.y + 1);
    }
  });
});
