import { AGENT_PROMPT } from '@/content/sections';

// The timing of the Agents section's sample prompt session. The prompt card and the chart beside it both read
// one number that runs from 0 to 1 over the session (--agent-t), so each reply lands in the card at the exact
// moment its mark appears on the chart and the daily budget bar steps up.
export const CYCLE = 9; // seconds for one loop
export const TYPE_START = 0.02; // when the user prompt begins typing in the input bar
export const TYPE_SPAN = 0.18; // how long typing takes before the send button fires
export const SENT_AT = 0.22; // when the prompt lands in the bubble and the input clears
const TRADE_START = 0.38; // when the first dip buy lands
const TRADE_STEP = 0.14; // spacing between each of the four trade events

// Each trade in the session: when its reply appears and its mark lands on the chart, and whether it went through.
export const TRADES = AGENT_PROMPT.replies.map((reply, i) => ({
  ...reply,
  at: Number((TRADE_START + i * TRADE_STEP).toFixed(4)),
}));

// The chart is drawn from left to right as the session runs: typing and sending take the opening quarter of the
// day, then the trading window runs at a steady 25/24 pace so each trade lands on its exact dip and hour.
// Each knot is [how far through the session, how far across the chart].
const KNOTS = [
  [0, 0],
  [0.29, 0.25],
  [0.866, 0.85],
  [1, 1],
];
const tidy = (n: number) => Number(n.toFixed(6));

// How far across the chart the session has drawn, from 0 to 1, when it is `t` of the way through.
export function chartX(t: number) {
  for (let i = 1; i < KNOTS.length; i++) {
    const [[t0, x0], [t1, x1]] = [KNOTS[i - 1], KNOTS[i]];
    if (t <= t1) return x0 + (x1 - x0) * ((t - t0) / (t1 - t0));
  }
  return 1;
}
// The same, as a CSS sum over --agent-t, so the line is clipped by the very rule that places the marks.
export const CHART_X = KNOTS.slice(1)
  .map(([t1, x1], i) => `clamp(0, var(--agent-t) - ${KNOTS[i][0]}, ${tidy(t1 - KNOTS[i][0])}) * ${tidy((x1 - KNOTS[i][1]) / (t1 - KNOTS[i][0]))}`)
  .join(' + ');

// As CSS: the share of the day's budget spent so far, a step for each trade that went through; and whether
// a trade has been held yet.
const landed = (trade: { at: number }) => `clamp(0, (var(--agent-t) - ${trade.at}) * 200, 1)`;
const through = TRADES.filter((trade) => trade.through);
export const SPENT = `(${through.map(landed).join(' + ')}) / ${through.length}`;
export const HELD = TRADES.filter((trade) => !trade.through).map(landed).join(' + ') || '0';

// The price line: [how far across the chart, the price], each from 0 to 100. It is an illustration. It dips
// where the agent buys, which a unit test holds it to, and each dip stands higher than the last, so the
// amounts written under the marks clear one another on a narrow screen.
export const PRICE: [number, number][] = [
  [0, 40], [3, 44], [6, 39], [9, 44], [12, 50], [15, 46], [18, 52], [21, 47], [25, 43], [29, 37], [32, 32],
  [34.4, 28], [38, 40], [42, 50], [45, 47], [49, 42], [53, 54], [57, 63], [60, 60], [63.6, 56], [68, 68],
  [72, 77], [75, 73], [78.1, 68], [82, 78], [86, 84], [90, 81], [94, 88], [97, 85], [100, 91],
];

// The price where the line stands at `x` across the chart (0 to 100).
export function priceAt(x: number) {
  const next = PRICE.findIndex(([at]) => at >= x);
  if (next <= 0) return PRICE[next === 0 ? 0 : PRICE.length - 1][1];
  const [[x0, p0], [x1, p1]] = [PRICE[next - 1], PRICE[next]];
  return p0 + (p1 - p0) * ((x - x0) / (x1 - x0));
}
