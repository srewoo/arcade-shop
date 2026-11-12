// Procedural stone sprites, cached per (palette, palette index, pixel size).
// Each shape carries its own glyph so colour is never the only cue.
import { GLYPH_HALO, GLYPH_INK, stoneOf } from './palette';

const cache = new Map<string, HTMLCanvasElement>();
const CACHE_LIMIT = 128;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

type Pt = readonly [number, number];
const poly = (c: CanvasRenderingContext2D, pts: readonly Pt[]): void => {
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

/** Glyph per shape index: bar, square, triangle, diamond, plus, ring, disc. Garbage gets a dot. */
export function glyphPath(c: CanvasRenderingContext2D, idx: number, s: number): void {
  const m = s / 2;
  const r = s * 0.26;
  c.beginPath();
  switch (idx) {
    case 1: c.rect(m - r * 1.15, m - r * 0.38, r * 2.3, r * 0.76); break; // bar
    case 2: c.rect(m - r * 0.85, m - r * 0.85, r * 1.7, r * 1.7); break; // square
    case 3: poly(c, [[m, m - r * 1.05], [m + r * 1.05, m + r * 0.8], [m - r * 1.05, m + r * 0.8]]); break; // triangle
    case 4: poly(c, [[m, m - r * 1.15], [m + r * 1.15, m], [m, m + r * 1.15], [m - r * 1.15, m]]); break; // diamond
    case 5: { // plus
      const t = r * 0.42;
      poly(c, [[m - t, m - r], [m + t, m - r], [m + t, m - t], [m + r, m - t], [m + r, m + t], [m + t, m + t], [m + t, m + r], [m - t, m + r], [m - t, m + t], [m - r, m + t], [m - r, m - t], [m - t, m - t]]);
      break;
    }
    case 6: c.arc(m, m, r * 0.95, 0, Math.PI * 2); c.moveTo(m + r * 0.45, m); c.arc(m, m, r * 0.45, 0, Math.PI * 2, true); break; // ring
    case 7: c.arc(m, m, r * 0.9, 0, Math.PI * 2); break; // disc
    default: c.arc(m, m, r * 0.35, 0, Math.PI * 2); // garbage dot
  }
}

/** Cut-gem facets: four bevel faces around a polished table, each lit from the upper left. */
function facets(c: CanvasRenderingContext2D, size: number, pad: number): void {
  const o = pad;
  const e = size - pad;
  const i0 = size * 0.2;
  const i1 = size - i0;
  const face = (pts: readonly Pt[], fill: string): void => {
    c.beginPath();
    poly(c, pts);
    c.fillStyle = fill;
    c.fill();
  };
  face([[o, o], [e, o], [i1, i0], [i0, i0]], 'rgba(255,255,255,0.34)'); // top
  face([[o, o], [i0, i0], [i0, i1], [o, e]], 'rgba(255,255,255,0.16)'); // left
  face([[e, o], [e, e], [i1, i1], [i1, i0]], 'rgba(0,0,0,0.22)'); // right
  face([[o, e], [i0, i1], [i1, i1], [e, e]], 'rgba(0,0,0,0.38)'); // bottom
  c.strokeStyle = 'rgba(255,255,255,0.28)';
  c.lineWidth = Math.max(0.6, size * 0.015);
  c.beginPath();
  c.moveTo(o, o); c.lineTo(i0, i0); c.moveTo(e, o); c.lineTo(i1, i0); c.moveTo(o, e); c.lineTo(i0, i1); c.moveTo(e, e); c.lineTo(i1, i1);
  c.stroke();
  const table = c.createLinearGradient(i0, i0, i1, i1); // polished table lifts the glyph area
  table.addColorStop(0, 'rgba(255,255,255,0.26)');
  table.addColorStop(1, 'rgba(255,255,255,0.04)');
  c.fillStyle = table;
  c.fillRect(i0, i0, i1 - i0, i1 - i0);
}

function build(idx: number, size: number, assist: boolean): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d') as CanvasRenderingContext2D;
  const st = stoneOf(idx, assist);
  const pad = Math.max(1, size * 0.04);
  const w = size - pad * 2;
  const g = c.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, st.light);
  g.addColorStop(0.45, st.base);
  g.addColorStop(1, st.dark);
  roundRect(c, pad, pad, w, w, size * 0.22);
  c.fillStyle = g;
  c.fill();
  c.save();
  roundRect(c, pad, pad, w, w, size * 0.22);
  c.clip();
  facets(c, size, pad);
  c.restore();
  roundRect(c, pad, pad, w, w, size * 0.22);
  c.strokeStyle = 'rgba(0,0,0,0.35)';
  c.lineWidth = Math.max(1, size * 0.03);
  c.stroke();
  glyphPath(c, idx, size);
  c.fillStyle = GLYPH_INK; // dark ink with a light halo: >= 3:1 on every stone
  c.strokeStyle = GLYPH_HALO;
  c.lineJoin = 'round';
  c.lineWidth = Math.max(1.2, size * 0.07);
  c.stroke();
  c.fill('evenodd');
  c.fillStyle = 'rgba(255,255,255,0.9)'; // specular glints
  c.beginPath();
  c.arc(size * 0.2, size * 0.18, size * 0.05, 0, Math.PI * 2);
  c.fill();
  c.fillRect(size * 0.3, size * 0.1, size * 0.12, Math.max(1, size * 0.025));
  if (assist) outline(c, size, pad);
  return cv;
}

/** Colour-blind assist: a dark outer and light inner outline on every cell. */
function outline(c: CanvasRenderingContext2D, size: number, pad: number): void {
  const lw = Math.max(1.5, size * 0.06);
  c.lineWidth = lw;
  c.strokeStyle = 'rgba(0,0,0,0.85)';
  roundRect(c, pad + lw / 2, pad + lw / 2, size - 2 * pad - lw, size - 2 * pad - lw, size * 0.2);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  roundRect(c, pad + lw * 1.5, pad + lw * 1.5, size - 2 * pad - lw * 3, size - 2 * pad - lw * 3, size * 0.16);
  c.stroke();
}

export function stoneSprite(idx: number, size: number, assist = false): HTMLCanvasElement {
  const px = Math.max(4, Math.round(size));
  const key = `${assist ? 'a' : 'd'}${idx}:${px}`;
  let sprite = cache.get(key);
  if (!sprite) {
    sprite = build(idx, px, assist);
    cache.set(key, sprite);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  }
  return sprite;
}

/** Build every sprite for the given pixel sizes ahead of time (call when idle). */
export function prewarmSprites(sizes: readonly number[], assist: boolean): void {
  for (const size of sizes) for (let idx = 1; idx <= 8; idx++) stoneSprite(idx, size, assist);
}
