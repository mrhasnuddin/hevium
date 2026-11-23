// A short price line for one pair, as the points of an SVG polyline in a 200 by 48 frame. It is a walk
// seeded by the ticker's own letters: every pair has a line of its own, and the same one on every visit,
// so the page is built with it in place. It leans upward a little.
export function priceLine(ticker: string) {
  let seed = [...ticker].reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) >>> 0, 7);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const points: string[] = [];
  let y = 24 + random() * 16;
  for (let x = 2; x <= 198; x += 14) {
    points.push(`${x},${y.toFixed(1)}`);
    y += (random() - 0.53) * 26; // smaller y is higher on screen
    // it turns back at the frame's edges rather than running flat along one
    if (y > 44) y = 88 - y;
    if (y < 4) y = 8 - y;
  }
  return points.join(' ');
}
