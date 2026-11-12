// Attract scene behind the title card, drawn in screen space so the hero jet and the enemy
// formation frame the card instead of hiding behind it. `t` is 0 with reduced motion (a poster).
import type { Palette } from './palette';
import { drawPlayerShot } from './renderShapes';
import { drawEnemy, drawPlayer } from './renderShips';
import { glow, type Ctx } from './renderKit';
import type { Enemy } from './types';
import type { Geom } from './view';

const dummy = (kind: Enemy['kind']): Enemy => ({ id: 0, kind, hp: 1, maxHp: 1, r: 12, t: 0, x0: 0, y0: 0, path: 'straight', dir: 1, cd: 0, flash: 0, armed: true, x: 0, y: 0, px: 0, py: 0 });
const FORMATION = [dummy('scout'), dummy('weaver'), dummy('gunner'), dummy('tank'), dummy('scout')] as const;

function contrail(c: Ctx, x: number, y: number, len: number, k: number): void {
  for (const dx of [-9, 9]) {
    const g = c.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(210,235,255,0.5)');
    g.addColorStop(1, 'rgba(210,235,255,0)');
    c.fillStyle = g;
    c.fillRect(x + dx * k - 1.5 * k, y, 3 * k, len);
  }
}

/** `t` is 0 with reduced motion, giving a still poster frame. */
export function drawTitleScene(c: Ctx, p: Palette, g: Geom, t: number, moving: boolean): void {
  const wide = g.cssW >= 760;
  const k = Math.max(0.9, Math.min(g.cssW, g.cssH) / 360);
  const hx = (wide ? g.cssW * 0.2 : g.cssW * 0.78) + (moving ? Math.sin(t * 0.9) * 14 : 0);
  const hy = (wide ? g.cssH * 0.62 : g.cssH * 0.14) + (moving ? Math.sin(t * 1.7) * 8 : 0);
  const hs = wide ? k * 1.7 : k * 0.9;
  c.save();
  c.translate(hx, hy);
  c.rotate(wide ? 0.12 : 0.08);
  c.scale(hs, hs);
  contrail(c, 0, 12, 160, 1.55);
  for (let i = 0; i < 4; i++) drawPlayerShot(c, 0, -40 - ((moving ? t * 300 : 0) + i * 80) % 320, p);
  glow(c, 0, 0, 90, 'rgba(80,190,255,0.18)');
  drawPlayer(c, 0, 0, p, t, false, false);
  c.restore();
  const fs = wide ? k * 1.5 : k * 0.8;
  FORMATION.forEach((e, i) => {
    const side = wide ? g.cssW * 0.8 + ((i % 2) - 0.5) * 90 * k : g.cssW * (0.14 + i * 0.18);
    const ex = side + (moving ? Math.sin(t * 0.7 + i) * 10 : 0);
    const ey = (wide ? g.cssH * (0.2 + i * 0.13) : g.cssH * 0.94 - (i % 2) * 40) + (moving ? Math.sin(t * 1.1 + i) * 6 : 0);
    c.save();
    c.translate(ex, ey);
    c.scale(fs, fs);
    drawEnemy(c, e, 0, 0, t);
    c.restore();
  });
}
