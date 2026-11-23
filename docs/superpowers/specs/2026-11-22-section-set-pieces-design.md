# Section set pieces: design

Written 2026-11-22. Changes how every section after the hero is designed. It replaces the card-based middle sections in the build plan (Task 5) and sits beside `docs/landing-page-spec.md`, which still governs constraints, SEO and links. Where the two disagree on what a section shows, this document wins.

> **Changed on 2026-11-22, after the first set piece was built.** The user saw Problem as three walls and replaced it: "lets change to this kind of cards instead.. with each card we have an asset as the thumbnail with ascii reveal when hover", pointing at OriginKit's features-04 section. Problem is now that card layout (see `DESIGN.md`, Card and ASCII image), and the walk-through below is not built. Whether the remaining sections stay as set pieces or become cards was still open when this note was written: ask before building the next one.

## Intent

The user reviewed the first built sections and set a new direction, in their words:

- The statement section "felt kinda contrained due to the lines and box". They want the feel of fobo.fun, "where i felt like the whole canvas is immersive because the border is not visible + they have the 3D elements".
- "for all of our sections here will be the same as well, each section compliments each other and not the standard website design strcuture and ai slop."
- "Less is More... let assets / diagram / medias / animated svg do the talking.. text are there as supporting. Need to balance these 2."
- "the rest of the section we need to be super creative awwwwards level kind of creative to give user a unique experience when exploring our landing page."

Why: a headline over three bordered cards reads to them as generic. Each section should be something to watch or play with, and the page should feel like one space.

## Goals

- Every section makes its point with one visual. A visitor who reads nothing but the headline still gets it.
- The page reads as one continuous canvas, and neighbouring sections connect.
- Each visual is specific to Hevium's claim in that section, not decoration.

## Non-goals

- No second WebGL scene. Real 3D stays in the hero.
- No new claims. Words come from the spec and the deck's public pages.
- No change to the roadmap's design, which the user approved, or to FAQ, where text leads.

## Anti-goals

These would make it a failure even if it works:

- A section whose main content is a grid of bordered cards, or a panel with a frame round it.
- A visual that is only atmosphere: it must show the claim.
- Text that repeats what the visual already shows.
- Scroll that feels taken away from the visitor: no long pinned stretches, no scroll-jacking.

## Constraints

- From `docs/landing-page-spec.md`: 360px floor, one H1, one H2 per section, tagged app links, no investor material, no logos of stock companies or chains outside the hero.
- Tokens only for colour and type. Obsidian canvas. Mint is still the one accent.
- Each visual works on a phone, shows a finished still under reduced motion, and has a text alternative. The page stays readable with JavaScript off.
- A visual runs only while it is on screen.

## Approaches

| Approach | What it is | Trade-off |
|---|---|---|
| One set piece each | fobo.fun's way. One canvas, and one visual per section built for that section's idea | Each piece is its own build. Unity has to be designed in. **Picked by the user on 2026-11-22** |
| One continuous 3D world | Tenbin's way. The hero's scene runs under the whole page and its objects reappear per section | Strongest sense of one space. Heaviest, needs a separate phone version, and depends on the hero scene's code |
| Type-led | Walrus's way. Giant statements, with 3D as pre-rendered video | Lightest. Least interactive, and needs rendered footage we do not have |

## Rules every section follows

1. **One canvas.** No rule between sections, no boxed panels, no framed cards as a section's content. Text and visuals sit directly on the canvas.
2. **Text budget.** One headline of seven words or fewer, at most 25 words of support, and short labels beside the visual. FAQ is the exception.
3. **Three kinds of visual, one look.**
   - *Objects* (Launch, Earn, Guarantees, and every coin): solid isometric figures drawn in SVG. Their faces are the neutral surface tones, light to dark, and mint lights only the part that carries the point. This keeps the one-accent rule in `DESIGN.md`.
   - *Type pieces* (Problem, Stocks, Agents): the visual is made of characters or type.
   - *One diagram* (Five chains).
   All three share the palette, the mono labels and the coin.
4. **The ground.** Each piece draws its own patch of the hero floor's characters under and round it: upright, on the floor's 9 by 15px grid, drifting slowly, fading out on every side, as the statement section does now. It is not one page-long layer and it does not mirror the objects. The light roadmap section has none.
5. **Connections between sections**, where they are named in the table below. They are matched ends, not one drawing: an element leaves the bottom of one section and a matching one enters the top of the next at the same place and angle. None is needed at the roadmap's sheet or round the FAQ.
6. **Coins recur.** A plain token coin, never the Hevium mark, appears in most pieces: dropped, struck, carried, shaved. It ties the page together the way fobo's floating coins do.
7. **Motion.** A piece starts when it enters the screen and loops calmly while it is there. Only the statement and Problem follow the scroll position. Problem holds the screen for at most one extra screen of scrolling. This changes `DESIGN.md`, which says only the hero scene moves continuously.
8. **Labels are HTML.** Words are never drawn inside an SVG. They sit beside or over the figure as real text.
9. **Text alternative.** Each visual is a `figure` with a description of one or two sentences for screen readers and crawlers. It carries any claim the visual shows without words.
10. **On-chain view.** Objects turn to mint outlines with no fills, and each section's characters hide, as the statement's already do. A mono label appears only where the repo holds the fact: the fee split in Earn (0.80% protocol, 0.20% referrer), the chain IDs in Five chains (8453, 56, 4663) and live or pending in the roadmap.

## The sections

| Section | The visual | Words kept |
|---|---|---|
| What is Hevium | Built. The statement lights as it is read and three figures count up | The statement, three figures |
| Problem | You stand on the ground looking straight down a path. Three walls face you, one behind another, each built from the floor's characters with its name across its face. Scrolling walks you forward: the nearest wall grows to fill the screen, breaks into characters and falls, and the next stands behind it. After the third, open ground and one line. **Still** (reduced motion, no script): the three walls standing in a row into the distance, all three names readable. **Connects:** the statement's characters gather into the first wall; the last wall's characters run off sideways into Stocks | Headline. On the walls: Crypto-only, Sniper bots, Humans only. Closing line: "Hevium puts stock pairs, fair launches and AI trading in one terminal." |
| Stocks | A ring of tickers turns in depth across the full width, like a ticker round a building: stock tickers and the three digital dollars together. A coin drops in from above, lands on one ticker, and the two lock as a pair while a short price line draws out from them. Then the next coin. **Phone:** the ring flattens to two straight tapes running opposite ways, at a readable size. **Connects:** the paired coin falls out of the bottom toward Launch | Headline, "17+ stock and dollar pairs", "Open the terminal" |
| Launch | A small coin press, the first object. A blank drops in, a clock beside it counts fifteen (sped up, about four seconds a cycle), a finished coin comes out. Coins sort into three bins marked 80, 20 and 0, and the third stays empty. Small bots approach and bounce off a dome over the press. **Connects:** a conveyor carries coins out of the bottom | Headline, "80% public", "20% locked liquidity", "0% insiders", "Launch a token" |
| Agents | The conveyor enters from above and runs past a terminal with no window frame: lines of mono text typing themselves. An agent connects from Claude, then from Cursor, then places trades while a small day-and-night dial turns. Two gauges, per trade and per day, fill to their marks and hold. **Connects:** the conveyor runs on out of the bottom | Headline, the typed lines, "MCP", "Docs" |
| Earn | The conveyor reaches a splitter, the second object. Each coin passing loses a thin shaving, the 1.0% fee. One fifth of every shaving drops into your tray, where a counter climbs. A share card slides out beside the tray now and then, as a caller's proof of a trade | Headline, "20% of the 1.0% fee", "Become an affiliate" |
| Five chains | Seen from above at an angle: one login point at the centre and five rings round it, one per chain, each with a bead that travels its ring. Under the figure, the five chain names as a row of real buttons. Choosing a name brings its ring forward and shows one line on who that chain is for; a coin then leaves that ring's bead: a trade. Three small step words sit at the centre, the ring and the coin: Sign in, Pick a chain, Trade. **No script:** the five names with all five lines showing | Headline, five chain names, one line each, three step words |
| Roadmap | Designed and approved in `design-system/preview.html`. Still to be ported into the site (plan Task 6). The one light section | As approved |
| Guarantees | A vault with its front cut away, the third object. Outside the door a key hangs on your side, never inside. Inside: a stack of coins under a sealed band, a tank with a padlock, and a chute carrying coins from a fee tray back into the vault. An empty badge slot on the door | Headline. Labels: Your keys, Fixed supply, Locked liquidity, Buyback vault. Note: "Audit in progress" |
| FAQ | Plain questions and answers on the canvas, with no boxes and no lines between them | All of it |
| Final | The page's coins gather under one button | Headline, "Launch app" |

**How it works** is folded into Five chains, whose three step words are its content. The page goes from eleven sections after the hero to ten. The steps keep the anchor `id="how"`, so the hero's "How it works" button still lands on them. This is my proposal, not something the user asked for.

## Where the spec's other claims go

The spec lists more per section than the words above. Nothing leaves the page's HTML: each claim is shown by the visual and stated in its text alternative, or it moves to the FAQ.

| Claim | Where it goes |
|---|---|
| Digital-dollar pairs (Stocks) | In the ticker ring: USD+, USDC, USDG |
| Auto-graduation (Stocks) | FAQ, under "How does a fair launch work?" |
| The three walls' explanations (Problem) | The figure's description |
| Connect from Claude or Cursor; daily and per-trade limits (Agents) | The typed lines and the two gauges |
| Verified entries on charts, PnL share cards (Earn) | The share card in the visual, and the figure's description |
| The three steps (How it works) | The step words in Five chains |

## What the builder decides

- The exact drawing of each object. Read the `anatomy` skill before the first one. Three departures from it, which are decided here: no framed card round the figure, labels as HTML beside it (which the skill also wants), and the figure built to this page's palette. Its craft rules and its audit of each figure apply.
- Motion timing, under the `emil-design-eng` rules in `DESIGN.md`.
- How Problem follows the scroll: CSS scroll-driven animation with the still as the fallback, as the statement does. No GSAP or Lenis is installed; add neither for this.
- Each piece loops while on screen and stops when off it.
- The real command for connecting an agent, from docs.hevium.xyz, when Agents is built. Do not invent one.
- Tone tokens for object faces, added to `tokens.css` with the first object.
- Headlines over seven words are trimmed when their section is built.

## Order

1. Problem, rebuilt. It comes first on the page and tests the walk-through.
2. Launch. It is the first object and sets the look for the others. The user sees it before any other object is drawn.
3. Stocks, rebuilt, then Agents and Earn, which share the conveyor.
4. Five chains, Guarantees, FAQ, Final. The roadmap is ported in its own task.

The existing Problem and Stocks sections are replaced, not restyled. Each piece rewrites the layout tests for its section, and updates the copy tests where wording changes (for example "Humans only").

## On approval

`DESIGN.md` is updated: sections are set pieces, not card grids; the motion rule in rule 7; the object tones. The spec's page-structure table is updated for the fold and the new visuals. The build plan's Task 5 is replaced by a plan written from this document.

## Calls made here, for the user to check

- Claims that no longer appear as words in a section live in its visual, its description or the FAQ (table above).
- The ground is a patch per section, not one layer down the page.
- Objects are neutral with mint as the one lit part, not mint all over.
- Section visuals loop while on screen, which `DESIGN.md` did not allow before.
- No chain logos: chain names are text.

## Open for the user

- Fold How it works into Five chains?
- "17+ pairs" has not been checked against the app.

## Built: Stocks (2026-11-22)

The user chose the ticker ring again on 2026-11-22, over cards like Problem's and a pair board, to sit under the shared section head (eyebrow, headline, one supporting line). It is built as the table above describes, with these differences:

- The coin is drawn in star pixels, as every picture on the page now is, not as an isometric SVG.
- The coin lands on the head of the front ticker and that ticker turns mint: there is no separate pair label.
- Phones keep the ring at a smaller size (the front ticker is 24px) instead of two straight tapes.
- The ground under it is star pixels, not characters.
- The coin falls away behind the front ticker and fades. Nothing enters Launch yet, because Launch is not built.
- Auto-graduation is no longer said in this section. It still has to be said in the FAQ, as the table of moved facts says.

## Built: Launch (2026-11-22)

The user chose the coin press again on 2026-11-22, over a fairness bar and a try-it studio. It is built as the table above describes, with these differences:

- It is one wide picture in star pixels, not an isometric SVG object, and it spans the container.
- The headline is "A fair launch in 15 seconds.", trimmed to the seven-word budget from the plan's "A fair launch from the 15-second Token Studio."
- The bins are marked by figures in real text under them, not inside the drawing, and hold stacks of coins rather than loose ones.
- The clock is a counter in pixel figures above the press, inside the dome.
- The anti-bot guard is also named in the supporting line, as "a launch guard deters sniper bots", in the deck's own careful word.
- No conveyor leaves the bottom yet, because Agents is not built.

## Built: Agents (2026-11-22)

The user chose the agent terminal again on 2026-11-22, over a round-the-clock ring and a connect switcher. It is built as the table above describes, with these differences:

- The session types the real self-hosted command and its two limit settings, then real tool names, read from docs.hevium.xyz/llms-full.txt and mcp.hevium.xyz on the day. It does not show "connects from Claude, then from Cursor": those connect by pasting the address into a settings screen, which is not a terminal line. The supporting line names them instead.
- Three trades go through and a fourth is held at the day's budget, so the limits are seen to work.
- The dial and gauges were built first as one picture in star pixels. On 2026-11-22 the user had them replaced: "i want to have a chart instead... Its a line chart and the animation need to be tallied with prompt on the left, when the prompt is buy, the chart will also have a buy indicator with the amount stated", with GMGN's chart card as the reference. So the right half is a price line through one day, drawn as the session runs. Each buy lands a B on a dip with "0.1 ETH" under it at the moment its line is answered; the held trade lands an amber mark. The two limits stand under the chart as text, beside a "spent today" bar that fills with each buy.
- The terminal and the chart read one number set on the piece, in CSS, so no script keeps them in step.
- No conveyor enters or leaves: Launch's coins do not travel on yet, and Earn is not built.
- It ends in a button, "Connect an agent" (mcp.hevium.xyz), and a text link, "Read the docs", each in a new tab.

## Built: Earn (2026-11-22)

Here the user did not take the approved piece. Offered the fee splitter (as the table above), an earnings slider and a stack of share cards, they first chose the slider, which was built, and then asked for the share card stack instead: interactive, in the style of GMGN's PnL share cards, with the referral fee as each card's highlight and the perks said clearly in words beside it. So Earn is now a fan of five sample cards the visitor can turn, throw, tilt and put their name on, beside three perks. There is no splitter and no conveyor. The headline is "Bring traders. Keep 20% of the fee." and the button is "Become an affiliate". The slider version was removed.

## Built: Five chains (2026-11-22)

Three options were offered (a chain route, the approved orbit of five rings, a chain board). The user answered with two reference pictures instead, a set of chains joined by curved lanes to one hub and a hub with chains round it: "does these 2 relevant with this section ? if yes we can build following our design system", then "you can also include in your ideas to make it even more interesting". It is built as a chain route on the first reference's shape, not as the orbit in the table above:

- The Hevium hub on the left, a curved lane to each chain, the five chains in a list with who each suits, and a line on from each chain to a few of the assets that trade there.
- One chain is lit at a time. A pulse runs from the hub down its lane, the line draws on to its tokens, and a trade tag B lands on its logo. It moves down the list by itself and goes to the chain the pointer is on.
- My additions: the three step words light with the pulse, each over its own part; the buy tag reuses the design system's trade tag; the line on to the tokens; the patch of star pixels round the hub.
- The references show funds moving from chain to chain. Hevium is one terminal on five chains and does not bridge, so a pulse only runs from the hub out, and a unit test keeps bridge and speed claims out of the copy.
- How it works is folded in, as proposed above: an anchor named `how` at the top of the section, and the step words Sign in, Pick a chain, Trade.
- Chain IDs are left out. The docs give Elysium as 99901, not among the three this document listed for the on-chain view.
- Each chain's line is the deck's reading of who it is for, in a visitor's words. Its assets are from the docs' list for that chain.
- It ends in a button, "Start trading", into the app.
- The three steps ended as three still pills joined by a line, under the supporting line. They were first words that lit with the pulse, then a stepper whose line filled level with it; the user had the motion taken out: "since we are pulsing 5 times (all chains), it will look weird for the nodes to keep repeating 5 times... not animated because we already have the graph."
- Under the pointer the hub turns to the brand gradient with the mark in black, as the user asked.
- Its lines are 2px, the weight the other sections draw at, held in one token (`--line-drawn`).

## Fewer sections (2026-11-22)

With eight sections built and four to go, the user found the page had "too much sections" for a landing page and asked which could be combined, "even though it overflows the viewport". Two merges were agreed:

- **Problem into What is Hevium.** Done. One section holds the statement, then the problem (the three wall cards under a label and an `h3`). It is not held to one screen.
- **The solution and the four product sections into one frame.** Done. The user had pointed out that after the problem there was no solution, so the four product sections "felt disconnected". A solution head ("One terminal. Four engines.") with four pills was first added to the end of What is Hevium; the user then found the gap between it and the Stocks head disconnected too, and asked for the head to stay fixed while the four slide up under it, with the pills marking the one in view. On phones they chose tabs. So the frame is: wide, a pinned head over four sliding sections; narrow, four tabs.
- **Guarantees into FAQ**, as one trust section: the four guarantees as a short strip with the audit note, over the questions. Not built yet. It replaces the vault set piece in the table above.

The page is then seven stops: Hero, What is Hevium (with the problem), the solution frame (Stocks, Launch, Agents, Earn), Five chains, Roadmap, Trust and FAQ, Final.

## Built: Trust and FAQ (2026-11-22)

Guarantees and FAQ are one section, as agreed under Fewer sections above. It is not the vault of the table: the user chose the merge before any of the three sketched options for Guarantees was picked.

- The four guarantees and the audit are an animated bento of five cells, which the user asked for after first seeing them as a strip of drawn marks: "come up with our version. i want it to be animated...mixture of our star pixels and ui components", with three reference bentos. One wide cell (large words beside a feed of sample trades), then two rows of two, each a star-pixel object beside a small piece of interface. The facts are the docs' (read on the day): supply of 1,000,000,000; pool tokens burned to the dead address on the EVM chains and locked on Solana; the vault as an on-chain locker that vests over 180 days or burns.
- The buyback vault is described as the docs describe it, not as the deck does (revenue backing graduated liquidity). The two do not say the same thing.
- "Security audit in progress" is a pill with an amber dot. The word for a finished audit appears nowhere on the page, and a test holds that.
- Eight questions: who holds funds, how a fair launch works (with graduation by itself and the launch guard's five seconds), where liquidity goes, what trading costs (with Solana's 0.50%), how referrals pay (and where they do not), whether an agent can trade (and that on Solana it reads and quotes only), the audit, and the risks. The last carries the risk line the spec asks for.
- A "last updated" date stands under the questions, as the spec asks.
- Not done here: FAQPage structured data. It belongs with the SEO and GEO task.
- The roadmap is to be ported next and stands between Five chains and this section. The user reminded of it while this was being built: "dont forget to include roadmap".

## Built: Roadmap (2026-11-22)

Ported from `design-system/preview.html`, where it was designed and approved before the site was built. The user asked for it not to be left out ("dont forget to include roadmap"). It stands between Five chains and Trust and is the page's one light section.

- The ladder, the five cards, their skews and places, the colours and the way the colour wipes down are the preview's, unchanged.
- It opens with the shared section head, as every section now does: eyebrow pill, headline, one supporting line. The preview had a mono label and a display-lg headline.
- The rungs are the page's 2px drawn line, where they were 1.5px.
- It is not held to one screen: it is as tall as the ladder, and the scroll is what moves it.
- The nav bar turns light over it. That was already in the nav.
- The phases are the spec's. The deck's roadmap also counts wallets and affiliates to reach, which stay out.

## Built: Final (2026-11-23)

The table above has "the page's coins gather under one button". The user sent three references for this section and asked for it simple: "Come up with our version..i think the final CTA quite simple..no need too complex."

- The mark, a headline ("Start trading in one terminal."), one line, the Launch app button and a text link to the docs, in the middle of one screen.
- The page's coins are there, as the table has it, but as the logos themselves: the five chains and seven assets as round discs at both sides, drifting, after the reference with circles at its sides. They are left out below 1024px.
- It has no eyebrow: the mark stands in that place.
- No footer yet.

## Changed: roadmap removed, and a polish pass (2026-11-23)

The user had the roadmap taken out of the page and the design system: "its not needed in landing page anyway". The light theme went with it, since nothing else used it. The page is six stops: Hero, What is Hevium (with the problem), the solution frame, Five chains, Trust and FAQ, Final.

In the same pass, at their request:

- A section's button takes the whole row on a phone. A section ends in one button with nothing beside it: the "Read the docs" links and the FAQ's "Last updated" line are gone.
- The nav bar's corners follow its button's (18px, not a pill), and below 1024px its links fold into a menu.
- Copy treats what is still in phases as live: "Security audited", and agents trading on all five chains. Both have to be true before the page goes live.
- The three walls stand side by side from 768px.
- A section that is off screen rests its animations, and the pixel canvases paint about 30 times a second.
