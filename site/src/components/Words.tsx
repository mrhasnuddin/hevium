'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { asset } from '@/config/site';
import type { Copy } from '@/content/copy';
import { isLang, langOf, langPath, type Lang } from '@/content/langs';

// The page's words. The page is built in one language and sent with that language only. When the visitor picks
// another, its words are fetched (/copy/<code>.json) and every part of the page is drawn again with them, in
// place: nothing is loaded again, nothing that is running stops, and what the visitor was reading stays where
// it was on the screen. The address changes to that language's page, so a reload or a shared link lands there.
type Words = { lang: Lang; copy: Copy };
type Store = Words & {
  /** Change the page to this language. */
  turnTo: (code: Lang) => void;
  /** Fetch this language's words ahead of the visitor picking it. */
  warm: (code: Lang) => void;
};
const Context = createContext<Store | null>(null);
const HOLD = 800; // ms the visitor's place is held after a change of language
const HANDS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const; // what says the visitor is moving the page themself

const fetched = new Map<Lang, Promise<Copy>>();
function fetchWords(code: Lang) {
  if (!fetched.has(code)) {
    const words = fetch(asset(`/copy/${code}.json`)).then((answer) => (answer.ok ? (answer.json() as Promise<Copy>) : Promise.reject(new Error(String(answer.status)))));
    words.catch(() => fetched.delete(code)); // a failed fetch may be tried again
    fetched.set(code, words);
  }
  return fetched.get(code)!;
}
const hrefOf = (code: Lang) => asset(`/${langPath(code)}`) + location.search + location.hash;
// the language an address is in: its first folder, where that is a language
const langAt = (path: string): Lang => {
  const first = path.slice(asset('/').length).split('/')[0];
  return isLang(first) ? first : 'en';
};

// The nearest part round `el` that moves with the page: one that is pinned (the solution's head, an engine as
// it slides under it) stands still on the screen whatever happens above it, so it cannot say where the page is.
function steady(el?: Element | null) {
  let part = el ?? null;
  // a phrase inside a line (a headline's accent) stands elsewhere in another language: take the block it is in
  while (part && getComputedStyle(part).display === 'inline') part = part.parentElement;
  for (let up = part; up && up !== document.body; up = up.parentElement) if (/sticky|fixed/.test(getComputedStyle(up).position)) part = up.parentElement;
  return part;
}

export function WordsProvider({ lang, copy, children }: Words & { children: ReactNode }) {
  const [words, setWords] = useState<Words>({ lang, copy });
  const shown = useRef(lang);
  const held = useRef<{ part: Element; edge: 'top' | 'bottom'; at: number } | null>(null); // what the visitor was looking at, and where it stood

  const change = useCallback(
    async (code: Lang, push: boolean) => {
      if (code === shown.current) return;
      shown.current = code;
      try {
        const next = code === lang ? copy : await fetchWords(code);
        if (shown.current !== code) return; // another language was picked meanwhile
        // the part of the page under a point a third of the way down the screen, past the bar and any open menu
        const line = innerHeight * 0.4;
        const part = steady(document.elementsFromPoint(innerWidth / 2, line).find((el) => el.closest('main, footer')));
        const box = part?.getBoundingClientRect();
        // held by its top, where reading starts; by its foot where its top is above the screen and its foot is not
        const edge = box && box.top < 0 && box.bottom <= innerHeight ? 'bottom' : 'top';
        held.current = part && box ? { part, edge, at: box[edge] } : null;
        if (push) history.pushState(null, '', hrefOf(code));
        setWords({ lang: code, copy: next });
      } catch {
        if (push) location.assign(hrefOf(code)); // the words could not be fetched: load that language's page
      }
    },
    [lang, copy],
  );

  // After the page is drawn in the new words and before it is painted: say what language it is in (which also
  // sets its type rules), and put what the visitor was looking at back where it stood.
  useLayoutEffect(() => {
    document.documentElement.lang = langOf(words.lang).tag;
    document.title = words.copy.META.title;
    const was = held.current;
    held.current = null;
    if (!was) return;
    // Held for a moment more, and not once: a part above it may settle a frame or two late (a picture sized by
    // script, a face that arrives). The visitor's own hand ends it.
    const until = performance.now() + HOLD;
    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      for (const kind of HANDS) removeEventListener(kind, stop);
    };
    const keep = () => {
      if (!was.part.isConnected || performance.now() > until) return stop();
      const off = was.part.getBoundingClientRect()[was.edge] - was.at;
      if (Math.abs(off) > 0.5) scrollBy({ top: off, behavior: 'instant' });
      frame = requestAnimationFrame(keep);
    };
    for (const kind of HANDS) addEventListener(kind, stop, { passive: true });
    keep();
    return stop;
  }, [words]);

  // Back and forward move between the languages the visitor has been through.
  useEffect(() => {
    const moved = () => void change(langAt(location.pathname), false);
    addEventListener('popstate', moved);
    return () => removeEventListener('popstate', moved);
  }, [change]);

  const turnTo = useCallback((code: Lang) => void change(code, true), [change]);
  const warm = useCallback((code: Lang) => void (code !== lang && fetchWords(code).catch(() => {})), [lang]);
  return <Context.Provider value={{ ...words, turnTo, warm }}>{children}</Context.Provider>;
}

export function useWords() {
  const words = useContext(Context);
  if (!words) throw new Error('useWords needs a WordsProvider above it');
  return words;
}
