'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppLink } from '@/components/AppLink';
import { Arrow } from '@/components/Arrow';
import { asset } from '@/config/site';
import { ENGINES, NAV, SECTIONS } from '@/content/sections';
import styles from './Nav.module.css';

const DESKTOP = '(min-width: 64rem)';
const ENGINE_HREFS = new Set(ENGINES.map((engine) => engine.href));

// The bar that floats over the page: the logo, the five section links (with Solution opening into the four
// engines, as plain links with a line each), Docs, and Launch app.
// Below 1024px the links fold into a popover menu with Solution as an inline accordion, triggered by a 3x2
// geometric tile matrix button, and Launch app is the menu's last row. Both the menu (popover="auto") and Solution (<details>) work with no script.
export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const links = useRef<HTMLUListElement>(null);
  const solutionRef = useRef<HTMLDetailsElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [active, setActive] = useState<string>('');

  const clearHoverTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const closeSolution = useCallback(() => {
    clearHoverTimer();
    if (solutionRef.current) solutionRef.current.open = false;
  }, [clearHoverTimer]);

  const shut = () => {
    closeSolution();
    links.current?.hidePopover();
  };

  const onSolutionEnter = () => {
    if (!matchMedia(DESKTOP).matches || !matchMedia('(hover: hover)').matches) return;
    clearHoverTimer();
    if (solutionRef.current) solutionRef.current.open = true;
  };

  const onSolutionLeave = () => {
    if (!matchMedia(DESKTOP).matches || !matchMedia('(hover: hover)').matches) return;
    clearHoverTimer();
    closeTimer.current = window.setTimeout(() => {
      if (solutionRef.current) solutionRef.current.open = false;
    }, 140);
  };

  // Auto-hide on scroll down, reveal on scroll up / focus / open menus, close menus on Escape / outside click / resize.
  useEffect(() => {
    const off = new AbortController();
    const menu = links.current;
    const nav = navRef.current;

    const onBreakpoint = () => {
      menu?.hidePopover();
      closeSolution();
    };
    matchMedia(DESKTOP).addEventListener('change', onBreakpoint, { signal: off.signal });

    if (!nav) return () => off.abort();

    const TOP_KEEP = 80;
    const DELTA = 8;
    let lastY = Math.max(0, window.scrollY);
    let suppressUntil = 0;

    const setHidden = (hidden: boolean) => {
      if (hidden) {
        nav.dataset.hidden = 'true';
        document.documentElement.dataset.nav = 'hidden';
      } else {
        delete nav.dataset.hidden;
        delete document.documentElement.dataset.nav;
      }
    };

    const syncScrolled = (y: number) => {
      if (y > 24) nav.dataset.scrolled = 'true';
      else delete nav.dataset.scrolled;
    };

    const holdVisible = () => {
      suppressUntil = performance.now() + 800;
      setHidden(false);
      lastY = Math.max(0, window.scrollY);
      syncScrolled(lastY);
    };

    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      syncScrolled(y);
      if (
        performance.now() < suppressUntil ||
        y <= TOP_KEEP ||
        menu?.matches(':popover-open') ||
        (matchMedia(DESKTOP).matches && solutionRef.current?.open) ||
        nav.contains(document.activeElement)
      ) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (Math.abs(y - lastY) < DELTA) return;
      if (y > lastY) closeSolution();
      setHidden(y > lastY);
      lastY = y;
    };

    syncScrolled(lastY);

    window.addEventListener('scroll', onScroll, { passive: true, signal: off.signal });
    window.addEventListener('hashchange', holdVisible, { signal: off.signal });
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as Element | null;
        if (!event.defaultPrevented && target?.closest('a[href^="#"]')) holdVisible();
        if (matchMedia(DESKTOP).matches && solutionRef.current?.open && !solutionRef.current.contains(target)) {
          closeSolution();
        }
      },
      { signal: off.signal },
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && solutionRef.current?.open) {
          closeSolution();
          solutionRef.current.querySelector('summary')?.focus();
        }
      },
      { signal: off.signal },
    );
    nav.addEventListener('focusin', () => setHidden(false), { signal: off.signal });
    menu?.addEventListener(
      'toggle',
      () => {
        if (menu.matches(':popover-open')) setHidden(false);
        else closeSolution();
      },
      { signal: off.signal },
    );

    // Track whichever section (or engine) is currently in view for the active hairline indicator.
    const watchHrefs = ['#problem', '#solution', ...ENGINES.map((e) => e.href), '#chains', '#trust', '#faq'];
    const targets = watchHrefs
      .map((href) => ({ href, el: document.querySelector(href) }))
      .filter((entry): entry is { href: string; el: Element } => Boolean(entry.el));

    const observer =
      targets.length > 0
        ? new IntersectionObserver(
            (entries) => {
              const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
              if (visible) {
                const match = targets.find((t) => t.el === visible.target);
                if (match) setActive(match.href);
              }
            },
            { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.2, 0.5] },
          )
        : null;

    for (const { el } of targets) observer?.observe(el);

    return () => {
      clearHoverTimer();
      observer?.disconnect();
      delete document.documentElement.dataset.nav;
      off.abort();
    };
  }, [clearHoverTimer, closeSolution]);

  const solutionActive = active === '#solution' || ENGINE_HREFS.has(active);

  return (
    <header className={`container ${styles.wrap}`}>
      <nav className={styles.nav} ref={navRef} aria-label="Main">
        <a className={styles.logo} href="#top" aria-label="Hevium, back to top" onClick={shut}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a static export: images are plain <img> */}
          <img src={asset('/brand/hevium-logo-dark.svg')} alt="" width={132} height={36} />
        </a>

        <ul className={styles.links} id="nav-links" popover="auto" ref={links}>
          {NAV.map(({ label, href, external, children }) =>
            children ? (
              <li
                key={label}
                className={`${styles.item} ${styles.hasMenu}`}
                onMouseEnter={onSolutionEnter}
                onMouseLeave={onSolutionLeave}
              >
                <details className={styles.dropdown} ref={solutionRef}>
                  <summary className={styles.trigger} data-nav-item data-active={solutionActive ? 'true' : undefined}>
                    <span>{label}</span>
                    <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 6.25 8 10.25 12 6.25" />
                    </svg>
                  </summary>
                  <div className={styles.panel} data-solution-menu>
                    <div className={styles.panelHead}>
                      <div>
                        <p className={styles.panelTitle}>{label}</p>
                        <p className={styles.panelSub}>{SECTIONS.solution.title}</p>
                      </div>
                      <a className={styles.overview} href={href} onClick={shut}>
                        <span>Overview</span>
                        <Arrow to="right" />
                      </a>
                    </div>
                    <div className={styles.grid}>
                      {children.map((engine) => (
                        <a
                          key={engine.id}
                          href={engine.href}
                          className={styles.engine}
                          data-engine={engine.id}
                          data-active={active === engine.href ? 'true' : undefined}
                          onClick={shut}
                        >
                          <div className={styles.engineCopy}>
                            <span className={styles.engineName}>{engine.label}</span>
                            <span className={styles.engineDesc}>{engine.summary}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </details>
              </li>
            ) : (
              <li key={label} className={`${styles.item} ${external ? styles.docsItem : ''}`}>
                <a
                  href={href}
                  className={styles.link}
                  data-nav-item
                  data-active={active === href ? 'true' : undefined}
                  data-external={external ? 'true' : undefined}
                  onClick={shut}
                  {...(external && { target: '_blank', rel: 'noopener' })}
                >
                  <span>{label}</span>
                  {external && <Arrow to="out" className={styles.extArrow} />}
                </a>
              </li>
            ),
          )}
          <li className={styles.cta}>
            <AppLink target="app" placement="nav" className="btn btn-primary" onClick={shut}>
              Launch app
            </AppLink>
          </li>
        </ul>

        <div className={styles.actions}>
          <AppLink target="app" placement="nav" className="btn btn-primary btn-sm" data-launch>
            Launch app
          </AppLink>
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${styles.menu}`}
            popoverTarget="nav-links"
            aria-label="Menu"
          >
            <span className={styles.matrix} aria-hidden="true">
              <i />
              <i />
              <i className={styles.mintTile} />
              <i className={styles.mintTile} />
              <i />
              <i />
            </span>
            <span className={styles.closeIcon} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </nav>
    </header>
  );
}
