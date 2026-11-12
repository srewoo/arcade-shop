// Non-colour cue glyphs drawn on each disc (colour-blind assist).
import { SYMBOL_INK, type SymbolId } from './palette';

function symbolPath(ctx: CanvasRenderingContext2D, id: SymbolId, r: number): void {
  ctx.beginPath();
  if (id === 'ring') ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  else if (id === 'square') ctx.rect(-r * 0.5, -r * 0.5, r, r);
  else if (id === 'triangle') {
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(r * 0.58, r * 0.45);
    ctx.lineTo(-r * 0.58, r * 0.45);
    ctx.closePath();
  } else if (id === 'diamond') {
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(r * 0.55, 0);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.55, 0);
    ctx.closePath();
  } else {
    ctx.moveTo(-r * 0.55, 0);
    ctx.lineTo(r * 0.55, 0);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(0, r * 0.55);
  }
}

/** Draw glyph `id` centred on the current origin, ink on top of a faint light "emboss" edge. */
export function drawSymbol(ctx: CanvasRenderingContext2D, id: SymbolId, r: number): void {
  ctx.lineWidth = Math.max(2, r * 0.17);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const solid = id === 'square' || id === 'triangle';
  ctx.save();
  ctx.translate(0, r * 0.045);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  symbolPath(ctx, id, r);
  if (solid) ctx.fill();
  else ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = SYMBOL_INK;
  ctx.fillStyle = SYMBOL_INK;
  symbolPath(ctx, id, r);
  if (solid) ctx.fill();
  else ctx.stroke();
}
