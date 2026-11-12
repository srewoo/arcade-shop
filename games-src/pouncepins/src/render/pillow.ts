// Cushion pits behind and beside the deck: plump pillows with highlight, seam, button and contact shadow.
import { CONFIG } from '../config';
import { INK, PILLOWS } from './palette';
import type { Camera } from './camera';

const { lane } = CONFIG;

export function pillow(c: CanvasRenderingContext2D, cam: Camera, x: number, y: number, i: number): void {
  const p = cam.project(x, y, 5);
  const r = 17 * cam.k;
  const rot = 0.15 * ((i % 3) - 1);
  c.fillStyle = 'rgba(30,20,40,0.28)';
  c.beginPath(); c.ellipse(p.x + r * 0.1, p.y + r * 0.55, r * 1.3, r * 0.5, 0, 0, 7); c.fill();
  const col = PILLOWS[i % PILLOWS.length] ?? '#e8553e';
  const g = c.createRadialGradient(p.x - r * 0.4, p.y - r * 0.4, r * 0.1, p.x, p.y, r * 1.3);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, col); g.addColorStop(1, col);
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.ellipse(p.x, p.y, r * 1.25, r * 0.85, rot, 0, 7); c.fill(); c.stroke();
  c.save(); c.beginPath(); c.ellipse(p.x, p.y, r * 1.22, r * 0.82, rot, 0, 7); c.clip();
  c.globalAlpha = 0.5; c.fillStyle = g; c.fillRect(p.x - r * 2, p.y - r * 2, r * 4, r * 4);
  c.globalAlpha = 1;
  const sh = c.createLinearGradient(0, p.y, 0, p.y + r * 0.9);
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(30,10,40,0.3)');
  c.fillStyle = sh; c.fillRect(p.x - r * 2, p.y, r * 4, r);
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5; c.setLineDash([3, 3]);
  c.beginPath(); c.moveTo(p.x - r * 0.75, p.y); c.lineTo(p.x + r * 0.75, p.y); c.stroke(); c.setLineDash([]);
  c.fillStyle = INK; c.beginPath(); c.arc(p.x, p.y, Math.max(1.2, r * 0.09), 0, 7); c.fill();
}

/** Cushion pits behind and beside the deck. `near` selects the side that is drawn after the cats. */
export function paintCushions(c: CanvasRenderingContext2D, cam: Camera, part: 'back' | 'near' | 'far'): void {
  const step = 40;
  if (part === 'back') {
    for (let y = -lane.deckHalf - 20, i = 0; y <= lane.deckHalf + 20; y += step, i++) { pillow(c, cam, lane.backX + 22, y, i); pillow(c, cam, lane.backX + 34, y + 20, i + 2); }
    return;
  }
  const y = (part === 'near' ? 1 : -1) * (lane.deckHalf + 18);
  for (let x = lane.pinX - 40, i = 0; x <= lane.backX; x += step, i++) pillow(c, cam, x, y, i + (part === 'near' ? 1 : 3));
}
