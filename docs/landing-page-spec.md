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
| A hero scene modelled on `hero.mp4`: the Hevium mark in a glass cube, with eleven logos piled round it (ten assets, and HyperEVM since 2026-11-24) that collide and can be dragged. Each logo is dark until the pointer is on it and glows while pointed at or held. They stand on a floor of ASCII characters that mirrors them, ripples at their waterline and sends a ring out where one lands | Heavy in the first screen only. Needs a loader, a poster for phones, reduced motion and no WebGL | Set by the user on 2026-11-21 and refined on 2026-11-22. Built in its own session and in the site since 2026-11-22: the scene is in `site/src/hero/scene/`, and `hero-scene/` keeps its lab page and tools. What it is and how it mounts: `DESIGN.md`, "Hero scene" |
| One fixed Three.js scene behind the whole page, with an object that changes per section (Tenbin's method) | The heaviest option. Needs a loader, a phone fallback and care with text placement | Chosen first, then replaced by the hero scene. On 2026-11-22 the user asked for the hero to be a full viewport whose floor is masked out after the fold so that it blends into the next section, which makes 3D hero-only. That is read from the request; the user was not asked in those words |
| Pre-rendered video or stills (Walrus's method) | Cheap and fast, no interaction | Kept as the fallback for phones and reduced motion |

Motion stack: Three.js for the scene, GSAP ScrollTrigger with Lenis for scroll, Canvas 2D or SVG for section demos, plain CSS for UI states. No anime.js. The hero's logos are extruded from the SVGs in `assets/logos/` by `site/src/hero/scene/logo3d.js`, and collide through the Rapier physics engine. The site treats the scene as a module behind one interface, described in the build plan.

## Loading and reveal

Loading states use the `ascii-reveal` package (0.3.0, MIT, no dependencies), at the user's request.

- Entrance: the star-H mark plays as the ASCII loading mascot with a percent readout. When assets are ready, the hero decodes in with the `cinematic` duration.
- Live data (stat row, ticker wall, chain table values): `AsciiSkeleton` while fetching, then the values decode in (about 400 ms).
- Section headings and stats decode as they scroll into view. Body copy and cards stay still.
- Server-rendered text is never hidden, so crawlers read it. Reduced motion gets a short fade.

The package's components need React 17 or newer, so the site is built on React. Proposed: Next.js with static rendering, which both Fobo and Solana use. The package is not installed yet because there is no project scaffold; it goes in with the scaffold.

## On-chain view (removed)

Added 2026-11-21 as a hold-left-click state that turned the page to outlines. Removed 2026-11-23: the user decided the page does not need it.

- Sound is off unless the visitor turns it on.
- Buttons: the third action style is tonal, matching the active tab in the app.

How Shopify builds theirs, for the build step: page elements carry `data-layout` and `data-depth` and are mirrored into one Three.js scene; headline letters are extruded from font outlines with an `EdgesGeometry` line twin; the outline look is a depth-only pass of the solid meshes followed by a pass of the lines; the projection matrix blends from orthographic to perspective.

## Type

- Display, text and UI: Plus Jakarta Sans, as in the app and on hevium.xyz/brand. The user asked on 2026-11-21 for fonts and colours to follow the DEX. This replaces Sora with Manrope, picked earlier that day after comparing six pairings, including a custom face built with make-font (kept in `fonts/hevium-display`, not used).
- Colours were cross-checked against the app the same day. The differences and what changed are listed in `DESIGN.md`.
- The wordmark lockups keep Plus Jakarta Sans.
- Colour follows 60-30-10. Obsidian is locked. There is one theme: the light one went with the roadmap on 2026-11-23.
- Data and labels: JetBrains Mono.

## Page structure

From 2026-11-22 each section after the hero is a set piece: one visual that makes the section's point, with few words. What each section shows is set by `docs/superpowers/specs/2026-11-22-section-set-pieces-design.md`, which replaces the Content column below for rows 3 to 12. Row 9, How it works, is folded into row 8, Five chains. The claims listed below all stay on the page: that document says where each one goes.

| # | Section | Content | Source |
|---|---|---|---|
| 0 | Entrance loader | Star-H mark as an ASCII mascot with real load progress, then the hero decodes in | Tenbin, ascii-reveal |
| 1 | Nav | Logo, Stocks, Launch, Agents, Earn, FAQ, Docs, Launch app. Below 1024px the links fold into a menu | Fobo |
| 2 | Hero | Deck headline, one supporting line, Launch app and How it works, stat row (5 chains, 1.0% fee, 17+ pairs, AI-native), 3D scene | Deck p1, `hero.mp4` |
| 3 | Problem | Three walls of first-generation launchpads: crypto-only, sniper bots, built for humans only | Deck p2 |
| 4 | Stocks | "Meme speed meets Wall Street". Ticker wall, stock and stable pairs, auto-graduation | Deck p4 |
| 5 | Launch | 15-second Token Studio, fairness bar (80% public, 20% locked liquidity, 0% insider), anti-bot Shield | Deck p3, p6 |
| 6 | Agents | 24/7 trading, connect from Claude or Cursor, daily and per-trade spend limits | Deck p5 |
| 7 | Earn | 20% commission on every trade, verified entries on charts, PnL share cards, affiliate button | Deck p6, p9 |
| 8 | Five chains | Base, Robinhood Chain, BNB Chain, Solana, Elysium: who each is for and what trades there | Deck p7 |
| 9 | How it works | Sign in with Google, pick a chain, trade or launch | Docs |
| 10 | Roadmap | Removed on 2026-11-23 at the user's request ("its not needed in landing page anyway"), from the site and the design system. It was five phases on a ladder of rungs after taiko.xyz | |
| 11 | Guarantees and FAQ | Non-custodial, fixed supply, locked liquidity, buyback vault, audit status. Six to eight questions | Deck p6, docs |
| 12 | Final CTA and footer | Headline again with Launch app. Footer: Product, Developers, Community, Legal | Fobo |

## User flow

1. Visitor arrives from X, Telegram or a referral link.
2. Loader, then hero. The nav button is on screen from here on. Phones get a bottom bar with the same button.
3. The visitor follows one of four interests: Stocks, Launch, Earn or Agents.
4. Stocks, Launch and Earn end at Launch app or a text link into the matching app screen. Agents sends builders to `mcp.hevium.xyz` and the docs in a new tab.
5. In the app: legal notice (accept to continue), sign in with Google or a wallet, first trade, launch or call.

The app's legal notice is the first thing a visitor sees after clicking, so the FAQ and footer state the risk line beforehand.

## Roadmap content (not on the page since 2026-11-23; kept for the record)

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
- The audit was in progress when this was written, with its completion badge due in Q1 2027, and the rule was that the site must not say "audited" before then. On 2026-11-23 the user had the page written as if it were done ("just say it is Security Audited"). The page now says "Security audited" and names no auditor or report. That has to be true before the page goes live.
- "15-second Token Studio" must match the app.
- Stock names appear as ticker text. Three places also show logos, each asked for by the user: the hero scene (company and chain logos in 3D), the Problem section's chain logos, and the coin in the Stocks ring (the app's own icon for each of its thirteen tickers, since 2026-11-22). All of them need a trademark and legal read before publishing. Nine of the ten logo files are Simple Icons redraws and have not been compared with each brand's own kit; Base's is from its official kit. How tokenized stocks may be advertised needs a legal read per target market.
- hevium.xyz/brand says not to rotate, skew, stretch, outline or shadow the mark. The hero's glass cube needs checking against that rule.

## Open items

- Confirm the landing URL (`/home` assumed).
- A public data endpoint for live numbers. Without one, the hero uses static stats.
- App URLs for Launch token, Terminal, Callouts and the affiliate page.
- The referral parameter name.
- The hero has no supporting line and no stat row: the user's hero is the headline and two buttons over the scene. If they are still wanted, they need a place, most likely the top of the next section.
- Phones and touch: the site shows a poster in place of the hero scene, so the glow on hover never appears there. The poster image is not made yet.

## References

- fobo.fun/home (primary): one claim per section, each with a small live demo.
- solana.com: live counters, partner stat cards.
- walrus.xyz: logo strip, statement screen, GSAP with Lenis.
- tenbinlabs.xyz: fixed 3D scene that changes per section, entrance loader.
- `hero.mp4` (project root, not in git): the hero's layout, its pile of extruded logos and how they light.
- An interactive floor installation (pin.it/6wweA4tlA): a speckled floor where each footstep sends out a ring that clears the floor inside it. The model for the hero's floor.

## Skills by phase

| Phase | Skills |
|---|---|
| Design system | alyn `design-system` (three-layer tokens), better-typography, emil-design-eng |
| Build | hallmark, motionsites-web-builder (no ads), emil-design-eng, img2threejs |
| Copy | humanize |
| SEO and GEO | alyn `seo`, alyn `seo-geo` |
| Review | impeccable, fixing-accessibility |
