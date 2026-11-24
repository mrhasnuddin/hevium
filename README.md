# Hevium Landing Page (`hevium.xyz`)

Official marketing & product landing page for **Hevium**, deployed at **[https://hevium.xyz](https://hevium.xyz)** and linking into the trading terminal at **[https://app.hevium.xyz](https://app.hevium.xyz)**.

---

## Domain Architecture

| Surface | Production URL | Repository / Path |
| :--- | :--- | :--- |
| **Landing Page** | `https://hevium.xyz/` | `aimaneth/hevium-landing` (`site/`) |
| **Trading App & Terminal** | `https://app.hevium.xyz/` | `aimaneth/hevium` (`app/`) |
| **Perps Terminal** | `https://perps.hevium.xyz/` | `aimaneth/hevium` (`perps/`) |
| **Brand Kit** | `https://app.hevium.xyz/brand/` | `aimaneth/hevium` (`app/public/brand/`) |
| **Documentation** | `https://docs.hevium.xyz/` | `aimaneth/hevium` (`app/public/docs/`) |

---

## Repository Structure

```text
hevium-landing/
├── .github/workflows/ci.yml   # GitHub Actions CI (unit tests + Next.js static export build)
├── package.json               # Root Cloudflare Pages build entry (delegates to site/)
├── wrangler.jsonc             # Cloudflare Worker + Static Assets configuration
├── worker.js                  # Dynamic OG meta URL rewriter per request origin
├── DESIGN.md                  # Hevium Obsidian design system & typography rules
├── docs/                      # Landing page specs & design notes
└── site/                      # Next.js 16 (App Router) static export project
    ├── public/
    │   ├── art/               # SVG fallbacks for star-pixel canvas illustrations
    │   ├── brand/             # Hevium brand marks & wordmarks
    │   ├── chains/            # Self-hosted chain icons (Base, Robinhood, BNB, Solana, Elysium)
    │   ├── tokens/            # Self-hosted stock & token icons (NVDA, TSLA, AAPL, SPY, etc.)
    │   ├── _headers           # Cloudflare immutable cache headers
    │   └── robots.txt         # Search crawler directives & sitemap reference
    ├── src/
    │   ├── app/               # Next.js App Router (layout.tsx, page.tsx, globals.css, entrances.css, sitemap.ts)
    │   ├── components/        # Shared UI components + page sections (Hero, WhatIs, Problem, Engines, etc.)
    │   ├── config/site.ts     # Canonical URLs, deep-link paths, and local icon registry
    │   ├── content/           # Structured copy, stats, and section metadata
    │   ├── hero/              # Three.js + Rapier3D interactive 3D glass cube & token physics scene
    │   ├── lib/               # Star-pixel 2D canvas engine, SEO metadata, and appUrl builder
    │   └── styles/tokens.css  # CSS custom properties (Obsidian theme tokens)
    └── tests/
        ├── unit/              # Vitest unit tests (URLs, content, SEO integrity)
        └── e2e/               # Playwright E2E & GPU visual tests
```

---

## Quick Start for Contributors

> **No fork needed**: Once you are added as a collaborator on `aimaneth/hevium-landing`, clone this repository directly so your pushes trigger Cloudflare builds automatically.

### 1. Clone & Install

```bash
git clone https://github.com/aimaneth/hevium-landing.git
cd hevium-landing/site
pnpm install
```

*(If you already have an older local clone of the repo, switch its remote and sync with `origin/main`)*:
```bash
git remote set-url origin https://github.com/aimaneth/hevium-landing.git
git fetch origin
git checkout main
git reset --hard origin/main
```

### 2. Run Local Development Server

```bash
cd site
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)**.

### 3. Run Tests & Production Build

Always verify unit tests and the static export build before pushing:

```bash
cd site
pnpm test          # Runs Vitest unit tests
pnpm run build     # Compiles TypeScript & exports static site to site/out/
```

To run Playwright E2E tests against the built static export:
```bash
cd site
pnpm run e2e
```

---

## Important Conventions & Guardrails

Please keep the following project invariants intact when making changes:

1. **Root Path & Clean App Links (`site/src/config/site.ts` & `site/src/lib/appUrl.ts`)**:
   - The landing page is served at the root domain **`https://hevium.xyz/`** (`SITE.path = '/'`). Do **not** re-introduce a `/landing` `basePath`.
   - All CTA links point to **`https://app.hevium.xyz/`** (`launch`, `terminal`, `feed`, `invite`) with **clean URLs** (no `?utm_*` query parameters; section placement is stored on `data-placement`, and only `?ref=<code>` is forwarded when present).
2. **Self-Hosted Icons (`site/public/chains/` & `site/public/tokens/`)**:
   - All 5 chain icons and 17 token/stock icons are self-hosted locally in `site/public/chains/` and `site/public/tokens/` with explicit root `<svg width height>` attributes. Do not replace them with external runtime fetches.
3. **3D Hero Scene & Star-Pixel Canvas Performance (`site/src/hero/` & `site/src/lib/`)**:
   - The 3D hero renders on both desktop and mobile (with logo dragging locked below `768px` via `HERO_DRAG_BREAKPOINT = 768` so mobile touch scrolling is never interrupted).
   - Keep the off-screen/tab-hidden animation loop pausing (`IntersectionObserver` + `visibilitychange`), mobile WebGL2 low-power fallback, and pre-baked 2D star sprite cache intact.
4. **Root `package.json`**:
   - Keep the root `package.json` intact — Cloudflare Pages executes `npm run build` from the repository root, which installs dependencies, builds `site/out`, and mirrors the static output to `out/` and `dist/`.

---

## Deployment (Cloudflare Automatic CI/CD)

Deployment is 100% automated via Cloudflare + GitHub integration:

- **Push to `main`**:
  - GitHub Actions runs `.github/workflows/ci.yml` (`pnpm test` + `pnpm run build`).
  - Cloudflare automatically builds the repository and deploys the static export live to **`https://hevium.xyz`** (~45–60 seconds).
- **Push to a feature branch / Open a Pull Request**:
  - Cloudflare builds an isolated preview deployment (`https://<branch>.hevium-landing.pages.dev`) so changes can be reviewed before merging into `main`.
