// SVG markup for X and O marks (placed marks and the hover "ghost" preview).
import type { Player } from '../game';

const X_PATHS =
  '<path class="stroke" pathLength="1" d="M24 24L76 76"/><path class="stroke s2" pathLength="1" d="M76 24L24 76"/>';
const O_PATH = '<circle class="stroke" pathLength="1" cx="50" cy="50" r="27"/>';

const body = (p: Player): string => (p === 'X' ? X_PATHS : O_PATH);

export const markSvg = (p: Player): string =>
  `<svg class="mark" data-p="${p}" viewBox="0 0 100 100" aria-hidden="true">${body(p)}</svg>`;

export const ghostSvg = (p: Player): string =>
  `<svg class="ghost-mark" data-p="${p}" viewBox="0 0 100 100" aria-hidden="true">${body(p)}</svg>`;

/** Small X/O glyph used in the title and score cards. */
export const glyphSvg = (p: Player): string =>
  `<svg class="glyph" data-p="${p}" viewBox="0 0 100 100" aria-hidden="true">${body(p)}</svg>`;
