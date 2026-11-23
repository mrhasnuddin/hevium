// The page's pixels. A picture is laid on a grid, and each cell draws one four-point star that is as big
// and as bright as the picture is there. The stars lean the way the Hevium mark leans. They shimmer on
// their own, and those near the pointer are pulled toward it.
//
// The star was chosen over a square and a circle (design-system/preview.html#pixels).

export type Pointer = { x: number; y: number; pull: number }; // CSS px in the canvas; pull runs 0 to 1

type Frame = {
  cols: number;
  rows: number;
  cell: number; // CSS px
  ratio: number; // device pixels per CSS px
  picture: Uint8ClampedArray; // RGBA at one pixel per cell: brightness times alpha is the star's size
  time: number; // seconds
  pointer: Pointer;
  reach: number; // how far the pointer's pull carries, CSS px
  pull: number; // how far it moves a star at most, CSS px
  phases?: Float32Array; // each cell's place in the shimmer, worked out once for the grid (see `phases`)
  spread?: number; // 0 the picture, 1 its stars thrown apart and gone: the loader's hand-off, and an object assembling
};

const LEAN = -0.3; // the shear that makes a star lean like the mark

// A cell's own steady number from 0 to 1, so its shimmer is out of step with its neighbours'.
export const grain = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// Every cell's place in the shimmer, in radians. It never changes for a grid, so it is worked out once.
export function phases(cols: number, rows: number) {
  const out = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) out[y * cols + x] = grain(x, y) * 6.283;
  return out;
}

export function paintPixels(ctx: CanvasRenderingContext2D, frame: Frame) {
  const { cols, rows, cell, ratio, picture, time, pointer, reach, pull } = frame;
  const phase = frame.phases?.length === cols * rows ? frame.phases : phases(cols, rows);
  const spread = frame.spread ?? 0;
  const [midX, midY, throwBy] = [(cols * cell) / 2, (rows * cell) / 2, Math.max(cols, rows) * cell * 0.5];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      let value = (picture[i] / 255) * (picture[i + 3] / 255);
      if (value < 0.04) continue;
      value = Math.min(1, value * (0.86 + 0.14 * Math.sin(time * 2.4 + phase[y * cols + x])));

      let px = (x + 0.5) * cell;
      let py = (y + 0.5) * cell;
      if (spread) {
        // outward from the middle, each star by an amount of its own
        px += ((px - midX) * 1.6 + (phase[y * cols + x] / 6.283 - 0.5) * throwBy) * spread;
        py += ((py - midY) * 1.6 + (grain(y, x) - 0.5) * throwBy) * spread;
      }
      let near = 0;
      // with no pointer near, which is all the time on a phone, there is nothing to work out
      if (pointer.pull) {
        const dx = pointer.x - px;
        const dy = pointer.y - py;
        const far = Math.hypot(dx, dy) || 1;
        near = pointer.pull * Math.exp(-(far * far) / (reach * reach));
        px += (dx / far) * near * pull;
        py += (dy / far) * near * pull;
      }

      // the star: four points with hollow sides
      const r = cell * (0.16 + 0.8 * value) * (1 + near * 0.35) * 0.66;
      const k = r * 0.18;
      ctx.globalAlpha = Math.min(1, 0.22 + 0.78 * value + near * 0.3) * Math.max(0, 1 - spread);
      ctx.setTransform(ratio, 0, LEAN * ratio, ratio, px * ratio, py * ratio);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(k, -k, r, 0);
      ctx.quadraticCurveTo(k, k, 0, r);
      ctx.quadraticCurveTo(-k, k, -r, 0);
      ctx.quadraticCurveTo(-k, -k, 0, -r);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
