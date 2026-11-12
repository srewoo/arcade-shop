// Canvas overlays: title, READY and level summary. Pause, settings, how-to and game over are DOM dialogs.
import { HUD_TOP, TILE } from './layout';
import { STR } from './strings';
import { drawCat } from './spriteCat';
import { paragraph, paragraphHeight, sized, text } from './textStyle';
import { CAT_KINDS } from './types';
import type { Modifier } from './levels';

type Ctx = CanvasRenderingContext2D;

export interface Summary {
  readonly level: number;
  readonly crumbs: number;
  readonly splashes: number;
  readonly bestChain: number;
  readonly cheese: number;
  readonly seconds: number;
  readonly points: number;
}

function panel(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.78): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgba(38,20,18,${alpha})`);
  g.addColorStop(1, `rgba(12,5,8,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,214,140,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,214,140,0.16)';
  ctx.fillRect(x + 1, y + 1, w - 2, 1.5);
}

export function drawReady(ctx: Ctx, w: number, modifier: Modifier = 'none'): void {
  const y = HUD_TOP + 13 * TILE + TILE / 2;
  text(ctx, STR.ready, w / 2, y, 16, '#ffe066', 'center');
  if (modifier !== 'none') text(ctx, STR.modifier[modifier], w / 2, y + sized(16) * 0.9 + 4, 12, '#ff9db5', 'center');
}

export function drawSummary(ctx: Ctx, w: number, h: number, s: Summary, blink: boolean): void {
  const rowH = sized(12) * 1.5;
  const titleH = sized(17) * 1.6;
  const rows: [string, string][] = [
    [STR.summary.crumbs, String(s.crumbs)], [STR.summary.splashes, String(s.splashes)],
    [STR.summary.chain, String(s.bestChain)], [STR.summary.cheese, `${s.cheese} / 2`],
    [STR.summary.time, `${Math.floor(s.seconds / 60)}:${String(Math.floor(s.seconds % 60)).padStart(2, '0')}`],
    [STR.summary.score, `+${s.points}`],
  ];
  const total = titleH + rows.length * rowH + rowH * 1.4;
  const top = h / 2 - total / 2;
  panel(ctx, 24, top - 8, w - 48, total + 16);
  text(ctx, `${STR.hud.level} ${s.level} ${STR.summary.clear}`, w / 2, top + titleH / 2, 17, '#ffe066', 'center');
  rows.forEach(([k, v], i) => {
    const y = top + titleH + rowH * (i + 0.5);
    text(ctx, k, 40, y, 12, '#f3e3c3');
    text(ctx, v, w - 40, y, 12, '#fff6d8', 'right');
  });
  if (blink) text(ctx, STR.summary.next, w / 2, top + total - rowH * 0.5, 12, '#bde7ff', 'center');
}

/** Title card. `top`/`bottom` are the visible canvas edges in full-board coordinates. Start buttons are DOM. */
export function drawTitle(ctx: Ctx, w: number, top: number, bottom: number, time: number, calm: boolean): void {
  const maxW = w - 24;
  const goalH = paragraphHeight(ctx, STR.title.goal, 12, maxW);
  const topH = sized(30) * 1.5 + paragraphHeight(ctx, STR.title.tagline, 12, maxW) + goalH + 10;
  panel(ctx, 0, top, w, topH, 0.84);
  ctx.save();
  ctx.shadowColor = 'rgba(255,170,60,0.75)';
  ctx.shadowBlur = calm ? 0 : 14;
  text(ctx, STR.title.name, w / 2, top + sized(30) * 0.8, 30, '#ffd36b', 'center');
  ctx.restore();
  let y = top + sized(30) * 1.5;
  y = paragraph(ctx, STR.title.tagline, w / 2, y, 12, '#f3e3c3', maxW);
  paragraph(ctx, STR.title.goal, w / 2, y + 2, 12, '#d3bd96', maxW);
  const ctrlH = paragraphHeight(ctx, STR.title.controls1, 12, maxW) + paragraphHeight(ctx, STR.title.controls2, 12, maxW);
  const botH = 54 + ctrlH + 6;
  const botY = bottom - botH;
  panel(ctx, 0, botY, w, botH, 0.84);
  CAT_KINDS.forEach((k, i) => {
    const cx = w / 8 + (i * w) / 4;
    drawCat(ctx, cx, botY + 18, { kind: k, dir: 'R', time, drenched: false, wearingOff: false,
      pouncing: false, returning: false, bob: 0, calm });
    text(ctx, STR.cats[k], cx, botY + 36 + sized(12) * 0.3, 12, '#f3e3c3', 'center');
  });
  const y2 = paragraph(ctx, STR.title.controls1, w / 2, botY + 54, 12, '#d3bd96', maxW);
  paragraph(ctx, STR.title.controls2, w / 2, y2, 12, '#d3bd96', maxW);
}
