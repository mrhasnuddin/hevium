import type { CSSProperties } from 'react';
import { Card } from '@/components/Card';
import { PixelArt, PixelField } from '@/components/PixelArt';
import { asset } from '@/config/site';
import { AUDIT_NOTE, AUDIT_TEXT, GUARANTEES, TRUST_FEED, TRUST_WORDS } from '@/content/sections';
import styles from './TrustBento.module.css';

const [keys, supply, liquidity, vault] = GUARANTEES;

// How a cell says its guarantee: its name and one line run on together, the fact behind it in mono under them.
function Caption({ title, text, proof }: { title: string; text: string; proof?: string }) {
  return (
    <div className={styles.caption}>
      <h3>{title}.</h3> <p data-line>{text}</p>
      {proof && (
        <p className={styles.proof} data-proof>
          {proof}
        </p>
      )}
    </div>
  );
}

// A cell's object, in star pixels, as large as its room allows.
function Art({ scene }: { scene: 'seal' | 'lock' | 'safe' | 'shield' }) {
  return (
    <div className={styles.art}>
      <PixelArt scene={scene} fallback={asset(`/art/trust-${scene}.svg`)} />
    </div>
  );
}

// The guarantees as an animated bento: one wide
// cell over two rows of two, on the design system's card. Each cell mixes the page's star pixels with a small
// piece of interface that shows the fact behind its guarantee. The interface is drawn, not live: it is hidden
// from screen readers and the words under it carry the meaning. All the motion is CSS or the pixel canvas, and
// it stops with reduced motion.
export function TrustBento() {
  return (
    <ul className={styles.bento} data-bento>
      {/* Your keys: three lines set large over a field of stars, beside a feed of sample trades, each signed by the visitor */}
      <Card as="li" className={`${styles.cell} ${styles.hero}`}>
        <PixelField className={styles.field} />
        <div className={styles.pitch}>
          <p className={styles.words}>
            {TRUST_WORDS.map((line) => (
              <span key={line}>{line} </span>
            ))}
          </p>
          <Caption {...keys} />
        </div>
        <div className={styles.side}>
          <div className={styles.feed} data-feed aria-hidden="true">
            <ul>
              {/* twice over, so the list can run on without a seam */}
              {[...TRUST_FEED, ...TRUST_FEED].map((trade, n) => (
                <li key={n}>
                  <span className="trade-tag" data-side={trade.side}>
                    {trade.side === 'buy' ? 'B' : 'S'}
                  </span>
                  <span className={styles.what}>
                    <b>{trade.what}</b>
                    <span>{trade.where}</span>
                  </span>
                  <span className={styles.signed}>
                    <span>signed by you</span>
                    <i />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Fixed supply: a sealed box of coins that a new coin bounces off, over the two figures */}
      <Card as="li" className={`${styles.cell} ${styles.narrow}`}>
        <div className={styles.visual}>
          <Art scene="seal" />
          <dl className={styles.readout} data-supply>
            <div>
              <dt>Total supply</dt>
              <dd>1,000,000,000</dd>
            </div>
            <div>
              <dt>Minted for insiders</dt>
              <dd>0</dd>
            </div>
          </dl>
        </div>
        <Caption {...supply} />
      </Card>

      {/* Locked liquidity: the receipt of a graduation, its pool tokens sent to the dead address, beside a padlock that shuts */}
      <Card as="li" className={`${styles.cell} ${styles.wide}`}>
        <div className={`${styles.visual} ${styles.pair}`}>
          <dl className={styles.receipt} data-receipt aria-hidden="true">
            {[
              ['Graduated on', 'Base'],
              ['Pool tokens', '100%'],
              ['Sent to', '0x0000...dEaD'],
            ].map(([label, value], n) => (
              <div key={label} style={{ '--n': n } as CSSProperties}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div style={{ '--n': 3 } as CSSProperties}>
              <dt>Status</dt>
              <dd className={styles.status}>
                <span data-pending>Pending</span>
                <span data-done>Burned</span>
              </dd>
            </div>
          </dl>
          <Art scene="lock" />
        </div>
        <Caption {...liquidity} />
      </Card>

      {/* Buyback vault: a vault door whose wheel turns, beside a meter that counts the 180 days */}
      <Card as="li" className={`${styles.cell} ${styles.wide}`}>
        <div className={`${styles.visual} ${styles.pair}`}>
          <Art scene="safe" />
          <div className={styles.vesting} data-vesting aria-hidden="true">
            <p className={styles.vestHead}>
              <span>Vesting</span>
              <span className={styles.day}>
                Day <i /> of 180
              </span>
            </p>
            <div className={styles.track}>
              <span className={styles.fill} data-fill />
            </div>
            <ol className={styles.ticks}>
              {[0, 60, 120, 180].map((day) => (
                <li key={day}>{day}</li>
              ))}
            </ol>
          </div>
        </div>
        <Caption {...vault} />
      </Card>

      {/* The audit: a shield being read from the top down, under a pill that says where it stands */}
      <Card as="li" className={`${styles.cell} ${styles.narrow}`}>
        <div className={styles.visual}>
          <p className={styles.standing}>
            <span className="pill" data-audit>
              <span className={styles.dot} data-dot />
              {AUDIT_NOTE}
            </span>
          </p>
          <Art scene="shield" />
        </div>
        <Caption title="Security audit" text={AUDIT_TEXT} />
      </Card>
    </ul>
  );
}
