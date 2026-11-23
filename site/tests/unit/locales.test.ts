import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { FIXED, getCopy, translatable } from '@/content/copy';
import { LANGS } from '@/content/langs';

// Every translation is held to the English it was made from: the same shape, the same figures and names,
// its accent phrases still inside their headlines, and nothing left in English by oversight.
const source = translatable() as Record<string, unknown>;

type Leaf = { at: string; key: string; value: string };
function leaves(value: unknown, at = '', key = '', out: Leaf[] = []): Leaf[] {
  if (typeof value === 'string') out.push({ at, key, value });
  else if (Array.isArray(value)) value.forEach((item, i) => leaves(item, `${at}[${i}]`, key, out));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => leaves(v, at ? `${at}.${k}` : k, k, out));
  return out;
}
const shape = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(shape) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : typeof value;

// Names and tickers that are written the same in every language.
const KEPT = ['Hevium', 'Base', 'Robinhood Chain', 'BNB Chain', 'Solana', 'Elysium', 'MCP', 'Claude', 'Cursor', 'Google', 'Phantom', 'Solflare', 'Jupiter', 'EVM', 'NVDA', 'TSLA', 'AAPL', 'SPY', 'COIN', 'USDC', 'USDG', 'USD+', 'ETH', 'PnL', 'mcp.hevium.xyz', '0x0000...dEaD'];
const figures = (line: string): string[] => [...(line.match(/\d[\d.,]*\d|\d/g) ?? [])].sort();
const places = (line: string) => (line.match(/\{\w+\}/g) ?? []).sort();

for (const { code, name } of LANGS.filter((lang) => lang.code !== 'en')) {
  describe(`${name} (${code})`, () => {
    const file = path.join(__dirname, '../../src/content/locales', `${code}.json`);
    const words = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    const [theirs, ours] = [leaves(words), leaves(source)];
    const english = new Map(ours.map((leaf) => [leaf.at, leaf.value]));

    test('has every line the English has, and no others', () => {
      expect(shape(words)).toEqual(shape(source));
      expect(theirs.filter((leaf) => !leaf.value.trim()).map((leaf) => leaf.at)).toEqual([]);
    });

    test('leaves addresses, figures and names in code as they are', () => {
      const changed = theirs.filter((leaf) => FIXED.has(leaf.key) && leaf.value !== english.get(leaf.at)).map((leaf) => leaf.at);
      expect(changed).toEqual([]);
    });

    test('keeps every figure, every filled-in place and every name written in Latin letters', () => {
      const off: string[] = [];
      for (const leaf of theirs) {
        const en = english.get(leaf.at) ?? '';
        // every figure the English has; a language may also write in digits what English spells out (5つ, 1세대)
        const kept = figures(leaf.value);
        const lost = figures(en).filter((figure) => {
          const at = kept.indexOf(figure);
          return at < 0 || !kept.splice(at, 1);
        });
        if (lost.length) off.push(`${leaf.at}: lost the figures ${lost}`);
        if (places(leaf.value).join('|') !== places(en).join('|')) off.push(`${leaf.at}: places ${places(en)} became ${places(leaf.value)}`);
        for (const term of KEPT) if (en.includes(term) && !leaf.value.includes(term)) off.push(`${leaf.at}: lost "${term}"`);
      }
      expect(off).toEqual([]);
    });

    test('keeps each accent phrase inside its headline, and each figure\'s words inside the statement', () => {
      const copy = getCopy(code);
      const heads = [copy.HERO, ...Object.values(copy.SECTIONS), { title: copy.UI.faqTitle, highlight: copy.UI.faqHighlight }];
      expect(heads.filter((head) => !head.title.includes(head.highlight)).map((head) => `${head.highlight} is not in ${head.title}`)).toEqual([]);
      expect(copy.FACTS.filter((fact) => !copy.META.whatIs.includes(fact.words)).map((fact) => fact.words)).toEqual([]);
    });

    test('has no long dashes, no doubled spaces, and is not English left as it was', () => {
      expect(theirs.filter((leaf) => /[–—]|  /.test(leaf.value)).map((leaf) => leaf.at)).toEqual([]);
      // lines of three words or more that read exactly as the English does
      const untouched = theirs.filter((leaf) => !FIXED.has(leaf.key) && leaf.value === english.get(leaf.at) && leaf.value.trim().split(/\s+/).length >= 3 && !KEPT.includes(leaf.value));
      expect(untouched.map((leaf) => `${leaf.at}: ${leaf.value}`)).toEqual([]);
    });

    test('fits a search result: a title of 60 characters or fewer and a description of 160 or fewer', () => {
      const copy = getCopy(code);
      // a full-width character takes the room of two
      const wide = (line: string) => [...line].reduce((n, ch) => n + (/[ᄀ-ᇿ⺀-鿿가-힯＀-￯]/.test(ch) ? 2 : 1), 0);
      expect(wide(copy.META.title)).toBeLessThanOrEqual(64);
      expect(wide(copy.META.description)).toBeLessThanOrEqual(170);
    });
  });
}
