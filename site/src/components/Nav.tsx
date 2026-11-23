'use client';

import { useEffect, useRef } from 'react';
import { AppLink } from '@/components/AppLink';
import { asset } from '@/config/site';
import { NAV } from '@/content/sections';
import styles from './Nav.module.css';

// The bar that floats over the page: the logo, the section links, and the way into the app.
// Below 1024px the links fold into a menu, and Launch app goes into it as its last row, so the bar is the
// logo and the menu button. The menu is a popover, so the browser opens it from the button and shuts it on
// Escape or a tap outside, with no script.
export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const links = useRef<HTMLUListElement>(null);
  const shut = () => links.current?.hidePopover();

  // Hide the floating bar when scrolling down past the hero top, bring it back on scroll up, keep it visible
  // at the top / when focused / while the mobile menu is open, and close the popover when widening past 1024px.
  useEffect(() => {
    const off = new AbortController();
    const menu = links.current;
    const nav = navRef.current;
    matchMedia('(min-width: 64rem)').addEventListener('change', () => menu?.hidePopover(), { signal: off.signal });

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

    const holdVisible = () => {
      suppressUntil = performance.now() + 800;
      setHidden(false);
      lastY = Math.max(0, window.scrollY);
    };

    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      if (
        performance.now() < suppressUntil ||
        y <= TOP_KEEP ||
        menu?.matches(':popover-open') ||
        nav.contains(document.activeElement)
      ) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (Math.abs(y - lastY) < DELTA) return;
      setHidden(y > lastY);
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true, signal: off.signal });
    window.addEventListener('hashchange', holdVisible, { signal: off.signal });
    document.addEventListener(
      'click',
      (event) => {
        if (!event.defaultPrevented && (event.target as Element | null)?.closest('a[href^="#"]')) holdVisible();
      },
      { signal: off.signal },
    );
    nav.addEventListener('focusin', () => setHidden(false), { signal: off.signal });
    menu?.addEventListener(
      'toggle',
      () => {
        if (menu.matches(':popover-open')) setHidden(false);
      },
      { signal: off.signal },
    );

    return () => {
      delete document.documentElement.dataset.nav;
      off.abort();
    };
  }, []);

  return (
    <header className={`container ${styles.wrap}`}>
      <nav className={styles.nav} ref={navRef} aria-label="Main">
        <a className={styles.logo} href="#top" aria-label="Hevium, back to top">
          {/* eslint-disable-next-line @next/next/no-img-element -- a static export: images are plain <img> */}
          <img src={asset('/brand/hevium-logo-dark.svg')} alt="" width={132} height={36} />
        </a>
        <ul className={styles.links} id="nav-links" popover="auto" ref={links}>
          {NAV.map(({ label, href, external }) => (
            <li key={label}>
              <a href={href} onClick={shut} {...(external && { target: '_blank', rel: 'noopener' })}>
                {label}
              </a>
            </li>
          ))}
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
          <button type="button" className={`btn btn-secondary btn-sm ${styles.menu}`} popoverTarget="nav-links" aria-label="Menu">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>
  );
}
