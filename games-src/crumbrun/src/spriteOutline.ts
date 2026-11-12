// Shared actor outline: a dark line wrapped in a light rim, so every sprite reads on every floor.
import { ACTOR_COLORS } from './theme';

type Ctx = CanvasRenderingContext2D;

export interface Outline {
  /** Total stroke width of the light rim in logical px (half shows outside the shape). */
  readonly width: number;
}

export const NORMAL_OUTLINE: Outline = { width: 3.2 };
export const BOLD_OUTLINE: Outline = { width: 4.6 };

/** Build a path with `path`, stroke the rim + dark line, then fill. */
export function paint(ctx: Ctx, fill: string, path: () => void, o: Outline): void {
  path();
  ctx.lineJoin = 'round';
  ctx.lineWidth = o.width;
  ctx.strokeStyle = ACTOR_COLORS.rim;
  ctx.stroke();
  ctx.lineWidth = o.width * 0.62;
  ctx.strokeStyle = ACTOR_COLORS.dark;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}
