// Tileable rock texture (strata, stones, cracks, mineral flecks) painted once and used as a
// canvas pattern for the cave walls and pillars. Scrolled by translating the pattern.
import { hash2, hexA as hex } from './caveMath';
import type { Palette, View } from './view';

const TILE = 256;
const PX = 2;

let cached: { key: string; canvas: HTMLCanvasElement } | null = null;

/** Draw `fn` at every wrap offset so features crossing the tile edge stay seamless. */
function wrapped(c: CanvasRenderingContext2D, fn: () => void): void {
  for (const dx of [-TILE, 0, TILE]) {
    for (const dy of [-TILE, 0, TILE]) {
      c.save();
      c.translate(dx, dy);
      fn();
      c.restore();
    }
  }
}

function blotches(c: CanvasRenderingContext2D, p: Palette): void {
  for (let i = 0; i < 16; i++) {
    const x = hash2(i, 1) * TILE;
    const y = hash2(i, 2) * TILE;
    const r = 30 + hash2(i, 3) * 50;
    const dark = i % 2 === 0;
    wrapped(c, () => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, dark ? 'rgba(2,8,16,0.28)' : hex(p.rockHi, 0.16));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    });
  }
}

function strata(c: CanvasRenderingContext2D, p: Palette): void {
  c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = (i + hash2(i, 4) * 0.7) * (TILE / 9);
    const amp = 2 + hash2(i, 5) * 5;
    const ph = hash2(i, 6) * 6;
    const path = (off: number): void => {
      c.beginPath();
      for (let x = -4; x <= TILE + 4; x += 8) {
        const yy = y + off + Math.sin(x / TILE * Math.PI * 2 + ph) * amp;
        if (x === -4) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    };
    c.lineWidth = 2.4;
    c.strokeStyle = 'rgba(2,8,16,0.22)';
    path(0);
    c.lineWidth = 1.1;
    c.strokeStyle = hex(p.rockHi, 0.28);
    path(2.2);
  }
}

function stones(c: CanvasRenderingContext2D, p: Palette): void {
  for (let i = 0; i < 26; i++) {
    const x = hash2(i, 7) * TILE;
    const y = hash2(i, 8) * TILE;
    const r = 6 + hash2(i, 9) * 14;
    const pts = Array.from({ length: 7 }, (_, k) => {
      const a = (k / 7) * Math.PI * 2;
      const rr = r * (0.7 + hash2(i * 7 + k, 10) * 0.5);
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75] as const;
    });
    wrapped(c, () => {
      c.beginPath();
      pts.forEach(([px, py], k) => (k === 0 ? c.moveTo(px, py) : c.lineTo(px, py)));
      c.closePath();
      c.fillStyle = hex(p.rockHi, 0.06 + hash2(i, 11) * 0.1);
      c.fill();
      c.strokeStyle = 'rgba(2,8,16,0.2)';
      c.lineWidth = 1;
      c.stroke();
    });
  }
}

function cracks(c: CanvasRenderingContext2D): void {
  c.strokeStyle = 'rgba(1,5,12,0.3)';
  c.lineWidth = 1.2;
  c.lineJoin = 'round';
  for (let i = 0; i < 10; i++) {
    let x = hash2(i, 12) * TILE;
    let y = hash2(i, 13) * TILE;
    const pts: (readonly [number, number])[] = [[x, y]];
    for (let k = 0; k < 5; k++) {
      x += (hash2(i * 9 + k, 14) - 0.4) * 16;
      y += (hash2(i * 9 + k, 15) - 0.5) * 16;
      pts.push([x, y]);
    }
    wrapped(c, () => {
      c.beginPath();
      pts.forEach(([px, py], k) => (k === 0 ? c.moveTo(px, py) : c.lineTo(px, py)));
      c.stroke();
    });
  }
}

function flecks(c: CanvasRenderingContext2D, p: Palette): void {
  for (let i = 0; i < 34; i++) {
    const x = hash2(i, 16) * TILE;
    const y = hash2(i, 17) * TILE;
    const r = 0.8 + hash2(i, 18) * 1.8;
    wrapped(c, () => {
      c.fillStyle = i % 5 === 0 ? hex(p.glow, 0.75) : hex(p.rim, 0.28);
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    });
  }
}

function build(p: Palette): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = TILE * PX;
  cv.height = TILE * PX;
  const c = cv.getContext('2d');
  if (!c) return cv;
  c.scale(PX, PX);
  c.fillStyle = p.rock;
  c.fillRect(0, 0, TILE, TILE);
  blotches(c, p);
  strata(c, p);
  stones(c, p);
  cracks(c);
  flecks(c, p);
  return cv;
}

let tall: { key: string; canvas: HTMLCanvasElement; w: number; h: number } | null = null;

/** Tall tile (one tile wide, as high as the view) at device resolution, depth shading baked in. */
function tallTile(p: Palette, v: View): { canvas: HTMLCanvasElement; w: number; h: number } {
  const px = v.s * v.dpr;
  const w = Math.max(1, Math.round(TILE * px));
  const h = Math.max(1, Math.round((v.bottom - v.top) * px));
  const baseKey = `${p.rock}|${p.rockHi}|${p.glow}|${p.rim}`;
  const key = `${baseKey}|${w}|${h}|${v.top}`;
  if (tall?.key === key) return tall;
  if (cached?.key !== baseKey) cached = { key: baseKey, canvas: build(p) };
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  if (c && cached) {
    for (let y = 0; y < h; y += w) c.drawImage(cached.canvas, 0, y, w, w);
    const ceil = c.createLinearGradient(0, 0, 0, (170 - v.top) * px);
    ceil.addColorStop(0, 'rgba(2,8,16,0.55)');
    ceil.addColorStop(1, 'rgba(2,8,16,0)');
    c.fillStyle = ceil;
    c.fillRect(0, 0, w, h);
    const floor = c.createLinearGradient(0, h, 0, (300 - v.top) * px);
    floor.addColorStop(0, 'rgba(2,8,16,0.55)');
    floor.addColorStop(1, 'rgba(2,8,16,0)');
    c.fillStyle = floor;
    c.fillRect(0, 0, w, h);
  }
  tall = { key, canvas: cv, w, h };
  return tall;
}

/** Pattern aligned so the texture scrolls with the world (`camX`). Null if unavailable. */
export function rockPattern(ctx: CanvasRenderingContext2D, p: Palette, camX: number, v: View): CanvasPattern | null {
  const t = tallTile(p, v);
  const pat = ctx.createPattern(t.canvas, 'repeat');
  if (!pat) return null;
  // Snap the tile origin to whole device pixels so the browser can blit 1:1 instead of resampling.
  const m = ctx.getTransform();
  const offUser = ((camX % TILE) + TILE) % TILE;
  const x0 = Math.round(m.e - offUser * m.a);
  const y0 = Math.round(m.f + v.top * m.d);
  pat.setTransform(new DOMMatrix().translate((x0 - m.e) / m.a, (y0 - m.f) / m.d).scale(TILE / t.w, (v.bottom - v.top) / t.h));
  return pat;
}
