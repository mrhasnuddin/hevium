// Where the site lives and what it links to. Entries marked "open" wait on an answer from the product team.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** The address of a file in public/, under whatever path the site is served from. */
export const asset = (path: string) => `${BASE}${path}`;

export const SITE = {
  name: 'Hevium',
  origin: 'https://hevium.xyz',
  path: '/',
  app: 'https://app.hevium.xyz/',
  docs: 'https://docs.hevium.xyz/',
  mcp: 'https://mcp.hevium.xyz/',
  brand: 'https://app.hevium.xyz/brand/',
  x: 'https://x.com/heviumxyz',
  threads: 'https://www.threads.com/@hevium.xyz',
  refParam: 'ref',
  appPaths: { app: '', launch: 'launch', terminal: 'terminal', callouts: 'feed', affiliate: 'invite' },
  legal: { terms: '', privacy: '' }, // open: an empty address means the footer leaves the link out
} as const;

export type AppTarget = keyof typeof SITE.appPaths;

// The six chains, in the order the page names them, each with its self-hosted logo in public/chains/.
export const CHAIN_LOGOS = [
  { name: 'Base', file: 'base.svg' },
  { name: 'Robinhood Chain', file: 'robinhood.webp' },
  { name: 'BNB Chain', file: 'bnb.svg' },
  { name: 'Solana', file: 'solana.png' },
  { name: 'Elysium', file: 'elysium.svg' },
  { name: 'HyperEVM', file: 'hyperevm.svg' },
].map((chain) => ({ name: chain.name, src: asset(`/chains/${chain.file}`) }));

// Self-hosted token icon in public/tokens/ (SOL shares its chain mark in public/chains/solana.png). Most are <ticker>.svg; these are not.
// USDT0 is Tether's own token on HyperEVM and wears Tether's mark.
const TICKER_FILES: Record<string, string> = { 'USD+': 'usdplus.svg', USDT0: 'usdt.svg', USDG: 'usdg.png', DIS: 'dis.png', ETH: 'eth.png', HYPE: 'hype.png' };
export const tickerLogo = (ticker: string) =>
  ticker === 'SOL' ? asset('/chains/solana.png') : asset(`/tokens/${TICKER_FILES[ticker] ?? `${ticker.toLowerCase()}.svg`}`);
