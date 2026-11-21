# Hevium landing page spec

Approved 2026-11-21. Covers structure, user flow and constraints. The visual system lives in `DESIGN.md`.

## Intent

A marketing page that explains Hevium in one scroll and sends visitors into the app at `https://hevium.xyz/`. One primary action everywhere: **Launch app**.

Positioning comes from the pitch deck: "The Multi-Chain Stock & Fair-Launch Terminal". Fair-launch tokens paired with stocks and digital dollars, built for retail traders and AI agents.

## Audience

| Visitor | Wants | Where they convert |
|---|---|---|
| Trader | Stock-paired tokens, five chains, one login | Launch app |
| Creator | A fair launch in seconds | Launch a token |
| Caller or affiliate | 20% commission, proof of their trades | Become an affiliate |
| Agent builder | A terminal a bot can use safely | MCP and docs |

## Goals

- A first-time visitor can say what Hevium is after the hero.
- Every section ends within reach of the Launch app button.
- Search engines and AI answer engines can read every claim as plain HTML.

## Not goals

- No wallet connection, trading or sign-in on the landing page.
- No investor material. The deck is confidential: raise, valuation, token warrant, revenue share, run-rate scenarios and use of funds stay off the site, its metadata and `llms.txt`.
- No third-party ads, credits, badges or watermarks.

## Constraints

- Content max width 1600px. Backgrounds and the 3D canvas run full bleed. Design floor 360px, fluid to 320px with no sideways scroll. Breakpoints 768, 1024, 1280, 1600.
- An entrance loader, capped at about 3 seconds, shown once per session.
- SEO and GEO configured (see below).
- Landing lives at `hevium.xyz/home`. The app keeps the root. Assumption, not yet confirmed.
- Every link into the app carries the visitor's referral code and UTM tags.

## Approaches

| Option | Trade-off | Status |
|---|---|---|
| A hero scene modelled on `hero.mp4`: the Hevium logo in a glass cube, with ten asset logos around it that light up and can be dragged | Heavy in the first screen only. Needs a loader, a poster for phones, reduced motion and no WebGL | Set by the user on 2026-11-21. Built in its own session, in `hero-scene/` |
| One fixed Three.js scene behind the whole page, with an object that changes per section (Tenbin's method) | The heaviest option. Needs a loader, a phone fallback and care with text placement | Chosen first, then replaced by the hero scene. The hero session read the new direction as hero-only 3D; the user has not confirmed that the page-long scene is dropped |
| Pre-rendered video or stills (Walrus's method) | Cheap and fast, no interaction | Kept as the fallback for phones and reduced motion |

Motion stack: Three.js for the scene, GSAP ScrollTrigger with Lenis for scroll, Canvas 2D or SVG for section demos, plain CSS for UI states. No anime.js. The hero's logos are extruded from the official SVGs in `assets/logos/` by `hero-scene/logo3d.js`. The site treats the scene as a module behind one interface, described in the build plan.

## Loading and reveal

Loading states use the `ascii-reveal` package (0.3.0, MIT, no dependencies), at the user's request.

- Entrance: the star-H mark plays as the ASCII loading mascot with a percent readout. When assets are ready, the hero decodes in with the `cinematic` duration.
- Live data (stat row, ticker wall, chain table values): `AsciiSkeleton` while fetching, then the values decode in (about 400 ms).
- Section headings and stats decode as they scroll into view. Body copy and cards stay still.
- Server-rendered text is never hidden, so crawlers read it. Reduced motion gets a short fade.

The package's components need React 17 or newer, so the site is built on React. Proposed: Next.js with static rendering, which both Fobo and Solana use. The package is not installed yet because there is no project scaffold; it goes in with the scaffold.

## On-chain view (hold left click)

Added 2026-11-21, modelled on the hold-to-dive state on shopify.design. There is no pill or button: the user wants the hold alone to trigger it.

- Holding the left mouse button on any area that is not a link, button or form field moves the page into the on-chain view. Releasing returns.
- The hold must last 350ms with less than 6px of movement, so clicks, text selection and drags keep working. A ring fills at the cursor during the hold, and a small mono hint follows the cursor in the hero: "Hold to see on-chain".
- In the on-chain view the scene changes from solid to outline: the camera eases from a flat projection to perspective, page layers separate in depth, the 3D mark shows edges only, and mono labels attach to what is on screen.
- Labels show what sits behind each claim: fee split and escrow contract, chain IDs and block heights, contract addresses from the verified registry, the bonding-curve formula, recent transaction hashes. Live values need a data endpoint; without one the labels are static and marked as samples.
- Labels decode in with `ascii-reveal`.
- Touch uses a long press with the same rules. Keyboard users get a toggle button that is visible only on focus, and Esc leaves the view. Reduced motion gets a crossfade to a static outline layer.
- Sound is off unless the visitor turns it on.
- The view is one attribute on `<html>`. The hero answers it in the 3D scene, and every other section answers it in CSS.
- Roadmap: the light section flips to Obsidian, cards become outlines, rungs read as blocks (solid for what is live, dashed for what is pending), and each phase shows what exists on-chain for it.
- Buttons: the third action style is tonal, matching the active tab in the app.

How Shopify builds theirs, for the build step: page elements carry `data-layout` and `data-depth` and are mirrored into one Three.js scene; headline letters are extruded from font outlines with an `EdgesGeometry` line twin; the outline look is a depth-only pass of the solid meshes followed by a pass of the lines; the projection matrix blends from orthographic to perspective.

## Type

- Display, text and UI: Plus Jakarta Sans, as in the app and on hevium.xyz/brand. The user asked on 2026-11-21 for fonts and colours to follow the DEX. This replaces Sora with Manrope, picked earlier that day after comparing six pairings, including a custom face built with make-font (kept in `fonts/hevium-display`, not used).
- Colours were cross-checked against the app the same day. The differences and what changed are listed in `DESIGN.md`.
- The wordmark lockups keep Plus Jakarta Sans.
- Colour follows 60-30-10. Obsidian is locked. The roadmap section alone uses the light theme.
- Data and labels: JetBrains Mono.

## Page structure

| # | Section | Content | Source |
|---|---|---|---|
| 0 | Entrance loader | Star-H mark as an ASCII mascot with real load progress, then the hero decodes in | Tenbin, ascii-reveal |
| 1 | Nav | Logo, Stocks, Launch, Agents, Earn, Roadmap, FAQ, Docs, Launch app | Fobo |
| 2 | Hero | Deck headline, one supporting line, Launch app and How it works, stat row (5 chains, 1.0% fee, 17+ pairs, AI-native), 3D scene | Deck p1, `hero.mp4` |
| 3 | Problem | Three walls of first-generation launchpads: crypto-only, sniper bots, built for humans only | Deck p2 |
| 4 | Stocks | "Meme speed meets Wall Street". Ticker wall, stock and stable pairs, auto-graduation | Deck p4 |
| 5 | Launch | 15-second Token Studio, fairness bar (80% public, 20% locked liquidity, 0% insider), anti-bot Shield | Deck p3, p6 |
| 6 | Agents | 24/7 trading, connect from Claude or Cursor, daily and per-trade spend limits | Deck p5 |
| 7 | Earn | 20% commission on every trade, verified entries on charts, PnL share cards, affiliate button | Deck p6, p9 |
| 8 | Five chains | Base, Robinhood Chain, BNB Chain, Solana, Elysium: who each is for and what trades there | Deck p7 |
| 9 | How it works | Sign in with Google, pick a chain, trade or launch | Docs |
| 10 | Roadmap | Five phases on a zigzag ladder of rungs, after taiko.xyz: grey rungs that colour in as the section scrolls, and skewed cards that grow upward from the rung they stand on. The only light section on the page, and the nav turns light over it. Entrance and exit are our own: a rounded sheet, no Taiko transition. Phones keep the ladder, cropped at the sides | Deck p10, Taiko |
| 11 | Guarantees and FAQ | Non-custodial, fixed supply, locked liquidity, buyback vault, audit status. Six to eight questions | Deck p6, docs |
| 12 | Final CTA and footer | Headline again with Launch app. Footer: Product, Developers, Community, Legal | Fobo |

## User flow

1. Visitor arrives from X, Telegram or a referral link.
2. Loader, then hero. The nav button is on screen from here on. Phones get a bottom bar with the same button.
3. The visitor follows one of four interests: Stocks, Launch, Earn or Agents.
4. Stocks, Launch and Earn end at Launch app or a text link into the matching app screen. Agents sends builders to `mcp.hevium.xyz` and the docs in a new tab.
5. In the app: legal notice (accept to continue), sign in with Google or a wallet, first trade, launch or call.

The app's legal notice is the first thing a visitor sees after clicking, so the FAQ and footer state the risk line beforehand.

## Roadmap content

Public milestones only. User, wallet and affiliate targets from the deck are left off.

| Phase | When | Milestones |
|---|---|---|
| 0 Ignition (now) | Nov to Dec 2026 | Five-chain public rollout, tier-1 security audit |
| 1 Stock Wedge | Q1 2027 | Earnings-season sprints, audit completion badge |
| 2 AI Wave | Q2 2027 | Starter AI bot kits, developer buildathons |
| 3 Affiliate Arena | Q3 2027 | Affiliate leaderboards, cross-chain trading cups |
| 4 Market Leader | Q4 2027 | Institutional API feeds |

## SEO and GEO

SEO:
- All copy in static HTML. One H1, one H2 per section. The canvas is hidden from assistive tech.
- Title, description, canonical, Open Graph and X cards using `hevium-brand-kit/06-banners/hevium-og-card-1200x630.png`.
- JSON-LD: Organization, WebSite, the app, FAQPage.
- `sitemap.xml`, `robots.txt`, self-hosted fonts, lazy-loaded 3D.

GEO:
- `llms.txt` at the root: what Hevium is, the main facts, links to docs and MCP.
- `robots.txt` names and allows GPTBot, ClaudeBot, PerplexityBot and Google-Extended.
- A plain "What is Hevium" paragraph near the top: five chains, 1.0% fee, 20% referral share, non-custodial.
- FAQ as real question-and-answer text in the page, with a visible "last updated" date.

## Check before publishing

- "Bots grab 40%+ of day-1 supply" needs a source.
- The audit is in progress until the completion badge lands (roadmap Q1 2027). The site must not say "audited" before then.
- "15-second Token Studio" must match the app.
- Outside the hero, stock names appear as ticker text, never company logos. The hero scene shows company and chain logos in 3D, which needs a trademark and legal read before publishing. How tokenized stocks may be advertised needs a legal read per target market.
- hevium.xyz/brand says not to rotate, skew, stretch, outline or shadow the mark. The hero's glass cube and the on-chain view's outline treatment both need checking against that rule.

## Open items

- Confirm the landing URL (`/home` assumed).
- A public data endpoint for live numbers. Without one, the hero uses static stats.
- App URLs for Launch token, Terminal, Callouts and the affiliate page.
- The referral parameter name.

## References

- fobo.fun/home (primary): one claim per section, each with a small live demo.
- solana.com: live counters, partner stat cards.
- walrus.xyz: logo strip, statement screen, GSAP with Lenis.
- tenbinlabs.xyz: fixed 3D scene that changes per section, entrance loader.

## Skills by phase

| Phase | Skills |
|---|---|
| Design system | alyn `design-system` (three-layer tokens), better-typography, emil-design-eng |
| Build | hallmark, motionsites-web-builder (no ads), emil-design-eng, img2threejs |
| Copy | humanize |
| SEO and GEO | alyn `seo`, alyn `seo-geo` |
| Review | impeccable, fixing-accessibility |
