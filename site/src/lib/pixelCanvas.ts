import { paintPixels, phases, type Pointer } from './pixels';

const FRAME = 30; // ms between paints of a canvas at rest: a shimmer needs no more than about 30 frames a second

type Options = {
  cell: number; // CSS px per star
  reach: number; // how far the pointer's pull carries, CSS px
  pull: number; // how far it moves a star at most, CSS px
  stillAt: number; // the moment shown when nothing may move, seconds
  /** The picture at this moment, as RGBA with one pixel per star. */
  picture: (cols: number, rows: number, time: number) => Uint8ClampedArray;
  /** Where the pointer is watched: the canvas itself, unless the canvas lies behind other things. */
  watch?: HTMLElement;
  onPaint?: () => void;
};

// Keeps a canvas of star pixels alive (lib/pixels.ts): sizes it, paints it while it is on screen, and
// feeds it the pointer. With reduced motion it shows one still moment that still answers the pointer.
// The stars take the canvas's CSS `color`. Returns the function that stops it.
export function runPixels(canvas: HTMLCanvasElement, { cell, reach, pull, stillAt, picture, watch = canvas, onPaint }: Options) {
  const found = canvas.getContext('2d');
  if (!found) return () => {};
  const ctx = found;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer: Pointer & { inside: boolean } = { x: 0, y: 0, pull: 0, inside: false };
  let cols = 0;
  let rows = 0;
  let ratio = 1;
  let seen = false;
  let frame = 0;
  let last = 0; // when it was last painted
  let ink = ''; // the stars' colour
  let shimmer = new Float32Array(0);

  function paint(now: number) {
    if (!cols) return;
    const time = still ? stillAt : now / 1000;
    pointer.pull += ((pointer.inside ? 1 : 0) - pointer.pull) * 0.14; // eases in on entry, back out on leaving
    if (pointer.pull < 0.002) pointer.pull = 0;
    ctx.fillStyle = ink;
    paintPixels(ctx, { cols, rows, cell, ratio, picture: picture(cols, rows, time), time, pointer, reach, pull, phases: shimmer });
    onPaint?.();
  }
  function size() {
    if (!canvas.clientWidth || !canvas.clientHeight) {
      cols = 0; // not laid out, as in a tab that is put away: a scene drawn into no room would have nothing to measure by
      return;
    }
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    cols = Math.max(1, Math.round(canvas.clientWidth / cell));
    rows = Math.max(1, Math.round(canvas.clientHeight / cell));
    shimmer = phases(cols, rows);
    ink = getComputedStyle(canvas).color; // read here and not on every frame: reading it makes the browser settle the page's styles
    paint(performance.now());
  }
  function loop(now: number) {
    // the pointer's pull is played on every frame; a canvas at rest skips every other one
    if (pointer.inside || pointer.pull > 0 || now - last >= FRAME) {
      last = now;
      paint(now);
    }
    // with reduced motion the loop only runs to play the pointer's pull in or out, then stops
    const moving = !still || (pointer.inside ? pointer.pull < 0.998 : pointer.pull > 0);
    frame = seen && moving ? requestAnimationFrame(loop) : 0;
  }
  const wake = () => {
    if (!frame && seen) frame = requestAnimationFrame(loop);
  };

  function move(event: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    // a watched area can be wider than the canvas: only a pointer over the canvas pulls
    pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= box.width && pointer.y <= box.height;
    wake();
  }
  function leave() {
    pointer.inside = false;
    wake();
  }

  const resized = new ResizeObserver(size);
  resized.observe(canvas);
  const watching = new IntersectionObserver(([entry]) => {
    seen = entry.isIntersecting;
    wake();
  });
  watching.observe(canvas);
  watch.addEventListener('pointermove', move);
  watch.addEventListener('pointerleave', leave);
  watch.addEventListener('pointercancel', leave);

  return () => {
    cancelAnimationFrame(frame);
    resized.disconnect();
    watching.disconnect();
    watch.removeEventListener('pointermove', move);
    watch.removeEventListener('pointerleave', leave);
    watch.removeEventListener('pointercancel', leave);
  };
}
