'use client';

import { useEffect, useRef } from 'react';

const DURATION = 700; // ms

// A figure that counts up from zero at the moment it comes into sight. The page is built with the
// finished figure, which is what stands with scripts off, with reduced motion, and whenever it is at rest.
// "Into sight" is read from the parent's opacity, which the section's CSS raises from 0 when it wants the figure shown.
export function Count({ value }: { value: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const span = el.current!;
    const host = span.parentElement!;
    const to = parseFloat(value);
    const decimals = value.match(/\.(\d+)/)?.[1].length ?? 0;
    const unit = value.replace(/[\d.]/g, '');
    let shown = false;
    let counting = 0;
    let queued = 0;

    const count = () => {
      const start = performance.now();
      span.textContent = (0).toFixed(decimals) + unit; // from nought at once, however late the first frame comes
      const tick = (now: number) => {
        // A frame's own time can be a little before `start` when the page is busy, so it is held at zero: the figure never dips below nought.
        const t = Math.min(1, Math.max(0, (now - start) / DURATION));
        // ease-out: fast off zero, settling onto the figure
        span.textContent = t < 1 ? (to * (1 - (1 - t) ** 3)).toFixed(decimals) + unit : value;
        counting = t < 1 ? requestAnimationFrame(tick) : 0;
      };
      counting = requestAnimationFrame(tick);
    };
    const check = () => {
      queued = 0;
      const visible = Number(getComputedStyle(host).opacity) > 0.05;
      if (visible === shown) return;
      shown = visible;
      cancelAnimationFrame(counting);
      if (visible) count();
      else span.textContent = value; // out of sight again: back to the finished figure, ready to count next time
    };
    const onScroll = () => {
      queued ||= requestAnimationFrame(check);
    };

    addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(counting);
      cancelAnimationFrame(queued);
      span.textContent = value;
    };
  }, [value]);

  return <span ref={el}>{value}</span>;
}
