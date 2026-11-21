# Hevium design system

The visual system for the Hevium landing page. Values live in `design-system/tokens.css`. Open `design-system/preview.html` to see them rendered.

Sources: `hevium-brand-kit/BRAND_GUIDELINES.md` for colour, logo and type; the pitch deck for layout habits (mono eyebrows, hairline rules, mint on one or two headline words, large stat numerals); Fobo, Solana, Walrus and Tenbin for structure and motion.

## Principles

1. Obsidian first. The page is dark, and mint is the only colour that carries meaning.
2. One accent, used sparingly. Mint marks the primary action, the current item and the words that matter in a headline.
3. Lines over boxes. Hairline rules and surface steps separate content. Shadows are not used.
4. Numbers are content. Stats, tickers and fees are set large, in tabular figures.
5. Motion explains or confirms. If it does neither, it is removed.

## Tokens

Three layers. Primitives hold raw values. Semantic tokens name a purpose. Component tokens belong to one component. Components read semantic or component tokens, never a primitive or a raw value.

## Colour

Colour follows 60-30-10. 60% is the canvas (`--color-bg`). 30% is surfaces and structure: surface steps, hairlines and secondary text. 10% is the accent, spent on the primary action, one highlighted phrase per headline and the current state. If a screen needs more accent than that, something else should give way.

Obsidian is the scheme, chosen by the user on 2026-11-21. It matches the app, so the canvas does not change when a visitor clicks Launch app.

One section, the roadmap, sets `data-theme="light"` and takes the brand kit's light values: canvas `#F4F6F5`, white surfaces, ink text `#0A0C10`, and teal `#0D9488` as the accent, with `#0B6E66` where the accent is small text. The primary button turns ink there, because white on teal fails contrast at button size. Tokens are declared on `:root` and on every `[data-theme]` scope, so components inside a themed section pick up that section's colours.

| Token | Value | Use | Contrast on Obsidian |
|---|---|---|---|
| `--color-bg` | `#07080B` Obsidian | Page canvas | |
| `--color-surface` | `#0E1117` Carbon | Cards, panels, callouts | |
| `--color-surface-raised` | `#141922` | Nested or raised surfaces | |
| `--color-surface-hover` | `#1B212C` | Hover on surfaces | |
| `--color-border` | white 8% | Hairlines | |
| `--color-border-strong` | white 16% | Outlined buttons, chips, roadmap line | |
| `--color-text` | `#FFFFFF` | Headings and primary text | 20.0 |
| `--color-text-secondary` | `#A1A1AA` | Body copy under headings. The app's value | 7.8 |
| `--color-text-muted` | `#8B8B95` | Labels, captions, table heads | 5.9 |
| `--color-text-disabled` | `#71717A` | Disabled text only. The app's muted value | 4.1 |
| `--color-accent` | `#97FBE3` Hevium Mint | Links, highlights, focus | 16.4 |
| `--color-accent-deep` | `#1CD8B3` Deep Teal | Gradient end stop, depth | 11.0 |
| `--color-up` | `#34D399` | Gains. The app's value | 10.4 |
| `--color-down` | `#FF637E` | Losses, errors. The app's value | 7.0 |
| `--color-warning` | `#FFB900` | Risk notices. The app's value | 11.6 |

Cross-checked against hevium.xyz/brand and the app at hevium.xyz on 2026-11-21. Mint, Deep Teal, Obsidian, Carbon and the hairlines already matched. The text greys, the gain, loss and warning colours, the primary button fill and the tonal button edge were changed to the app's values. Two things were left as they are:
- The app's muted grey, `#71717A`, measures 4.1 to 1 on Obsidian, under the 4.5 to 1 needed for small text. Small labels here use the same grey lifted to `#8B8B95`.
- The app draws its cards on `#121319`. The brand page names Carbon `#0E1117` as the card surface, so the cards here stay Carbon.

Rules:
- Text on mint is always Obsidian (16.4).
- Muted text never sits on `--color-surface-hover`.
- The brand gradient (mint to teal at 135 degrees) is for the logo mark, the primary button, the fairness bar and chart fills. It is not used for text or large backgrounds.
- Gains are emerald, not mint, as in the app. Mint stays the accent.
- Glow (`--glow-accent`) is for chart lines and the current roadmap node only.

## Typography

| Role | Family | Status |
|---|---|---|
| Display | Plus Jakarta Sans | Headlines and numerals. Weights 700 and 800 |
| Text and UI | Plus Jakarta Sans | Body copy, buttons, nav, card titles. Weights 400 to 700 |
| Data and labels | JetBrains Mono | Brand face. Weights 400 and 500 |

Both are free with open licences. On 2026-11-21 the user asked for the fonts to follow the DEX. The app sets everything in Plus Jakarta Sans, and hevium.xyz/brand names it for display, UI titles and prose, with JetBrains Mono for addresses, maths and commands. This replaces Sora with Manrope, which the user had picked earlier the same day. The app itself loads no mono face, so mono labels are the brand page's rule, not the app's.

Set aside: Sora with Manrope, Geist, Tektur with Inter, Space Grotesk with DM Sans, Neue Machina with IBM Plex Sans, and Hevium Display, a custom face built with make-font. Its files stay in `fonts/hevium-display` and are not used.

Sizes are fluid between a 360px and a 1600px viewport. Display tracking follows the brand page: -0.035em at the hero size, easing to -0.025em.

| Token | Size | Line height | Weight | Family | Use |
|---|---|---|---|---|---|
| `--text-display-xl` | 44 to 104px | 1.04 | 800 | Display | Hero headline |
| `--text-display-lg` | 34 to 72px | 1.08 | 700 | Display | Section headlines |
| `--text-display-md` | 28 to 48px | 1.15 | 700 | Display | Statements, large card titles |
| `--text-title` | 20 to 28px | 1.25 | 600 | Text | Card and list titles |
| `--text-body-lg` | 17 to 21px | 1.5 | 400 | Text | Lead paragraphs |
| `--text-body` | 16 to 17px | 1.6 | 400 | Text | Body copy |
| `--text-small` | 14px | 1.5 | 400 or 700 | Text | Nav and table cells at 400, buttons at 700 |
| `--text-caption` | 13px | 1.5 | 400 | Text | Captions, footnotes |
| `--text-eyebrow` | 12px | 1.4 | 500 | Mono | Uppercase labels, tracking 0.14em |
| `--text-stat` | 40 to 88px | 1.0 | 800 | Display | Stat numerals |

Rules:
- Headings use `text-wrap: balance`. Paragraphs use `text-wrap: pretty` and cap at 68 characters.
- Numbers that change or line up use `font-variant-numeric: tabular-nums`.
- In a headline, at most one phrase is mint.
- Mono is for labels of 14px or smaller, tickers, addresses and code. It is never used for sentences.
- The "Hevium" wordmark is never re-typed. Use the lockup files.
- Fonts are self-hosted in production with `font-display: swap`, and only the weights listed above are loaded.

## Layout

- Container: max width 1600px (`--container-max`), centred, with a gutter of 16 to 64px (`--gutter`).
- Backgrounds and the 3D canvas run full bleed. Text and UI stay inside the container.
- Grid: 12 columns from 1024px, 8 from 768px, 4 below. Gap 16 to 32px.
- Section spacing: 72 to 160px top and bottom (`--section-y`).
- Breakpoints: 768, 1024, 1280, 1600px. The design floor is 360px and nothing scrolls sideways down to 320px.
- Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160px.

## Shape and depth

- Radius: 6px (inputs, small chips), 10px (buttons), 16px (cards), 24px (large panels), pill (nav, tags).
- Borders are 1px hairlines. An accent rule is 2px mint, on the left of a callout or above the active column.
- No drop shadows. Depth comes from surface steps and the scene behind the page.
- A film grain overlay sits above the scene at 6% opacity.

## Motion

| Token | Value | Use |
|---|---|---|
| `--motion-press` | 120ms, ease-out | Button and chip press, scale to 0.97 |
| `--motion-hover` | 160ms, ease | Colour changes on hover |
| `--motion-ui` | 220ms, ease-out | Accordions, menus, tooltips |
| `--motion-panel` | 400ms, ease-out | Drawers, the mobile menu |
| `--motion-reveal` | 700ms, ease-out | Section reveals, 60ms stagger, 12px travel |

Easing: `--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)` for anything entering or responding. `--ease-in-out` is `cubic-bezier(0.77, 0, 0.175, 1)` for things moving on screen. Ease-in is not used.

Rules:
- Animate `transform` and `opacity` only.
- UI motion stays under 300ms. Only section reveals and the scene run longer.
- Nothing scales in from zero. Entrances start at 0.95 or higher with opacity.
- Hover effects sit behind `@media (hover: hover) and (pointer: fine)`.
- Reduced motion keeps fades and removes travel, scale and scroll-driven movement.
- Scroll-driven motion is scrubbed by GSAP ScrollTrigger with Lenis. The scene is the only element that moves continuously.

## Loading and reveal

Loading states use `ascii-reveal` (0.3.0). Its CSS properties are mapped in `tokens.css`: glyphs in JetBrains Mono, accent and flash in mint.

| Where | What plays |
|---|---|
| Entrance | The star-H mark as the loading mascot with a percent readout, then the hero decodes in (`duration="cinematic"`, origin centre) |
| Live data | `AsciiSkeleton` in the `scan` variant while fetching, then values decode in with the `decode` preset (about 400ms) |
| Section headings and stats | Decode once as they enter the viewport |
| Body copy, cards, buttons | No decode. Buttons and chips use `data-ascii="fade"` |

The loader is capped at about 3 seconds and shows once per session.

## Components

| Component | Spec | States |
|---|---|---|
| Nav | Sticky pill, 56px tall, glass surface with a hairline. Logo left, anchor links centre, Launch app right. Below 1024px the links collapse into a menu | Link hover: text goes white. Current section: mint |
| Button, primary | 48px tall, 10px radius, mint fill, Obsidian text, 14px semibold | Hover: lighter mint. Active: scale 0.97. Focus: 2px mint ring, 3px offset |
| Button, secondary | Same size, transparent, strong hairline, white text | Hover: surface-hover fill |
| Button, tonal | Same size, accent tint fill at 15%, accent text, hairline edge (white 8%). Measured from the active tab in the app. Used for the third action, such as Become an affiliate | Hover: tint at 20% |
| Text link | Mint, underline from the font, arrow optional | Hover: lighter mint |
| Eyebrow | Mono, 12px, uppercase, mint, optional index ("01") | |
| Section header | Eyebrow, display-lg headline with one mint phrase, body-lg lead capped at 68 characters | |
| Stat | Display numeral in tabular figures over a mono label. Alternate mint and white across a row | Loading: ASCII skeleton |
| Card | Carbon surface, hairline, 16px radius, 20 to 32px padding | Hover on linked cards: surface-hover |
| Callout | Carbon surface with a 2px mint rule on the left, no radius on that side | |
| Ticker wall | Display type in rows. First rank mint, second white, third disabled grey. Text only, no company logos | |
| Chain table | Mono header row, hairline between rows, status in mono | Scrolls inside its own frame below 768px |
| Fairness bar | 12px track, brand gradient fill for the public share, labels in mono | Fill animates once on entry |
| Roadmap | A ladder of 49 thin rungs after the roadmap on taiko.xyz: a fan across the top at about 18 degrees, then three sweeps at 5 degrees. The rungs are always drawn in a quiet grey. As the section scrolls, colour wipes down them, parallel to the rungs, running through five phase colours in order: teal `#0D9488`, blue `#155DFC`, purple `#9810FA`, pink `#E60076` and orange `#F54A00`. They measure 3.5, 4.8, 5.1, 4.2 and 3.3 to 1 on the light canvas. No two phases share a colour, and a rung takes the colour of the card it passes, blending toward the next card's colour on the way. Five phase cards stand on the ladder. Each is skewed to the slope of the rungs under it (-18 and -16 degrees on the fan, -5 below) and the skew never changes. A card shows its label and title until the wipe reaches it, then its panel grows upward from a fixed bottom edge. The panel is see-through: a gradient fill in the phase colour, a border that fades in toward the bottom and a 15px backdrop blur. The label and title lie on the rungs with a halo in the canvas colour, which keeps the lines off the letters. Phase colours are for lines, edges and fills only. Text stays ink. The last rungs fade out, since no card stands on the tail. Light theme. The map has three fixed widths (576, 680 and 891px) and crops evenly at the sides on phones, as Taiko's does. The nav takes the light theme while it sits over the section | Current phase: accent label |
| FAQ | `details` and `summary`, hairline between items, plus icon turns 45 degrees when open | Open and close: 220ms |
| Mobile CTA bar | Fixed to the bottom below 768px, primary button full width | |
| Loader | Full-screen Obsidian, ASCII mark centred, percent in mono | Leaves with a fade |

## On-chain view

The page has two states. Solid is the default. On-chain is entered by holding the left mouse button. There is no pill or button.

| | Solid | On-chain |
|---|---|---|
| Surfaces | Carbon fills, hairlines | No fills, mint outlines (`--onchain-line`) |
| 3D mark | Lit, solid | Edges only, hidden lines removed |
| Camera | Flat projection | Perspective, layers separated in depth |
| Type | Display and text faces | Same, plus mono labels with on-chain data |
| Background | Obsidian with grain | Obsidian with a receding block grid |

- Holding for `--hold-delay` (350ms) on any non-interactive area enters the view. Moving more than `--hold-move-tolerance` (6px) first cancels it, so clicks, text selection and drags keep working.
- A ring (`--hold-ring-size`, 40px) fills at the cursor during the hold. In the hero a mono hint follows the cursor: "Hold to see on-chain".
- Entering takes `--onchain-in` (600ms). Leaving takes `--onchain-out` (300ms).
- Touch uses a long press. Keyboard users get a toggle button that is visible only on focus. Esc leaves the view. Reduced motion crossfades.
- Mono labels decode in with `ascii-reveal`.
- The view is one attribute, `data-view="onchain"` on `<html>`. Each section answers it in CSS, and the 3D scene reads the same attribute.
- In the roadmap the light section flips to Obsidian, which is the sharpest change on the page. Cards lose their fill and become outlines. Rungs read as blocks: solid for the stretch already live, dashed for what is not on-chain yet. Each card shows a mono line with what exists on-chain for that phase.

## 3D scene

Planned in a separate step. Fixed for now: one canvas behind the content at `--z-scene`, Obsidian background, mint as the only emissive colour, grain on top, and a still image for phones and reduced motion. The object is the star-H mark, modelled with the img2threejs skill.

## Accessibility

- Text contrast meets WCAG AA at every pairing in the colour table.
- Every interactive element has a visible focus ring and a 44px minimum target.
- The canvas, grain and ASCII overlays are hidden from assistive tech. Real text stays in the DOM during every reveal.
- Motion respects `prefers-reduced-motion`.

## Logo

From the brand kit: use the supplied SVG files, keep clear space of one crossbar height, minimum 24px for the mark and 96px for the lockup. Do not rotate, stretch, outline or shadow the mark, and do not set mint on white.

## Open

- The 3D scene direction.
