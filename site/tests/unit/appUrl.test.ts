import { expect, test } from 'vitest';
import { appUrl, readRef } from '@/lib/appUrl';

const q = (u: string) => new URL(u).searchParams;

test('utm tags', () => {
  const u = appUrl('app', { placement: 'hero' });
  expect(u.startsWith('https://hevium.xyz/?')).toBe(true);
  expect([q(u).get('utm_source'), q(u).get('utm_medium'), q(u).get('utm_campaign'), q(u).get('utm_content')]).toEqual([
    'landing',
    'cta',
    'home',
    'hero',
  ]);
  expect(q(u).has('ref')).toBe(false);
});

test('referral code is carried', () => expect(q(appUrl('app', { ref: 'dean_01' })).get('ref')).toBe('dean_01'));

test('readRef accepts only [A-Za-z0-9_-]{1,64}', () => {
  expect(readRef('?ref=dean_01')).toBe('dean_01');
  expect(readRef('?ref=a&ref=b')).toBe('a');
  expect(readRef('?ref=%3Cscript%3E')).toBeNull();
  expect(readRef('?ref=' + 'a'.repeat(65))).toBeNull();
  expect(readRef('')).toBeNull();
});

test('a rejected ref never reaches a link', () => expect(appUrl('app', { ref: '<script>' })).not.toContain('script'));
