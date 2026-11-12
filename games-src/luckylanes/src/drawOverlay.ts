// Lane overlays drawn above the floor: aim/power/hook guide, pocket ticks, drag trail and power ring.
import { shotFromDrag } from './drag';
import type { Game } from './game';
import { previewPath, type PathPoint } from './preview';
import { shotOf } from './inputFsm';
import { project } from './project';
import { drawGuide, type GuideStyle } from './renderPins';
import { S } from './strings';
import { TUNING } from './tuning';

type Ctx = CanvasRenderingContext2D;

let guideKey = '';
let guidePath: PathPoint[] = [];

/** Colour + dash pattern per meter: the pattern, not only the colour, tells the phases apart. */
export function guideStyle(phase: string, highContrast: boolean): GuideStyle {
  const base = { aim: { color: '#ffe14a', dash: [18, 8], label: 'AIM' }, power: { color: '#ff8a3d', dash: [2, 9], label: 'POWER' }, spin: { color: '#5cf0ff', dash: [], label: 'HOOK' } };
  const b = phase === 'aim' ? base.aim : phase === 'power' ? base.power : base.spin;
  if (!highContrast) return { ...b, width: 1, label: '' };
  const hc: Record<string, string> = { AIM: '#ffffff', POWER: '#ffe14a', HOOK: '#6fc8ff' };
  return { ...b, color: hc[b.label] as string, width: 1.7, label: b.label };
}

function guideFor(game: Game): PathPoint[] | null {
  const { phase } = game.input;
  const showing = (game.stage === 'ready' && phase !== 'position' && phase !== 'rolling') || (game.stage === 'cpu' && game.cpuShot);
  if (!showing) return null;
  const shot = game.stage === 'cpu' && game.cpuShot ? game.cpuShot : shotOf(game.input);
  const key = `${shot.x.toFixed(2)}|${shot.aim.toFixed(4)}|${shot.spin.toFixed(2)}|${phase === 'aim' ? 0 : shot.power.toFixed(2)}`;
  if (key !== guideKey) {
    guideKey = key;
    guidePath = previewPath(phase === 'aim' ? { ...shot, spin: 0 } : shot);
  }
  return guidePath;
}

export function drawGuideLayer(ctx: Ctx, game: Game): void {
  const guide = guideFor(game);
  if (!guide) return;
  const phase = game.stage === 'cpu' ? 'spin' : game.input.phase;
  drawGuide(ctx, game.pres.cam, guide, game.pres.time, guideStyle(phase, game.pres.highContrast));
}

/** Two ticks on the foul line at the pocket positions, shown while sliding the ball. */
export function drawPocketTicks(ctx: Ctx, game: Game): void {
  if (!game.humanTurn || game.input.phase !== 'position') return;
  const { cam } = game.pres;
  ctx.save();
  ctx.textAlign = 'center';
  for (const side of [-1, 1]) {
    const x = side * TUNING.meters.pocketX;
    const a = project(cam, x, 0, 0);
    const b = project(cam, x, 90, 0);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a0b30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy - 2);
    ctx.lineTo(a.sx - 7, a.sy + 9);
    ctx.lineTo(a.sx + 7, a.sy + 9);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const c = project(cam, 0, 0, 0);
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#1a0b30';
  ctx.shadowBlur = 4;
  ctx.fillText(S.pocket.replace('!', '').toUpperCase() + ' MARKS', c.sx, c.sy + 24);
  ctx.restore();
}

/** Trail of the finger while dragging, with a power ring at its end. */
export function drawDragTrail(ctx: Ctx, game: Game): void {
  const path = game.pres.dragTrail;
  const last = path[path.length - 1];
  const first = path[0];
  if (path.length < 2 || !last || !first) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 4;
  ctx.setLineDash([2, 8]);
  ctx.beginPath();
  path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
  const shot = shotFromDrag(path, game.pres.size.h * 0.55, game.input.startX);
  const power = shot ? shot.power : 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = power > 0.85 ? '#ff8a3d' : '#5cf0ff';
  ctx.beginPath();
  ctx.arc(last.x, last.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(shot ? `${Math.round(power * 100)}%` : '', last.x, last.y - 32);
  ctx.restore();
}
