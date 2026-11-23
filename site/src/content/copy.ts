import id from './locales/id.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ms from './locales/ms.json';
import vi from './locales/vi.json';
import zhCn from './locales/zh-cn.json';
import zhTw from './locales/zh-tw.json';
import { LANGS, type Lang } from './langs';
import * as meta from './meta';
import * as sections from './sections';
import { UI } from './ui';

// English is the source: the content files as they are written. A translation is the same shape with other
// words in it, laid over the English, so a line a translation lacks is shown in English rather than not at all.
const EN = { ...meta, ...sections, UI };
type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? readonly Widen<U>[] : T extends object ? { readonly [K in keyof T]: Widen<T[K]> } : T;
export type Copy = Widen<typeof EN>;

// What is the same in every language: addresses, names in code, figures, tickers. A translation cannot change these.
export const FIXED = new Set(['href', 'id', 'external', 'value', 'setting', 'side', 'time', 'through', 'trades', 'copyright']);
// What is not words at all, and is left out of a translation altogether.
export const UNTRANSLATED = ['TICKERS', 'AGENT_CLIENTS', 'SHARE_CARDS'];

function overlay<T>(base: T, over: unknown): T {
  if (typeof base === 'string') return (typeof over === 'string' && over ? over : base) as T;
  if (Array.isArray(base)) return base.map((item, i) => overlay(item, Array.isArray(over) ? over[i] : undefined)) as T;
  if (base && typeof base === 'object') {
    const from = (over && typeof over === 'object' ? over : {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, FIXED.has(key) ? value : overlay(value, from[key])])) as T;
  }
  return base;
}

const TRANSLATIONS: Record<Exclude<Lang, 'en'>, unknown> = { ms, id, vi, 'zh-cn': zhCn, 'zh-tw': zhTw, ja, ko };

function translate(words: unknown): Copy {
  const copy = overlay(EN as Copy, words);
  // the Solution menu lists the engines, which are written once
  return { ...copy, NAV: copy.NAV.map((item) => (item.children ? { ...item, children: copy.ENGINES } : item)) };
}

const COPY = Object.fromEntries(LANGS.map(({ code }) => [code, code === 'en' ? (EN as Copy) : translate(TRANSLATIONS[code])])) as Record<Lang, Copy>;

/** The page's words in a language. */
export const getCopy = (lang: Lang): Copy => COPY[lang];

/** The part of the English copy that is words, as a translator is given it. */
export function translatable() {
  const { NAV, ...rest } = EN;
  return Object.fromEntries(
    Object.entries({ ...rest, NAV: NAV.map((item) => ({ label: item.label, href: item.href })) }).filter(([name]) => !UNTRANSLATED.includes(name)),
  );
}
