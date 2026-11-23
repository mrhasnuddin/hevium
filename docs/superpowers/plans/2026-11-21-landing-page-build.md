# Hevium Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Hevium marketing page as a static site in `site/`, served at `hevium.xyz/home`, that explains the product in one scroll and sends visitors into the app.

**Architecture:** A Next.js App Router project with static export. Server components render every word of copy at build time. A few small client components add behaviour: nav, loader, on-chain view, roadmap ladder, reveal, smooth scroll and the hero scene slot. Looks come from the existing design system: `tokens.css` moves into the site and component rules are ported from `design-system/preview.html`.

**Tech Stack:** Next.js 16.4 (static export), React 19, TypeScript, pnpm 9, plain CSS (globals plus CSS Modules) on custom-property tokens, ascii-reveal 0.3.0, Lenis 1.3, Vitest 5, Playwright 1.65. Node 20.9 or newer.

**Spec:** `docs/landing-page-spec.md`, with `DESIGN.md` for the visual system. `design-system/preview.html` is the working reference for every component and for the roadmap and on-chain behaviour. Executors read all three.

**Scope:** This plan builds the site. The 3D hero scene is its own sub-project in `hero-scene/`, built in another session. It plugs in through the interface in Task 10; until then a poster stub satisfies it.

**Departures from the spec, for the user to confirm:**
- GSAP ScrollTrigger is left out. Nothing here needs a scrubbed timeline: the roadmap wipe runs on its own scroll handler and reveals run on ascii-reveal. Lenis stays.
- `robots.txt` and `llms.txt` only count at the domain root, which the app's deployment owns. This plan writes both files and a note saying what the root needs (Task 11).
- No skeleton loading states yet. They need a live data endpoint, which is an open item, so numbers are static.

## Global Constraints

- Content max width 1600px (`--container-max`). Design floor 360px, fluid to 320px, no sideways scroll. Breakpoints 768, 1024, 1280, 1600.
- One primary action everywhere: Launch app. No wallet connection, trading or sign-in on the page.
- No investor material: raise, valuation, token warrant, revenue share, run-rate scenarios and use of funds stay off the site, its metadata and `llms.txt`. `hevium-pitch-deck.pdf` is never copied into `site/` and never committed.
- No third-party ads, credits, badges or watermarks, in files or in chat. That includes the MotionSites upgrade block and the Hallmark stamp comment.
- Every link into the app carries UTM tags and the visitor's referral code when one is present.
- All copy in static HTML. One H1, one H2 per section. The canvas is hidden from assistive tech. A loading state never hides server-rendered text from a visitor without JavaScript.
- Entrance loader capped at 3 seconds, shown once per session.
- Components read semantic or component tokens only, never a primitive or a raw colour or font. Obsidian is the page. Only the roadmap sets `data-theme="light"`.
- Type: Plus Jakarta Sans and JetBrains Mono, self-hosted. No request to Google Fonts at runtime.
- Motion: animate `transform` and `opacity` only (one exception: the roadmap card's `grid-template-rows`), never `transition: all`. Ease-out is `--ease-out`. UI transitions under 300ms. Hover styles sit inside `@media (hover: hover) and (pointer: fine)`. Everything honours `prefers-reduced-motion`.
- On-chain view: `data-view="onchain"` on `<html>`, entered by holding for 350ms within 6px. No pill or button for it.
- Layout safety: `overflow-x: clip` on `html` and `body`, never `100vw`. Hero height in `svh`, not `vh`.
- Copy: never says "audited". No em or en dashes. Outside the hero, stock names are ticker text, never logos. "Bots grab 40%+ of day-1 supply" is left out until it has a source.
- Images are plain `<img>` with `width` and `height`. `next/image` is not used.
- Shell commands in this repo are prefixed with `rtk` (the user's standing rule), for example `rtk pnpm test`.

## Skills by task

| Task | Skills |
|---|---|
| 3 | humanize |
| 4 to 10 | emil-design-eng (motion and interaction rules) |
| 11 | alyn `seo`, alyn `seo-geo` (load through the alyn MCP) |
| 12 | motionsites-web-builder (screenshot and review loop only), hallmark (sloplint sweep only), impeccable, fixing-accessibility |

Hallmark and MotionSites both try to invent a theme and a spec. Both steps are skipped: `DESIGN.md` is the locked system.

## Review Focus

1. JavaScript is off or fails to load: all copy is readable, the loader does not cover the page, roadmap cards are open. Tests in Tasks 6 and 8.
2. Reduced motion is on: no smooth scroll, no decode animation, roadmap fully open at load, on-chain view still reachable. Tests in Tasks 6, 8 and 9.
3. WebGL is missing or the scene fails to load: the poster shows, the loader still ends, no error reaches the console. Test in Task 10.
4. The referral value in the URL is malformed or hostile (`?ref=<script>`, 500 characters): it is dropped, never written into a link. Test in Task 2.
5. Session storage throws (private mode, blocked site data): the loader still dismisses and the page works. Test in Task 8.

---

### Task 1: Scaffold the static site

**Files:**
- Create: `site/` (create-next-app), `site/next.config.ts`, `site/vitest.config.ts`, `site/playwright.config.ts`, `site/tests/e2e/fixtures.ts`, `site/tests/e2e/smoke.spec.ts`, `.gitignore`
- Move: `design-system/tokens.css` to `site/src/styles/tokens.css`
- Modify: `design-system/preview.html` (stylesheet `href` to `../site/src/styles/tokens.css`), `site/src/app/layout.tsx`, `site/src/app/page.tsx`, `site/src/app/globals.css`, `.claude/launch.json`

**Interfaces:**
- Produces: scripts `pnpm dev`, `pnpm build` (writes `site/out/`), `pnpm test` (`vitest run`, files in `tests/unit`), `pnpm e2e` (`playwright test`, files in `tests/e2e`), `pnpm lint`.
- Produces: `tests/e2e/fixtures.ts` exporting `test` and `expect`. Its `test` sets `sessionStorage['hevium:loaded'] = '1'` in an init script, so specs skip the entrance loader. Every spec except Task 8's imports from it.
- Produces: `asset(path: string): string` in `site/src/config/site.ts`, which prefixes `process.env.NEXT_PUBLIC_BASE_PATH ?? ''`.
- Produces: font CSS variables `--font-jakarta` and `--font-jetbrains` on `<html>`.

- [ ] **Step 1: Scaffold.** From the repo root: `pnpm create next-app site --yes --ts --app --src-dir --eslint --no-tailwind --use-pnpm --import-alias "@/*" --disable-git --empty`. Then in `site/`: `pnpm add -D vitest @playwright/test serve` and `pnpm exec playwright install chromium`.
- [ ] **Step 2: Write `next.config.ts`** with exactly these keys, replacing whatever the template wrote:

```ts
import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
};
export default config;
```

- [ ] **Step 3: Configure tests.** Playwright `webServer`: `pnpm build && pnpm exec serve out -l 4321`, `baseURL` `http://localhost:4321`, projects `desktop` (1440x900) and `phone` (360x780, `hasTouch`). Vitest: `environment: 'node'`, `include: ['tests/unit/**/*.test.ts']`.
- [ ] **Step 4: Write the failing smoke test** in `tests/e2e/smoke.spec.ts`:

```ts
test('static shell', async ({ page }) => {
  const fontHosts: string[] = [];
  page.on('request', (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontHosts.push(r.url()); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 8, 11)');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Plus.Jakarta.Sans/i);
  expect(fontHosts).toEqual([]);
});
```

- [ ] **Step 5: Run `pnpm e2e`.** Expected: FAIL on the background colour.
- [ ] **Step 6: Wire the design system.** Move `tokens.css`. In it, change the two font tokens to `--font-display` and `--font-sans`: `var(--font-jakarta, "Plus Jakarta Sans"), var(--font-fallback)`, and `--font-mono`: `var(--font-jetbrains, "JetBrains Mono"), ui-monospace, "SF Mono", Menlo, Consolas, monospace`, so the preview page and the site both resolve. In `layout.tsx` load both families with `next/font/google` (Jakarta weights 400, 500, 600, 700, 800; JetBrains 400, 500; `display: 'swap'`; the variable names above) and import `tokens.css` then `globals.css`. Port into `globals.css` the reset, base element rules and the "layout", "type roles", "buttons" and "third button" blocks of `preview.html`, plus `overflow-x: clip` on `html, body`.
- [ ] **Step 7: Run `pnpm e2e`.** Expected: PASS. Open `http://localhost:4173/design-system/preview.html` and confirm it still renders with the moved tokens.
- [ ] **Step 8: Add a `site` entry to `.claude/launch.json`** (`pnpm --dir site dev`, port 3000).
- [ ] **Step 9: Start version control.** Write `.gitignore` with `hevium-pitch-deck.pdf`, `hero.mp4`, `font ref.jpg`, `node_modules/`, `site/.next/`, `site/out/`, `site/test-results/`, `site/playwright-report/`. Run `git init`, then confirm `git status --short` does not list the deck before the first commit: `git add -A && git commit -m "chore: scaffold static site on the Hevium design system"`.

### Task 2: Site config and app links

**Files:**
- Create: `site/src/lib/appUrl.ts`, `site/src/components/AppLink.tsx`
- Modify: `site/src/config/site.ts` (add `SITE` beside `asset`)
- Test: `site/tests/unit/appUrl.test.ts`

**Interfaces:**
- Produces:

```ts
export const SITE = {
  name: 'Hevium', origin: 'https://hevium.xyz', path: '/home/',
  app: 'https://hevium.xyz/', docs: 'https://docs.hevium.xyz/', mcp: 'https://mcp.hevium.xyz/',
  brand: 'https://hevium.xyz/brand/', x: 'https://x.com/heviumxyz',
  refParam: 'ref',                                   // open item: confirm the name
  appPaths: { app: '', launch: '', terminal: '', callouts: '', affiliate: '' }, // open item: deep links
  legal: { terms: '', privacy: '' },                 // open item: empty means the footer omits the link
} as const;
export type AppTarget = keyof typeof SITE.appPaths;
export function readRef(search: string): string | null;
export function appUrl(target: AppTarget, opts?: { ref?: string | null; placement?: string }): string;
// <AppLink target="app" placement="hero" className="btn btn-primary">Launch app</AppLink>
```

- [ ] **Step 1: Write the failing tests:**

```ts
const q = (u: string) => new URL(u).searchParams;
test('utm tags', () => {
  const u = appUrl('app', { placement: 'hero' });
  expect(u.startsWith('https://hevium.xyz/?')).toBe(true);
  expect([q(u).get('utm_source'), q(u).get('utm_medium'), q(u).get('utm_campaign'), q(u).get('utm_content')])
    .toEqual(['landing', 'cta', 'home', 'hero']);
  expect(q(u).has('ref')).toBe(false);
});
test('referral code is carried', () => expect(q(appUrl('app', { ref: 'dean_01' })).get('ref')).toBe('dean_01'));
test('readRef accepts only [A-Za-z0-9_-]{1,64}', () => {
  expect(readRef('?ref=dean_01')).toBe('dean_01');
  expect(readRef('?ref=a&ref=b')).toBe('a');
  expect(readRef('?ref=%3Cscript%3E')).toBeNull();
  expect(readRef('?ref=' + 'a'.repeat(65))).toBeNull();
  expect(readRef('')).toBeNull();
});
test('a rejected ref never reaches a link', () => expect(appUrl('app', { ref: '<script>' })).not.toContain('script'));
```

- [ ] **Step 2: Run `pnpm test`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement `readRef` and `appUrl`** with the `URL` API. `appUrl` validates `ref` with the same pattern.
- [ ] **Step 4: Implement `AppLink`** as a client component. It renders `<a href={appUrl(target, { placement })}>` on the server and, in an effect, rewrites `href` with `readRef(location.search)`.
- [ ] **Step 5: Run `pnpm test`.** Expected: PASS. Commit: `feat: app link builder with referral and UTM tags`.

### Task 3: Content

**Files:**
- Create: `site/src/content/meta.ts`, `site/src/content/sections.ts`, `site/src/content/roadmap.ts`, `site/src/content/faq.ts`
- Test: `site/tests/unit/content.test.ts`

**Interfaces:**
- Produces:

```ts
export const META: { title: string; description: string; whatIs: string };
export const NAV: { label: string; href: string; external?: true }[]; // Stocks, Launch, Agents, Earn, Roadmap, FAQ, Docs
export type SectionId = 'problem' | 'stocks' | 'launch' | 'agents' | 'earn' | 'chains' | 'how' | 'roadmap' | 'guarantees' | 'faq' | 'final';
export const HERO: { eyebrow: string; title: string; highlight: string; lead: string; stats: { value: string; label: string; onchain?: string }[] };
export const SECTIONS: Record<SectionId, { eyebrow?: string; title: string; highlight: string; lead?: string }>;
export const CHAINS: { name: string; id?: number; audience: string; trades: string }[];
export type Phase = { id: 0 | 1 | 2 | 3 | 4; name: string; when: string; current?: true; milestones: string[]; chain: string };
export const PHASES: Phase[];
export const GUARANTEES: { title: string; body: string }[];
export const FAQS: { q: string; a: string }[]; export const FAQ_UPDATED: '2026-11-21';
export const RISK_LINE: string; // shown in the footer and at the end of the "hold my funds" answer
```

Pinned copy (`[ ]` marks the highlighted phrase):
- `META.title`: `Hevium: Multi-Chain Stock and Fair-Launch Terminal`
- `META.description`: `Trade fair-launch tokens paired with stocks and digital dollars on five chains. 1.0% fee, non-custodial, one login. Built for traders and AI agents.`
- `META.whatIs`: `Hevium is a non-custodial trading terminal and fair-launch launchpad on five chains: Base, Robinhood Chain, BNB Chain, Solana and Elysium. Tokens launch on a bonding curve and can be paired with stocks and digital dollars. Each trade costs 1.0%, and 20% of that fee goes to the referrer.`
- `HERO`: eyebrow `Live on 5 chains`; title `The multi-chain [stock & fair-launch] terminal.`; lead and four stats exactly as in the `hero` block of `preview.html`. The fee stat's `onchain` is `fee split: 0.80% protocol, 0.20% referrer`.
- `problem`: `First-generation launchpads hit [three walls].` Items: Crypto-only, Sniper bots, Built for humans only.
- `stocks`: `Meme speed meets [Wall Street].`
- `launch`: `A fair launch from the [15-second Token Studio].` Fairness split 80% public, 20% locked liquidity, 0% insider.
- `agents`: `Built for [24/7 AI orderflow].`
- `earn`: `[20% commission] on every trade you bring.` The lead states that the commission is 20% of the 1.0% fee.
- `chains`: `Five chains, [one login].` `id`: Base 8453, BNB Chain 56, Robinhood Chain 4663.
- `how`: `Three steps to [your first trade].` Steps: Sign in with Google, Pick a chain, Trade or launch.
- `roadmap`: `Where Hevium [goes next]`. `PHASES` from the spec's "Roadmap content" table; `chain` lines from `preview.html`.
- `guarantees`: `What stays true [on every chain].` Items: Non-custodial, Fixed supply, Locked liquidity, Buyback vault, Audit in progress.
- `faq`: `Common [questions]`. Questions, in order: What is Hevium? What does a trade cost? Which chains are live? Does Hevium hold my funds? How do I sign in? How does a fair launch work? Can AI agents trade on Hevium? Is there a security audit?
- `final`: the hero title again.
- `RISK_LINE`: `Trading tokens carries risk, and prices can fall to zero. Hevium is non-custodial and does not give investment advice.`

- [ ] **Step 1: Write the failing tests:** every string in the four modules (walk the exports) fails none of `/valuation|warrant|use of funds|run-rate|investor|revenue share|\baudited\b|[–—]/i`; `PHASES.length === 5` with exactly one `current`; `FAQS.length === 8`; `META.title.length <= 60`; `META.description.length <= 160`; `CHAINS.length === 5`.
- [ ] **Step 2: Run `pnpm test`.** Expected: FAIL, modules not found.
- [ ] **Step 3: Write the content.** Leads and bodies come from the spec's page-structure table and the deck pages it names (public claims only), then go through the humanize skill. The audit answer says a tier-1 audit is in progress and the badge appears when it completes.
- [ ] **Step 4: Run `pnpm test`.** Expected: PASS. Commit: `feat: page content`.

### Task 4: Shell: nav, hero, final call, footer

**Files:**
- Create: `site/src/components/SectionHead.tsx`, `site/src/components/Nav.tsx` + `Nav.module.css`, `site/src/components/MobileCtaBar.tsx` + `.module.css`, `site/src/components/Footer.tsx` + `.module.css`, `site/src/components/sections/Hero.tsx` + `.module.css`, `site/src/components/sections/FinalCta.tsx` + `.module.css`
- Create: `site/public/brand/` (copies of `hevium-logo-dark.svg`, `hevium-logo-light.svg`, `hevium-mark-mint.svg` from `hevium-brand-kit/`)
- Modify: `site/src/app/page.tsx`
- Test: `site/tests/e2e/shell.spec.ts`

**Interfaces:**
- Consumes: `AppLink`, `SITE`, `asset` (Tasks 1, 2); `HERO`, `NAV`, `SECTIONS` (Task 3).
- Produces: `<SectionHead id eyebrow title highlight lead />`, which renders the section's only `<h2 id={id + '-title'}>` with the highlight in `<span class="hl">`. `Nav` is a client component that sets its own `data-theme` to that of any `[data-theme]` section under its mid-line and shows the matching logo (logic in the roadmap script of `preview.html`). `Hero` leaves an empty `<div data-hero-art>` for Task 10. `MobileCtaBar` carries `data-cta-bar`.

- [ ] **Step 1: Write the failing tests:** exactly one `h1`, text `The multi-chain stock & fair-launch terminal.`; at 1280x800 the `h1`, the hero lead and the hero "Launch app" link are inside the viewport; nav "Launch app" `href` has `utm_content=nav`, hero `utm_content=hero`, final `utm_content=final`; Docs opens in a new tab with `rel="noopener"`; at widths 320, 360, 768, 1024, 1280, 1600 and 1920 `scrollWidth <= clientWidth`, and at 1920 `.container` is no wider than 1600px; `[data-cta-bar]` is visible at 360 and hidden at 1440; the footer shows a risk line and omits legal links whose URL is empty.
- [ ] **Step 2: Run `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 3: Build the components** by porting the "nav", "hero specimen" and stat rules from `preview.html` into their modules. Hero min-height in `svh`. The bottom bar is fixed, uses `--z-cta-bar` and pads for the safe area.
- [ ] **Step 4: Run `pnpm e2e`.** Expected: PASS. Commit: `feat: page shell with nav, hero and footer`.

### Task 5: Middle sections

> **Superseded on 2026-11-22.** The user replaced card-based sections with set pieces. Build from `docs/superpowers/specs/2026-11-22-section-set-pieces-design.md` and its own plans (`2026-11-22-set-piece-*.md`), not from the steps below.

**Files:**
- Create, each with a `.module.css`: `site/src/components/sections/Problem.tsx`, `Stocks.tsx`, `Launch.tsx`, `Agents.tsx`, `Earn.tsx`, `Chains.tsx`, `HowItWorks.tsx`, `Guarantees.tsx`, `Faq.tsx`
- Modify: `site/src/app/page.tsx` (order: Hero, Problem, Stocks, Launch, Agents, Earn, Chains, HowItWorks, Roadmap slot, Guarantees, Faq, FinalCta)
- Test: `site/tests/e2e/sections.spec.ts`

**Interfaces:**
- Consumes: `SectionHead`, `AppLink`, content modules.
- Produces: `<section id>` for each `SectionId`. `Problem` opens with `<p id="what-is-hevium">` holding `META.whatIs`. `Faq` uses native `<details>` and shows `FAQ_UPDATED` as "Last updated". `Launch` renders the fairness bar with `data-in-view` set by Task 9. Each interest ends in its own link: `Stocks` in `AppLink target="terminal" placement="stocks"`, `Launch` in "Launch a token" (`target="launch" placement="launch"`), `Earn` in the tonal "Become an affiliate" (`target="affiliate" placement="earn"`), and `Agents` in plain links to `SITE.mcp` and `SITE.docs` that open in a new tab. Elements that show an on-chain fact carry `data-onchain-label`.

- [ ] **Step 1: Write the failing tests:** every `SectionId` except `roadmap` exists with exactly one `h2`; each `NAV` anchor resolves to an element; the four section links above have the stated targets, with `utm_content` equal to their placement and `target="_blank" rel="noopener"` on the two Agents links; `#what-is-hevium` contains "non-custodial"; the fairness bar shows 80%, 20% and 0%; with JavaScript disabled a `<details>` opens on click and all nine `h2` are visible; no sideways scroll at 320, 768 and 1440; no `img` on the page has a stock company's name in its `src` or `alt` outside `[data-hero-art]`.
- [ ] **Step 2: Run `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 3: Build the sections** as server components, porting "cards and callout", "ticker wall", "table", "fairness bar" and "faq" from `preview.html`. Stock names are text.
- [ ] **Step 4: Run `pnpm e2e`.** Expected: PASS. Commit: `feat: content sections`.

### Task 6: Roadmap ladder

**Files:**
- Create: `site/src/lib/ladder.ts`, `site/src/components/sections/Roadmap.tsx`, `RoadmapMotion.tsx`, `Roadmap.module.css`
- Modify: `site/src/app/page.tsx`
- Test: `site/tests/unit/ladder.test.ts`, `site/tests/e2e/roadmap.spec.ts`

**Interfaces:**
- Consumes: `PHASES`, `SectionHead`, `Nav`'s theme behaviour.
- Produces:

```ts
export type Waypoint = [x: number, y: number, deg: number, length: number, count: number];
export type Rung = { x1: number; y1: number; x2: number; y2: number; at: number };
export const LADDER = { width: 893, height: 1067, mid: 440 } as const;
export const ROUTE: Waypoint[];                       // the 15 waypoints in preview.html
export function turn(x: number, y: number, deg: number): number;
export function buildRungs(route?: Waypoint[]): Rung[];
export function toneAt(at: number, cardTurns: number[]): { from: number; to: number; mix: number };
```

`Roadmap` is a server component: `<section id="roadmap" data-theme="light">`, the SVG with every rung as a `<line class="rung">` (so the ladder exists without JavaScript), and an `<ol>` of five cards. `RoadmapMotion` is a client component that measures the cards, sets each rung's `--a`, `--b` and `--mix`, and toggles `is-on` on rungs and cards as the wipe front (55% of the viewport height) passes them.

- [ ] **Step 1: Write the failing unit tests:** `buildRungs().length === 49`; the first rung's `at` is below -100 and the last above 1000; `at` of the first eight rungs rises; `toneAt(-500, [-72, 134, 371, 638, 872])` equals `{ from: 1, to: 2, mix: 0 }`; `toneAt(5000, ...)` equals `{ from: 4, to: 5, mix: 1 }`; `toneAt(252.5, ...)` has `from: 2`, `to: 3`, `mix` 0.5.
- [ ] **Step 2: Write the failing e2e tests:** at 1440 with the map's top at 40% of the viewport, at least 8 rungs and the first card have `is-on`; scrolled to the end, 49 rungs and 5 cards have `is-on`; the five cards' computed `--tone` values are five different colours; the nav has `data-theme="light"` over the section and none above it; with `reducedMotion: 'reduce'` all five cards are open at load; with JavaScript disabled 49 `line` elements exist and every milestone is visible; at 360 no card's box leaves the viewport and nothing scrolls sideways.
- [ ] **Step 3: Run `pnpm test` and `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 4: Implement** by moving the roadmap script and the "roadmap" CSS block of `preview.html` into these files unchanged in behaviour. The `noscript` rule that opens the cards goes in `layout.tsx`.
- [ ] **Step 5: Run both suites.** Expected: PASS. Commit: `feat: roadmap ladder`.

### Task 7: On-chain view

**Files:**
- Create: `site/src/components/OnchainView.tsx` + `.module.css`
- Modify: `site/src/app/layout.tsx`, `site/src/app/globals.css` and each section module (their `:global([data-view="onchain"])` rules, ported from the "on-chain view" block of `preview.html`), `Hero.tsx` (the hint)
- Test: `site/tests/e2e/onchain.spec.ts`

**Interfaces:**
- Consumes: `data-onchain-label` elements (Task 5), the roadmap's `.phase-chain` lines (Task 6).
- Produces: `document.documentElement.dataset.view === 'onchain'` while held. On every change, `document.dispatchEvent(new CustomEvent('hevium:view', { detail: 'onchain' | 'default' }))`. A toggle button that is visible only on focus, with `aria-pressed`.

- [ ] **Step 1: Write the failing tests** with `page.mouse` on an empty area: 200ms after `down` the attribute is absent; 500ms after `down` it is `onchain`; after `up` it is absent; `down`, move 20px, wait 500ms leaves it absent; `down` on a button leaves it absent; a dispatched `pointercancel` clears it; Tab to the toggle then Enter sets it and Escape clears it; while it is set, `#roadmap` has `background-color` `rgb(7, 8, 11)`, `[data-onchain-label]` elements are visible and the hero hint reads "Hold to see on-chain"; a `hevium:view` listener receives `onchain` then `default`.
- [ ] **Step 2: Run `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 3: Implement** by moving the hold handler from `preview.html` into `OnchainView` and adding the event. Labels show only facts the repo already holds: the fee split, the three chain IDs and each phase's live or pending line. No sample hashes or addresses.
- [ ] **Step 4: Run `pnpm e2e`.** Expected: PASS. Commit: `feat: on-chain view on hold`.

### Task 8: Entrance loader and reveal

**Files:**
- Create: `site/src/components/Loader.tsx` + `.module.css`, `site/src/components/RevealRoot.tsx`
- Modify: `site/src/app/layout.tsx` (inline head script, `noscript` style), `SectionHead.tsx`, `Hero.tsx` (add `data-reveal` to the `h1`, each `h2` and each stat value)
- Test: `site/tests/e2e/loader.spec.ts` (imports from `@playwright/test`, not the fixture)

**Interfaces:**
- Consumes: `ascii-reveal/core`: `createAsciiReveal(root, { selector, lazy, preset, duration })`, its controller's `hide({ instant: true })` and `reveal()`, and `imageMascot(src)`, which returns `(ctx, w, h, t, color) => void`.
- Produces: `<div data-loader>` covering the page until done. The loader finishes when `document.fonts.ready` has resolved and either `hevium:scene-ready` has fired or 3000ms have passed, with a 600ms minimum. It then sets `html[data-loaded]`, stores `sessionStorage['hevium:loaded'] = '1'` inside `try`/`catch`, and dispatches `hevium:loaded`. An inline head script sets `data-loaded` before first paint when the key is present. `RevealRoot` starts on `hevium:loaded` or when `data-loaded` is already set. When `hevium:view` reports `onchain`, it runs a `fast` reveal over the `[data-onchain-label]` elements.

- [ ] **Step 1: Add the dependency:** `pnpm add ascii-reveal@0.3.0`.
- [ ] **Step 2: Write the failing tests:** on a first visit `[data-loader]` is visible, shows a percentage, and is hidden within 3500ms; a reload in the same context never shows it; the raw HTML from `request.get('/')` contains the `h1` text; with `sessionStorage` patched to throw, the loader is hidden within 3500ms and no `pageerror` fires; with JavaScript disabled the loader is not visible and the `h1` is; after the loader, scrolling to each section leaves its `h2` visible with its final text within 2000ms; with `reducedMotion: 'reduce'` the `h1` text equals the final text on the first frame after the loader; after a hold enters the on-chain view, each visible `[data-onchain-label]` shows its final text within 1000ms.
- [ ] **Step 3: Run `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 4: Implement the loader.** Its canvas draws `imageMascot(asset('/brand/hevium-mark-mint.svg'))` each frame in the accent colour. The percentage eases toward 90 over the cap and jumps to 100 when ready. `noscript` hides `[data-loader]`.
- [ ] **Step 5: Implement `RevealRoot`:** `createAsciiReveal(main, { selector: '[data-reveal]', lazy: true })`, then `hide({ instant: true })` and `reveal()`; the hero run uses `duration: 'cinematic'`. Under reduced motion it never hides anything: the loader fades out over `--dur-reveal` and the text is simply there.
- [ ] **Step 6: Run `pnpm e2e`.** Expected: PASS. Commit: `feat: entrance loader and decode reveal`.

### Task 9: Smooth scroll and section motion

**Files:**
- Create: `site/src/components/SmoothScroll.tsx`, `site/src/lib/useInView.ts`
- Modify: `Launch.tsx` (bar fill), `Stocks.tsx` (ticker drift), their modules
- Test: `site/tests/e2e/motion.spec.ts`

**Interfaces:**
- Produces: `useInView(ref, { once?: boolean }): boolean`, built on `IntersectionObserver`, which also writes `data-in-view` on the element. `SmoothScroll` starts Lenis on pointer-fine devices only, routes in-page anchor clicks through `lenis.scrollTo`, and sets `html[data-smooth]`.

- [ ] **Step 1: Add the dependency:** `pnpm add lenis`.
- [ ] **Step 2: Write the failing tests:** on desktop `html[data-smooth]` is present; with `reducedMotion: 'reduce'` or in the `phone` project it is absent; clicking the nav's Roadmap link brings `#roadmap` to the top of the viewport within 2000ms in both cases; the fairness bar's fill has `transform` scale below 0.1 before it enters and `matrix(1, 0, 0, 1, 0, 0)` after; under reduced motion the bar is full at load and the ticker's `animation-name` is `none`.
- [ ] **Step 3: Run `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 4: Implement.** The bar and the ticker are CSS driven by `data-in-view`.
- [ ] **Step 5: Run `pnpm e2e`.** Expected: PASS. Commit: `feat: smooth scroll and section motion`.

### Task 10: Hero scene slot

**Files:**
- Create: `site/src/hero/types.ts`, `site/src/hero/index.ts` (the stub), `site/src/components/HeroScene.tsx` + `.module.css`
- Modify: `Hero.tsx`
- Test: `site/tests/e2e/hero-scene.spec.ts`

**Interfaces:**
- Consumes: `hevium:view` (Task 7), `hevium:loaded` (Task 8).
- Produces, for the hero session to implement in place of the stub:

```ts
export type HeroView = 'default' | 'onchain';
export type HeroSceneHandle = { setView(view: HeroView): void; dispose(): void };
export type MountHeroScene = (
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean; onProgress(fraction: number): void },
) => Promise<HeroSceneHandle>;
// site/src/hero/index.ts
export const mountHeroScene: MountHeroScene;
```

`HeroScene` renders a poster (`hevium-mark-mint.svg`, empty `alt`) and `<canvas aria-hidden="true">` inside `[data-hero-art]`. It imports `@/hero` dynamically only when the viewport is 768px or wider, reduced motion is off and a WebGL2 context can be created. On success it adds `is-live`, which fades the canvas in over the poster. In every case, including a rejected import or a mount that takes longer than 2500ms, it dispatches `hevium:scene-ready` exactly once. It forwards `hevium:view` to `setView` and calls `dispose` on unmount.

- [ ] **Step 1: Write the failing tests:** the canvas has `aria-hidden="true"` and the poster is visible at load; on desktop `hevium:scene-ready` fires once and `[data-hero-art]` gains `is-live`; with `HTMLCanvasElement.prototype.getContext` patched to return `null`, `is-live` never appears, `hevium:scene-ready` still fires, the loader ends and no `pageerror` fires; in the `phone` project no request URL contains the hero chunk and the poster is visible; holding for the on-chain view calls the stub's `setView('onchain')`, which the stub records on `canvas.dataset.view`.
- [ ] **Step 2: Run `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 3: Implement** the types, the stub (resolves at once, `onProgress(1)`, `setView` writes `canvas.dataset.view`) and `HeroScene`.
- [ ] **Step 4: Run `pnpm e2e`.** Expected: PASS. Commit: `feat: hero scene slot with poster fallback`.

**From the hero session, 2026-11-22.** Done, with the real scene in place of the stub, at the user's request. What differs from the task above, with the reasons, is in the ledger (`.superpowers/sdd/2026-11-21-landing-page-build/progress.md`, "Hero session"). In short:
- `site/src/hero/index.ts` exports the real `mountHeroScene`. The scene's modules are in `site/src/hero/scene/` as plain JavaScript; `hero-scene/` keeps a lab page (`hero.html`) and tools that run the site's copy on its own. `node hero-scene/tools/hero_test.mjs` checks the scene end to end; `site/tests/e2e/hero-scene.spec.ts` checks the slot.
- The handle also carries `setSpotlight(on)`. `HeroScene` calls it while either Launch app button, marked `data-launch`, is pointed at or focused.
- The art box starts at the top of the hero and is 24svh taller than it, masked over that stretch, so the floor fades into the next section. `Hero.module.css` lifts the sections after the hero above that tail and removes the first one's top rule.
- The hero's copy sits above the canvas with `pointer-events: none` on everything but its links. The scene stops a `pointerdown` that lands on a logo from reaching the document, so the hold in Task 7 only starts on empty space.
- Tasks 2 and 7 were needed and are built too, Task 7 only as far as the sections that exist. Nav and Hero from Task 4 are built; MobileCtaBar, Footer and FinalCta are not.
- `tests/e2e/fixtures.ts` blocks WebGL2 for every spec except the live-scene ones (`liveTest`): the test browser renders in software, where the scene would starve the other specs.
- The scene loads only on a GPU: `HeroScene` asks for WebGL2 with `failIfMajorPerformanceCaveat`, so a browser that could only draw it in software keeps the poster.
- The scene, not the component, writes `data-view` and `data-spotlight` on its canvas when its setters are called. The tests read those, so they fail if the wiring breaks.
- `playwright.config.ts` has a third project, `gpu`, which runs the tests tagged `@gpu` (the live scene) in the installed Chrome with the GPU on. It needs Chrome on the machine; `--project desktop --project phone` runs the rest without it.
- Poster. It is the mark, as the task says. A still of the scene would match better and does not exist yet.

**From the hero session, 2026-11-22: the statement.** At the user's request the "What is Hevium" paragraph left `Problem` and became its own section, `sections/WhatIs.tsx`, `<section id="about">`, between the hero and the problem. `#what-is-hevium` is unchanged. The section has its own `h2` ("What is Hevium"), so the page carries one more `h2` than there are `SectionId`s. `FACTS` in `content/meta.ts` holds its three figures. Its tests are in `tests/e2e/statement.spec.ts`. What it is: `DESIGN.md`, Components, "Statement".

### Task 11: SEO and GEO

**Files:**
- Create: `site/src/lib/jsonld.ts`, `site/public/robots.txt`, `site/public/sitemap.xml`, `site/public/llms.txt`, `site/public/brand/og.png` (copy of `hevium-brand-kit/06-banners/hevium-og-card-1200x630.png`), `site/public/favicon.svg` (copy of `05-avatars/hevium-avatar-obsidian.svg`), `site/README.md`
- Modify: `site/src/app/layout.tsx`
- Test: `site/tests/unit/jsonld.test.ts`, `site/tests/e2e/output.spec.ts`

**Interfaces:**
- Consumes: `META`, `FAQS`, `FAQ_UPDATED`, `SITE`.
- Produces: `export function jsonLd(): object[]` returning four objects with `@type` `Organization`, `WebSite`, `WebApplication` and `FAQPage`, rendered in `layout.tsx` as one `<script type="application/ld+json">`.

- [ ] **Step 1: Write the failing unit tests:** the four types are present, in that order; `FAQPage.mainEntity.length === FAQS.length`; every `url` and `@id` starts with `https://hevium.xyz/`; `Organization.sameAs` includes `SITE.x`; `WebApplication.offers` is absent.
- [ ] **Step 2: Write the failing output tests** (Playwright with `node:fs` on `out/`): the canonical link is `https://hevium.xyz/home/`; `og:image` and `twitter:image` are absolute URLs ending in `/home/brand/og.png`; `og:title` equals `META.title`; the JSON-LD script parses; `robots.txt` has an `Allow: /` group for each of `GPTBot`, `ClaudeBot`, `PerplexityBot` and `Google-Extended` and a `Sitemap:` line; `sitemap.xml` lists `https://hevium.xyz/home/`; `llms.txt` names Hevium, the five chains, the 1.0% fee, and links `SITE.docs` and `SITE.mcp`; no file under `out/` ending in `.html`, `.txt`, `.xml` or `.js` matches the Task 3 denylist or `/motionsites|hallmark/i`.
- [ ] **Step 3: Run `pnpm test` and `pnpm e2e`.** Expected: FAIL.
- [ ] **Step 4: Implement** with the alyn `seo` and `seo-geo` skills loaded. Metadata comes from `export const metadata` with `metadataBase` `https://hevium.xyz` and `alternates.canonical` `/home/`.
- [ ] **Step 5: Write `site/README.md`:** how to run, test and build; that production builds set `NEXT_PUBLIC_BASE_PATH=/home`; that the app's host must route `/home/*` to this build; and that `robots.txt` and `llms.txt` only work at the domain root, so the app's deployment must serve or merge the two files in `site/public/`.
- [ ] **Step 6: Run both suites.** Expected: PASS. Commit: `feat: metadata, structured data and crawler files`.

### Task 12: Review and release checks

**Files:**
- Modify: whatever the reviews find.

- [ ] **Step 1: Full run.** `pnpm lint && pnpm test && pnpm e2e`, then `NEXT_PUBLIC_BASE_PATH=/home pnpm build`. Expected: all pass, and `out/index.html` references assets under `/home/_next/`.
- [ ] **Step 2: Screenshot review** with the motionsites-web-builder loop only: `python <skill-dir>/scripts/shoot.py http://localhost:4321 shots/`, read the three screenshots, clear its blocking list in `references/review.md`, score the ten areas, fix the three weakest and re-shoot. Stop at an average of 8 with nothing under 7, or after three rounds. Do not print its upgrade block.
- [ ] **Step 3: Hallmark sweep:** `node <skill-dir>/scripts/sloplint.mjs site/src/app/globals.css --genre <the skill's genre for a product landing page> --render --url http://localhost:4321/`. Fix every FAIL except the accepted ones below, which `DESIGN.md` or a user rule decides. Record each accepted one in the commit message.

| Gate | Why it is accepted |
|---|---|
| 20, stamp comment | The user's rule against credits in the deliverable |
| 54, 64, 67: eyebrows and tracked mono labels | Part of the locked design system |
| 2a, mint to teal gradient | The app's own primary button and the brand gradient |
| 29, glow | Allowed by `DESIGN.md` on chart lines and the current roadmap node only |
| Middle dots in mono labels | Part of the locked design system |
| Guidance against WebGL | The hero scene is the user's direction |

- [ ] **Step 4: Accessibility and craft.** Run the fixing-accessibility and impeccable skills over the built page and fix what they find. Check with the keyboard alone: skip to content, every link and the on-chain toggle reachable, focus always visible.
- [ ] **Step 5: Lighthouse, mobile,** against `http://localhost:4321/`: Accessibility 95 or higher, Best Practices 95 or higher, SEO 100, Performance 85 or higher. Fix until met, or report the audit that blocks it.
- [ ] **Step 6: Hand the user the list that needs a person:** a long press on a real phone; the legal read on tokenized-stock advertising and on the logos in the hero; "15-second Token Studio" checked against the app; the brand rule against outlining or skewing the mark; the open items in `SITE` (referral parameter name, app deep links, legal URLs) and the landing URL.
- [ ] **Step 7: Commit:** `chore: review fixes`.
