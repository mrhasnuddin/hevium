'use client';

import { Arrow } from '@/components/Arrow';
import { useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from 'react';
import { SITE, tickerLogo } from '@/config/site';
import { EARN, SHARE_CARDS } from '@/content/sections';
import { priceLine } from '@/lib/priceLine';
import styles from './Earn.module.css';

const never = () => () => {};
const usd = (amount: number) => `$${amount.toLocaleString('en-US')}`;
// A name as a link can hold it: lower-case letters, digits and underscores, fifteen at most.
const tidy = (text: string) => text.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);
const THROW = 80; // px a card must be dragged sideways before letting go sends it to the back
const TAP = 6; // px under which a press is a tap and not a drag
// A plus sign before a figure. In this face a plus is drawn lower than the middle of a figure, so it is
// set as its own piece and lifted to stand level with it (see `.sign`).
const plus = (
  <span className={styles.sign} data-sign>
    +
  </span>
);
const LOOSE =['--dx', '--dy', '--dr', '--rx', '--ry']; // what a drag or a tilt sets on a card

// The Earn section's piece. On the left a stack of sample share cards, laid out like the PnL cards traders
// post, with the referral fee as the figure each one shows off. The visitor can turn the stack with the
// buttons, tap a card, throw the front one, tilt it with the mouse, and put their own name on every card
// and in its link. On the right the perks in words. With scripts off the stack stands as built, with no
// field and no buttons.
export function ShareCards() {
  const [order, setOrder] = useState(() => SHARE_CARDS.map((_, i) => i)); // which card lies where, front first
  const [name, setName] = useState('');
  const scripted = useSyncExternalStore(never, () => true, () => false);
  const press = useRef<{ card: number; x: number; y: number; far: number } | null>(null);
  const who = name || 'you';
  const link = `${new URL(SITE.app).host}/?${SITE.refParam}=${who}`;
  const front = order[0];

  const next = () => setOrder(([first, ...rest]) => [...rest, first]);
  const previous = () => setOrder((now) => [now[now.length - 1], ...now.slice(0, -1)]);
  const bring = (card: number) => setOrder((now) => [...now.slice(now.indexOf(card)), ...now.slice(0, now.indexOf(card))]);

  // Lets a card go: nothing a drag or a tilt set on it is left.
  function settle(el: HTMLElement) {
    for (const property of LOOSE) el.style.removeProperty(property);
    delete el.dataset.dragging;
    delete el.dataset.tilting;
  }
  function down(event: PointerEvent<HTMLLIElement>, card: number) {
    if (event.button !== 0) return;
    press.current = { card, x: event.clientX, y: event.clientY, far: 0 };
    if (card !== front) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = '';
  }
  function move(event: PointerEvent<HTMLLIElement>, card: number) {
    const el = event.currentTarget;
    const held = press.current;
    if (held?.card === card) {
      const [dx, dy] = [event.clientX - held.x, event.clientY - held.y];
      held.far = Math.max(held.far, Math.hypot(dx, dy));
      if (card !== front) return;
      el.style.setProperty('--dx', `${dx}px`);
      el.style.setProperty('--dy', `${dy * 0.4}px`);
      el.style.setProperty('--dr', `${dx / 22}deg`);
    } else if (card === front && event.pointerType === 'mouse' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // the card leans toward the mouse
      const box = el.getBoundingClientRect();
      el.dataset.tilting = '';
      el.style.setProperty('--ry', `${((event.clientX - box.left) / box.width - 0.5) * 14}deg`);
      el.style.setProperty('--rx', `${(0.5 - (event.clientY - box.top) / box.height) * 10}deg`);
    }
  }
  function up(event: PointerEvent<HTMLLIElement>, card: number) {
    const held = press.current;
    press.current = null;
    if (held?.card !== card) return;
    const thrown = Math.abs(event.clientX - held.x) > THROW;
    settle(event.currentTarget);
    if (card !== front) {
      if (held.far < TAP) bring(card);
    } else if (held.far < TAP || thrown) next();
  }

  return (
    <div className={`section-piece ${styles.stage}`}>
      <div className={styles.play}>
        <ul className={styles.stack} data-cards aria-label="Share cards">
          {SHARE_CARDS.map((card, i) => {
            const at = order.indexOf(i);
            const sold = (card.bought * (100 + parseFloat(card.result))) / 100;
            return (
              <li
                key={card.ticker}
                className={styles.card}
                data-front={at === 0 ? '' : undefined}
                style={{ '--at': at, zIndex: SHARE_CARDS.length - at } as CSSProperties}
                onPointerDown={(event) => down(event, i)}
                onPointerMove={(event) => move(event, i)}
                onPointerUp={(event) => up(event, i)}
                onPointerLeave={(event) => press.current || settle(event.currentTarget)}
                onPointerCancel={(event) => {
                  press.current = null;
                  settle(event.currentTarget);
                }}
              >
                <div className={styles.face}>
                  <div className={styles.content}>
                    <p className={styles.top}>
                      <span className={styles.brand}>Hevium</span>
                      <span>
                        {new URL(SITE.app).host} · @{new URL(SITE.x).pathname.slice(1)}
                      </span>
                    </p>
                    <svg className={styles.chart} viewBox="0 0 200 48" preserveAspectRatio="none" aria-hidden="true">
                      <polyline points={priceLine(card.ticker)} />
                    </svg>
                    <div className={styles.main}>
                      <div className={styles.token}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon, served by the app */}
                        <img className={styles.logo} data-logo src={tickerLogo(card.ticker)} alt="" width={64} height={64} loading="lazy" draggable={false} />
                        <p>
                          <span className={styles.pair} data-pair>
                            {card.ticker} pair
                          </span>
                        </p>
                      </div>
                      <p className={styles.fee}>
                        <span>{EARN.fee}</span>
                        <strong className={styles.pill} data-fee>
                          {plus}
                          {usd(card.volume / 500)}
                        </strong>
                      </p>
                      <dl className={styles.rows}>
                        <div>
                          <dt>Referred volume</dt>
                          <dd data-volume>{usd(card.volume)}</dd>
                        </div>
                        <div>
                          <dt>Total PnL</dt>
                          <dd className={styles.gain}>
                            {plus}
                            {usd(sold - card.bought)} (
                            <span data-result>
                              {plus}
                              {card.result.slice(1)}
                            </span>
                            )
                          </dd>
                        </div>
                        <div className={styles.trade} data-trade>
                          <dt>
                            <span className="trade-tag" data-side="buy" aria-hidden="true">
                              B
                            </span>
                            <span className="sr-only">Bought</span>
                          </dt>
                          <dd>{usd(card.bought)}</dd>
                          <dt>
                            <span className="trade-tag" data-side="sell" aria-hidden="true">
                              S
                            </span>
                            <span className="sr-only">Sold</span>
                          </dt>
                          <dd>{usd(sold)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className={styles.ref}>
                      <span className={styles.avatar} aria-hidden="true">
                        {who[0].toUpperCase()}
                      </span>
                      <p className={styles.whose}>
                        <span>@{who}&apos;s referral link</span>
                        <b>{link}</b>
                      </p>
                      <span className={styles.seal} aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {/* Always in the page, so the section is one height before and after the script runs. Until it runs they
            are out of sight and out of reach: a field and buttons that do nothing would be worse than none. */}
        <div className={styles.controls} data-idle={scripted ? undefined : ''}>
          <button className={`btn btn-secondary btn-sm ${styles.turn}`} type="button" aria-label="Previous card" onClick={previous}>
            <Arrow to="left" />
          </button>
          <span className={styles.count} data-count>
            {front + 1} / {SHARE_CARDS.length}
          </span>
          <button className={`btn btn-secondary btn-sm ${styles.turn}`} type="button" aria-label="Next card" onClick={next}>
            <Arrow />
          </button>
          <label className={styles.field}>
            <span className="sr-only">{EARN.name}</span>
            <input className="input" value={name} onChange={(event) => setName(tidy(event.target.value))} placeholder={EARN.name} autoComplete="off" autoCapitalize="none" spellCheck={false} />
          </label>
        </div>
        <p className="sr-only" aria-live="polite">
          Card {front + 1} of {SHARE_CARDS.length}: {SHARE_CARDS[front].ticker} pair
        </p>
      </div>

      <dl className={styles.perks} data-perks>
        {EARN.perks.map((perk, i) => (
          <div key={perk.title}>
            <dt>{perk.title}</dt>
            <dd>
              {perk.text}
              {i === 0 && (
                <span className={styles.split} data-split>
                  <span className={styles.bar} data-bar>
                    <span data-you />
                  </span>
                  <span className={styles.shares}>
                    <span>{EARN.protocol}</span>
                    <b>{EARN.you}</b>
                  </span>
                </span>
              )}
              {i === EARN.perks.length - 1 && <span className={styles.link}>{link}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
