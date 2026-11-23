'use client';

import { useRef, type MouseEvent } from 'react';
import { useWords } from '@/components/Words';
import { asset } from '@/config/site';
import { LANGS, langOf, langPath, type Lang } from '@/content/langs';
import styles from './LangSwitch.module.css';

// The language switch: a small button with the language's short name, which opens a list of all eight. Each
// is a plain link to that language's page, and the list is a popover, so with no script it opens, shuts and
// leads to that page. With scripts the page changes language in place (Words.tsx): the words of all eight are
// fetched when the list opens, so the one picked is there at once.
export function LangSwitch() {
  const { lang, copy, turnTo, warm } = useWords();
  const list = useRef<HTMLDivElement>(null);
  function pick(event: MouseEvent, code: Lang) {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // a new tab or window: the link's own
    event.preventDefault();
    list.current?.hidePopover();
    turnTo(code);
  }
  return (
    <div className={styles.lang} data-lang-switch>
      <button type="button" className={`btn btn-secondary btn-sm ${styles.button}`} popoverTarget="lang-menu" aria-label={copy.UI.language}>
        {langOf(lang).short}
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6.25 8 10.25 12 6.25" />
        </svg>
      </button>
      <div ref={list} className={styles.list} id="lang-menu" popover="auto" onToggle={(event) => event.newState === 'open' && LANGS.forEach(({ code }) => warm(code))}>
        {LANGS.map(({ code, tag, short, name }) => (
          <a key={code} href={asset(`/${langPath(code)}`)} lang={tag} hrefLang={tag} aria-current={code === lang ? 'true' : undefined} onClick={(event) => pick(event, code)}>
            <span>{name}</span>
            <span className={styles.short}>{short}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
