// Enemy aircraft: tinted layered hulls with volume shading, panel lines, glass and animated
// engine glow. Hitboxes (config.ts) are unchanged; the art is drawn larger than them.
import { castShadow, dot, glow, hgrad, line, poly, shade, vgrad, type Ctx, type Pt } from './renderKit';
import { drawBoss } from './renderBoss';
import type { Enemy } from './types';

export const ENEMY_SCALE = 1.3;

interface Tint {
  main: string;
  light: string;
  trim: string;
  glow: string;
}

const TINT: Record<string, Tint> = {
  scout: { main: '#d93a35', light: '#ff8a70', trim: '#3d0b09', glow: 'rgba(255,120,80,0.65)' },
  weaver: { main: '#9a4fe0', light: '#d3a2ff', trim: '#27093f', glow: 'rgba(190,110,255,0.6)' },
  gunner: { main: '#e39a2e', light: '#ffd98a', trim: '#402705', glow: 'rgba(255,200,90,0.55)' },
  tank: { main: '#76879b', light: '#c7d3e0', trim: '#151c24', glow: 'rgba(255,120,60,0.5)' },
};

const hull = (c: Ctx, pts: readonly Pt[], k: Tint, flash: boolean, y0: number, y1: number, half: number, lw = 1.2): void => {
  poly(c, pts, flash ? '#ffffff' : vgrad(c, y0, y1, k.light, k.main), k.trim, lw);
  if (!flash) shade(c, pts, half, 0.9);
};


function trail(c: Ctx, x: number, len: number, color: string, t: number): void {
  const l = len * (0.8 + 0.25 * Math.sin(t * 30 + x));
  poly(c, [[x - 2, -8], [x, -8 - l], [x + 2, -8]], vgrad(c, -8, -8 - l, color, 'rgba(255,255,255,0)'));
}

const SCOUT: readonly Pt[] = [[0, 15], [14, -11], [5, -6], [0, -12], [-5, -6], [-14, -11]];
function drawScout(c: Ctx, k: Tint, flash: boolean, t: number): void {
  castShadow(c, SCOUT);
  glow(c, 0, -9, 15, k.glow);
  trail(c, 0, 9, 'rgba(255,200,140,0.9)', t);
  hull(c, SCOUT, k, flash, -12, 15, 14);
  poly(c, [[0, 9], [3.2, -2], [0, -4], [-3.2, -2]], flash ? '#ffffff' : vgrad(c, -4, 9, '#ffe9b0', k.trim), k.trim, 0.8);
  line(c, [[-3, -7], [-11, -10]], 'rgba(61,11,9,0.6)');
  line(c, [[3, -7], [11, -10]], 'rgba(61,11,9,0.6)');
  poly(c, [[-14, -11], [-9, -4], [-12, -3]], '#ffd25a', k.trim, 0.7);
  poly(c, [[14, -11], [9, -4], [12, -3]], '#ffd25a', k.trim, 0.7);
}

const WEAVER: readonly Pt[] = [[0, 13], [18, 0], [11, -13], [0, -7], [-11, -13], [-18, 0]];
function drawWeaver(c: Ctx, k: Tint, flash: boolean, t: number): void {
  castShadow(c, WEAVER);
  for (const x of [-11, 11]) {
    glow(c, x, -10, 14, k.glow);
    trail(c, x, 8, 'rgba(225,170,255,0.85)', t);
  }
  hull(c, WEAVER, k, flash, -13, 13, 18);
  poly(c, [[0, 6], [5, -4], [0, -6], [-5, -4]], flash ? '#ffffff' : vgrad(c, -6, 6, '#e9d0ff', '#2c0f4a'), k.trim, 0.8);
  for (const s of [-1, 1] as const) {
    poly(c, [[s * 18, 0], [s * 15, 7], [s * 12, 1]], '#2c0f4a', k.trim);
    line(c, [[s * 4, 2], [s * 13, -4]], 'rgba(39,9,63,0.55)');
  }
  const pulse = 0.55 + 0.45 * Math.sin(t * 7);
  glow(c, 0, -1, 6, `rgba(255,242,176,${pulse})`);
  dot(c, 0, -1, 1.8, '#fff2b0');
}

const GUNNER: readonly Pt[] = [[-17, -7], [-9, 15], [9, 15], [17, -7], [0, -14]];
function drawGunner(c: Ctx, k: Tint, flash: boolean, t: number): void {
  castShadow(c, GUNNER);
  poly(c, [[-4, 11], [4, 11], [4, 22], [-4, 22]], hgrad(c, -4, 4, [[0, '#6a727e'], [1, k.trim]]), k.trim, 0.8);
  glow(c, 0, 23, 12 + Math.sin(t * 20) * 2, k.glow);
  hull(c, GUNNER, k, flash, -13, 15, 17);
  for (const s of [-1, 1] as const) {
    poly(c, [[s * 17, -7], [s * 24, 2], [s * 14, 4]], k.main, k.trim);
    poly(c, [[s * 21, -2], [s * 23, 5], [s * 20, 5]], '#3a3f48', k.trim, 0.6);
    line(c, [[s * 3, -9], [s * 12, -3]], 'rgba(64,39,5,0.55)');
  }
  poly(c, [[0, -5], [6, 3], [0, 5], [-6, 3]], flash ? '#ffffff' : vgrad(c, -5, 5, '#fffbe0', '#e39a2e'), k.trim, 0.9);
}

const TANK: readonly Pt[] = [[-22, -10], [-15, 17], [15, 17], [22, -10], [11, -19], [-11, -19]];
function drawTank(c: Ctx, k: Tint, flash: boolean, t: number): void {
  castShadow(c, TANK);
  hull(c, TANK, k, flash, -18, 16, 22, 1.6);
  for (const s of [-1, 1] as const) {
    poly(c, [[s * 26, -6], [s * 22, 8], [s * 18, -4]], k.main, k.trim);
    line(c, [[s * 6, -16], [s * 15, 12]], 'rgba(21,28,36,0.6)', 0.8);
  }
  poly(c, [[-10, -5], [10, -5], [10, 9], [-10, 9]], flash ? '#ffffff' : vgrad(c, -5, 9, '#3a4656', k.trim), '#0b1016', 1);
  line(c, [[-10, 2], [10, 2]], 'rgba(255,255,255,0.15)', 0.8);
  poly(c, [[-5, 9], [5, 9], [5, 24], [-5, 24]], hgrad(c, -5, 5, [[0, '#f2f6fa'], [1, '#8d9aab']]), k.trim);
  glow(c, 0, 24, 10, 'rgba(255,150,70,0.55)');
  const blink = 0.5 + 0.5 * Math.sin(t * 8);
  for (const rx of [-16, -8, 8, 16]) {
    dot(c, rx, -14, 1.5, '#ff7a4d');
    glow(c, rx, -14, 5, `rgba(255,122,77,${0.2 + 0.4 * blink})`);
  }
}

export function drawEnemy(c: Ctx, e: Enemy, x: number, y: number, t: number): void {
  c.save();
  c.translate(x, y);
  if (e.kind === 'boss') {
    drawBoss(c, e.flash > 0, t);
    c.restore();
    return;
  }
  c.scale(ENEMY_SCALE, ENEMY_SCALE);
  const k = TINT[e.kind] ?? (TINT.scout as Tint);
  const flash = e.flash > 0;
  if (e.kind === 'scout') drawScout(c, k, flash, t);
  else if (e.kind === 'weaver') drawWeaver(c, k, flash, t);
  else if (e.kind === 'gunner') drawGunner(c, k, flash, t);
  else drawTank(c, k, flash, t);
  c.restore();
}

