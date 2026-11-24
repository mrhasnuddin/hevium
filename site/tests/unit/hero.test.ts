import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { LOGOS } from '@/hero/scene/logos.js';

const scene = fs.readFileSync(path.join(__dirname, '../../src/hero/scene/hero.js'), 'utf8');

test('the hero pile holds the ten assets and HyperEVM, each with an outline', () => {
  expect(LOGOS.map((logo) => logo.file)).toEqual([
    'bitcoin', 'ethereum', 'solana', 'robinhood', 'spacex', 'anthropic', 'nvidia', 'tesla', 'base', 'binance', 'hyperevm',
  ]);
  for (const logo of LOGOS) expect(logo.svg, logo.file).toMatch(/^<svg [^>]*viewBox="[^"]+"><path d="[Mm]/);
});

test('every logo has a place to drop from, and the floor a slot for each and for the cube', () => {
  // A logo without a drop stops the scene from mounting, and the page then keeps its poster without a word.
  const drops = scene.match(/const DROP = \[([\s\S]*?)\n\];/)![1].match(/\[[^\]]+\]/g)!;
  expect(drops).toHaveLength(LOGOS.length);
  const floor = fs.readFileSync(path.join(__dirname, '../../src/hero/scene/floor.js'), 'utf8');
  expect(Number(floor.match(/const RESTING = (\d+)/)![1])).toBeGreaterThanOrEqual(LOGOS.length + 1);
});
