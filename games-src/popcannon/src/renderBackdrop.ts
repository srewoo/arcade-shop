// Playfield backdrop, painted once into the sprite cache: deep-space gradient, soft nebula
// glows, star specks, faint hex lattice, a lit launch pad and a red-tinted danger zone.
import { DANGER_Y } from './renderTypes';
import { H, R, ROW_H, SHOOTER, TOP_Y, W } from './hex';

type Ctx = CanvasRenderingContext2D;

const hash = (i: number, salt: number): number => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function glowAt(c: Ctx, x: number, y: number, r: number, color: string): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

function stars(c: Ctx): void {
  for (let i = 0; i < 70; i++) {
    const x = hash(i, 1) * W;
    const y = TOP_Y + hash(i, 2) * (H - TOP_Y);
    const r = 0.5 + hash(i, 3) * 0.9;
    c.fillStyle = `rgba(190,205,255,${0.1 + hash(i, 4) * 0.28})`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
}

function lattice(c: Ctx): void {
  c.fillStyle = 'rgba(255,255,255,0.05)';
  for (let r = 0; r < 20; r++) {
    for (let col = 0; col < 11; col++) c.fillRect(R + col * 2 * R + (r % 2) * R - 1, TOP_Y + R + r * ROW_H - 1, 2, 2);
  }
}

function launchPad(c: Ctx): void {
  glowAt(c, SHOOTER.x, SHOOTER.y + 10, 120, 'rgba(110,120,255,0.20)');
  c.strokeStyle = 'rgba(150,165,255,0.16)';
  c.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    c.beginPath();
    c.ellipse(SHOOTER.x, SHOOTER.y + 40, 40 * i, 12 * i, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

function dangerZone(c: Ctx): void {
  const g = c.createLinearGradient(0, DANGER_Y - 30, 0, DANGER_Y + 50);
  g.addColorStop(0, 'rgba(255,70,70,0)');
  g.addColorStop(1, 'rgba(255,70,70,0.07)');
  c.fillStyle = g;
  c.fillRect(0, DANGER_Y - 30, W, H - DANGER_Y + 30);
}

function walls(c: Ctx): void {
  for (const [x0, x1] of [[0, 14], [W, W - 14]] as const) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(Math.min(x0, x1), 0, 14, H);
  }
}

export function paintBackground(c: Ctx): void {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#202850');
  g.addColorStop(0.55, '#141937');
  g.addColorStop(1, '#0a0d20');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  glowAt(c, W * 0.2, 110, 190, 'rgba(110,80,220,0.20)');
  glowAt(c, W * 0.85, 300, 200, 'rgba(40,150,200,0.13)');
  stars(c);
  lattice(c);
  dangerZone(c);
  launchPad(c);
  walls(c);
}
