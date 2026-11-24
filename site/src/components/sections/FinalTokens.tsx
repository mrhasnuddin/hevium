'use client';

import { type CSSProperties, type MouseEvent, useState } from 'react';
import { PixelArt } from '@/components/PixelArt';
import { asset } from '@/config/site';
import styles from './Final.module.css';

/** [the logo, where it stands across its side (0 to 1), how far down, its width in rem, how strongly it shows] */
export type TokenSpot = [src: string, x: number, y: number, size: number, strength: number];

// One token, drawn as the Stocks token is: a rim of star pixels with the logo in its middle. Under the
// pointer the logo turns over to the Hevium mark. A click sends rings out from it and tells the section,
// whose field of stars answers with a wave (PixelField), as the hero floor answers a logo that lands.
function Token({ spot: [src, x, y, size, strength], n }: { spot: TokenSpot; n: number }) {
  const [hits, setHits] = useState(0);
  function hit(event: MouseEvent<HTMLSpanElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setHits(hits + 1);
    event.currentTarget.dispatchEvent(new CustomEvent('hevium:impact', { bubbles: true, detail: { x: box.left + box.width / 2, y: box.top + box.height / 2 } }));
  }
  return (
    <span className={styles.token} data-token style={{ '--x': x, '--y': y, '--z': size, '--o': strength, '--n': n } as CSSProperties} onClick={hit}>
      <PixelArt scene="coin" cell={4} fallback={asset('/art/coin.svg')} />
      <span className={styles.flip} data-flip>
        {/* eslint-disable-next-line @next/next/no-img-element -- the app's own logo, served by the app */}
        <img data-logo src={src} alt="" width={88} height={88} loading="lazy" decoding="async" />
        <span className={styles.back} data-back />
      </span>
      {hits > 0 && <span key={hits} className={styles.pulse} data-pulse />}
    </span>
  );
}

// One side's tokens. They are decoration: every one of them is named in the sections above.
export function FinalTokens({ spots, first }: { spots: TokenSpot[]; first: number }) {
  return (
    <div className={styles.coins} data-coins aria-hidden="true">
      {spots.map((spot, n) => (
        <Token key={spot[0]} spot={spot} n={first + n} />
      ))}
    </div>
  );
}
