// Draws one frame. The sky fills the canvas; the 360x640 world is drawn inside the lane
// rectangle. Positions are blended between the previous and current sim step (alpha).
import { CONFIG } from './config';
import { lerp } from './clock';
import type { Fx } from './fx';
import { ASSIST, NORMAL } from './palette';
import { drawBackground } from './renderBg';
import { drawFxLayer } from './renderFx';
import { drawBanner, drawBossBar, drawCombo, drawScreenFx } from './renderOverlay';
import { drawEnemyShot, drawPickup, drawPlayerShot } from './renderShapes';
import { drawEnemy, drawPlayer } from './renderShips';
import { drawTitleScene } from './renderTitle';
import type { Body, GameState } from './types';
import type { Geom } from './view';

export interface RenderView {
  state: GameState | null;
  alpha: number;
  /** Wall-clock seconds, used only for cosmetic motion. */
  clock: number;
  assist: boolean;
  reduce: boolean;
  fx: Fx;
  /** Banner text and its opacity 0..1. */
  banner: { text: string; opacity: number } | null;
}

const ix = (b: Body, a: number): number => lerp(b.px, b.x, a);
const iy = (b: Body, a: number): number => lerp(b.py, b.y, a);

function drawWorld(c: CanvasRenderingContext2D, v: RenderView, s: GameState): void {
  const p = v.assist ? ASSIST : NORMAL;
  const a = v.alpha;
  for (const k of s.pickups) drawPickup(c, k, ix(k, a), iy(k, a), v.clock);
  for (const e of s.enemies) drawEnemy(c, e, ix(e, a), iy(e, a), v.clock);
  for (const b of s.pBullets) drawPlayerShot(c, ix(b, a), iy(b, a), p);
  for (const b of s.eBullets) drawEnemyShot(c, ix(b, a), iy(b, a), b.r, p, v.assist);
  const pl = s.player;
  const blink = pl.invuln > 0 && s.phase === 'playing' && Math.floor(v.clock * 14) % 2 === 0 && pl.invuln < CONFIG.player.invuln + 1;
  if (s.phase !== 'down') {
    drawPlayer(c, ix(pl, a), iy(pl, a), p, v.clock, pl.shield > 0, blink);
    drawCombo(c, s.mult, ix(pl, a), iy(pl, a), v.fx.comboPop, v.reduce);
  }
}

export function render(c: CanvasRenderingContext2D, v: RenderView, g: Geom): void {
  const p = v.assist ? ASSIST : NORMAL;
  const sx = v.fx.shake > 0 ? (Math.random() - 0.5) * v.fx.shake : 0;
  const sy = v.fx.shake > 0 ? (Math.random() - 0.5) * v.fx.shake : 0;
  const { x, y, scale } = g.layout;
  c.setTransform(g.dpr, 0, 0, g.dpr, sx * g.dpr, sy * g.dpr);
  drawBackground(c, p, g, v.reduce ? 0 : v.clock);
  c.setTransform(g.dpr * scale, 0, 0, g.dpr * scale, (x + sx) * g.dpr, (y + sy) * g.dpr);
  if (v.state) drawWorld(c, v, v.state);
  else {
    c.setTransform(g.dpr, 0, 0, g.dpr, sx * g.dpr, sy * g.dpr);
    drawTitleScene(c, p, g, v.reduce ? 0 : v.clock, !v.reduce);
    c.setTransform(g.dpr * scale, 0, 0, g.dpr * scale, (x + sx) * g.dpr, (y + sy) * g.dpr);
  }
  drawFxLayer(c, v.fx);
  if (v.state) drawBossBar(c, v.state, p);
  if (v.banner) drawBanner(c, v.banner.text, v.banner.opacity, p);
  c.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
  drawScreenFx(c, g, v.fx, v.state?.bombFlash ?? 0, v.reduce);
}
