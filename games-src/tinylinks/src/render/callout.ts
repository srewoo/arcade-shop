import { CONFIG } from '../config';
import { PAL } from './palette';
import type { View } from './view';

export interface Callout { text: string; sub: string; gold: boolean; blue: boolean; age: number }

/** Big floating text in screen space ("Birdie!"). */
export function drawCallout(ctx: CanvasRenderingContext2D, c: Callout, v: View, reduced: boolean): void {
  const life = CONFIG.fx.calloutSec;
  if (c.age >= life) return;
  const inT = Math.min(1, c.age / 0.22);
  const ease = 1 - (1 - inT) ** 3;
  const fade = Math.min(1, (life - c.age) / 0.45);
  const scale = reduced ? 1 : 0.55 + 0.45 * ease + (c.gold ? 0.06 * Math.sin(c.age * 7) : 0);
  const size = Math.max(26, Math.min(66, v.w * 0.075));
  ctx.save();
  ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  ctx.globalAlpha = fade;
  ctx.translate(v.w / 2, v.h * 0.4 - (reduced ? 0 : c.age * 8));
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.font = `900 ${size}px ui-rounded, 'SF Pro Rounded', system-ui, sans-serif`;
  ctx.lineWidth = size * 0.2;
  ctx.strokeStyle = PAL.ink;
  ctx.strokeText(c.text, 0, 0);
  const g = ctx.createLinearGradient(0, -size, 0, 0);
  if (c.gold) { g.addColorStop(0, '#fff1a8'); g.addColorStop(1, '#ffb62e'); }
  else if (c.blue) { g.addColorStop(0, '#e6f6ff'); g.addColorStop(1, '#7fcdf5'); }
  else { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d6e8da'); }
  ctx.fillStyle = g;
  ctx.fillText(c.text, 0, 0);
  if (c.sub) {
    ctx.font = `700 ${Math.round(size * 0.36)}px system-ui, sans-serif`;
    ctx.lineWidth = size * 0.1;
    ctx.strokeText(c.sub, 0, size * 0.55);
    ctx.fillStyle = '#fff';
    ctx.fillText(c.sub, 0, size * 0.55);
  }
  ctx.restore();
}
