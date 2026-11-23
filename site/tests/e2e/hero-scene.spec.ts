import type { Page, Route } from '@playwright/test';
import { expect, liveTest, test } from './fixtures';

// Counts `hevium:scene-ready`, which the loader waits for, from before any page script runs.
const countReady = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { sceneReady: number };
    w.sceneReady = 0;
    document.addEventListener('hevium:scene-ready', () => w.sceneReady++);
  });
const ready = (page: Page) => page.evaluate(() => (window as unknown as { sceneReady: number }).sceneReady);
const art = (page: Page) => page.locator('[data-hero-art]');
const canvas = (page: Page) => art(page).locator('canvas');

// three.js names its renderer in its own messages, so the name survives minifying and marks the scene's script.
const SCENE = 'WebGLRenderer';
// Collects the body of every script the page downloads.
const scripts = (page: Page) => {
  const bodies: string[] = [];
  page.on('response', async (response) => {
    if (response.request().resourceType() === 'script') bodies.push(await response.text().catch(() => ''));
  });
  return bodies;
};
// Hands the scene's script, and only that one, to `handle`.
const onSceneScript = (page: Page, handle: (route: Route) => Promise<void>) =>
  page.route('**/*.js', async (route) => {
    const response = await route.fetch();
    if ((await response.text()).includes(SCENE)) await handle(route);
    else await route.fulfill({ response });
  });
const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
};

test.describe('hero scene slot', () => {
  test('shows the poster first and hides the canvas from assistive tech', async ({ page }) => {
    await page.goto('/');
    await expect(art(page).locator('img')).toBeVisible();
    await expect(art(page).locator('img')).toHaveAttribute('alt', '');
    await expect(canvas(page)).toHaveAttribute('aria-hidden', 'true');
  });

  test('without WebGL keeps the poster, still reports ready once, and throws nothing', async ({ page }) => {
    const errors = errorsOf(page);
    await countReady(page);
    await page.goto('/');
    await expect.poll(() => ready(page)).toBe(1);
    await page.waitForTimeout(3000); // past the 2500ms a slow mount is given
    expect(await ready(page)).toBe(1);
    await expect(art(page)).not.toHaveClass(/is-live/);
    await expect(art(page).locator('img')).toBeVisible();
    expect(errors).toEqual([]);
  });

  liveTest('where the browser can only draw slowly, keeps the poster and never downloads the scene', async ({ page, viewport }) => {
    liveTest.skip(viewport!.width < 768, 'phones get the poster whatever draws it');
    // What a browser without a GPU answers when asked to refuse a slow renderer. The test browser is
    // started with its software renderer allowed, and so says yes to everything.
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: { failIfMajorPerformanceCaveat?: boolean }) {
        return kind === 'webgl2' && options?.failIfMajorPerformanceCaveat ? null : getContext.call(this, kind as '2d', options as undefined);
      } as typeof getContext;
    });
    const bodies = scripts(page);
    await countReady(page);
    await page.goto('/');
    await expect.poll(() => ready(page)).toBe(1);
    await page.waitForTimeout(3000);
    await expect(art(page)).not.toHaveClass(/is-live/);
    expect(bodies.filter((body) => body.includes(SCENE))).toEqual([]);
    expect(await ready(page)).toBe(1);
  });

  liveTest('on a phone never downloads the scene', async ({ page, viewport }) => {
    liveTest.skip(viewport!.width >= 768, 'desktops get the scene');
    const bodies = scripts(page);
    await countReady(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect.poll(() => ready(page)).toBe(1);
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.filter((body) => body.includes(SCENE))).toEqual([]);
    await expect(art(page).locator('img')).toBeVisible();
    await expect(art(page)).not.toHaveClass(/is-live/);
  });
});

// The scene itself, in a browser that draws on a GPU (see playwright.config.ts).
liveTest.describe('live hero scene', { tag: '@gpu' }, () => {
  liveTest.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
    const renderer = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      return gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    });
    liveTest.skip(!renderer || /swiftshader|llvmpipe|software|basic render/i.test(renderer), 'needs a GPU: a software renderer keeps the page busy for seconds at a time');
  });

  liveTest('mounts, goes live and reports ready once', async ({ page }) => {
    const errors = errorsOf(page);
    const bodies = scripts(page);
    await countReady(page);
    await page.goto('/');
    await expect(art(page)).toHaveClass(/is-live/, { timeout: 30_000 });
    await page.waitForTimeout(500); // a second announcement would come by now
    expect(await ready(page)).toBe(1);
    expect(bodies.filter((body) => body.includes(SCENE))).toHaveLength(1); // the marker the other tests rely on is real
    expect(errors).toEqual([]);
  });

  // A shader that fails to compile throws nothing: three.js logs it and the thing it draws is simply missing.
  liveTest("compiles every shader, the floor's pixels included", async ({ page }) => {
    const shaderErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /shader|WebGLProgram/i.test(message.text())) shaderErrors.push(message.text().slice(0, 240));
    });
    await page.goto('/');
    await expect(art(page)).toHaveClass(/is-live/, { timeout: 30_000 });
    await page.waitForTimeout(1500); // a program is built on its first drawn frame
    expect(shaderErrors).toEqual([]);
  });

  liveTest('lets the pointer through to the scene where the poster stood', async ({ page }) => {
    await page.goto('/');
    await expect(art(page)).toHaveClass(/is-live/, { timeout: 30_000 });
    const poster = (await art(page).locator('img').boundingBox())!;
    const under = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)!.tagName, [poster.x + poster.width / 2, poster.y + poster.height / 2]);
    expect(under).toBe('CANVAS');
  });

  liveTest('lights the cube while either Launch app button is pointed at', async ({ page }) => {
    await page.goto('/');
    await expect(art(page)).toHaveClass(/is-live/, { timeout: 30_000 });
    for (const scope of ['[data-hero]', 'nav']) {
      await page.locator(scope).getByRole('link', { name: 'Launch app' }).hover();
      await expect(canvas(page)).toHaveAttribute('data-spotlight', 'on');
      await page.mouse.move(40, 420);
      await expect(canvas(page)).toHaveAttribute('data-spotlight', 'off');
    }
  });

  liveTest('with reduced motion keeps the poster and never downloads the scene', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const bodies = scripts(page);
    await countReady(page);
    await page.goto('/');
    await expect.poll(() => ready(page)).toBe(1);
    await page.waitForTimeout(3000);
    await expect(art(page)).not.toHaveClass(/is-live/);
    await expect(art(page).locator('img')).toBeVisible();
    expect(bodies.filter((body) => body.includes(SCENE))).toEqual([]);
  });

  liveTest('keeps the poster when the scene fails to download, and throws nothing', async ({ page }) => {
    const errors = errorsOf(page);
    await onSceneScript(page, (route) => route.abort());
    await countReady(page);
    await page.goto('/');
    await expect.poll(() => ready(page)).toBe(1);
    await page.waitForTimeout(3000);
    expect(await ready(page)).toBe(1);
    await expect(art(page)).not.toHaveClass(/is-live/);
    await expect(art(page).locator('img')).toBeVisible();
    expect(errors).toEqual([]);
  });

  liveTest('reports ready after 2500ms when the scene is slow, and only once when it arrives', async ({ page }) => {
    await onSceneScript(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await route.continue();
    });
    await countReady(page);
    await page.goto('/');
    await expect.poll(() => ready(page), { timeout: 3500 }).toBe(1);
    await expect(art(page)).not.toHaveClass(/is-live/); // announced by the clock, before the scene
    await expect(art(page)).toHaveClass(/is-live/, { timeout: 30_000 });
    await page.waitForTimeout(500);
    expect(await ready(page)).toBe(1);
  });
});
