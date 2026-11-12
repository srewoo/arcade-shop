// Office props painted into the static backdrop: window at dusk, shelves, cooler, desk, plant, lamps.
import { INK, NIGHT } from './palette';
import { fitFontPx } from './fit';

type C = CanvasRenderingContext2D;

export function rect(c: C, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, r = 4): void {
  c.fillStyle = fill; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); c.stroke();
}

/** Window onto a dusk sky: gradient, stars, moon, bare tree silhouette and a pumpkin on the sill. */
export function windowPane(c: C, x: number, y: number, u: number): void {
  const w = 130 * u, h = 88 * u;
  const sky = c.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, NIGHT.top); sky.addColorStop(0.65, NIGHT.mid); sky.addColorStop(1, NIGHT.low);
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, 4); c.clip();
  c.fillStyle = sky; c.fillRect(x, y, w, h);
  c.fillStyle = '#fff';
  for (let i = 0; i < 14; i++) { const sx = x + ((i * 37) % 100) / 100 * w, sy = y + ((i * 53) % 55) / 100 * h; c.globalAlpha = 0.4 + (i % 3) * 0.2; c.fillRect(sx, sy, 1.6, 1.6); }
  c.globalAlpha = 1;
  c.fillStyle = NIGHT.moon; c.beginPath(); c.arc(x + w * 0.76, y + h * 0.3, 9 * u, 0, 7); c.fill();
  c.fillStyle = NIGHT.top; c.beginPath(); c.arc(x + w * 0.76 + 4 * u, y + h * 0.3 - 2 * u, 8 * u, 0, 7); c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1;
  tree(c, x + w * 0.04, y + h, u);
  c.fillStyle = '#3a2350'; c.fillRect(x, y + h * 0.88, w, h * 0.12);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.roundRect(x, y, w, h, 4); c.stroke();
  c.strokeStyle = '#f5ead6'; c.lineWidth = 3 * u + 1;
  c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.5); c.lineTo(x + w, y + h * 0.5); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.moveTo(x + w * 0.1, y + h); c.lineTo(x + w * 0.28, y); c.lineTo(x + w * 0.4, y); c.lineTo(x + w * 0.22, y + h); c.fill();
  rect(c, x - 7 * u, y + h, w + 14 * u, 8 * u, '#e8dcc6', 3);
  pumpkin(c, x + w * 0.2, y + h - 1, u);
}

function tree(c: C, x: number, base: number, u: number): void {
  c.strokeStyle = NIGHT.tree; c.lineCap = 'round';
  const branch = (x0: number, y0: number, x1: number, y1: number, wd: number): void => {
    c.lineWidth = wd; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  };
  branch(x, base, x + 14 * u, base - 36 * u, 6 * u);
  branch(x + 14 * u, base - 36 * u, x + 34 * u, base - 58 * u, 3.5 * u);
  branch(x + 14 * u, base - 36 * u, x + 2 * u, base - 62 * u, 2.5 * u);
  branch(x + 26 * u, base - 50 * u, x + 50 * u, base - 52 * u, 2.5 * u);
  branch(x + 34 * u, base - 58 * u, x + 44 * u, base - 80 * u, 2 * u);
  branch(x + 8 * u, base - 26 * u, x + 30 * u, base - 30 * u, 2.5 * u);
}

function pumpkin(c: C, x: number, y: number, u: number): void {
  c.fillStyle = '#f08a24'; c.strokeStyle = INK; c.lineWidth = 1.6;
  c.beginPath(); c.ellipse(x, y - 7 * u, 10 * u, 7.5 * u, 0, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = '#c4601a'; c.lineWidth = 1;
  for (const dx of [-4, 0, 4]) { c.beginPath(); c.ellipse(x + dx * u, y - 7 * u, 3 * u, 7 * u, 0, 0, 7); c.stroke(); }
  c.fillStyle = '#4f7a3a'; c.fillRect(x - 1.2 * u, y - 17 * u, 2.4 * u, 4 * u);
}

export function clock(c: C, x: number, y: number, r: number): void {
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e8e0d0');
  c.fillStyle = g; c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
  c.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); c.stroke(); }
  c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + r * 0.5, y - r * 0.2); c.moveTo(x, y); c.lineTo(x - r * 0.1, y - r * 0.7); c.stroke();
}

export function poster(c: C, x: number, y: number, u: number): void {
  rect(c, x, y, 70 * u, 90 * u, '#fff3d6');
  c.fillStyle = '#f2a33a'; c.beginPath(); c.ellipse(x + 35 * u, y + 40 * u, 18 * u, 16 * u, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + 35 * u + s * 16 * u, y + 30 * u); c.lineTo(x + 35 * u + s * 11 * u, y + 17 * u); c.lineTo(x + 35 * u + s * 5 * u, y + 26 * u); c.fill(); }
  const text = 'NAP TEAM', base = Math.max(8, 9 * u), maxW = 60 * u;
  c.textAlign = 'center';
  c.font = `bold ${base}px system-ui, sans-serif`;
  c.font = `bold ${fitFontPx(c.measureText(text).width, base, maxW)}px system-ui, sans-serif`;
  c.fillText(text, x + 35 * u, y + 78 * u, maxW); c.textAlign = 'left';
}

export function shelf(c: C, x: number, y: number, u: number): void {
  rect(c, x, y, 96 * u, 8 * u, '#b8864f', 2);
  const cols = ['#e8553e', '#3aa6b0', '#f2a33a', '#8a63c9', '#5aa469', '#e8553e'];
  let bx = x + 5 * u;
  cols.forEach((col, i) => { const bw = (8 + (i % 3) * 3) * u, bh = (26 + (i % 2) * 8) * u; rect(c, bx, y - bh, bw, bh, col, 1.5); bx += bw + 1.5 * u; });
  rect(c, bx + 4 * u, y - 18 * u, 14 * u, 18 * u, '#f4f1ec', 3);
}

export function lamp(c: C, x: number, y: number, u: number): void {
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke();
  const g = c.createRadialGradient(x, y + 20 * u, 2, x, y + 40 * u, 90 * u);
  g.addColorStop(0, 'rgba(255,230,160,0.5)'); g.addColorStop(1, 'rgba(255,230,160,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - 16 * u, y + 12 * u); c.lineTo(x + 16 * u, y + 12 * u); c.lineTo(x + 90 * u, y + 120 * u); c.lineTo(x - 90 * u, y + 120 * u); c.fill();
  c.fillStyle = '#e8553e'; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - 6 * u, y); c.lineTo(x + 6 * u, y); c.lineTo(x + 17 * u, y + 13 * u); c.lineTo(x - 17 * u, y + 13 * u); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffe9a8'; c.beginPath(); c.ellipse(x, y + 13 * u, 11 * u, 2.5 * u, 0, 0, 7); c.fill();
}

export function furniture(c: C, y: number, w: number, u: number): void {
  const bot = c.createLinearGradient(0, y - 78 * u, 0, y);
  bot.addColorStop(0, '#b9d3e8'); bot.addColorStop(1, '#8fb0cf');
  rect(c, w * 0.06, y - 70 * u, 38 * u, 70 * u, '#9bb7d4', 6);
  rect(c, w * 0.06 + 5 * u, y - 96 * u, 28 * u, 28 * u, bot, 14);
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(w * 0.06 + 13 * u, y - 86 * u, 3 * u, 7 * u, 0.2, 0, 7); c.fill();
  rect(c, w * 0.86, y - 78 * u, 50 * u, 78 * u, '#a7a79f', 4);
  for (let i = 0; i < 3; i++) { rect(c, w * 0.86 + 6 * u, y - 72 * u + i * 24 * u, 38 * u, 18 * u, '#c8c8be', 3); rect(c, w * 0.86 + 20 * u, y - 66 * u + i * 24 * u, 10 * u, 3 * u, '#6c6c64', 1); }
  rect(c, w * 0.72, y - 44 * u, 110 * u, 44 * u, '#b8864f', 4);
  c.strokeStyle = '#8a5f33'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * 0.72 + 4, y - 40 * u); c.lineTo(w * 0.72 + 106 * u, y - 40 * u); c.stroke();
  const scr = c.createLinearGradient(0, y - 80 * u, 0, y - 46 * u);
  scr.addColorStop(0, '#8fe0e8'); scr.addColorStop(1, '#4fa8b8');
  rect(c, w * 0.72 + 30 * u, y - 80 * u, 44 * u, 34 * u, '#3b4a54', 4);
  c.fillStyle = scr; c.fillRect(w * 0.72 + 33 * u, y - 77 * u, 38 * u, 26 * u);
  c.fillStyle = '#ffffff'; c.globalAlpha = 0.85; c.beginPath(); c.arc(w * 0.72 + 52 * u, y - 62 * u, 4.5 * u, 0, 7); c.fill(); c.globalAlpha = 1;
  plant(c, w * 0.28, y, u);
}

function plant(c: C, x: number, y: number, u: number): void {
  c.fillStyle = '#e8553e'; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - 13 * u, y - 24 * u); c.lineTo(x + 13 * u, y - 24 * u); c.lineTo(x + 9 * u, y - 2 * u); c.lineTo(x - 9 * u, y - 2 * u); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#5aa469';
  for (const [dx, rot, hh] of [[-9, -0.5, 18], [-3, -0.15, 24], [4, 0.2, 22], [10, 0.55, 16]] as const) {
    c.beginPath(); c.ellipse(x + dx * u, y - 36 * u, 5.5 * u, hh * u, rot, 0, 7); c.fill(); c.stroke();
  }
}
