// The objects on the Problem cards, the coin of the Stocks ring, the press of the Launch section and the four objects of the Trust bento. Each is drawn small, one pixel per star, in greys: the brighter the
// grey, the bigger the star (see lib/pixels.ts). `u` is the picture's height, so every size is a share of it.

export type Scene = (pen: CanvasRenderingContext2D, cols: number, rows: number, time: number) => void;

const grey = (value: number) => {
  const v = Math.round(Math.min(1, Math.max(0, value)) * 255);
  return `rgb(${v},${v},${v})`;
};

function disc(pen: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, value: number) {
  pen.fillStyle = grey(value);
  pen.beginPath();
  pen.ellipse(x, y, Math.max(rx, 0.5), ry, 0, 0, Math.PI * 2);
  pen.fill();
}

function block(pen: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, radius = 0) {
  pen.fillStyle = grey(value);
  pen.beginPath();
  pen.roundRect(x, y, w, h, radius);
  pen.fill();
}

// A coin turning on its upright axis: both faces and the band between them, then the face toward us with
// a ring on it.
function coin(pen: CanvasRenderingContext2D, cx: number, cy: number, r: number, turn: number) {
  const rx = r * Math.abs(Math.cos(turn));
  const rim = r * 0.2 * Math.abs(Math.sin(turn));
  const lead = Math.sin(turn) > 0 ? rim / 2 : -rim / 2;
  disc(pen, cx - rim / 2, cy, rx, r, 0.3);
  disc(pen, cx + rim / 2, cy, rx, r, 0.3);
  block(pen, cx - rim / 2, cy - r, rim, r * 2, 0.3);
  disc(pen, cx + lead, cy, rx, r, 0.62);
  disc(pen, cx + lead, cy, rx * 0.64, r * 0.64, 0.26);
  disc(pen, cx + lead, cy, rx * 0.46, r * 0.46, 0.62);
}

// Crypto-only: the coin shut in behind bars.
const vault: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  coin(pen, cx, u * 0.52, u * 0.3, time * 1.1);
  // the cage, in front
  for (let bar = -2; bar <= 2; bar++) block(pen, cx + bar * u * 0.19 - u * 0.022, u * 0.1, u * 0.044, u * 0.82, 1);
  block(pen, cx - u * 0.44, u * 0.07, u * 0.88, u * 0.06, 1, u * 0.02);
  block(pen, cx - u * 0.44, u * 0.89, u * 0.88, u * 0.06, 1, u * 0.02);
};

// Stocks: the rim of the token coin, face on. Its middle is left open for the logo of the ticker it lands
// on, which the page lays over it; the page also rocks the two together (Stocks.module.css).
const token: Scene = (pen, cols, rows) => {
  const r = rows * 0.42;
  disc(pen, cols / 2, rows / 2, r, r, 0.95);
  disc(pen, cols / 2, rows / 2, r * 0.68, r * 0.68, 0);
};

// Sniper bots: a robot head that turns from side to side, its one eye a crosshair that sweeps.
const bot: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  const yaw = Math.sin(time * 0.8); // -1 looking left, 1 looking right
  const shift = yaw * u * 0.04; // the face slides the way the head turns
  // antenna, with a light that blinks
  block(pen, cx - u * 0.018, u * 0.1, u * 0.036, u * 0.16, 0.5);
  disc(pen, cx, u * 0.1, u * 0.05, u * 0.05, Math.sin(time * 4) > 0 ? 1 : 0.35);
  // ears and head
  block(pen, cx - u * 0.39, u * 0.44, u * 0.07, u * 0.2, 0.5, u * 0.02);
  block(pen, cx + u * 0.32, u * 0.44, u * 0.07, u * 0.2, 0.5, u * 0.02);
  block(pen, cx - u * 0.32, u * 0.25, u * 0.64, u * 0.56, 0.72, u * 0.09);
  // the side of the head that comes into view as it turns
  const side = Math.abs(yaw) * u * 0.07;
  block(pen, yaw > 0 ? cx - u * 0.32 : cx + u * 0.32 - side, u * 0.29, side, u * 0.48, 0.3);
  // the visor, dark, and the eye sweeping inside it
  block(pen, cx - u * 0.25 + shift, u * 0.38, u * 0.5, u * 0.17, 0.06, u * 0.04);
  const eye = cx + shift + Math.sin(time * 2.3) * u * 0.16;
  block(pen, eye - u * 0.1, u * 0.455, u * 0.2, u * 0.022, 0.85);
  block(pen, eye - u * 0.011, u * 0.39, u * 0.022, u * 0.15, 0.85);
  disc(pen, eye, u * 0.466, u * 0.045, u * 0.045, 1);
  // the grille
  for (let slot = -2; slot <= 2; slot++) block(pen, cx + shift + slot * u * 0.08 - u * 0.025, u * 0.65, u * 0.05, u * 0.07, 0.2);
};

// Humans only: a pointer comes down on a button and presses it by hand, again and again.
const click: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  const beat = (time * 0.55) % 1;
  const ease = (t: number) => t * t * (3 - 2 * t);
  const arrive = ease(Math.min(1, beat / 0.45)); // the pointer travels in
  const press = beat < 0.45 ? 0 : beat < 0.55 ? ease((beat - 0.45) / 0.1) : beat < 0.7 ? 1 - ease((beat - 0.55) / 0.15) : 0;
  const after = beat < 0.55 ? 0 : (beat - 0.55) / 0.45; // the ring that spreads from the press
  // the button: a slab whose top sinks into its side as it is pressed
  const top = u * 0.56 + press * u * 0.07;
  block(pen, cx - u * 0.34, u * 0.66, u * 0.68, u * 0.2, 0.28, u * 0.06);
  block(pen, cx - u * 0.34, top, u * 0.68, u * 0.2, 0.6 + press * 0.4, u * 0.06);
  if (after > 0) {
    pen.strokeStyle = grey((1 - after) * 0.9);
    pen.lineWidth = u * 0.035;
    pen.beginPath();
    pen.ellipse(cx, top + u * 0.1, after * u * 0.42, after * u * 0.2, 0, 0, Math.PI * 2);
    pen.stroke();
  }
  // the pointer: the plain arrow, its tip on the button when it lands
  const tipX = cx + u * 0.26 - arrive * u * 0.24;
  const tipY = u * 0.12 + arrive * u * 0.5 + press * u * 0.07;
  const s = u * 0.36;
  pen.fillStyle = grey(1);
  pen.beginPath();
  [[0, 0], [0, 0.86], [0.22, 0.67], [0.36, 1], [0.5, 0.94], [0.36, 0.62], [0.62, 0.62]].forEach(([x, y], i) =>
    i ? pen.lineTo(tipX + x * s, tipY + y * s) : pen.moveTo(tipX + x * s, tipY + y * s),
  );
  pen.closePath();
  pen.fill();
};

// A 3 by 5 figure for each digit and the colon: one number per row, top row first, one bit per cell.
const FIGURES: Record<string, number[]> = {
  '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [7, 1, 7, 4, 7], '3': [7, 1, 7, 1, 7], '4': [5, 5, 7, 1, 1],
  '5': [7, 4, 7, 1, 7], '6': [7, 4, 7, 5, 7], '7': [7, 1, 1, 1, 1], '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 7],
  ':': [0, 2, 0, 2, 0],
};

// Writes digits in those figures, `size` cells to the bit, from their top left corner.
function figures(pen: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, value: number) {
  pen.fillStyle = grey(value);
  [...text].forEach((figure, n) => {
    for (let row = 0; row < 5; row++) {
      for (let bit = 0; bit < 3; bit++) {
        if (FIGURES[figure][row] & (4 >> bit)) pen.fillRect(x + (n * 4 + bit) * size, y + row * size, size, size);
      }
    }
  });
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
// A cell's own steady number from 0 to 1, for telling one coin in a pile from the next.
const speck = (a: number, b: number) => {
  const n = Math.sin(a * 91.7 + b * 47.3) * 9301.13;
  return n - Math.floor(n);
};

// Launch: a coin press under a dome, across the whole width. Every four seconds a blank slides in, a
// counter runs to fifteen, the ram strikes and the coin drops to a rail, where it splits in one go: one part
// falls into the second of three bins, and the other runs to the first bin and splits again, a coin to each
// of its four stacks. Nothing goes to the third. So each beat shares the coin out 80 to 20 to nothing, and the
// bins hold that split at every moment as stacks of coins: four stacks, one stack, nothing (on a narrow
// screen one stack four coins high, one coin, nothing). Bots run at the press from both sides and bounce off the
// dome, which lights where they hit.
const press: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  const ground = Math.round(u * 0.48); // where the press stands and the dome meets the floor
  const apex = u * 0.03;
  const rx = Math.min(cols / 2 - u * 0.16, u * 0.62);
  const ry = ground - apex;
  const beat = 4; // seconds to a coin
  const n = Math.floor(time / beat); // which coin this is
  const p = time / beat - n; // how far through its beat, 0 to 1
  const cr = Math.max(2, u * 0.04); // the coin's radius while it is in the press

  // the three bins and the coins stacked in them
  const third = cols / 3;
  const top = Math.round(u * 0.62);
  const bottom = Math.round(u * 0.97);
  const rail = Math.round(u * 0.55);
  const width = Math.round(third - Math.max(2, Math.min(u * 0.08, third * 0.12)));
  const wide = width >= 30;
  const stacks = wide ? [4, 1, 0] : [1, 1, 0]; // stacks in each bin
  const high = wide ? [4, 4, 0] : [4, 1, 0]; // coins in each stack: either way the split is 80 to 20 to nothing
  const thick = Math.max(2, u * (wide ? 0.04 : 0.065)); // a coin lying in a stack
  const across = wide ? Math.min(u * 0.22, (width - 3) / 4 - 2) : width - 4; // a stack's width
  const floor = bottom - 1 - Math.max(1, u * 0.02); // where the lowest coins rest
  const left = (k: number) => Math.round(k * third + (third - width) / 2);
  // where a coin lies: the middle of stack `i` in bin `k`, `level` coins up
  const lying = (k: number, i: number, level: number): [number, number] => [left(k) + width / 2 + (i - (stacks[k] - 1) / 2) * (across + 2), floor - (level + 0.5) * thick];
  const lay = (x: number, y: number, value: number) => block(pen, x - across / 2, y - thick / 2 + 0.35, across, thick - 0.7, value, thick * 0.3);
  for (let k = 0; k < 3; k++) {
    const x = left(k);
    block(pen, x, top, 1, bottom - top, 0.6);
    block(pen, x + width - 1, top, 1, bottom - top, 0.6);
    block(pen, x, bottom - 1, width, 1, 0.6);
    for (let i = 0; i < stacks[k]; i++) {
      for (let level = 0; level < high[k]; level++) lay(...lying(k, i, level), 0.8 + 0.2 * speck(i + k * 31, level));
    }
  }
  // the rail from the press to each bin. The way to the third is there and never used.
  block(pen, left(0) + width / 2, rail, left(2) - left(0), 1, 0.3);
  for (let k = 1; k < 3; k++) block(pen, left(k) + width / 2 - 0.5, k === 1 ? ground : rail, 1, top - (k === 1 ? ground : rail), 0.3);
  // over the first bin it branches, with a drop to each stack
  block(pen, lying(0, 0, 0)[0], rail, lying(0, stacks[0] - 1, 0)[0] - lying(0, 0, 0)[0], 1, 0.3);
  for (let i = 0; i < stacks[0]; i++) block(pen, lying(0, i, 0)[0] - 0.5, rail, 1, top - rail, 0.3);

  // the dome and the floor under it
  pen.lineWidth = 1.2;
  pen.strokeStyle = grey(0.45);
  pen.beginPath();
  pen.ellipse(cx, ground, rx, ry, 0, Math.PI, Math.PI * 2);
  pen.stroke();
  block(pen, cx - rx, ground, rx * 2, 1, 0.4);

  // the bots: two each side on a wide screen, one each side on a narrow one
  const botW = u * 0.09;
  const botH = u * 0.07;
  for (let j = 0; j < (cols > u * 2 ? 4 : 2); j++) {
    const side = j % 2 ? 1 : -1;
    const lane = ground - botH * (0.6 + 1.9 * (j >> 1));
    const reach = rx * Math.sqrt(Math.max(0, 1 - ((ground - lane) / ry) ** 2)); // the dome's half width at this height
    const hit = cx + side * (reach + botW * 0.6);
    const from = side < 0 ? -botW : cols + botW;
    const s = (time / (3 + 0.37 * j) + j * 0.29) % 1;
    let x = from + (hit - from) * (s / 0.6) ** 2; // running in, faster and faster
    let y = lane;
    let strength = 1;
    if (s >= 0.6) {
      const k = (s - 0.6) / 0.4; // thrown back in a small arc, fading as it goes
      x = hit + side * u * 0.22 * (1 - (1 - k) ** 2);
      y = lane - Math.sin(k * Math.PI) * u * 0.07;
      strength = 1 - k;
      if (k < 0.45) {
        // the dome lights where it was struck
        const at = Math.atan2(-(ground - lane) / ry, (side * reach) / rx);
        pen.lineWidth = 2;
        pen.strokeStyle = grey(1 - k / 0.45);
        pen.beginPath();
        pen.ellipse(cx, ground, rx, ry, 0, at - 0.25, at + 0.25);
        pen.stroke();
      }
    }
    pen.globalAlpha = strength;
    block(pen, x - botW / 2, y - botH / 2, botW, botH, 0.9, botH * 0.25);
    block(pen, x - 0.5, y - botH * 0.95, 1, botH * 0.45, 0.7); // its antenna
    block(pen, x - side * botW * 0.2 - botW * 0.14, y - botH * 0.2, botW * 0.28, botH * 0.4, 0); // its eye, toward the press
    pen.globalAlpha = 1;
  }

  // the counter: it runs from 0 to 15 while the blank waits, and stays lit once the coin is struck
  const count = Math.min(15, Math.floor(clamp((p - 0.2) / 0.4) * 16));
  const size = u >= 66 ? 2 : 1;
  figures(pen, `0:${String(count).padStart(2, '0')}`, Math.round(cx - 7.5 * size), Math.round(u * 0.06), size, p >= 0.6 ? 1 : 0.7);

  // the press: two pillars, a beam, a ram that strikes at 0.6, an anvil and a base
  const pw = Math.min(u * 0.3, cols * 0.3);
  const anvil = u * 0.42;
  const strike = (p < 0.6 ? 0 : p < 0.66 ? (p - 0.6) / 0.06 : clamp(1 - (p - 0.66) / 0.08)) * u * 0.02;
  block(pen, cx - pw / 2, u * 0.25, u * 0.03, ground - u * 0.25, 0.55);
  block(pen, cx + pw / 2 - u * 0.03, u * 0.25, u * 0.03, ground - u * 0.25, 0.55);
  block(pen, cx - pw / 2, u * 0.25, pw, u * 0.035, 0.75);
  block(pen, cx - u * 0.015, u * 0.28, u * 0.03, u * 0.02 + strike, 0.6);
  block(pen, cx - pw * 0.27, u * 0.295 + strike, pw * 0.54, u * 0.05, 1, u * 0.01);
  block(pen, cx - pw * 0.3, anvil, pw * 0.6, u * 0.03, 0.85);
  block(pen, cx - pw / 2, u * 0.45, pw, ground - u * 0.45, 0.65);

  // Where this beat's coin ends up: one coin on each stack of the first bin, and one in the second.
  const rests: [number, number][] = [...Array.from({ length: stacks[0] }, (_, i) => lying(0, i, high[0])), lying(1, 0, high[1])];
  // the coins of the beat before, lying on their stacks and sinking into them
  if (n > 0 && p < 0.3) {
    pen.globalAlpha = 1 - p / 0.3;
    for (const [x, y] of rests) lay(x, y, 1);
    pen.globalAlpha = 1;
  }
  const onAnvil = anvil - cr;
  if (p < 0.79) {
    // one coin: a blank slides onto the anvil, waits out the count, is struck, and drops to the rail
    const x = p < 0.2 ? cx - (pw / 2 - cr) * (1 - clamp(p / 0.2)) ** 2 : cx;
    const y = onAnvil + (rail - onAnvil) * clamp((p - 0.72) / 0.07) ** 2;
    disc(pen, x, y, cr, cr, p < 0.6 ? 0.55 : 1);
    if (p >= 0.6) disc(pen, x, y, cr * 0.4, cr * 0.4, 0.3); // struck: it has a face now
  } else {
    // At the rail it splits, all in one go. One part falls straight into the second bin. The other runs
    // along the rail to the first bin, branches there to above each stack, and a coin drops onto each.
    const small = cr * 0.8;
    // a part on its way down: a disc that flattens into a coin lying on a stack
    const part = (x: number, y: number, flat: number) => disc(pen, x, y, small + (across / 2 - small) * flat, small + (thick / 2 - 0.35 - small) * flat, 1);
    const smooth = (k: number) => k * k * (3 - 2 * k);
    const fall = clamp((p - 0.79) / 0.14) ** 2;
    const [lockedX, lockedY] = rests[rests.length - 1];
    part(cx + (lockedX - cx) * fall, rail + (lockedY - rail) * fall, fall);
    const over = left(0) + width / 2; // the middle of the first bin
    const along = clamp((p - 0.79) / 0.08); // to the middle of the first bin
    const branch = clamp((p - 0.87) / 0.06); // out along the rail to above each stack
    const drop = clamp((p - 0.93) / 0.07) ** 2; // and down onto it
    if (branch === 0) part(cx + (over - cx) * smooth(along), rail, 0);
    else for (let i = 0; i < stacks[0]; i++) part(over + (rests[i][0] - over) * smooth(branch), rail + (rests[i][1] - rail) * drop, drop);
  }
};

// Trust, fixed supply: full stacks of coins in a box with a sealed lid. A coin comes down, meets the lid and is
// thrown off to one side: nothing more goes in.
const seal: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  const [left, right, lid, floor] = [cx - u * 0.36, cx + u * 0.36, u * 0.46, u * 0.9];
  const thick = (floor - lid - u * 0.06) / 5;
  for (let stack = -1; stack <= 1; stack++) {
    for (let level = 0; level < 5; level++) block(pen, cx + stack * u * 0.22 - u * 0.09, floor - (level + 1) * thick + thick * 0.15, u * 0.18, thick * 0.72, 0.82, thick * 0.3);
  }
  // the box, its lid, and the seal's knot in the middle of the lid
  block(pen, left - u * 0.045, lid, u * 0.045, floor - lid, 1);
  block(pen, right, lid, u * 0.045, floor - lid, 1);
  block(pen, left - u * 0.045, floor, right - left + u * 0.09, u * 0.045, 1);
  block(pen, left - u * 0.07, lid - u * 0.055, right - left + u * 0.14, u * 0.06, 1, u * 0.02);
  disc(pen, cx, lid - u * 0.025, u * 0.065, u * 0.065, 1);
  disc(pen, cx, lid - u * 0.025, u * 0.028, u * 0.028, 0.1);
  // the coin that tries: down to the lid, then off to the side and gone
  const beat = (time * 0.45) % 1;
  const side = Math.floor(time * 0.45) % 2 ? 1 : -1;
  if (beat < 0.4) {
    const fall = (beat / 0.4) ** 2;
    disc(pen, cx + side * u * 0.15, u * 0.06 + fall * (lid - u * 0.16), u * 0.09, u * 0.032, 0.95);
  } else if (beat < 0.85) {
    const t = (beat - 0.4) / 0.45;
    disc(pen, cx + side * u * (0.15 + t * 0.34), lid - u * 0.1 - Math.sin(t * Math.PI) * u * 0.2 + t * u * 0.2, u * 0.09, u * 0.032 + Math.sin(t * Math.PI) * u * 0.04, 0.95 * (1 - t));
  }
};

// Trust, locked liquidity: a padlock. Its shackle stands open, comes down and shuts, and the body flashes as it catches.
const lock: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  const beat = (time * 0.3 + 0.5) % 1; // shut at the still moment
  const ease = (t: number) => t * t * (3 - 2 * t);
  const open = beat < 0.2 ? 1 : beat < 0.32 ? 1 - ease((beat - 0.2) / 0.12) : 0;
  const flash = beat >= 0.32 && beat < 0.5 ? 1 - (beat - 0.32) / 0.18 : 0;
  const top = u * 0.5; // the top of the body
  const lift = open * u * 0.13;
  pen.strokeStyle = grey(0.85);
  pen.lineWidth = u * 0.075;
  pen.lineCap = 'round';
  pen.beginPath();
  pen.moveTo(cx - u * 0.16, top + u * 0.03); // this leg stays in the body
  pen.lineTo(cx - u * 0.16, top - u * 0.12 - lift);
  pen.arc(cx, top - u * 0.12 - lift, u * 0.16, Math.PI, 0);
  pen.lineTo(cx + u * 0.16, top + u * 0.03 - lift * 1.3); // this one reaches it only when shut
  pen.stroke();
  block(pen, cx - u * 0.27, top, u * 0.54, u * 0.38, 0.6 + flash * 0.4, u * 0.06);
  disc(pen, cx, top + u * 0.15, u * 0.05, u * 0.05, 0.08);
  block(pen, cx - u * 0.02, top + u * 0.15, u * 0.04, u * 0.11, 0.08);
};

// Trust, the buyback vault: a vault door with its bolts, its wheel turning slowly one way and then back.
const safe: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const [cx, cy] = [cols / 2, u * 0.5];
  disc(pen, cx, cy, u * 0.44, u * 0.44, 0.78);
  disc(pen, cx, cy, u * 0.37, u * 0.37, 0.1);
  disc(pen, cx, cy, u * 0.32, u * 0.32, 0.4);
  for (let bolt = 0; bolt < 8; bolt++) {
    const a = (bolt * Math.PI) / 4 + Math.PI / 8;
    disc(pen, cx + Math.cos(a) * u * 0.405, cy + Math.sin(a) * u * 0.405, u * 0.024, u * 0.024, 1);
  }
  const turn = Math.sin(time * 0.5) * 1.6;
  pen.strokeStyle = grey(0.9);
  pen.lineWidth = u * 0.04;
  pen.lineCap = 'round';
  for (let spoke = 0; spoke < 3; spoke++) {
    const a = turn + (spoke * Math.PI) / 3;
    pen.beginPath();
    pen.moveTo(cx - Math.cos(a) * u * 0.2, cy - Math.sin(a) * u * 0.2);
    pen.lineTo(cx + Math.cos(a) * u * 0.2, cy + Math.sin(a) * u * 0.2);
    pen.stroke();
  }
  for (let knob = 0; knob < 6; knob++) {
    const a = turn + (knob * Math.PI) / 3;
    disc(pen, cx + Math.cos(a) * u * 0.2, cy + Math.sin(a) * u * 0.2, u * 0.036, u * 0.036, 1);
  }
  disc(pen, cx, cy, u * 0.075, u * 0.075, 1);
  disc(pen, cx, cy, u * 0.032, u * 0.032, 0.15);
};

// Trust, the audit: a shield being read from the top down, line by line. What has been read is lit, and the
// reading starts over: it is not finished.
const shield: Scene = (pen, cols, rows, time) => {
  const u = rows;
  const cx = cols / 2;
  const outline = () => {
    pen.beginPath();
    pen.moveTo(cx - u * 0.3, u * 0.14);
    pen.lineTo(cx + u * 0.3, u * 0.14);
    pen.lineTo(cx + u * 0.3, u * 0.5);
    pen.quadraticCurveTo(cx + u * 0.3, u * 0.76, cx, u * 0.9);
    pen.quadraticCurveTo(cx - u * 0.3, u * 0.76, cx - u * 0.3, u * 0.5);
    pen.closePath();
  };
  outline();
  pen.fillStyle = grey(0.14);
  pen.fill();
  const beat = (time * 0.28) % 1;
  const line = u * (0.14 + Math.min(1, beat / 0.8) * 0.76);
  pen.save();
  outline();
  pen.clip();
  block(pen, 0, u * 0.14, cols, line - u * 0.14, 0.34);
  for (let row = 0; row < 6; row++) {
    const y = u * (0.25 + row * 0.09);
    if (y < line) block(pen, cx - u * 0.18, y, u * (0.36 - (row % 3) * 0.08), u * 0.034, 0.78);
  }
  block(pen, 0, line - u * 0.018, cols, u * 0.036, 1);
  pen.restore();
  outline();
  pen.strokeStyle = grey(0.95);
  pen.lineWidth = u * 0.045;
  pen.lineJoin = 'round';
  pen.stroke();
};

export const SCENES = { vault, bot, click, coin: token, press, seal, lock, safe, shield };
export type SceneName = keyof typeof SCENES;
