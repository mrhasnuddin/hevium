'use client';

import { Eyebrow } from '@/components/Eyebrow';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type TouchEvent } from 'react';
import { useWords } from '@/components/Words';
import { fill } from '@/content/langs';
import { ENGINES } from '@/content/sections';
import styles from './Engines.module.css';

const IDS = ENGINES.map((engine) => engine.href.slice(1));
const NARROW = '(max-width: 63.999rem)'; // where the engines are tabs: below the width at which a section is one screen
const SWIPE = 60; // px a finger must travel sideways to turn to the next engine

// Runs as the page is read, before the engines after it are drawn: marks the frame as live and opens the
// engine the address names. A phone therefore never draws the four stacked and then puts three away.
const EARLY = `(function(f){f.dataset.live='';var h=location.hash.slice(1);if(${JSON.stringify(IDS)}.indexOf(h)>-1)f.dataset.active=h})(document.currentScript.parentElement)`;

// The engine the address names, if it names one. Turning to an engine rewrites the address without a new
// history entry, which sends no event, so those who listen are told by hand.
const listeners = new Set<() => void>();
const onAddress = (notify: () => void) => {
  listeners.add(notify);
  addEventListener('hashchange', notify);
  return () => {
    listeners.delete(notify);
    removeEventListener('hashchange', notify);
  };
};
const named = () => (IDS.includes(location.hash.slice(1)) ? location.hash.slice(1) : '');
const turnTo = (id: string) => {
  history.replaceState(null, '', `#${id}`);
  listeners.forEach((notify) => notify());
};
const onWidth = (notify: () => void) => {
  const query = matchMedia(NARROW);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const never = () => () => {};

// The solution and its four engines, as one frame with no box round it: the solution's head and a row of four
// pills, then the four product sections, which are passed in. On a wide screen the head and the pills stay put
// while the four slide up under them, and the pill of the one in view is lit. On a narrow screen the pills are
// tabs: one engine shows at a time, a swipe or the button at its foot turns to the next, and a link to an
// engine opens it. Which way it behaves is CSS (see the module). With scripts off it is the head, four links
// and four sections one after another.
// The last engine's way on leads to the section that follows the frame: Five chains.
export function Engines({ children }: { children: ReactNode }) {
  const { ENGINES: engines, SECTIONS, UI } = useWords().copy;
  const scripted = useSyncExternalStore(never, () => true, () => false);
  const narrow = useSyncExternalStore(onWidth, () => matchMedia(NARROW).matches, () => false);
  const open = useSyncExternalStore(onAddress, named, () => ''); // narrow: the engine that is open
  const [inView, setInView] = useState(IDS[0]); // wide: the engine passing the middle of the screen
  const from = useRef<{ x: number; y: number } | null>(null);
  const tabs = useRef<HTMLOListElement>(null);
  const active = narrow ? open || IDS[0] : inView;
  const next = engines[IDS.indexOf(active) + 1]; // none after the last engine: the way on leaves the frame
  const after = { label: SECTIONS.chains.eyebrow, href: '#chains' };
  const { title, highlight } = SECTIONS.solution;
  const at = title.indexOf(highlight);

  useEffect(() => {
    const watch = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && setInView(entry.target.id)), { rootMargin: '-60% 0px -40% 0px' });
    for (const id of IDS) watch.observe(document.getElementById(id)!);
    return () => watch.disconnect();
  }, []);

  // Narrow: when another engine opens, bring its top under the tabs, unless it is already in plain view.
  useEffect(() => {
    if (!narrow || !open) return;
    const panel = document.getElementById(open)!;
    const [top, line] = [panel.getBoundingClientRect().top, parseFloat(getComputedStyle(panel).scrollMarginTop)];
    if (top < line - 8 || top > innerHeight * 0.7) panel.scrollIntoView({ block: 'start' });
  }, [narrow, open]);

  // Narrow: where the row of tabs is wider than the screen, bring the open one to its middle.
  useEffect(() => {
    const bar = tabs.current!;
    const tab = bar.querySelector(`a[href="#${active}"]`);
    if (!narrow || !tab || bar.scrollWidth <= bar.clientWidth) return;
    const [row, box] = [bar.getBoundingClientRect(), tab.getBoundingClientRect()];
    bar.scrollTo({ left: bar.scrollLeft + box.left - row.left - (row.width - box.width) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [narrow, active]);

  function swipeEnd(event: TouchEvent) {
    const start = from.current;
    from.current = null;
    if (!start || !narrow) return;
    const [dx, dy] = [event.changedTouches[0].clientX - start.x, event.changedTouches[0].clientY - start.y];
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 2) return;
    const to = IDS[IDS.indexOf(active) + (dx < 0 ? 1 : -1)];
    if (to) turnTo(to);
  }

  return (
    <div
      className={styles.engines}
      id="engines"
      role="region"
      aria-labelledby="solution-title"
      data-live={scripted ? '' : undefined}
      data-active={active}
      suppressHydrationWarning // the script below has already set both by the time React arrives
      // a swipe that starts on the share cards or the tabs is theirs
      onTouchStart={(event) => (from.current = (event.target as Element).closest('[data-cards], [data-tabs]') ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY })}
      onTouchEnd={swipeEnd}
    >
      <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      <div className={styles.top} data-top>
        <div className="container">
          <header className="section-head" id="solution">
            <Eyebrow>{SECTIONS.solution.eyebrow}</Eyebrow>
            <h2 className="display-md" id="solution-title">
              {title.slice(0, at)}
              <span className="hl">{highlight}</span>
              {title.slice(at + highlight.length)}
            </h2>
            <p className="lead">{SECTIONS.solution.lead}</p>
          </header>
        </div>
      </div>
      <ol className={`pill-row ${styles.bar}`} data-tabs ref={tabs}>
        {engines.map((engine, i) => (
          <li key={engine.href}>
            <a
              className="pill"
              data-pill
              href={engine.href}
              aria-current={scripted && active === IDS[i] ? 'true' : undefined}
              onClick={(event) => {
                if (!narrow) return; // wide: an ordinary link down the page
                event.preventDefault();
                turnTo(IDS[i]);
              }}
            >
              <span className="pill-n" data-n aria-hidden="true">
                0{i + 1}
              </span>
              <span data-name>{engine.label}</span>
            </a>
          </li>
        ))}
      </ol>
      {children}
      {/* Narrow only (see the module). Always in the page, so the frame is one height before and after the script runs. */}
      <p className={styles.next}>
        <a
          className="btn btn-secondary"
          data-next
          href={(next ?? after).href}
          onClick={(event) => {
            if (!next) return; // an ordinary link on to the next section
            event.preventDefault();
            turnTo(next.href.slice(1));
          }}
        >
          {fill(UI.next, { name: (next ?? after).label })}
        </a>
      </p>
    </div>
  );
}
