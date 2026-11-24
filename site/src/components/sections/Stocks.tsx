'use client';

import type { CSSProperties } from 'react';
import { AppLink } from '@/components/AppLink';
import { PixelArt, PixelField } from '@/components/PixelArt';
import { SectionHead } from '@/components/SectionHead';
import { asset, tickerLogo } from '@/config/site';
import { TICKERS } from '@/content/sections';
import { useWords } from '@/components/Words';
import { priceLine } from '@/lib/priceLine';
import styles from './Stocks.module.css';

// A thing's place in the ring's order, for the CSS that decides which one shows.
const place = (i: number) => ({ '--i': i }) as CSSProperties;

// The section's one piece: a ring of tickers turning in depth. A coin drops onto the ticker at the front
// carrying that ticker's logo, and the two lock as a pair with a short price line of their own; then the
// next. The ring, the drop, and which logo and line show are all CSS (see the module). The tickers are a
// list of real text; the logos are the app's own icons and say nothing the list does not.
export function Stocks() {
  const { SECTIONS, STOCK_COUNT, STOCK_RING, UI } = useWords().copy;
  return (
    <section className="section" id="stocks" aria-labelledby="stocks-title">
      <div className="container">
        <SectionHead id="stocks" {...SECTIONS.stocks} />
        <figure className={`section-piece ${styles.stage}`} style={{ '--n': TICKERS.length } as CSSProperties}>
          <PixelField className={styles.ground} />
          <ul className={styles.ring} data-ring>
            {TICKERS.map((ticker, i) => (
              <li key={ticker} style={place(i)}>
                {ticker}
              </li>
            ))}
          </ul>
          <div className={styles.coin} data-coin>
            <div className={styles.face}>
              <PixelArt scene="coin" cell={5} fallback={asset('/art/coin.svg')} />
              {TICKERS.map((ticker, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- the app's own icon, served by the app
                <img key={ticker} className={styles.logo} data-logo src={tickerLogo(ticker)} alt="" width={64} height={64} loading="lazy" decoding="async" style={place(i)} />
              ))}
            </div>
          </div>
          <svg className={styles.line} data-line viewBox="0 0 200 48" aria-hidden="true">
            {TICKERS.map((ticker, i) => (
              <polyline key={ticker} pathLength={1} points={priceLine(ticker)} style={place(i)} />
            ))}
          </svg>
          <figcaption className="sr-only">{STOCK_RING}</figcaption>
        </figure>
        <div className={`section-foot ${styles.foot}`}>
          <p className={styles.count}>
            <strong>{STOCK_COUNT.value}</strong> {STOCK_COUNT.label}
          </p>
          <AppLink className="btn btn-tonal" target="terminal" placement="stocks">
            {UI.openTerminal}
          </AppLink>
        </div>
      </div>
    </section>
  );
}
