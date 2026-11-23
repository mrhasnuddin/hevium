# Set Piece: Problem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Superseded on 2026-11-22.** This walk-through was built, shown to the user and replaced the same day by a card layout after OriginKit's features-04. The current Problem section is described in `DESIGN.md` and tested in `site/tests/e2e/problem.spec.ts`.

**Goal:** Replace the Problem section's headline-over-cards with a walk through three walls of characters.

**Architecture:** A server component with no script. One registered CSS property, `--walk`, runs from 0 to 1 on a scroll-driven view timeline while the section's stage is held on screen. Every wall's place, its break-up and the closing line are computed from that one number. Without scroll-driven CSS, or with reduced motion, the stage is not held and the walls simply stand in a row.

**Tech Stack:** Next.js 16 static export, React 19, CSS Modules, CSS scroll-driven animations. No new dependency.

**Spec:** `docs/superpowers/specs/2026-11-22-section-set-pieces-design.md` (rules 1 to 10 and the Problem row), with `docs/landing-page-spec.md` for page-wide constraints.

**Scope:** One set piece. The design's other pieces each get their own plan (`2026-11-22-set-piece-*.md`), written when their turn comes, because each depends on what the one before it taught. The connections to the statement above and to Stocks below are built with the Stocks piece, when both ends exist.

## Global Constraints

- One canvas: no border, no boxed panel, no `.card` in the section.
- Text budget: a headline of seven words or fewer and at most 25 words of support. Wall names are HTML text, never drawn into an image.
- The stage holds the screen for at most one extra screen of scrolling.
- Animate `transform` and `opacity` only. Honour `prefers-reduced-motion`.
- Tokens only for colour and type.
- Readable with JavaScript off. No sideways scroll from 320px up.
- The visual is a `figure` whose description carries the three walls' explanations.
- On-chain view: characters hide and each wall becomes a mint outline.
- The deck's "40%" bot figure stays out.
- Shell commands are prefixed with `rtk`.

## Review Focus

1. A browser without scroll-driven CSS: the section must not be held with nothing moving. Covered by the reduced-motion test, which exercises the same still layout.
2. A short, wide window (1440x500): the walls and the headline must not overlap. Test in Task 1.
3. A phone at 360px: all three names stay inside the screen while standing still. Test in Task 1.
4. Scrolling back up: the walls stand again. Test in Task 1.
5. JavaScript off: names, headline and closing line all readable. Test in Task 1.

---

### Task 1: The walk through three walls

**Files:**
- Rewrite: `site/src/components/sections/Problem.tsx`, `site/src/components/sections/Problem.module.css`
- Modify: `site/src/content/sections.ts` (third wall's title becomes `Humans only`), `site/tests/unit/content.test.ts` (that title), `site/tests/e2e/sections.spec.ts` (delete the `problem section` group)
- Create: `site/tests/e2e/problem.spec.ts`

**Interfaces:**
- Consumes: `SectionHead`, `SECTIONS.problem`, `PROBLEMS` from `@/content/sections`.
- Produces: `section#problem` containing `.track > .stage`, a `figure` with `ol > li` walls in order, each holding its name, a `figcaption` with the three explanations, and a closing line `p[data-closing]` holding `SECTIONS.problem.lead`. The registered property `--walk` is readable on `#problem figure`.

Numbers the CSS uses, so the tests and the drawing agree. Depth is counted in gaps, one gap being the distance between two walls:
- A wall's depth is `z = walk * 3.5 - i - 0.5`, for wall `i` of 0, 1, 2. At `z = 0` it is drawn at its own size.
- A wall breaks up over `z` from 0.25 to 0.6: its opacity falls from 1 to 0 and its characters drop.
- So wall 0 is gone by `walk = 0.32`, wall 1 by 0.6, wall 2 by 0.89. The closing line fades in from 0.88 to 0.98.

- [ ] **Step 1: Update the content test** so the wall titles are `['Crypto-only', 'Sniper bots', 'Humans only']`. Run `pnpm test`. Expected: FAIL on the third title.
- [ ] **Step 2: Change the title** in `sections.ts`. Run `pnpm test`. Expected: PASS.
- [ ] **Step 3: Write the failing page tests** in `problem.spec.ts`. A helper `walkTo(page, walk)` scrolls so the track has moved `walk` of the way through its held stretch, waits two frames and returns `Number(getComputedStyle(figure).getPropertyValue('--walk'))`. Tests:
  - structure: one `h2` with text `First-generation launchpads hit three walls.`; wall names in order; the `figcaption` contains `gas tokens`, `exit` and `spending limits`; `[data-closing]` has the lead's text; no `.card` in the section; no element in the section has a border or a background colour.
  - held for one screen at most: `.stage` is `position: sticky`, and the track's height minus the window's height is at most the window's height plus 1.
  - `walkTo(0)` returns 0 and all three walls have opacity 1; wall 0 is wider on screen at `walkTo(0.15)` than at 0.
  - `walkTo(0.45)`: wall 0 has opacity 0, walls 1 and 2 do not. `walkTo(0.7)`: walls 0 and 1 have opacity 0, wall 2 does not. `walkTo(1)`: all three have opacity 0 and `[data-closing]` has opacity 1. At `walkTo(0.3)` the closing line has opacity 0.
  - back up: after `walkTo(1)` then `walkTo(0)`, all three walls have opacity 1 again.
  - reduced motion: `.stage` is not sticky, the track is no taller than the stage plus 1, all three names and the closing line are visible with opacity 1.
  - JavaScript off: the headline, three names and the closing line are visible.
  - at 360x780, standing still (`walkTo(0)`), each name's box lies inside the screen's width.
  - at 1440x500, the headline's box and wall 0's box do not overlap at `walkTo(0)`.
- [ ] **Step 4: Run `pnpm e2e`.** Expected: the new tests FAIL (no `figure`).
- [ ] **Step 5: Build the section.** Base styles are the still: track and stage at their natural height, walls placed by the depth formula with `--walk` at its initial 0, closing line shown. Inside `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`: the track is `200svh` tall, the stage is sticky and `100svh` tall, and the track animates `--walk` from 0 to 1 over `contain 0%` to `contain 100%`. The camera stands above the walls (`perspective-origin` near the top), so the top band of each farther wall, with its name, shows over the nearer one. Each wall is a block of the hero floor's characters as CSS content with empty spoken text.
- [ ] **Step 6: Run `pnpm lint`, `pnpm test`, `pnpm e2e`.** Expected: all pass.
- [ ] **Step 7: Look at it** in the browser at 1440x900 and 360x780, at walk 0, mid-way and the end, and with the on-chain view held.
- [ ] **Step 8: Commit** only if the user has asked for commits: the tree still holds another session's uncommitted work.
