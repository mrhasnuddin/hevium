import type { CSSProperties } from 'react';
import { AppLink } from '@/components/AppLink';
import { PixelField } from '@/components/PixelArt';
import { SectionHead } from '@/components/SectionHead';
import { CHAIN_LOGOS, tickerLogo } from '@/config/site';
import { SECTIONS } from '@/content/sections';
import styles from './Final.module.css';

// The page's logos as coins, six to a side: the five chains and seven of the assets the page names. Each is
// [the logo, where it stands across its side (0 to 1), how far down, its width in rem, how strongly it shows].
const TOKENS = ['NVDA', 'TSLA', 'AAPL', 'SPY', 'COIN', 'USDC', 'ETH'].map(tickerLogo);
const CHAINS = CHAIN_LOGOS.map((chain) => chain.src);
const SIDES: [string, number, number, number, number][][] = [
  [
    [CHAINS[0], 0.1, 0.06, 4.5, 0.9],
    [TOKENS[0], 0.8, 0.2, 3.25, 0.55],
    [CHAINS[1], 0.3, 0.42, 5.5, 1],
    [TOKENS[1], 0.95, 0.56, 3.5, 0.6],
    [TOKENS[2], 0.05, 0.72, 3.75, 0.7],
    [CHAINS[2], 0.6, 0.9, 4.75, 0.85],
  ],
  [
    [TOKENS[3], 0.9, 0.08, 4.75, 0.85],
    [CHAINS[3], 0.2, 0.24, 3.5, 0.6],
    [TOKENS[4], 0.7, 0.44, 5.5, 1],
    [TOKENS[5], 0.02, 0.58, 3.25, 0.55],
    [CHAINS[4], 0.95, 0.74, 4, 0.75],
    [TOKENS[6], 0.35, 0.92, 4.5, 0.9],
  ],
];

// One side's coins. They are decoration: every one of them is named in the sections above.
function Coins({ side }: { side: number }) {
  return (
    <div className={styles.coins} data-coins aria-hidden="true">
      {SIDES[side].map(([src, x, y, size, strength], n) => (
        // eslint-disable-next-line @next/next/no-img-element -- the app's own logo, served by the app
        <img key={src} src={src} alt="" width={88} height={88} loading="lazy" style={{ '--x': x, '--y': y, '--s': `${size}rem`, '--o': strength, '--n': side * 6 + n } as CSSProperties} />
      ))}
    </div>
  );
}

// The final call to action: the Hevium
// mark, a headline, one line and one button in the middle of the screen, on a soft mint light and a field of
// stars, with the page's logos gathered at both sides as coins that drift. The mark stands where a section's
// eyebrow would. Below 1024px the coins are left out.
export function Final() {
  return (
    <section className={`section ${styles.final}`} id="final" aria-labelledby="final-title">
      <PixelField className={styles.field} />
      <div className="container">
        <div className={`section-piece ${styles.stage}`}>
          <Coins side={0} />
          <div className={styles.middle}>
            <span className={styles.mark} data-mark aria-hidden="true" />
            <SectionHead id="final" {...SECTIONS.final} />
            <div className={styles.actions} data-actions>
              <AppLink className="btn btn-primary" target="app" placement="final">
                Launch app
              </AppLink>
            </div>
          </div>
          <Coins side={1} />
        </div>
      </div>
    </section>
  );
}
