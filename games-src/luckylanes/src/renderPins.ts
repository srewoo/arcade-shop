// Aim/hook guide drawn along the predicted ball path. Pin and ball art live in renderPin / renderBall.
import { project, type Camera } from './project';
import type { PathPoint } from './preview';

export { drawBall } from './renderBall';
export { drawPin } from './renderPin';

type Ctx = CanvasRenderingContext2D;

export interface GuideStyle {
  readonly color: string;
  readonly dash: readonly number[];
  /** Line width multiplier. */
  readonly width: number;
  /** Text label at the arrow head (colour-blind assist); empty for none. */
  readonly label: string;
}

/** Guide along the predicted ball path with an arrow head; the dash pattern differs per meter. */
export function drawGuide(ctx: Ctx, cam: Camera, path: readonly PathPoint[], time: number, style: GuideStyle): void {
  if (path.length < 2) return;
  ctx.save();
  ctx.globalAlpha = style.width > 1 ? 1 : 0.65 + 0.3 * Math.sin(time * 6);
  ctx.lineDashOffset = -time * 40;
  ctx.lineCap = 'round';
  strokeGuide(ctx, cam, path, style);
  ctx.setLineDash([]);
  drawArrowHead(ctx, cam, path, style);
  ctx.restore();
}

function strokeGuide(ctx: Ctx, cam: Camera, path: readonly PathPoint[], style: GuideStyle): void {
  const trace = (extra: number): void => {
    ctx.beginPath();
    path.forEach((pt, i) => {
      const p = project(cam, pt.x, pt.y, 1);
      ctx.lineWidth = Math.max(2, p.s * 2.6) * style.width + extra;
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    });
    ctx.stroke();
  };
  if (style.width > 1) {
    // High-contrast guide: a dark underlay keeps it readable on the light wood.
    ctx.strokeStyle = '#1a0b30';
    ctx.setLineDash([]);
    trace(3);
  }
  ctx.strokeStyle = style.color;
  ctx.setLineDash([...style.dash]);
  trace(0);
}

function drawArrowHead(ctx: Ctx, cam: Camera, path: readonly PathPoint[], style: GuideStyle): void {
  const last = path[path.length - 1] as PathPoint;
  const prev = path[path.length - 2] as PathPoint;
  const a = project(cam, prev.x, prev.y, 1);
  const b = project(cam, last.x, last.y, 1);
  const size = Math.max(9, b.s * 9) * (style.width > 1 ? 1.3 : 1);
  ctx.fillStyle = style.color;
  ctx.save();
  ctx.translate(b.sx, b.sy);
  ctx.rotate(Math.atan2(b.sy - a.sy, b.sx - a.sx));
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, size * 0.7);
  ctx.lineTo(-size * 0.6, -size * 0.7);
  ctx.closePath();
  if (style.width > 1) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1a0b30';
    ctx.stroke();
  }
  ctx.fill();
  ctx.restore();
  if (!style.label) return;
  ctx.globalAlpha = 1;
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1a0b30';
  ctx.strokeText(style.label, b.sx, b.sy - size - 6);
  ctx.fillText(style.label, b.sx, b.sy - size - 6);
}
