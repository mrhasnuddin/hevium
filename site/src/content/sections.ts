// Copy for each section, added one section at a time as the page is built.
// `highlight` is the one phrase of the headline set in the accent colour, so it must appear in `title`.
export type SectionCopy = { eyebrow?: string; title: string; highlight: string; lead?: string };

export type EngineId = 'stocks' | 'launch' | 'agents' | 'earn';
export type EngineLink = { id: EngineId; label: string; href: string; summary: string };
export type NavItem = { label: string; href: string; external?: true; children?: readonly EngineLink[] };

// The four engines the solution names, in page order, with a short line for the Solution menu.
export const ENGINES: readonly EngineLink[] = [
  { id: 'stocks', label: 'Stocks', href: '#stocks', summary: 'Tokens paired with stocks and digital dollars' },
  { id: 'launch', label: 'Launch', href: '#launch', summary: 'Fixed supply, fair launch in 15 seconds' },
  { id: 'agents', label: 'Agents', href: '#agents', summary: '24/7 AI orderflow over MCP with guardrails' },
  { id: 'earn', label: 'Earn', href: '#earn', summary: 'Share your link and keep 20% of the fee' },
];

// The nav bar's links, in page order. Solution expands into the four engines; Docs leaves the page.
export const NAV: readonly NavItem[] = [
  { label: 'Problem', href: '#problem' },
  { label: 'Solution', href: '#solution', children: ENGINES },
  { label: 'Chains', href: '#chains' },
  { label: 'Trust', href: '#trust' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Docs', href: 'https://docs.hevium.xyz/', external: true },
];

// The hero is the headline and two buttons over the 3D scene, which needs the rest of the screen.
export const HERO = {
  title: 'The multi-chain stock & fair-launch terminal.',
  highlight: 'stock & fair-launch',
} satisfies SectionCopy;

export const SECTIONS = {
  problem: {
    eyebrow: 'The problem',
    title: 'First-generation launchpads hit three walls.',
    highlight: 'three walls',
  },
  // The answer to the walls: the head of the frame that holds the four engines.
  solution: {
    eyebrow: 'The solution',
    title: 'One terminal. Four engines.',
    highlight: 'Four engines',
    lead: 'Hevium puts stock pairs, fair launches, AI agents and referral fees in one terminal.',
  },
  stocks: {
    eyebrow: 'Stocks',
    title: 'Meme speed meets Wall Street.',
    highlight: 'Wall Street',
    lead: 'Earnings days move markets and timelines. On Hevium a token can trade against the stock in the headlines.',
  },
  launch: {
    eyebrow: 'Launch',
    title: 'A fair launch in 15 seconds.',
    highlight: '15 seconds',
    lead: 'Name it, pick a pair and it is live. Supply is fixed, nothing is minted ahead for insiders, and a launch guard deters sniper bots.',
  },
  agents: {
    eyebrow: 'Agents',
    title: 'Built for 24/7 AI orderflow.',
    highlight: '24/7',
    lead: 'Connect Claude, Cursor or your own bot over MCP. Set a cap per trade and a budget per day, and it trades around the clock.',
  },
  earn: {
    eyebrow: 'Earn',
    title: 'Bring traders. Keep 20% of the fee.',
    highlight: '20% of the fee',
    lead: 'Share your link and earn from the 1.0% fee on what they trade.',
  },
  chains: {
    eyebrow: 'Five chains',
    title: 'One terminal, five chains.',
    highlight: 'five chains',
    lead: 'Sign in with Google, pick a chain and trade. Each chain brings its own crowd and its own pairs, all live on mainnet.',
  },
  // Guarantees and FAQ in one section.
  trust: {
    eyebrow: 'Trust',
    title: "Don't trust. Verify.",
    highlight: 'Verify',
    lead: 'Four guarantees anyone can check on-chain, and answers to the common questions.',
  },
  // The last thing on the page. It has no eyebrow: the Hevium mark stands in that place.
  final: {
    title: 'Start trading in one terminal.',
    highlight: 'one terminal',
    lead: 'Stock pairs, fair launches, AI agents and referral fees on five chains. Sign in with Google and you are in.',
  },
} satisfies Record<string, SectionCopy>;

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
    title: 'Humans only',
    body: 'Trading runs through manual web screens. AI agents get no direct connection and no spending limits.',
  },
];

// Two facts that stand beside the walls, both from the spec: where Hevium is live, and the launch split's insider share.
export const PROBLEM_FACTS = ['Live on 5 chains', '0% insider allocation'];

// The ticker ring, in its order round the ring: ten stocks and funds with the three digital dollars among them.
// Each is named in text. The coin also carries the app's icon for the one it lands on (config/site.ts tickerLogo).
// NVDA comes first: it is the pair shown when nothing moves.
export const TICKERS = ['NVDA', 'TSLA', 'USD+', 'AAPL', 'SPY', 'COIN', 'USDC', 'AMZN', 'MSFT', 'PLTR', 'USDG', 'AMD', 'DIS'];

export const STOCK_COUNT = { value: '17+', label: 'stock and dollar pairs' };

// What the ring shows, in words, for a screen reader and a crawler. The deck argues this section by market
// size; the page states what a trader can do and leaves the market claims out.
export const STOCK_RING =
  'Thirteen tickers turn in a ring: stocks and funds such as NVDA, TSLA and SPY, and the digital dollars USD+, USDC and USDG. A token coin drops onto one after another, and the two trade as a pair.';

// The launch split, from the deck: where a new token's fixed supply goes. One part per bin of the press.
export const LAUNCH_SPLIT = [
  { value: '80%', label: 'public' },
  { value: '20%', label: 'locked liquidity' },
  { value: '0%', label: 'insiders' },
];

// What the press shows, in words, for a screen reader and a crawler. The launch guard "deters" bots, as the
// deck puts it: the page never says it stops every one.
export const LAUNCH_PRESS =
  'A coin press under a dome strikes one coin while a counter runs to fifteen. Each coin splits as it leaves, into three bins: four parts in five go to the public, one in five is locked as liquidity, and the bin for insiders stays empty. Small bots come at the press and bounce off the dome.';

// The two limits an agent trades inside, each with the setting that holds it (docs.hevium.xyz/llms-full.txt,
// section 6, read on 2026-11-22). The amounts are examples: three trades at the cap spend the day's budget.
export const AGENT_LIMITS = [
  { label: 'per trade', setting: 'HEVIUM_MAX_TRADE_ETH', value: '0.1 ETH' },
  { label: 'per day', setting: 'HEVIUM_DAILY_BUDGET_ETH', value: '0.3 ETH' },
];

// The AI clients shown above the prompt card, matching the MCP clients visitors already use.
export const AGENT_CLIENTS = ['Claude', 'Gemini', 'Cursor', 'Codex'] as const;

// A sample prompt session over MCP. The caps match AGENT_LIMITS and the chart beside it: three buys spend
// the daily budget at dips across the day, and the fourth is held. The trades are an illustration.
export const AGENT_PROMPT = {
  prompt: 'Buy 0.1 ETH of NVDA dips. Max 0.3/day.',
  placeholder: 'Ask your agent',
  replies: [
    { text: 'Bought 0.1 ETH of NVDA', time: '08:15', through: true },
    { text: 'Bought 0.1 ETH of NVDA', time: '11:45', through: true },
    { text: 'Bought 0.1 ETH of NVDA', time: '15:15', through: true },
    { text: 'Held 0.1 ETH · daily budget reached', time: '18:45', through: false },
  ],
} as const;

// What the chart beside the session shows, in words, for a screen reader and a crawler.
export const AGENT_CHART =
  'A line chart of a price through one day, drawn as the session runs. Each time the agent buys, a B marks the line with the amount, 0.1 ETH, at a dip in the price. The fourth buy is held at the daily budget and is marked in amber.';

// The Earn section's sample share cards, front card first. Each is on a pair the page already names. The
// figures are made up, and shown with no tag saying so (the user, 2026-11-23): `bought` is dollars put in, `result` the gain on
// them, `volume` the dollars the card's referrals went on to trade. The fee a card shows is 0.20% of that.
export const SHARE_CARDS = [
  { ticker: 'NVDA', result: '+42%', bought: 500, volume: 42_000 },
  { ticker: 'TSLA', result: '+18%', bought: 1_200, volume: 18_500 },
  { ticker: 'USDC', result: '+7%', bought: 2_000, volume: 120_000 },
  { ticker: 'COIN', result: '+63%', bought: 300, volume: 9_000 },
  { ticker: 'AAPL', result: '+25%', bought: 800, volume: 65_000 },
];

// The words of the Earn section. The perks say what the docs say (docs.hevium.xyz/llms-full.txt, section 3,
// read on 2026-11-22): a referrer's share is paid on launch buys and on graduated swaps on the EVM chains.
// Nothing here promises an income.
export const EARN = {
  fee: 'Referral fee',
  name: 'Put your name on it',
  protocol: '0.80% protocol',
  you: '0.20% you',
  perks: [
    { title: '20% of the fee', text: 'A fifth of the 1.0% fee when someone you brought buys a launch, or swaps a graduated token on an EVM chain.' },
    { title: 'Paid on-chain', text: 'Swaps pay you in the same transaction. Launch buys build up in an escrow contract for you to claim.' },
    { title: 'Your link, your cards', text: 'Share a card or a replay of any trade, or post a callout. Each one carries your link:' },
  ],
};

// The five chains, in the order the page names them (config/site.ts CHAIN_LOGOS): who each suits, and a few
// of the assets that trade there. Who it suits is the deck's reading (p7), put in a visitor's words. The
// assets are from the docs' list for that chain (docs.hevium.xyz/llms-full.txt, section 1, read on
// 2026-11-22), and each has an icon the app serves.
export const CHAINS = [
  { name: 'Base', suits: 'Coinbase users and stable-yield holders', trades: ['ETH', 'USDC', 'USD+', 'COIN'] },
  { name: 'Robinhood Chain', suits: 'Stock traders, with markets open 24/7', trades: ['NVDA', 'TSLA', 'AAPL', 'SPY'] },
  { name: 'BNB Chain', suits: 'High-volume launches, worldwide', trades: ['BNB', 'USDT', 'USDC'] },
  { name: 'Solana', suits: 'Fast traders and bots', trades: ['SOL', 'USDC'] },
  { name: 'Elysium', suits: 'DeFi traders who like to be early', trades: ['HYPE', 'USDC'] },
];

// How it works, in three words: the page's old "How it works" section, folded into this one.
export const CHAIN_STEPS = ['Sign in', 'Pick a chain', 'Trade'];

// What the piece shows, in words, for a screen reader and a crawler. Hevium is one terminal on five chains.
// It does not move funds from one chain to another, so nothing here says it does.
export const CHAIN_ROUTE =
  'The Hevium mark stands as a hub, with a lane running from it to each of five chains: Base, Robinhood Chain, BNB Chain, Solana and Elysium. A pulse travels from the hub down the lane of the chain that is picked, and a buy lands there.';

// The four guarantees, each with the fact behind it in `proof`. They say what the docs say and no more
// (docs.hevium.xyz/llms-full.txt, read on 2026-11-22): Google sign-in makes a non-custodial wallet; supply is
// 1,000,000,000 a token; at graduation the pool tokens are burned to the dead address on the EVM chains and
// locked on Solana; the vault is an on-chain locker that vests over 180 days or burns. The deck describes the
// vault as revenue backing liquidity; the docs do not, so neither does this.
export const GUARANTEES = [
  { title: 'Your keys', text: 'Hevium never holds your deposits. Every trade settles on-chain from your own wallet.', proof: 'Non-custodial wallet' },
  { title: 'Fixed supply', text: 'Every token launches with the same fixed supply, and nothing is minted ahead for insiders.', proof: '1,000,000,000 per token' },
  { title: 'Locked liquidity', text: 'When a token graduates, its pool tokens are burned or permanently locked.', proof: 'Burned to 0x0000...dEaD' },
  { title: 'Buyback vault', text: 'Treasury and creator tokens sit in an on-chain vault that releases them over 180 days or burns them.', proof: '180-day vesting' },
] as const;

// Stated as done. The audit has to be finished before this page goes live, and no auditor or report is named
// until there is one to name.
export const AUDIT_NOTE = 'Security audited';
export const AUDIT_TEXT = 'The contracts have been through a security audit. Their addresses and build settings are listed in the docs, so anyone can check what is deployed.';

// The bento's first cell: three short lines for the first guarantee, set large, beside a feed of trades. The
// feed is an illustration, not live data. Each trade is on a pair or chain the page names.
export const TRUST_WORDS = ['You hold.', 'You sign.', 'It settles.'];
export const TRUST_FEED = [
  { side: 'buy', what: 'Buy on the NVDA pair', where: '0.1 ETH on Robinhood Chain' },
  { side: 'sell', what: 'Sell on the COIN pair', where: '0.25 ETH on Base' },
  { side: 'buy', what: 'Buy on a launch curve', where: '0.05 BNB on BNB Chain' },
  { side: 'buy', what: 'Buy on the USD+ pair', where: '120 USD+ on Base' },
  { side: 'sell', what: 'Sell on a launch curve', where: '2 HYPE on Elysium' },
] as const;

// The questions. Each answer keeps to what the docs say (same file, sections 1, 3 and 6), and together they
// carry what the sections above leave out: that a token graduates by itself, where a referral does not pay,
// Solana's own swap fee, and the risk. Agents are said to trade on all five chains, which has to be true
// before this page goes live: when it was written the docs had Solana as read and quote only.
export const FAQ = [
  {
    q: 'Who holds my funds?',
    a: 'You do. Signing in with Google creates a non-custodial wallet for the EVM chains, and you can link a Solana wallet such as Phantom or Solflare. Hevium never holds deposits, and every trade settles on-chain.',
  },
  {
    q: 'How does a fair launch work?',
    a: 'Every token has a fixed supply of 1,000,000,000. 80% is sold on a bonding curve that is open to everyone and 20% is set aside as liquidity, with nothing minted ahead for insiders. A launch guard taxes buys made in the first five seconds, starting at 95% and falling to zero, to deter sniper bots. When the curve fills, the token graduates by itself to an exchange pool on its chain.',
  },
  {
    q: 'What happens to liquidity after a token graduates?',
    a: 'It is put out of reach. On Base, BNB Chain and Robinhood Chain the pool tokens are burned to the dead address. On Elysium the position is minted straight to the dead address, and on Solana it is permanently locked.',
  },
  {
    q: 'What does trading cost?',
    a: '1.0% per trade, on launch curves and on graduated tokens. The one exception is a graduated token on Solana, which swaps through Jupiter at 0.50%.',
  },
  {
    q: 'How do referral fees work?',
    a: 'You earn 20% of the 1.0% fee, which is 0.20% of the trade, when someone you referred buys on a launch curve or swaps a graduated token on an EVM chain. Swaps pay you in the same transaction, and curve buys build up in an escrow contract for you to claim. Curve sells and graduated swaps on Solana pay no referral.',
  },
  {
    q: 'Can an AI agent trade for me?',
    a: 'Yes, over MCP. Connect Claude, Cursor or another client to mcp.hevium.xyz and approve each transaction yourself, or run the server yourself with a cap per trade and a budget per day. Agents trade on all five chains.',
  },
  {
    q: 'Has the code had a security audit?',
    a: 'Yes. The contracts have been through a security audit. Their addresses and build settings are listed in the docs, so anyone can check what is deployed.',
  },
  {
    q: 'What are the risks?',
    a: 'Tokens launched here are new and can lose all of their value. Prices on a bonding curve move fast in both directions, and a smart contract can have faults that no review has found. This page is not financial advice. Trade only what you can afford to lose.',
  },
];
