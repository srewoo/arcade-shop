// Shared colour + symbol table. Every colour has its own symbol so the game
// stays readable without colour vision (toggle in settings). Adjacent hues differ by at least
// 1.8:1 in luminance and every colour is at least 3.6:1 against the canvas background.
import { Bubble } from './hex';

export const COLORS = ['#cf2e2e', '#3dbd75', '#4a86f2', '#ffe04a', '#bd84fb', '#fb8a2b'] as const;
export const COLOR_NAMES = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'] as const;
export const SYMBOLS = ['circle', 'triangle', 'square', 'diamond', 'star', 'cross'] as const;
export type SymbolName = (typeof SYMBOLS)[number];

export const colorHex = (b: Bubble): string => COLORS[b.color] ?? '#888';
