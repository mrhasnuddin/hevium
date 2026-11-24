'use client';

import { AppLink } from '@/components/AppLink';
import { PixelField } from '@/components/PixelArt';
import { SectionHead } from '@/components/SectionHead';
import { CHAIN_LOGOS, tickerLogo } from '@/config/site';
import { useWords } from '@/components/Words';
import { FinalTokens, type TokenSpot } from './FinalTokens';
import styles from './Final.module.css';

// The page's logos as tokens, six to a side: the six chains and six of the assets the page names
// (FinalTokens.tsx says what each number is).
const TOKENS = ['NVDA', 'TSLA', 'AAPL', 'SPY', 'COIN', 'ETH'].map(tickerLogo);
const CHAINS = CHAIN_LOGOS.map((chain) => chain.src);
const SIDES: TokenSpot[][] = [
  [
    [CHAINS[0], 0.1, 0.06, 7.5, 0.9],
    [TOKENS[0], 0.8, 0.2, 5.5, 0.55],
    [CHAINS[1], 0.3, 0.42, 9, 1],
    [TOKENS[1], 0.95, 0.56, 5.75, 0.6],
    [TOKENS[2], 0.05, 0.72, 6.25, 0.7],
    [CHAINS[2], 0.6, 0.9, 7.75, 0.85],
  ],
  [
    [TOKENS[3], 0.9, 0.08, 7.75, 0.85],
    [CHAINS[3], 0.2, 0.24, 5.75, 0.6],
    [TOKENS[4], 0.7, 0.44, 9, 1],
    [CHAINS[5], 0.02, 0.58, 5.5, 0.55],
    [CHAINS[4], 0.95, 0.74, 6.75, 0.75],
    [TOKENS[5], 0.35, 0.92, 7.5, 0.9],
  ],
];

// The final call to action: the Hevium
// mark, a headline, one line and one button in the middle of the screen, on a soft mint light and a field of
// stars, with the page's logos gathered at both sides as tokens that drift, turn over under the pointer and
// send a wave through the stars when clicked. The mark stands where a section's eyebrow would. Below 1024px
// the tokens are left out.
export function Final() {
  const { SECTIONS, UI } = useWords().copy;
  return (
    <section className={`section ${styles.final}`} id="final" aria-labelledby="final-title">
      <PixelField className={styles.field} />
      <div className="container">
        <div className={`section-piece ${styles.stage}`}>
          <FinalTokens spots={SIDES[0]} first={0} />
          <div className={styles.middle}>
            <span className={styles.mark} data-mark aria-hidden="true" />
            <SectionHead id="final" {...SECTIONS.final} />
            <div className={styles.actions} data-actions>
              <AppLink className="btn btn-primary" target="app" placement="final">
                {UI.launchApp}
              </AppLink>
            </div>
          </div>
          <FinalTokens spots={SIDES[1]} first={6} />
        </div>
      </div>
    </section>
  );
}
