import { expect, test } from 'vitest';
import { appUrl, readRef } from '@/lib/appUrl';

const q = (u: string) => new URL(u).searchParams;

test('clean app url without utm tags', () => {
  const u = appUrl('app', { placement: 'hero' });
  expect(u).toBe('https://app.hevium.xyz/');
  expect(q(u).has('utm_source')).toBe(false);
  expect(q(u).has('ref')).toBe(false);
});

test('deep links target app.hevium.xyz paths', () => {
  expect(appUrl('launch', { placement: 'launch' })).toBe('https://app.hevium.xyz/launch');
  expect(appUrl('terminal', { placement: 'stocks' })).toBe('https://app.hevium.xyz/terminal');
  expect(appUrl('callouts')).toBe('https://app.hevium.xyz/feed');
  expect(appUrl('affiliate', { placement: 'earn' })).toBe('https://app.hevium.xyz/invite');
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
