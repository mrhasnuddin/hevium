'use client';

import { useEffect, useRef } from 'react';
import { asset } from '@/config/site';
import { runPixels } from '@/lib/pixelCanvas';
import styles from './Entrance.module.css';

const BEAT = 550; // ms the mark takes to fill where there is nothing to wait for
const CELL = 5; // the size of one star in the mark, CSS px

// Runs before the first paint (see the layout). It marks the page for its entrances (`data-motion`) and says
// which opening to play: `load` on a first visit and on every refresh, `rise` on any other return in the
// session. Nothing is marked with reduced motion, with the session switched off (the tests), or without scripts.
export const EARLY = `(function(){try{var d=document.documentElement,s=sessionStorage,k='hevium:loaded',v=s.getItem(k);if(v==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.dataset.motion='';s.setItem(k,'1');var h=location.hash;if(h&&h!=='#top')return;var n=performance.getEntriesByType('navigation')[0];d.dataset.entrance=!v||(n&&n.type==='reload')?'load':'rise'}catch(e){}})()`;

// Sets a headline as its lines, each behind a mask of its own, so they can rise one by one. The lines are
// read from the page as it stands (the headline is balanced, and a splitter that wraps greedily breaks it
// elsewhere, which shows as a jump when the lines are put back). The headline's own nodes are kept and
// returned by `revert`, and its words are said once, by a label, while it is in pieces.
const WIDE = '\\u2e80-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef'; // Chinese and Japanese characters and their punctuation
const PIECE = new RegExp(`\\s+|[${WIDE}]|[^\\s${WIDE}]+`, 'g');
function splitLines(heading: HTMLElement) {
  const kept = [...heading.childNodes];
  const rows: { top: number; words: { text: string; accent: boolean; gap: boolean }[] }[] = [];
  let gap = false; // whether a space stands before the next piece
  const texts = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = texts.nextNode(); node; node = texts.nextNode()) {
    // a word, or one character of a script whose lines break between characters
    for (const word of node.textContent!.matchAll(PIECE)) {
      if (!word[0].trim()) {
        gap = true;
        continue;
      }
      range.setStart(node, word.index);
      range.setEnd(node, word.index + word[0].length);
      const top = Math.round(range.getBoundingClientRect().top);
      if (!rows.length || Math.abs(rows[rows.length - 1].top - top) > 4) rows.push({ top, words: [] });
      rows[rows.length - 1].words.push({ text: word[0], accent: Boolean(node.parentElement?.closest('.hl')), gap });
      gap = false;
    }
  }
  const lines = rows.map((row) => {
    const mask = document.createElement('span');
    const line = mask.appendChild(document.createElement('span'));
    // room for what hangs below the line, taken back so the lines stand where they stood
    mask.style.cssText = 'display:block;overflow:clip;white-space:nowrap;padding-block:0.12em;margin-block:-0.12em';
    line.style.display = 'block';
    row.words.forEach((word, n) => {
      if (n && word.gap) line.append(' ');
      const piece = word.accent ? line.appendChild(document.createElement('span')) : null;
      if (piece) piece.className = 'hl';
      (piece ?? line).append(word.text);
    });
    return { mask, line };
  });
  heading.setAttribute('aria-label', heading.textContent ?? '');
  heading.replaceChildren(...lines.map(({ mask }) => mask));
  // a column, so the masks' margins do not run together and the lines keep their pitch
  heading.style.display = 'flex';
  heading.style.flexDirection = 'column';
  return {
    lines: lines.map(({ line }) => line),
    revert() {
      heading.replaceChildren(...kept);
      heading.removeAttribute('aria-label');
      heading.removeAttribute('style');
    },
  };
}

// The opening: a cover with the Hevium mark in star pixels, which fills as the page gets ready. Then the hand-off:
// the stars are thrown apart, the mark is left whole and glides to where the hero's mark stands, and the headline
// rises line by line with the buttons and the nav bar after it. The cover is drawn only under `data-entrance="load"`,
// and plain CSS lifts it after four seconds whatever happens here.
export function Entrance() {
  const cover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.entrance !== 'load') return;
    const box = cover.current!;
    const mark = box.querySelector<HTMLImageElement>('[data-mark]')!;
    const percent = box.querySelector<HTMLElement>('[data-percent]')!;
    const began = performance.now();
    const off = new AbortController();
    let gone = false;
    let frame = 0;
    let shown = 0; // the progress on screen, 0 to 1
    let scene = 0; // how far the 3D scene says it has got
    let ready = root.dataset.scene === 'ready';
    let thrown = 0; // 0 the mark, 1 its stars thrown apart
    // the headline's lines are found by measuring them, so its face has to be in first (or a second and a half has gone by)
    let faces = false;
    void Promise.race([document.fonts.ready, new Promise((later) => setTimeout(later, 1500))]).then(() => (faces = true));
    document.addEventListener('hevium:scene-ready', () => (ready = true), { signal: off.signal });
    document.addEventListener('hevium:scene-progress', (event) => (scene = (event as CustomEvent<number>).detail), { signal: off.signal });

    // the mark as a picture, drawn small into the middle of the cover's grid and lit from the bottom up
    const picture = new Image();
    picture.src = mark.src;
    const sketch = document.createElement('canvas');
    const pen = sketch.getContext('2d', { willReadFrequently: true });
    const stop = pen
      ? runPixels(box.querySelector('canvas')!, {
          cell: CELL,
          reach: 1,
          pull: 0,
          stillAt: 0,
          spread: () => thrown,
          picture(cols, rows) {
            if (sketch.width !== cols || sketch.height !== rows) {
              sketch.width = cols;
              sketch.height = rows;
            }
            pen.clearRect(0, 0, cols, rows);
            const size = mark.offsetWidth / CELL;
            const top = (rows - size) / 2;
            if (picture.complete && picture.naturalWidth) pen.drawImage(picture, (cols - size) / 2, top, size, size);
            const data = pen.getImageData(0, 0, cols, rows).data;
            // the mark's drawing takes the middle 42% of its picture's height; the light climbs through that
            const line = top + size * (0.71 - 0.42 * shown);
            for (let y = Math.max(0, Math.floor(top)); y < Math.min(rows, top + size); y++) {
              for (let x = 0; x < cols; x++) data[(y * cols + x) * 4] = y >= line ? 255 : 64;
            }
            return data;
          },
        })
      : () => {};

    const done = () => {
      stop();
      delete root.dataset.entrance;
    };

    async function handOff() {
      try {
        const { gsap } = await import('gsap');
        if (gone) return;
        const hero = document.querySelector<HTMLElement>('[data-hero]')!;
        const artBox = hero.querySelector<HTMLElement>('[data-hero-art]')!;
        const poster = artBox.querySelector<HTMLElement>('img')!;
        const split = splitLines(hero.querySelector('h1')!);
        const [from, to] = [mark.getBoundingClientRect(), poster.getBoundingClientRect()];
        const throwing = { by: 0 };
        gsap
          .timeline({
            defaults: { ease: 'power3.out' },
            onComplete() {
              split.revert();
              gsap.set(['[data-hero] p', 'header nav', poster], { clearProps: 'all' });
              done();
            },
          })
          // under the cover, the hero is set where its entrance starts
          .set(split.lines, { yPercent: 110 })
          .set('[data-hero] p', { opacity: 0, y: 12 })
          .set('header nav', { opacity: 0, y: -8 })
          .set(poster, { opacity: 0 })
          // the hand-off: the stars go, the mark stays and travels, and the cover's ground thins to nothing
          .to(percent, { opacity: 0, duration: 0.15 }, 0)
          .to(mark, { opacity: 1, duration: 0.12 }, 0)
          .to(throwing, { by: 1, duration: 0.55, ease: 'power2.out', onUpdate: () => (thrown = throwing.by) }, 0)
          .to('[data-ground]', { opacity: 0, duration: 0.35, ease: 'none' }, 0.1)
          .to(
            mark,
            { x: to.left + to.width / 2 - (from.left + from.width / 2), y: to.top + to.height / 2 - (from.top + from.height / 2), scale: to.width / from.width, duration: 0.55, ease: 'power3.inOut' },
            0.05,
          )
          // the mark gives way to what stands there: the poster, or the cube's own mark where the scene is up
          .add(() => {
            if (!artBox.classList.contains('is-live')) gsap.set(poster, { clearProps: 'opacity' });
          }, 0.6)
          .to(mark, { opacity: 0, duration: artBox.classList.contains('is-live') ? 0.3 : 0.01 }, 0.6)
          // the reveal
          .to(split.lines, { yPercent: 0, duration: 0.7, stagger: 0.07 }, 0.3)
          .to('[data-hero] p', { opacity: 1, y: 0, duration: 0.5 }, 0.55)
          .to('header nav', { opacity: 1, y: 0, duration: 0.5 }, 0.55);
      } catch {
        done(); // the animation code did not arrive: the page is simply shown
      }
    }

    let last = began;
    const tick = (now: number) => {
      if (gone) return;
      // with a scene on its way the figure creeps toward 90% and follows the scene's own count; ready takes it to 100
      const target = ready && faces ? 1 : Math.max(scene * 0.95, Math.min(0.9, (now - began) / 2300));
      shown = Math.min(target, shown + (now - last) / BEAT);
      last = now;
      percent.textContent = `${Math.round(shown * 100)}%`;
      if (shown >= 1) return void handOff();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      gone = true;
      cancelAnimationFrame(frame);
      off.abort();
      stop();
    };
  }, []);

  return (
    <div className={styles.cover} ref={cover} data-cover aria-hidden="true">
      <div className={styles.ground} data-ground />
      <canvas className={styles.pixels} />
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export: images are plain <img> */}
      <img className={styles.mark} data-mark src={asset('/brand/hevium-mark-mint.svg')} alt="" width={512} height={512} />
      <p className={styles.percent} data-percent>
        0%
      </p>
    </div>
  );
}
