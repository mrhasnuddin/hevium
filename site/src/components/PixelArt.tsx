'use client';

import { useEffect, useRef, useState } from 'react';
import { runPixels } from '@/lib/pixelCanvas';
import { grain } from '@/lib/pixels';
import { SCENES, type SceneName } from '@/lib/pixelScenes';
import styles from './PixelArt.module.css';

const STILL_AT = 0.6; // the moment shown when nothing may move

// A small moving object drawn in the page's star pixels (lib/pixels.ts). The pixels shimmer, the object
// moves, and pixels near the pointer are pulled toward it. It runs only while it is on screen.
// `fallback` is a plain picture of the object: it is in the page as built, for when scripts are off, and
// is hidden once the pixels are drawn. Both are decoration: the words beside it carry the meaning.
// `cell` is the size of one star in CSS px: finer for a small object.
export function PixelArt({ scene, fallback, cell = 7, className = '' }: { scene: SceneName; fallback: string; cell?: number; className?: string }) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = host.current!;
    const sketch = document.createElement('canvas'); // the object, one pixel per star
    const pen = sketch.getContext('2d', { willReadFrequently: true });
    if (!pen) return;
    return runPixels(wrap.querySelector('canvas')!, {
      cell,
      reach: 70,
      pull: 6,
      stillAt: STILL_AT,
      arrive: true,
      picture(cols, rows, time) {
        if (sketch.width !== cols || sketch.height !== rows) {
          sketch.width = cols;
          sketch.height = rows;
        }
        pen.clearRect(0, 0, cols, rows);
        SCENES[scene](pen, cols, rows, time);
        return pen.getImageData(0, 0, cols, rows).data;
      },
      onPaint: () => {
        wrap.dataset.pixels = 'ready';
      },
    });
  }, [scene, cell]);

  return (
    <span ref={host} className={`${styles.art} ${className}`.trim()} data-pixels="" data-scene={scene}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser */}
      <img src={fallback} alt="" width={400} height={400} loading="lazy" decoding="async" />
      <canvas aria-hidden="true" />
    </span>
  );
}

// A field of star pixels to lay behind words, as a section's texture: the hero floor at rest, on its
// 10px grid. Three cells in ten hold a quiet star, and a slow swell crosses the field and lifts them.
// It fills the box its class gives it and lets the pointer through, so it watches the pointer on the
// section it stands in. Decoration only.
export function PixelField({ className = '' }: { className?: string }) {
  const field = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = field.current!;
    let picture = new Uint8ClampedArray(0);
    let own = new Float32Array(0); // each cell's two steady numbers, worked out once for the grid
    let other = new Float32Array(0);
    return runPixels(canvas, {
      cell: 10,
      reach: 90,
      pull: 7,
      stillAt: STILL_AT,
      maxDpr: 1,
      watch: canvas.closest('section') ?? canvas,
      picture(cols, rows, time) {
        if (picture.length !== cols * rows * 4) {
          picture = new Uint8ClampedArray(cols * rows * 4);
          own = Float32Array.from({ length: cols * rows }, (_, n) => grain(n % cols, Math.floor(n / cols)));
          other = Float32Array.from({ length: cols * rows }, (_, n) => grain((n % cols) + 7, Math.floor(n / cols) + 7));
          for (let n = 0; n < cols * rows; n++) picture[n * 4 + 3] = 255;
        }
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const n = y * cols + x;
            if (own[n] <= 0.7) continue; // seven cells in ten are always empty
            const swell = Math.max(0, Math.sin(x * 0.19 + y * 0.11 - time * 0.7)) ** 3;
            picture[n * 4] = 255 * (0.18 + 0.2 * other[n] + 0.5 * swell * own[n]);
          }
        }
        return picture;
      },
      onPaint: () => {
        canvas.dataset.pixels = 'ready';
      },
    });
  }, []);

  return <canvas ref={field} className={`${styles.field} ${className}`.trim()} data-pixel-field="" aria-hidden="true" />;
}

// Official wordmark rendered in interactive 4-point star pixels. The official SVG acts both as the low-key
// fallback when scripts are off and as the raster mask for the star-pixel grid so the letterforms never drift
// from the brand kit. Pixels fade softly toward the bottom and shimmer under a slow diagonal light swell.
export function PixelWordmark({ src, className = '' }: { src: string; className?: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [cell, setCell] = useState(8);

  useEffect(() => {
    const mq = matchMedia('(min-width: 48rem)');
    const sync = () => setCell(mq.matches ? 8 : 4);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const wrap = host.current!;
    const img = imgRef.current!;
    const canvas = wrap.querySelector('canvas')!;
    const sketch = document.createElement('canvas');
    const pen = sketch.getContext('2d', { willReadFrequently: true });
    if (!pen) return;

    let stop = () => {};
    let disposed = false;
    let maskCols = 0;
    let maskRows = 0;
    let mask = new Float32Array(0);
    let own = new Float32Array(0);
    let other = new Float32Array(0);
    let picture = new Uint8ClampedArray(0);
    let maskReady = false;

    const rasterizeMask = (cols: number, rows: number) => {
      if (sketch.width !== cols || sketch.height !== rows) {
        sketch.width = cols;
        sketch.height = rows;
      }
      pen.clearRect(0, 0, cols, rows);
      pen.drawImage(img, 0, 0, cols, rows);
      const data = pen.getImageData(0, 0, cols, rows).data;
      mask = new Float32Array(cols * rows);
      let anyInk = false;
      for (let n = 0; n < cols * rows; n++) {
        const i = n * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
        const m = lum * (data[i + 3] / 255);
        mask[n] = m;
        if (m > 0.08) anyInk = true;
      }
      own = Float32Array.from({ length: cols * rows }, (_, n) => grain(n % cols, Math.floor(n / cols)));
      other = Float32Array.from({ length: cols * rows }, (_, n) => grain((n % cols) + 7, Math.floor(n / cols) + 7));
      picture = new Uint8ClampedArray(cols * rows * 4);
      for (let n = 0; n < cols * rows; n++) picture[n * 4 + 3] = 255;
      maskCols = cols;
      maskRows = rows;
      maskReady = anyInk;
    };

    const start = () => {
      if (disposed || !img.complete || !img.naturalWidth) return;
      stop();
      stop = runPixels(canvas, {
        cell,
        reach: 110,
        pull: 9,
        stillAt: STILL_AT,
        watch: wrap.closest('footer') ?? wrap,
        picture(cols, rows, time) {
          if (!maskReady || maskCols !== cols || maskRows !== rows) {
            rasterizeMask(cols, rows);
          }
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const n = y * cols + x;
              const m = mask[n];
              const swell = Math.max(0, Math.sin(x * 0.085 - y * 0.05 - time * 0.85)) ** 3;
              const vFade = 1 - (y / Math.max(1, rows - 1)) * 0.42;
              if (m > 0.08) {
                const v = Math.min(0.88, m * vFade * (0.34 + 0.14 * other[n] + 0.44 * swell));
                picture[n * 4] = Math.round(v * 255);
              } else if (own[n] > 0.88) {
                const dx = (x / Math.max(1, cols - 1) - 0.5) * 2;
                const dy = (y / Math.max(1, rows - 1) - 0.5) * 2;
                const edge = Math.max(0, 1 - (dx * dx * 0.85 + dy * dy * 0.95));
                picture[n * 4] = Math.round(255 * edge * (0.1 + 0.12 * other[n] + 0.22 * swell));
              } else {
                picture[n * 4] = 0;
              }
            }
          }
          return picture;
        },
        onPaint: () => {
          if (maskReady) wrap.dataset.pixels = 'ready';
        },
      });
    };

    if (img.complete && img.naturalWidth > 0) {
      start();
    } else {
      img.addEventListener('load', start, { once: true });
    }

    return () => {
      disposed = true;
      img.removeEventListener('load', start);
      stop();
      delete wrap.dataset.pixels;
    };
  }, [src, cell]);

  return (
    <span ref={host} className={`${styles.wordmark} ${className}`.trim()} data-pixels="" data-wordmark-pixels="">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export uses plain <img> as no-JS fallback and raster mask */}
      <img ref={imgRef} src={src} alt="" width={360} height={110} loading="lazy" decoding="async" />
      <canvas aria-hidden="true" />
    </span>
  );
}
