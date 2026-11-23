import type { CSSProperties } from 'react';
import { PixelField } from '@/components/PixelArt';
import { AGENT_CHART, AGENT_LIMITS } from '@/content/sections';
import { CHART_X, HELD, PRICE, SPENT, TRADES, chartX, priceAt } from '@/lib/agentSession';
import styles from './Agents.module.css';

const HOURS = ['00:00', '06:00', '12:00', '18:00', '24:00'];
// The line's points for an SVG that is 100 by 100, where the top is 0.
const LINE = PRICE.map(([x, price]) => `${x},${100 - price}`).join(' ');

// The chart beside the typed session: a price line through one day, drawn only as far as the session has
// run. Each trade is marked on it the moment its line is answered: a B with the amount for one that went
// through, an amber mark for the one that was held. Under it, the two limits in words and the day's budget
// filling as the buys land. All of it follows the session's one number in CSS (see the module), so it needs
// no script. The line itself is an illustration.
export function AgentChart() {
  return (
    <figure className={styles.chart} style={{ '--chart-x': `calc(${CHART_X})`, '--spent': `calc(${SPENT})`, '--held': `calc(${HELD})` } as CSSProperties}>
      <div className={styles.plot} data-plot>
        <PixelField className={styles.ground} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="agent-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${LINE} 100,100`} fill="url(#agent-chart-fill)" />
          <polyline className={styles.line} points={LINE} />
        </svg>
        <span className={styles.now} aria-hidden="true" />
        {TRADES.map((trade, i) => {
          const x = chartX(trade.at) * 100;
          return (
            <p key={i} className={styles.mark} data-mark style={{ '--at': trade.at, left: `${x}%`, top: `${100 - priceAt(x)}%` } as CSSProperties}>
              <span className="trade-tag" data-side={trade.through ? 'buy' : 'held'} aria-hidden="true">
                {trade.through ? 'B' : '!'}
              </span>
              <span className="sr-only">{trade.through ? 'Bought' : 'Buy'}</span>
              <span className={styles.amount}>{trade.through ? AGENT_LIMITS[0].value : 'held'}</span>
            </p>
          );
        })}
      </div>
      <ol className={styles.hours} data-hours aria-hidden="true">
        {HOURS.map((hour) => (
          <li key={hour}>{hour}</li>
        ))}
      </ol>
      <div className={styles.under}>
        <dl className={styles.limits}>
          {AGENT_LIMITS.map((limit) => (
            <div key={limit.label}>
              <dt>{limit.label}</dt>
              <dd>{limit.value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.budget}>
          <span className={styles.label}>spent today</span>
          <span className={styles.track} data-budget>
            <span />
          </span>
        </p>
      </div>
      <figcaption className="sr-only">{AGENT_CHART}</figcaption>
    </figure>
  );
}
