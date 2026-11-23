# Entrance: loader and on-load animation

Date: 2026-11-23. Status: approved by the user the same day ("proceed", with one change: "if they refresh or hard refresh their browser then re trigger the preloader"). GSAP approved with it.

## Why

The user, 2026-11-23: "2 things are still not yet implement. 1. Preloader (a loading page when user enter the site) 2. a unique and smooth on load animation.. like gsap or motion". Of three directions they chose "A, mark hand-off": the loader does not fade away and leave a second animation to start; it becomes the entrance.

The spec has asked for this since the start: "An entrance loader, capped at about 3 seconds, shown once per session", with real progress. Its mascot was drawn in ASCII characters. The page's texture has since become star pixels, so the mascot is drawn in those.

## Goals

- One continuous move from the first frame to the finished hero, made of things only this page has: the Hevium mark, its star pixels, the glass cube.
- A loader that waits for real work and for nothing else.
- The page is never held back by it: not with scripts off, not with reduced motion, not when something fails.

## Not goals

- No animation tied to the scroll position (nothing scrubbed, nothing pinned beyond what the page has). A section's entrance plays once when the section comes into view, and that is all.
- No change to the hero scene's own behaviour (the cube, the logos, dragging).
- No scrambled or decoding text (direction B, dropped: it belongs to the ASCII look the page left, and it is on every crypto site).

## What would make it a failure

- A wait with nothing behind it. On a phone the 3D scene never loads, so a long loader there is a fake.
- A page that stays covered when the script fails.
- A slower first sight of the headline than the page needs. Measured today on a throttled phone, the headline paints at about 1.75s.

## What is already there

- `HeroScene` sends `hevium:scene-ready` exactly once: at once when there will be no scene, when the scene is up, when it fails, or after 2500ms. The loader ends on it.
- The scene's `mountHeroScene(surface, { onProgress })` takes a progress callback, which nothing uses yet.
- The poster (the mint mark as a picture) stands exactly where the cube's mark stands, on every device. That is where the loader's mark lands, so one landing spot serves phone and desktop.
- `runPixels` draws anything in star pixels, a picture included (the footer's wordmark does it).
- `--z-loader: 1000` is in the tokens.

## Storyboard

Times in the second half count from "ready".

1. **Before the first paint.** A few lines of script in the page's head mark `<html data-entrance>` when scripts run, motion is allowed and this session has not seen the entrance. Only under that mark does CSS draw the loader. With no mark the page is as it is today.

2. **Loading.** Obsidian over the whole screen. In the middle, the Hevium mark in star pixels, about 140px wide. It starts as a dim outline and fills with light from the bottom up as the percent climbs. Under it, the percent in mono, mint, tabular figures.
   - From 768px with the 3D scene: the percent follows the scene's download and start, eased so it never stalls or jumps back. It ends on `hevium:scene-ready`, at 2.5s at the latest.
   - On a phone, or wherever there will be no scene: one short beat. The mark fills in about half a second and goes straight on.

3. **Hand-off, 0 to 450ms.** The percent fades. The star pixels fly apart from the mark across the screen and die out as they go, like the page's star field being thrown. What they leave is the mark itself, whole and crisp in the brand gradient. It glides down to the cube's spot and takes the size of the mark that stands there. The Obsidian behind it is the page's own colour, so nothing is seen to lift: the mark is simply now part of the hero.

4. **Reveal, 250 to 1200ms.**
   - The headline rises line by line from behind a mask, 70ms apart, easing out.
   - The two buttons come up after the last line.
   - The nav bar settles in from 8px above.
   - From 768px the cube and the logos come up round the mark (the scene's own fade, which exists).

5. **Done.** The loader's element is removed, the mark on `<html>` is taken off, and the session is marked as having seen it.

A refresh, soft or hard, plays the whole of it again, as the user asked. Coming back to the page within the session any other way (a link, the back button) plays no loader and no hand-off: the headline's rise alone, in 0.6s. A page opened at a section (an address ending in `#faq`, say) plays no loader either: the hand-off would land on a hero that is off screen.

## Section entrances

Added the same day, while this was being written. The user: "i also want each section on appear to have their own unique animation...like a ease in kinda thing".

Two layers, so the page stays one page and each section still has a move of its own:

- **The head, the same everywhere.** Eyebrow, headline and supporting line rise 12px and fade in, 60ms apart, easing out. One look for every head is the consistency the user has asked for throughout.
- **The piece, its own move.** Each is the section's piece arriving in the way that piece works, so none could be swapped with another:

| Section | How its piece arrives |
|---|---|
| What is Hevium | Nothing new: the statement already lights up as it is read, and its three figures count up. That is its entrance |
| The problem | The three walls rise one after another, and in each the pixel object assembles from scattered stars |
| The solution | The four pills arrive left to right and the line between them draws through, ending on the lit one |
| Stocks | The tickers fly in from both sides to their places on the ring, then the coin drops onto the first |
| Launch | The dome builds from its base up in star pixels, the three bins after it, and the counter starts from 0:00 |
| Agents | The four client icons pop in turn, the prompt card rises, and the chart's line draws from the left |
| Earn | The cards are dealt: one stack fans out into the five |
| Five chains | The hub lands with one ring going out, the lanes draw from it to each chain, and each chain appears as its lane reaches it |
| Trust | The bento's cells rise in the order the eye takes them: the wide one, then left to right, row by row |
| FAQ | The questions slide in from the right, one after another |
| Final | The coins drift in from the two sides to their places, and the mark draws itself |

Rules for all of them:

- Once per visit to the page, when about a quarter of the section is in view. Scrolling back up does not replay it.
- Each is over within 0.9 seconds, and only moves and fades (transform and opacity, or a drawn line), so the page does not shift and stays smooth on a phone.
- A section's own loop (the ring turning, the press striking, the session typing) starts when its entrance ends, not before.
- On a phone the four engines are tabs: the entrance plays the first time a tab is opened. On a desktop it plays as each engine slides up under the solution's head.
- Scripts off, or reduced motion: no entrance. Everything is in place from the start, as today.
- Built in CSS, keyed on one attribute the page sets on a section when it is first seen (the watcher that already rests off-screen sections does it). No library is needed for these; GSAP is for the opening sequence only.
- The existing tests measure sections where they stand, so the test run switches entrances off by default and the entrance tests switch them on.

## Rules

- Scripts off: nothing of this exists. The page is as it is today.
- Reduced motion: no loader and no movement. The page is as it is today.
- A failsafe in plain CSS lifts the cover after 4 seconds whatever the script does.
- The headline is in the page from the first byte, under the cover. Nothing is added to or taken from the text.
- One screen, no scrolling while the cover is up; the page under it does not move when the cover goes.

## Cost, said plainly

The headline is hidden until the hand-off, so the browser counts it as painted later. On a phone the short beat adds about 0.5 to 0.8 seconds to that first sight (from about 1.75s to about 2.4s on the throttled test). On a desktop with the scene, up to 2.5s. That is the price of any preloader. The phone beat is kept short for this reason, and the option below removes it.

## How it is built

- `Entrance.tsx`, one client component rendered once in the page, and `Entrance.module.css`. It owns the cover, the pixel mark, the percent and the timeline.
- The pixel mark: `runPixels` with the mark's picture as its source and a "fill" level driven by progress; on hand-off the same canvas plays the scatter.
- The landing: the gradient mark is measured against the poster's box and moved there (first, last, invert, play), then swapped for the poster.
- The headline's lines are found at run time (they depend on the screen's width) and wrapped for the mask.
- `HeroScene` passes its `onProgress` on as a `hevium:scene-progress` event. No other change to the hero.
- Library: GSAP, with its SplitText for the lines, loaded only when the entrance plays, so it costs nothing at first paint and nothing on later visits. One timeline has to drive a canvas, a measured move, split lines and the wait on the scene, which is what it is for. Motion fits less well: it is built round React components and this page is mostly static markup. This needs a package installed (`gsap`), which waits on the user's yes. Without it the same storyboard can be built on the browser's own animation API in about twice the code.

## Tests (each written first)

- With scripts off and with reduced motion: no cover, the headline visible at once.
- First visit: the cover is up before the first paint, shows the mark and a percent, and is gone within 2.5s plus the hand-off; the failsafe lifts it at 4s with the script blocked.
- The mark lands on the poster's box, within a pixel.
- The headline's text is unchanged and reads as one heading to a screen reader while its lines are wrapped.
- Second visit in the session: no cover.
- Phone: the beat is under 0.8s.
- The page under the cover does not shift when it goes (no layout shift from the entrance).

## Open, for the user

1. Install GSAP for this? (My pick: yes.)
2. Phones: the half-second beat as above, or no cover at all and only the headline's rise? (My pick: the beat, since the hand-off is the idea; the second is faster by about half a second.)
3. Later visits in a session: the 0.6s rise, or nothing? (My pick: the rise.)

## Built (2026-11-23)

As designed, with these differences:

- The headline's lines are split by a few lines of this site's own code, not GSAP's SplitText. That plugin wraps greedily, the headline is balanced, and the difference showed as a jump when the lines were put back. Only GSAP's core is loaded.
- The loader also waits for the headline's typeface (a second and a half at most), since the lines are found by measuring them.
- Stocks: the whole ring closes in from both sides. The tickers are not flown in one by one, and the coin has no drop of its own: both already move by transforms the entrance would fight.
- Launch: the counter does not restart from 0:00.
- Agents: the chart comes in from its side; its line is drawn by the session, as before.
- A section's loop does not wait for its entrance to end. It rests while off screen, as it did, and is running as the part comes in.
- The percent follows the 3D scene's own count where the scene reports one. That path could not be run in a headless browser, which has no GPU to offer.
