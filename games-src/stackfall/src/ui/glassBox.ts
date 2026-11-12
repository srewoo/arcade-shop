// Glass box, pebble bed, moss and condensation around the well. Painted into a cached canvas.
import { seeded } from './terrarium';
import type { Box } from './layout';

type Ctx = CanvasRenderingContext2D;

export function paintBed(c: Ctx, x: number, y: number, w: number, cell: number, hue: number): void {
  const rnd = seeded(777);
  const soil = c.createLinearGradient(0, y, 0, y + cell * 1.0);
  soil.addColorStop(0, `hsl(${(hue + 20) % 360} 28% 16%)`);
  soil.addColorStop(1, `hsl(${(hue + 20) % 360} 25% 7%)`);
  c.fillStyle = soil;
  c.fillRect(x, y + cell * 0.1, w, cell * 0.85);
  for (let px = x; px < x + w; px += cell * 0.3) {
    const r = cell * (0.09 + rnd() * 0.12);
    const py = y + cell * (0.2 + rnd() * 0.5);
    const h = Math.round(30 + rnd() * 40);
    const l = Math.round(34 + rnd() * 26);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(px + r + 1, py + r * 0.5, r * 1.3, r * 0.8, 0, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(px + r * 0.7, py - r * 0.3, 0.5, px + r, py, r * 1.4);
    g.addColorStop(0, `hsl(${h} 18% ${Math.min(82, l + 26)}%)`);
    g.addColorStop(1, `hsl(${h} ${Math.round(8 + rnd() * 14)}% ${Math.max(14, l - 14)}%)`);
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(px + r, py, r * 1.3, r, 0, 0, Math.PI * 2);
    c.fill();
  }
  // Moss tufts along the front edge.
  for (let px = x; px < x + w; px += cell * 0.22) {
    const r = cell * (0.08 + rnd() * 0.1);
    c.fillStyle = `hsl(${Math.round(95 + rnd() * 40)} ${Math.round(40 + rnd() * 25)}% ${Math.round(22 + rnd() * 16)}%)`;
    c.beginPath();
    c.arc(px, y + cell * 0.12, r, Math.PI, 0);
    c.fill();
  }
}

function frame(c: Ctx, x: number, y: number, w: number, h: number, cell: number, pad: number): void {
  const edge = c.createLinearGradient(x, y, x + w, y);
  edge.addColorStop(0, 'rgba(255,255,255,0.6)');
  edge.addColorStop(0.08, 'rgba(255,255,255,0.14)');
  edge.addColorStop(0.92, 'rgba(255,255,255,0.14)');
  edge.addColorStop(1, 'rgba(255,255,255,0.45)');
  c.strokeStyle = edge;
  c.lineWidth = Math.max(2, cell * 0.12);
  c.strokeRect(x - pad / 2, y - pad / 2, w + pad, h + pad);
  c.strokeStyle = 'rgba(160,230,220,0.18)'; // green glass tint on the inner edge
  c.lineWidth = Math.max(1, cell * 0.05);
  c.strokeRect(x - pad / 2 + cell * 0.1, y - pad / 2 + cell * 0.1, w + pad - cell * 0.2, h + pad - cell * 0.2);
  // Brass-like lid rim at the top.
  const rim = c.createLinearGradient(0, y - pad - cell * 0.16, 0, y - pad / 2 + 2);
  rim.addColorStop(0, '#d8c48a');
  rim.addColorStop(0.5, '#8a7440');
  rim.addColorStop(1, '#4e3f1e');
  c.fillStyle = rim;
  c.fillRect(x - pad - 2, y - pad - cell * 0.16, w + pad * 2 + 4, cell * 0.16 + pad / 2 + 2);
}

function reflections(c: Ctx, x: number, y: number, w: number, h: number, cell: number): void {
  c.fillStyle = 'rgba(255,255,255,0.07)'; // diagonal glare
  c.beginPath();
  c.moveTo(x + w * 0.12, y); c.lineTo(x + w * 0.34, y); c.lineTo(x + w * 0.1, y + h * 0.55); c.lineTo(x, y + h * 0.55); c.lineTo(x, y + h * 0.2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.05)';
  c.fillRect(x + w * 0.46, y, w * 0.035, h * 0.4);
  const gl = c.createLinearGradient(x + w - cell * 0.5, 0, x + w, 0);
  gl.addColorStop(0, 'rgba(255,255,255,0)');
  gl.addColorStop(1, 'rgba(255,255,255,0.1)');
  c.fillStyle = gl;
  c.fillRect(x + w - cell * 0.5, y, cell * 0.5, h);
  // Condensation droplets near the lid.
  const rnd = seeded(31);
  for (let i = 0; i < 16; i++) {
    const dx = x + rnd() * w;
    const dy = y + rnd() * cell * 2.2;
    const r = cell * (0.03 + rnd() * 0.04);
    c.fillStyle = 'rgba(255,255,255,0.10)';
    c.beginPath();
    c.arc(dx, dy, r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(dx - r * 0.5, dy - r * 0.6, r * 0.5, r * 0.4);
  }
}

export function paintGlass(c: Ctx, well: Box, cell: number, hue: number): void {
  const { x, y, w, h } = well;
  const pad = cell * 0.18;
  c.fillStyle = 'rgba(8,16,20,0.45)';
  c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(255,255,255,0.05)';
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 1; i < 10; i++) { c.moveTo(x + i * cell, y); c.lineTo(x + i * cell, y + h); }
  for (let j = 1; j < 20; j++) { c.moveTo(x, y + j * cell); c.lineTo(x + w, y + j * cell); }
  c.stroke();
  paintBed(c, x - pad, y + h, w + pad * 2, cell, hue);
  frame(c, x, y, w, h, cell, pad);
  reflections(c, x, y, w, h, cell);
}
