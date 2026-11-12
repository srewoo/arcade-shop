// In-world overlays drawn on top of the action: boss bar, banner, combo, score popups,
// effect rings and the damage vignette.
import { bossPhase } from './boss';
import { WORLD } from './config';
import type { Fx } from './fx';
import type { Palette } from './palette';
import { S } from './strings';
import type { GameState } from './types';
import type { Geom } from './view';

type Ctx = CanvasRenderingContext2D;

export function drawBossBar(c: Ctx, s: GameState, p: Palette): void {
  const boss = s.enemies.find((e) => e.kind === 'boss');
  if (!boss) return;
  const x = 24;
  const w = WORLD.w - 48;
  const y = 26;
  const h = 15;
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = 'bold 13px system-ui, sans-serif';
  c.lineWidth = 4;
  c.lineJoin = 'round';
  c.strokeStyle = p.textOutline;
  const label = `${S.bossName} ${'I'.repeat(bossPhase(boss) + 1)}`;
  c.strokeText(label, WORLD.w / 2, y - 6);
  c.fillStyle = '#ffffff';
  c.fillText(label, WORLD.w / 2, y - 6);
  c.fillStyle = p.bossBarBack;
  c.beginPath();
  c.roundRect(x, y, w, h, 4);
  c.fill();
  const frac = Math.max(0, boss.hp / boss.maxHp);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, p.bossBar);
  g.addColorStop(1, p.bossBar);
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(x + 2, y + 2, Math.max(0, (w - 4) * frac), h - 4, 3);
  c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(x, y, w, h, 4);
  c.stroke();
  c.restore();
}

export function drawBanner(c: Ctx, text: string, opacity: number, p: Palette): void {
  c.save();
  c.globalAlpha = Math.max(0, Math.min(1, opacity));
  c.font = 'bold 32px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 7;
  c.strokeStyle = p.textOutline;
  c.lineJoin = 'round';
  c.strokeText(text, WORLD.w / 2, WORLD.h * 0.34);
  c.fillStyle = p.text;
  c.fillText(text, WORLD.w / 2, WORLD.h * 0.34);
  c.restore();
}

/** Combo label floating above the plane, with a small pop when it rises. */
export function drawCombo(c: Ctx, mult: number, x: number, y: number, pop: number, reduce: boolean): void {
  if (mult < 2) return;
  const k = 1 + (reduce ? 0 : pop * 0.35);
  c.save();
  c.translate(x, y - 46);
  c.scale(k, k);
  c.font = 'bold 18px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 5;
  c.lineJoin = 'round';
  c.strokeStyle = '#06182f';
  c.strokeText(`x${mult}`, 0, 0);
  c.fillStyle = mult >= 8 ? '#ffd25a' : '#ffffff';
  c.fillText(`x${mult}`, 0, 0);
  c.restore();
}

/** Red edge vignette when the player is hit, and the white bomb flash. Screen space. */
export function drawScreenFx(c: Ctx, g: Geom, fx: Fx, bombFlash: number, reduce: boolean): void {
  if (fx.hurt > 0 && !reduce) {
    const r = Math.hypot(g.cssW, g.cssH) / 2;
    const v = c.createRadialGradient(g.cssW / 2, g.cssH / 2, r * 0.45, g.cssW / 2, g.cssH / 2, r);
    v.addColorStop(0, 'rgba(255,40,40,0)');
    v.addColorStop(1, `rgba(255,40,40,${Math.min(0.7, fx.hurt * 0.7)})`);
    c.fillStyle = v;
    c.fillRect(0, 0, g.cssW, g.cssH);
  }
  if (!reduce && (fx.flash > 0 || bombFlash > 0)) {
    c.fillStyle = `rgba(255,255,255,${Math.min(0.8, fx.flash)})`;
    c.fillRect(0, 0, g.cssW, g.cssH);
  }
}
