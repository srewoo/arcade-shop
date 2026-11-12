// Logical canvas geometry and viewport fitting. Pure.
import type { Maze } from './maze';

export const TILE = 18;
export const HUD_TOP = 46;
export const HUD_BOTTOM = 34;
/** Device pixel ratio is capped here (crisp enough, bounded fill cost). */
export const MAX_DPR = 2;
/** Never render the board larger than this many device px per logical px. */
export const MAX_SCALE = 5;
/** Below this many CSS px per logical px the board is too small to read comfortably. */
export const MIN_READABLE_CSS_SCALE = 0.75;

export interface Size {
  readonly w: number;
  readonly h: number;
}

/**
 * The outer wall row at the top and bottom of every maze is pure scenery (no crumbs, no actors), so the
 * canvas crops this many logical px off each end. The simulation is untouched; the board just fills more
 * of the screen. The HUD lives in the DOM beside or above the canvas.
 */
export const BOARD_CROP = 16;
/** Logical y of the canvas's top edge in full-board coordinates (everything is still drawn at its real y). */
export const ORIGIN_Y = HUD_TOP + BOARD_CROP;

/** Size of the cropped canvas in logical px. */
export function boardSize(maze: Pick<Maze, 'cols' | 'rows'>): Size {
  return { w: maze.cols * TILE, h: maze.rows * TILE - 2 * BOARD_CROP };
}

/** Side gutter (css px) needed beside the board for the HUD column before we switch to the side layout. */
export const MIN_SIDE_GUTTER = 150;
/** Padding around the board in the side layout, css px. */
export const SIDE_PAD = 6;

/** `side`: HUD and controls sit in the gutters next to a full-height board. `stack`: HUD above, controls below. */
export function layoutMode(vw: number, vh: number, size: Size, minGutter = MIN_SIDE_GUTTER): 'side' | 'stack' {
  const boardW = (Math.max(0, vh - 2 * SIDE_PAD) * size.w) / size.h;
  return (vw - boardW) / 2 >= minGutter ? 'side' : 'stack';
}

/** Fraction of the viewport the board itself covers. */
export function boardShare(fit: Pick<Fit, 'cssW' | 'cssH'>, vw: number, vh: number): number {
  return vw > 0 && vh > 0 ? (fit.cssW * fit.cssH) / (vw * vh) : 0;
}

export function logicalSize(maze: Pick<Maze, 'cols' | 'rows'>): Size {
  return { w: maze.cols * TILE, h: maze.rows * TILE + HUD_TOP + HUD_BOTTOM };
}

export interface Fit {
  /** Device pixels per logical pixel. Fractional so the board can fill the stage. */
  readonly scale: number;
  readonly pxW: number;
  readonly pxH: number;
  readonly cssW: number;
  readonly cssH: number;
  /** CSS pixels per logical pixel; below MIN_READABLE_CSS_SCALE the UI warns the player. */
  readonly cssScale: number;
  readonly tooSmall: boolean;
}

/**
 * Largest scale that fits `availW x availH` CSS pixels. It is fractional on purpose: an integer-only
 * scale left the board at 29% of a 1280x800 window. Everything is drawn from vector paths at the
 * chosen scale, so fractional scales stay sharp.
 */
export function fitScale(availW: number, availH: number, dpr: number, size: Size): Fit {
  const ratio = Math.min(MAX_DPR, Math.max(1, dpr || 1));
  const raw = Math.min((Math.max(0, availW) * ratio) / size.w, (Math.max(0, availH) * ratio) / size.h);
  const stepped = Math.floor(raw * 10000) / 10000;
  const scale = Math.min(MAX_SCALE, Math.max(0.25, stepped));
  const pxW = Math.max(1, Math.floor(size.w * scale));
  const pxH = Math.max(1, Math.floor(size.h * scale));
  const cssScale = scale / ratio;
  return { scale, pxW, pxH, cssW: pxW / ratio, cssH: pxH / ratio, cssScale, tooSmall: cssScale < MIN_READABLE_CSS_SCALE };
}

export function tileCenterX(x: number): number {
  return x * TILE + TILE / 2;
}

export function tileCenterY(y: number): number {
  return y * TILE + TILE / 2 + HUD_TOP;
}
