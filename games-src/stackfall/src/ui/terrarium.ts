// Terrarium scenery painted once per layout / hue bucket: light shafts, bokeh, hanging vines, ferns and a
// wooden tray under the glass. Everything is clipped OUT of the well rectangle so stone contrast is unchanged.
import type { Box } from './layout';

type Ctx = CanvasRenderingContext2D;

export const seeded = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => (a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296;
};

function leafy(c: Ctx, x: number, y: number, len: number, ang: number, rnd: () => number, fill: string): void {
  const bend = (rnd() - 0.5) * len * 0.6;
  const px = (t: number): number => x + Math.cos(ang) * len * t + Math.sin(ang) * bend * t * t;
  const py = (t: number): number => y + Math.sin(ang) * len * t - Math.cos(ang) * bend * t * t;
  c.strokeStyle = fill;
  c.lineWidth = Math.max(1.5, len * 0.012);
  c.beginPath();
  c.moveTo(x, y);
  for (let t = 0.1; t <= 1; t += 0.1) c.lineTo(px(t), py(t));
  c.stroke();
  c.fillStyle = fill;
  for (let i = 1; i <= 18; i++) {
    const t = i / 18;
    const s = len * 0.075 * Math.sin(Math.PI * Math.min(1, t * 1.15));
    for (const side of [-1, 1]) {
      c.beginPath();
      c.ellipse(px(t) + Math.sin(ang) * side * s * 0.6, py(t) - Math.cos(ang) * side * s * 0.6, s, s * 0.28, ang + side * 0.8, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function shafts(c: Ctx, W: number, H: number, hue: number): void {
  for (let i = 0; i < 4; i++) {
    const x = W * (0.05 + i * 0.27);
    const g = c.createLinearGradient(x, 0, x + W * 0.25, H);
    g.addColorStop(0, `hsla(${hue + 20} 80% 80% / 0.11)`);
    g.addColorStop(1, `hsla(${hue + 20} 80% 80% / 0)`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x, 0); c.lineTo(x + W * 0.1, 0); c.lineTo(x + W * 0.4, H); c.lineTo(x + W * 0.22, H);
    c.fill();
  }
}

function plants(c: Ctx, W: number, H: number, hue: number, rnd: () => number): void {
  const m = Math.min(W, H);
  const dark = `hsl(${(hue + 10) % 360} 40% 10%)`;
  const mid = `hsl(${(hue + 5) % 360} 38% 17%)`;
  for (const side of [0, 1]) {
    const x0 = side === 0 ? -m * 0.02 : W + m * 0.02;
    const dir = side === 0 ? 1 : -1;
    for (let i = 0; i < 6; i++) {
      leafy(c, x0, H * (0.55 + rnd() * 0.5), m * (0.32 + rnd() * 0.3), dir > 0 ? -0.9 + rnd() * 0.7 : -Math.PI + 0.9 - rnd() * 0.7, rnd, i % 2 ? mid : dark);
    }
    // Hanging vines from the top corner.
    for (let i = 0; i < 4; i++) {
      const vx = side === 0 ? m * (0.02 + i * 0.05) : W - m * (0.02 + i * 0.05);
      leafy(c, vx, -4, m * (0.25 + rnd() * 0.3), Math.PI / 2 + (rnd() - 0.5) * 0.5, rnd, mid);
    }
  }
}

function bokeh(c: Ctx, W: number, H: number, hue: number, rnd: () => number): void {
  for (let i = 0; i < 14; i++) {
    const r = Math.min(W, H) * (0.015 + rnd() * 0.035);
    const x = rnd() * W;
    const y = rnd() * H * 0.8;
    c.fillStyle = `hsla(${hue + 20 + rnd() * 40} 70% 75% / ${0.03 + rnd() * 0.05})`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
}

/** Wooden tray the terrarium stands on (drawn across the bottom, under the pebble bed). */
function tray(c: Ctx, W: number, H: number, well: Box, cell: number): void {
  const y = well.y + well.h + cell * 0.55;
  if (y >= H) return;
  const h = Math.max(cell * 0.5, H - y);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#3a2a1c');
  g.addColorStop(0.15, '#4a3624');
  g.addColorStop(1, '#1e150d');
  c.fillStyle = g;
  c.fillRect(0, y, W, h);
  c.fillStyle = 'rgba(255,220,170,0.18)';
  c.fillRect(0, y, W, 1.5);
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 1; i < 5; i++) { c.moveTo(0, y + (h * i) / 5); c.lineTo(W, y + (h * i) / 5 + 2); }
  c.stroke();
}

export function paintScenery(c: Ctx, W: number, H: number, hue: number, well: Box, cell: number): void {
  const rnd = seeded(4242);
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.rect(well.x - cell * 0.35, well.y - cell * 0.35, well.w + cell * 0.7, well.h + cell * 0.7 + cell * 1.1);
  c.clip('evenodd');
  shafts(c, W, H, hue);
  bokeh(c, W, H, hue, rnd);
  plants(c, W, H, hue, rnd);
  tray(c, W, H, well, cell);
  c.restore();
}
