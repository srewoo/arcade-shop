// Headlight beams and the screen-space vignette, both baked once and blitted.
import type { Box } from '../geom';

const BEAM_PPM = 40;
const BEAM_LEN = 6.5;
let beam: HTMLCanvasElement | null = null;

function bakeBeam(hh: number): HTMLCanvasElement {
  const spread = 2.1;
  const c = document.createElement('canvas');
  c.width = Math.ceil(BEAM_LEN * BEAM_PPM);
  c.height = Math.ceil(spread * 2 * BEAM_PPM);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(BEAM_PPM, BEAM_PPM);
  g.translate(0, spread);
  for (const s of [-1, 1]) {
    const y = s * (hh - 0.3);
    const grad = g.createLinearGradient(0, 0, BEAM_LEN, 0);
    grad.addColorStop(0, 'rgba(255,244,190,0.26)');
    grad.addColorStop(1, 'rgba(255,244,190,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, y - 0.12);
    g.lineTo(0, y + 0.12);
    g.lineTo(BEAM_LEN, y + s * 1.0 + 1.0);
    g.lineTo(BEAM_LEN, y + s * 1.0 - 1.0);
    g.closePath();
    g.fill();
  }
  return c;
}

/** Light cast on the tarmac ahead of a car, drawn under it. */
export function drawBeam(ctx: CanvasRenderingContext2D, b: Box): void {
  beam ??= bakeBeam(b.hh);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(beam, b.hw - 0.1, -2.1, BEAM_LEN, 4.2);
  ctx.restore();
}

/** Dark corners over the whole canvas (device pixels; call with an identity transform). */
export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.58);
  g.addColorStop(0, 'rgba(6,10,16,0)');
  g.addColorStop(1, 'rgba(6,10,16,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
