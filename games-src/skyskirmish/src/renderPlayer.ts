// The player's jet: layered paths with volume shading, canopy glass, animated afterburner,
// a silhouette shadow and the shield bubble. Original geometry; hitbox is the small core.
import type { Palette } from './palette';
import { castShadow, dot, glow, hgrad, line, poly, shade, vgrad, type Ctx, type Pt } from './renderKit';

export const PLAYER_SCALE = 1.55;

const WING_L: readonly Pt[] = [[-21, 13], [-14, 9], [-3, -6], [-3, 9], [-9, 15]];
const WING_R: readonly Pt[] = WING_L.map(([x, y]) => [-x, y] as const);
const BODY: readonly Pt[] = [[0, -21], [2.6, -14], [5.6, -3], [6, 12], [3, 14.5], [-3, 14.5], [-6, 12], [-5.6, -3], [-2.6, -14]];
const TAIL_L: readonly Pt[] = [[-4.5, 9], [-10, 16], [-3.2, 15.5]];
const TAIL_R: readonly Pt[] = TAIL_L.map(([x, y]) => [-x, y] as const);

function afterburner(c: Ctx, t: number): void {
  const flame = 11 + 4 * Math.sin(t * 40) + 2 * Math.sin(t * 67);
  glow(c, 0, 18, 24, 'rgba(255,160,60,0.7)');
  for (const dx of [-2, 2]) {
    poly(c, [[dx - 2.4, 13], [dx, 13 + flame], [dx + 2.4, 13]], vgrad(c, 13, 13 + flame, '#fffbe0', 'rgba(255,110,30,0)'));
  }
  poly(c, [[-1.1, 13], [0, 13 + flame * 1.35], [1.1, 13]], vgrad(c, 13, 13 + flame * 1.35, 'rgba(120,200,255,0.9)', 'rgba(60,140,255,0)'));
}

function wings(c: Ctx, p: Palette): void {
  for (const [w, side] of [[WING_L, -1], [WING_R, 1]] as const) {
    const fill = hgrad(c, side < 0 ? -21 : 3, side < 0 ? -3 : 21, side < 0 ? [[0, '#2f8fc2'], [1, '#8fe6ff']] : [[0, '#8fe6ff'], [1, '#2a6c98']]);
    poly(c, w, fill, '#06182f');
    shade(c, w, 21, 0.7);
    poly(c, [[side * 14, 9], [side * 20, 12.4], [side * 12.5, 11]], p.playerWing);
    line(c, [[side * 4, -2], [side * 14, 9.4]], 'rgba(255,255,255,0.7)', 0.9);
    line(c, [[side * 7, 4], [side * 15, 11]], 'rgba(6,24,47,0.55)', 0.6);
    poly(c, [[side * 17, 10], [side * 12.5, 5.5], [side * 11, 11]], '#ffd25a', '#06182f', 0.6);
  }
}

function fuselage(c: Ctx): void {
  poly(c, BODY, hgrad(c, -6, 6, [[0, '#ffffff'], [0.5, '#dbe6f2'], [1, '#8da3bd']]), '#06182f');
  shade(c, BODY, 6, 0.8);
  line(c, [[-2.4, -3], [-2.6, 11]], 'rgba(6,24,47,0.45)', 0.6);
  line(c, [[2.4, -3], [2.6, 11]], 'rgba(6,24,47,0.45)', 0.6);
  poly(c, [[-5.6, 0], [-3.6, 0], [-3.6, 6], [-5.7, 7]], '#34506e');
  poly(c, [[5.6, 0], [3.6, 0], [3.6, 6], [5.7, 7]], '#34506e');
  poly(c, [[0, -13.5], [3.2, -4.5], [1.6, 1.5], [-1.6, 1.5], [-3.2, -4.5]], vgrad(c, -13, 2, '#d9fbff', '#1b6fa0'), '#06182f', 0.9);
  poly(c, [[-1.2, -11], [0.3, -10], [-0.4, -4], [-2, -5]], 'rgba(255,255,255,0.88)');
  line(c, [[0, 2], [0, 12]], 'rgba(6,24,47,0.35)', 0.5);
}

export function drawPlayer(c: Ctx, x: number, y: number, p: Palette, t: number, shield: boolean, blink: boolean): void {
  if (blink) return;
  c.save();
  c.translate(x, y);
  c.scale(PLAYER_SCALE, PLAYER_SCALE);
  castShadow(c, WING_L);
  castShadow(c, WING_R);
  castShadow(c, BODY);
  afterburner(c, t);
  for (const tl of [TAIL_L, TAIL_R]) poly(c, tl, '#2e86b8', '#06182f');
  wings(c, p);
  fuselage(c);
  const on = Math.floor(t * 2.2) % 2 === 0;
  dot(c, -20, 12.5, 1.4, on ? '#ff5b6e' : '#7a2a38');
  dot(c, 20, 12.5, 1.4, on ? '#7dffb2' : '#2a6b4e');
  if (on) {
    glow(c, -20, 12.5, 6, 'rgba(255,91,110,0.7)');
    glow(c, 20, 12.5, 6, 'rgba(125,255,178,0.7)');
  }
  c.restore();
  drawCore(c, x, y);
  if (shield) drawShield(c, x, y, p.shield, t);
}

/** Hit core: the true (small) hitbox, so near misses look fair. */
function drawCore(c: Ctx, x: number, y: number): void {
  glow(c, x, y + 1, 7, 'rgba(255,255,255,0.5)');
  dot(c, x, y + 1, 3, '#ffffff');
  c.lineWidth = 1.2;
  c.strokeStyle = '#06182f';
  c.stroke();
}

function drawShield(c: Ctx, x: number, y: number, color: string, t: number): void {
  const bub = c.createRadialGradient(x, y, 14, x, y, 34);
  bub.addColorStop(0, 'rgba(125,255,178,0)');
  bub.addColorStop(0.8, 'rgba(125,255,178,0.12)');
  bub.addColorStop(1, 'rgba(180,255,215,0.4)');
  c.fillStyle = bub;
  c.beginPath();
  c.arc(x, y, 34, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.translate(x, y);
  c.rotate(t * 0.8);
  c.beginPath();
  c.arc(0, 0, 32, 0, Math.PI * 2);
  c.lineWidth = 3;
  c.strokeStyle = color;
  c.setLineDash([9, 6]);
  c.stroke();
  c.setLineDash([]);
  c.beginPath();
  c.arc(0, 0, 32, -2.4, -1.6);
  c.lineWidth = 2;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.stroke();
  c.restore();
}
