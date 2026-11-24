import { expect, test } from 'vitest';
import * as meta from '@/content/meta';
import * as sections from '@/content/sections';
import { CHAIN_LOGOS, tickerLogo } from '@/config/site';
import { PRICE, TRADES, chartX, priceAt } from '@/lib/agentSession';
import { priceLine } from '@/lib/priceLine';

// Investor material and long dashes never reach the page, and nothing on it is said to be unfinished or a sample.
const DENY = /valuation|warrant|use of funds|run-rate|investor|revenue share|in progress|not out yet|coming soon|\bsample\b|[–—]/i;

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('no copy contains investor terms, an unfinished feature or a long dash', () => {
  const all = strings({ meta, sections });
  expect(all.length).toBeGreaterThan(0);
  expect(all.filter((s) => DENY.test(s))).toEqual([]);
});

test('title and description fit a search result', () => {
  expect(meta.META.title.length).toBeLessThanOrEqual(60);
  expect(meta.META.description.length).toBeLessThanOrEqual(160);
});

test('the what-is paragraph states the four facts answer engines need', () => {
  for (const fact of ['five chains', '1.0%', '20%', 'non-custodial']) expect(meta.META.whatIs).toContain(fact);
});

test('every figure beside the what-is paragraph is stated in it, in reading order', () => {
  const at = meta.FACTS.map((fact) => meta.META.whatIs.indexOf(fact.words));
  expect(at.every((index) => index >= 0)).toBe(true);
  expect(at).toEqual([...at].sort((a, b) => a - b));
});

test('every section headline contains its highlighted phrase', () => {
  for (const [id, s] of Object.entries(sections.SECTIONS)) expect(s.title, id).toContain(s.highlight);
});

test('every section keeps to the text budget: a headline of seven words or fewer and at most 25 words of support', () => {
  const words = (text: string) => text.trim().split(/\s+/).length;
  for (const [id, s] of Object.entries(sections.SECTIONS)) {
    expect(words(s.title), `${id} headline`).toBeLessThanOrEqual(7);
    if ('lead' in s) expect(words(s.lead), `${id} lead`).toBeLessThanOrEqual(25);
  }
});

test('the launch split is 80% public, 20% locked liquidity and 0% insiders, and adds up', () => {
  expect(sections.LAUNCH_SPLIT.map((part) => `${part.value} ${part.label}`)).toEqual(['80% public', '20% locked liquidity', '0% insiders']);
  expect(sections.LAUNCH_SPLIT.reduce((sum, part) => sum + parseFloat(part.value), 0)).toBe(100);
});

test('the launch section says in words what its press shows, and promises no more than the launch guard does', () => {
  for (const word of ['press', 'fifteen', 'insiders', 'bots']) expect(sections.LAUNCH_PRESS).toContain(word);
  // the guard deters bots; nothing says it stops every one
  expect(strings([sections.SECTIONS.launch, sections.LAUNCH_PRESS]).join(' ')).not.toMatch(/bot-proof|no bots|blocks all|impossible|guarantee/i);
});

test('the agent prompt names the supported clients, real limit settings and matching times', () => {
  expect(sections.AGENT_CLIENTS).toEqual(['Claude', 'Gemini', 'Cursor', 'Codex']);
  expect(sections.AGENT_LIMITS.map((limit) => limit.setting)).toEqual(['HEVIUM_MAX_TRADE_ETH', 'HEVIUM_DAILY_BUDGET_ETH']);
  for (const trade of TRADES) {
    const [hours, mins] = trade.time.split(':').map(Number);
    const chartMinutes = chartX(trade.at) * 24 * 60;
    expect(Math.abs(hours * 60 + mins - chartMinutes), trade.time).toBeLessThan(10);
  }
});

test('the sample trades add up: the ones that go through spend exactly the daily budget, and the next is held', () => {
  const [perTrade, perDay] = sections.AGENT_LIMITS.map((limit) => parseFloat(limit.value));
  const trades = sections.AGENT_PROMPT.replies;
  const through = trades.filter((reply) => reply.through);
  expect(Math.round(through.length * perTrade * 1000) / 1000).toBe(perDay);
  expect(trades.at(-1)!.through).toBe(false);
  expect(trades.at(-1)!.text).toMatch(/^held/i);
  expect(trades.length).toBe(through.length + 1);
});

test('the sample share cards are on pairs the page already names, with modest results', () => {
  expect(sections.SHARE_CARDS).toHaveLength(5);
  for (const card of sections.SHARE_CARDS) {
    expect(sections.TICKERS, card.ticker).toContain(card.ticker);
    expect(card.result).toMatch(/^\+\d{1,2}%$/); // a gain under 100%: nothing that reads as a promise of riches
  }
  expect(new Set(sections.SHARE_CARDS.map((card) => card.ticker)).size).toBe(5);
  for (const card of sections.SHARE_CARDS) {
    // what was sold is what was bought plus the result, and the fee is 0.20% of the volume, each to the dollar
    expect(Number.isInteger((card.bought * (100 + parseFloat(card.result))) / 100), card.ticker).toBe(true);
    expect(Number.isInteger(card.volume / 500), card.ticker).toBe(true);
  }
});

test('the earn section splits the fee as the docs do and promises no income', () => {
  expect(sections.EARN.perks.map((perk) => perk.title)).toEqual(['20% of the fee', 'Paid on-chain', 'Your link, your cards']);
  expect(sections.EARN.protocol).toBe('0.80% protocol');
  expect(sections.EARN.you).toBe('0.20% you');
  expect(strings([sections.SECTIONS.earn, sections.EARN]).join(' ')).not.toMatch(/guarantee|passive income|risk[- ]free|get rich|every trade/i);
});

test('the agent chart runs left to right through the session, and the agent buys at a low each time', () => {
  expect(chartX(0)).toBe(0);
  expect(chartX(1)).toBe(1);
  const places = TRADES.map((trade) => chartX(trade.at));
  expect(places).toEqual([...places].sort((a, b) => a - b));
  for (const [n, place] of places.entries()) {
    expect(place, `trade ${n}`).toBeGreaterThan(0.2);
    expect(place, `trade ${n}`).toBeLessThan(0.9);
    if (n) expect(place - places[n - 1], `room for mark ${n}`).toBeGreaterThan(0.1);
  }
  // every point of the line is inside the plot, in order
  expect(PRICE.map(([x]) => x)).toEqual([...PRICE.map(([x]) => x)].sort((a, b) => a - b));
  for (const [x, price] of PRICE) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(100);
    expect(price).toBeGreaterThanOrEqual(8);
    expect(price).toBeLessThanOrEqual(92);
  }
  for (const trade of TRADES.filter((made) => made.through)) {
    const x = chartX(trade.at) * 100;
    expect(priceAt(x), 'a dip').toBeLessThan(Math.min(priceAt(x - 4), priceAt(x + 4)));
  }
});

test('the five chains are the ones the logos name, in that order, each with who it suits and what trades there', () => {
  expect(sections.CHAINS.map((chain) => chain.name)).toEqual(CHAIN_LOGOS.map((logo) => logo.name));
  for (const chain of sections.CHAINS) {
    expect(chain.suits.trim().split(/\s+/).length, chain.name).toBeLessThanOrEqual(7);
    expect(chain.trades.length, chain.name).toBeGreaterThanOrEqual(2);
    expect(chain.trades.length, chain.name).toBeLessThanOrEqual(4);
    // every asset named has a self-hosted icon in public/
    for (const ticker of chain.trades) expect(tickerLogo(ticker), ticker).toMatch(/^\/(tokens|chains)\/[a-z]+\.(svg|png)$/);
    expect(sections.CHAIN_ROUTE).toContain(chain.name);
  }
  expect(sections.CHAIN_STEPS).toEqual(['Sign in', 'Pick a chain', 'Trade']);
});

test('the chains section claims no bridge between chains and no speed', () => {
  // Hevium is one terminal on five chains. It does not move funds between them, and the page gives no timing.
  expect(strings([sections.SECTIONS.chains, sections.CHAINS, sections.CHAIN_ROUTE]).join(' ')).not.toMatch(/bridg|cross-chain|any chain|millisecond|instant|\bseconds?\b/i);
});

test('the ticker ring holds thirteen tickers as text: ten stocks and funds and the three digital dollars', () => {
  expect(sections.TICKERS).toHaveLength(13);
  for (const ticker of sections.TICKERS) expect(ticker).toMatch(/^[A-Z+]{2,5}$/);
  expect(sections.TICKERS.filter((ticker) => ticker.startsWith('USD'))).toEqual(['USD+', 'USDC', 'USDG']);
  expect(sections.TICKERS[0]).toBe('NVDA'); // the pair shown when nothing moves
});

test('every ticker in the ring has its own self-hosted icon for the coin', () => {
  for (const ticker of sections.TICKERS) expect(tickerLogo(ticker), ticker).toMatch(/^\/tokens\/[a-z]+\.(svg|png)$/);
  expect(new Set(sections.TICKERS.map(tickerLogo)).size).toBe(13);
});

test('every pair has a price line of its own, the same on every visit, inside its frame', () => {
  const lines = sections.TICKERS.map(priceLine);
  expect(new Set(lines).size).toBe(13);
  expect(sections.TICKERS.map(priceLine)).toEqual(lines);
  for (const line of lines) {
    const points = line.split(' ').map((point) => point.split(',').map(Number));
    expect(points.length).toBeGreaterThan(8);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(200);
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(46);
    }
    expect(Math.max(...points.map(([, y]) => y)) - Math.min(...points.map(([, y]) => y))).toBeGreaterThan(12); // it moves
  }
});

test('the stocks section says in words what its ring shows, and makes no market-size claim from the deck', () => {
  for (const word of ['USD+', 'USDC', 'USDG', 'pair']) expect(sections.STOCK_RING).toContain(word);
  expect(strings([sections.SECTIONS.stocks, sections.STOCK_RING, sections.STOCK_COUNT]).join(' ')).not.toMatch(/millions|stickier|volume/i);
});

test('the four guarantees say what the docs say, each with the fact behind it', () => {
  expect(sections.GUARANTEES.map((g) => g.title)).toEqual(['Your keys', 'Fixed supply', 'Locked liquidity', 'Buyback vault']);
  const said = strings(sections.GUARANTEES).join(' ');
  // from docs.hevium.xyz/llms-full.txt, read on 2026-11-22: the supply, where the pool tokens go, and the vault's vesting
  for (const fact of ['1,000,000,000', '0x0000...dEaD', '180']) expect(said).toContain(fact);
  // nothing stronger than the docs: no promise that funds are safe, and no claim that anything cannot fail
  expect(said).not.toMatch(/guarantee[ds]?\b.*safe|risk[- ]free|cannot be hacked|impossible|100% safe/i);
  // written as done at the user's request on 2026-11-23, with no auditor or report named until there is one to name
  expect(sections.AUDIT_NOTE).toBe('Security audited');
  expect(sections.AUDIT_TEXT).not.toMatch(/\bby [A-Z]|report|certif/);
});

test('the faq asks six to eight questions and carries what the rest of the page leaves to it', () => {
  expect(sections.FAQ.length).toBeGreaterThanOrEqual(6);
  expect(sections.FAQ.length).toBeLessThanOrEqual(8);
  for (const item of sections.FAQ) {
    expect(item.q, item.q).toMatch(/\?$/);
    expect(item.a.trim().split(/\s+/).length, item.q).toBeLessThanOrEqual(80);
  }
  const said = sections.FAQ.map((item) => item.a).join(' ');
  // graduation by itself; where referrals do not pay; Solana's own swap fee; agents on every chain; the risk line
  for (const fact of ['graduates by itself', 'Curve sells', '0.50%', 'all five chains', 'can lose all of their value', 'not financial advice']) expect(said, fact).toContain(fact);
});

test('the solution names the four sections that follow it, inside the Solution nav menu and their eyebrows', () => {
  expect(sections.ENGINES.map((engine) => engine.href)).toEqual(['#stocks', '#launch', '#agents', '#earn']);
  const solutionNav = sections.NAV.find((item) => item.href === '#solution');
  expect(solutionNav?.children).toEqual(sections.ENGINES);
  expect(sections.NAV.map((item) => item.label)).toEqual(['Problem', 'Solution', 'Chains', 'Trust', 'FAQ', 'Docs']);
  const eyebrows = [sections.SECTIONS.stocks, sections.SECTIONS.launch, sections.SECTIONS.agents, sections.SECTIONS.earn].map((s) => s.eyebrow);
  expect(sections.ENGINES.map((engine) => engine.label)).toEqual(eyebrows);
  expect(sections.SECTIONS.solution.title).toBe('One terminal. Four engines.');
});

test('the problem section names three walls and leaves out the unsourced bot figure', () => {
  expect(sections.PROBLEMS.map((p) => p.title)).toEqual(['Crypto-only', 'Sniper bots', 'Humans only']);
  expect(strings(sections.PROBLEMS).join(' ')).not.toMatch(/40\s?%/);
});
