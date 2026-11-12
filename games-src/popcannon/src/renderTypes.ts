// Shared renderer types and geometry.
import { DANGER_ROW, ROW_H, SHOOTER, TOP_Y } from './hex';

export const NEXT_POS = { x: SHOOTER.x - 96, y: SHOOTER.y + 14 } as const;
export const DANGER_Y = TOP_Y + DANGER_ROW * ROW_H;

export type Highlight = 'aim' | 'swap' | 'danger' | null;

export interface RenderOpts {
  symbols: boolean;
  /** Seconds, for animation phases. */
  time: number;
  /** Interpolation factor between the previous and current sim state (0..1). */
  alpha: number;
  /** 1, 1.25 or 1.5: multiplies canvas text sizes. */
  textScale: number;
  highContrast: boolean;
  /** Device pixels per logical pixel, for the sprite cache. */
  scale: number;
  highlight: Highlight;
}
