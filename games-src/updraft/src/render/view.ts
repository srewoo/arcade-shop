// Maps logical world units (450 tall) onto the canvas. Uniform scale, vertically centred;
// any extra space is filled with rock so the playfield is never stretched. On narrow portrait
// screens the camera zooms (minLogicalW) so the corridor fills most of the height.
import { CONFIG } from '../config';

export interface View {
  readonly pxW: number;
  readonly pxH: number;
  readonly dpr: number;
  readonly s: number;
  /** Logical y of the top edge of the canvas (negative when letterboxed). */
  readonly top: number;
  readonly bottom: number;
  /** Visible logical width. */
  readonly wv: number;
  /** Logical x where the craft sits on screen. */
  readonly cx: number;
}

export function computeView(pxW: number, pxH: number, rawDpr: number): View {
  const dpr = Math.min(2, Math.max(1, rawDpr));
  const H = CONFIG.world.height;
  const s = Math.max(0.1, Math.min(pxH / H, pxW / CONFIG.view.minLogicalW));
  const oy = (pxH - H * s) / 2;
  const wv = pxW / s;
  return { pxW, pxH, dpr, s, top: -oy / s, bottom: H + oy / s, wv, cx: wv * CONFIG.view.craftXFrac };
}

export interface Palette {
  cave: string; caveFar: string; caveMid: string; rock: string; rockHi: string; rim: string; glow: string;
  craft: string; craftInk: string; coin: string; coinInk: string;
  smoke: string; ghost: string; flame: string;
}

export function readPalette(root: HTMLElement = document.documentElement): Palette {
  const cs = getComputedStyle(root);
  const v = (name: string): string => cs.getPropertyValue(name).trim() || '#888';
  return {
    cave: v('--cave'), caveFar: v('--cave-far'), caveMid: v('--cave-mid'), rock: v('--rock'),
    rockHi: v('--rock-hi'), rim: v('--rim'), glow: v('--glow'),
    craft: v('--craft'), craftInk: v('--craft-ink'), coin: v('--coin'), coinInk: v('--coin-ink'),
    smoke: v('--smoke'), ghost: v('--ghost'), flame: v('--flame'),
  };
}

/** Share (0..1) of the canvas height that the 450-unit cave band occupies. */
export const caveShare = (v: View): number => (CONFIG.world.height * v.s) / v.pxH;
