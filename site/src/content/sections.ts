// Copy for each section, added one section at a time as the page is built.
// `highlight` is the one phrase of the headline set in the accent colour, so it must appear in `title`.
export type SectionCopy = { eyebrow?: string; title: string; highlight: string; lead?: string };

export const SECTIONS = {
  problem: {
    eyebrow: 'The problem',
    title: 'First-generation launchpads hit three walls.',
    highlight: 'three walls',
    lead: 'Hevium puts stock pairs, fair launches and AI trading in one terminal.',
  },
} satisfies Record<string, SectionCopy>;

export type SectionId = keyof typeof SECTIONS;

// The deck also gives a figure for how much supply bots take on day one. It stays out until it has a source.
export const PROBLEMS = [
  {
    title: 'Crypto-only',
    body: 'Tokens stay locked to volatile gas tokens, with no bridge to stocks like NVDA or TSLA.',
  },
  {
    title: 'Sniper bots',
    body: 'Bots buy up supply at launch, and the community that arrives later becomes their exit.',
  },
  {
    title: 'Built for humans only',
    body: 'Trading runs through manual web screens. AI agents get no direct connection and no spending limits.',
  },
];
