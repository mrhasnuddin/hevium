import { expect, test } from 'vitest';
import * as meta from '@/content/meta';
import * as sections from '@/content/sections';

// Investor material, audit claims and long dashes never reach the page.
const DENY = /valuation|warrant|use of funds|run-rate|investor|revenue share|\baudited\b|[–—]/i;

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('no copy contains investor terms, an audit claim or a long dash', () => {
  const all = strings({ meta, sections });
  expect(all.length).toBeGreaterThan(0);
  expect(all.filter((s) => DENY.test(s))).toEqual([]);
});

test('title and description fit a search result', () => {
  expect(meta.META.title.length).toBeLessThanOrEqual(60);
  expect(meta.META.description.length).toBeLessThanOrEqual(160);
});

test('the what-is paragraph states the four facts answer engines need', () => {
  for (const fact of ['five chains', '1.0%', '20%', 'non-custodial']) expect(meta.META.whatIs).toContain(fact);
});

test('every section headline contains its highlighted phrase', () => {
  for (const [id, s] of Object.entries(sections.SECTIONS)) expect(s.title, id).toContain(s.highlight);
});

test('the problem section names three walls and leaves out the unsourced bot figure', () => {
  expect(sections.PROBLEMS.map((p) => p.title)).toEqual(['Crypto-only', 'Sniper bots', 'Built for humans only']);
  expect(strings(sections.PROBLEMS).join(' ')).not.toMatch(/40\s?%/);
});
