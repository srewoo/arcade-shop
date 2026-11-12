// Canvas text with a user-controlled size multiplier (settings: 100 / 125 / 150 %).
type Ctx = CanvasRenderingContext2D;

export const FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
/** Smallest logical size any text may be drawn at: 12 px logical is >= 12 css px at 400 px width. */
export const MIN_LABEL_PX = 12;

let scale = 1;

export function setTextScale(s: number): void {
  scale = Math.min(2, Math.max(1, s));
}

export function getTextScale(): number {
  return scale;
}

/** Effective drawn size for a requested logical size. */
export function sized(size: number): number {
  return Math.max(MIN_LABEL_PX, size) * scale;
}

export function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'left'): void {
  const px = sized(size);
  ctx.font = `bold ${px}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, px / 4);
  ctx.strokeStyle = 'rgba(20,8,4,0.85)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

/** Greedy word wrap using real glyph metrics at the effective size. */
export function wrap(ctx: Ctx, s: string, size: number, maxW: number): string[] {
  ctx.font = `bold ${sized(size)}px ${FONT}`;
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** Draw wrapped text; returns the y just below the last line. */
export function paragraph(ctx: Ctx, s: string, cx: number, y: number, size: number, color: string,
  maxW: number): number {
  const lh = sized(size) * 1.3;
  let cur = y;
  for (const line of wrap(ctx, s, size, maxW)) {
    text(ctx, line, cx, cur + lh / 2, size, color, 'center');
    cur += lh;
  }
  return cur;
}

/** Height `paragraph` will use, without drawing. */
export function paragraphHeight(ctx: Ctx, s: string, size: number, maxW: number): number {
  return wrap(ctx, s, size, maxW).length * sized(size) * 1.3;
}
