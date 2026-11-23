// Page-level copy. Every claim is public: nothing from the deck's financial pages belongs here.
export const META = {
  title: 'Hevium: Multi-Chain Stock and Fair-Launch Terminal',
  description:
    'Trade fair-launch tokens paired with stocks and digital dollars on five chains. 1.0% fee, non-custodial, one login. Built for traders and AI agents.',
  // A plain statement for search and answer engines, shown at the top of the first section after the hero.
  whatIs:
    'Hevium is a non-custodial trading terminal and fair-launch launchpad on five chains: Base, Robinhood Chain, BNB Chain, Solana and Elysium. Tokens launch on a bonding curve and can be paired with stocks and digital dollars. Each trade costs 1.0%, and 20% of that fee goes to the referrer.',
} as const;

// The figures in `whatIs`, shown beside it. `words` is where the statement gives the figure: the figure lights up when the reading gets there.
export const FACTS = [
  { value: '5', label: 'Chains', words: 'five chains' },
  { value: '1.0%', label: 'Fee on each trade', words: '1.0%' },
  { value: '20%', label: 'Of that fee to the referrer', words: '20%' },
] as const;

// Shown in the footer so visitors read it before entering the app's own legal notice.
export const RISK_LINE =
  'Trading tokens carries risk, and prices can fall to zero. Hevium is non-custodial and does not give investment advice.';

export const FOOTER = {
  headline: 'One terminal. Five chains.',
  copyright: '© 2026 Hevium',
  backToTop: 'Back to top',
} as const;
