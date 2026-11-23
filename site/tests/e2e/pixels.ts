import type { Locator } from '@playwright/test';

// How many of a canvas's pixels are drawn, and the colour at a point given as fractions of its box.
export const read = (canvas: Locator, at: [number, number] = [0.5, 0.5]) =>
  canvas.evaluate((el, [fx, fy]) => {
    const c = el as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let drawn = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) drawn++;
    const i = (Math.floor(fy * c.height) * c.width + Math.floor(fx * c.width)) * 4;
    return { drawn, total: data.length / 4, pixel: [data[i], data[i + 1], data[i + 2], data[i + 3]] };
  }, at);

// A fingerprint of everything a canvas shows, to tell one frame from another.
export const snapshot = (canvas: Locator) =>
  canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum = (sum * 31 + data[i]) % 2147483647;
    return sum;
  });

// How many pixels are drawn inside one part of a canvas, given as fractions of its box: [left, top, right, bottom].
export const drawnIn = (canvas: Locator, part: [number, number, number, number]) =>
  canvas.evaluate((el, [left, top, right, bottom]) => {
    const c = el as HTMLCanvasElement;
    const [x, y] = [Math.floor(left * c.width), Math.floor(top * c.height)];
    const [w, h] = [Math.max(1, Math.floor((right - left) * c.width)), Math.max(1, Math.floor((bottom - top) * c.height))];
    const data = c.getContext('2d')!.getImageData(x, y, w, h).data;
    let drawn = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) drawn++;
    return drawn;
  }, part);
