'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { PixelField } from '@/components/PixelArt';
import { CHAIN_LOGOS, tickerLogo } from '@/config/site';
import { useWords } from '@/components/Words';
import { CHAINS } from '@/content/sections';
import styles from './Chains.module.css';

const never = () => () => {};
const TURN = 3000; // ms a chain is lit for: the pulse runs its lane, the buy lands, and it stands for a second
// A lane, in a box 100 by 100: out of the hub at the middle of the left side, to the middle of its chain's row,
// which is one of `rows` equal rows down the right side.
const lane = (i: number, rows: number) => {
  const y = ((i + 0.5) * 100) / rows;
  return `M0,50 C55,50 45,${y} 100,${y}`;
};

// The chains section's piece: the Hevium hub, a lane from it to each chain, and the chains in a list with
// who each suits and what trades there. One chain is lit at a time. A pulse runs from the hub down its lane, a
// line draws on to its tokens, and a buy tag lands on its logo. It moves on by itself and goes to whichever
// chain the pointer is on. Under the pointer the hub turns to its filled look. With scripts off all five
// chains stand at full strength.
export function ChainRoute() {
  const { CHAINS: chains, CHAIN_ROUTE, UI } = useWords().copy;
  const scripted = useSyncExternalStore(never, () => true, () => false);
  const [active, setActive] = useState(0);
  const held = useRef(false); // the pointer is on a chain, so the turn does not pass on
  const on = scripted ? active : -1;

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => (!held.current && !document.hidden) && setActive((now) => (now + 1) % CHAINS.length), TURN);
    return () => clearInterval(timer);
  }, []);

  return (
    <figure className={`section-piece ${styles.stage}`} data-live={scripted ? '' : undefined} style={{ '--turn': `${TURN}ms`, '--n': chains.length } as CSSProperties}>
      <PixelField className={styles.ground} />
      <div className={styles.hub} data-hub>
        {/* keyed by the chain, so the hub sends its ring out afresh on every turn */}
        <span className={styles.disc} data-disc key={`hub-${on}`}>
          <span className={styles.mark} data-mark />
        </span>
      </div>
      <div className={styles.web} aria-hidden="true">
        <svg className={styles.lanes} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {chains.map((chain, i) => (
            <path key={chain.name} data-lane data-on={on === i ? '' : undefined} d={lane(i, chains.length)} />
          ))}
        </svg>
        {/* the pulses: on each lane a short lit stretch, shown through a band that runs from the hub outward */}
        {chains.map((chain, i) => (
          <svg key={chain.name} className={styles.pulse} data-on={on === i ? '' : undefined} style={{ '--i': i } as CSSProperties} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={lane(i, chains.length)} />
          </svg>
        ))}
      </div>
      <ul className={styles.rows} data-chains onPointerLeave={() => (held.current = false)}>
        {chains.map((chain, i) => (
          <li
            key={chain.name}
            data-on={on === i ? '' : undefined}
            onPointerEnter={() => {
              held.current = true;
              setActive(i);
            }}
          >
            <span className={styles.at}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the app's own logo, served by the app */}
              <img className={styles.logo} data-logo src={CHAIN_LOGOS[i].src} alt="" width={44} height={44} loading="lazy" decoding="async" />
              <span className="trade-tag" data-side="buy" aria-hidden="true">
                B
              </span>
            </span>
            <p className={styles.who}>
              <strong className={styles.name} data-name>
                {chain.name}
              </strong>
              <span className={styles.suits} data-suits>
                {chain.suits}
              </span>
            </p>
            <p className={styles.trades}>
              <span className="sr-only">{UI.tradedHere} </span>
              {chain.trades.map((ticker) => (
                <span key={ticker} data-token>
                  {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon, served by the app */}
                  <img src={tickerLogo(ticker)} alt="" width={20} height={20} loading="lazy" decoding="async" />
                  {ticker}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">{CHAIN_ROUTE}</figcaption>
    </figure>
  );
}
