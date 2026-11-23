// Where the site lives and what it links to. Entries marked "open" wait on an answer from the product team.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** The address of a file in public/, under whatever path the site is served from. */
export const asset = (path: string) => `${BASE}${path}`;

export const SITE = {
  name: 'Hevium',
  origin: 'https://hevium.xyz',
  path: '/home/',
  app: 'https://hevium.xyz/',
  docs: 'https://docs.hevium.xyz/',
  mcp: 'https://mcp.hevium.xyz/',
  brand: 'https://hevium.xyz/brand/',
  x: 'https://x.com/heviumxyz',
  refParam: 'ref', // open: confirm the name
  appPaths: { app: '', launch: '', terminal: '', callouts: '', affiliate: '' }, // open: deep links into the app
  legal: { terms: '', privacy: '' }, // open: an empty address means the footer leaves the link out
} as const;

export type AppTarget = keyof typeof SITE.appPaths;

// The five chains, in the order the page names them, each with the logo the app itself shows for it.
// The logos are the app's own files. In production this page is served from the same site, so they are local to it.
export const CHAIN_LOGOS = [
  { name: 'Base', file: 'base.svg' },
  { name: 'Robinhood Chain', file: 'robinhood.webp' },
  { name: 'BNB Chain', file: 'bnb.svg' },
  { name: 'Solana', file: 'solana.png' },
  { name: 'Elysium', file: 'elysium.svg' },
].map((chain) => ({ name: chain.name, src: `${SITE.app}chains/${chain.file}` }));

// The app's own icon for a ticker, as the app serves it. Most are <ticker>.svg; these are not.
const TICKER_FILES: Record<string, string> = { 'USD+': 'usdplus.svg', USDG: 'usdg.png', DIS: 'dis.png', ETH: 'eth.png', HYPE: 'hype.png' };
// The app has no icon for SOL among its tokens (checked on 2026-11-22); its chain's logo is the same mark.
export const tickerLogo = (ticker: string) =>
  ticker === 'SOL' ? `${SITE.app}chains/solana.png` : `${SITE.app}tokens/${TICKER_FILES[ticker] ?? `${ticker.toLowerCase()}.svg`}`;
