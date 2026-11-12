// Fixed colours for the playfield. The scene is dark in every theme (like a game cabinet); only
// the dialog sheets follow the light/dark setting. Contrast is checked in tests/contrast.test.ts.
import type { Kind } from '../model/types';

export interface DiscColour { readonly base: string; readonly light: string; readonly dark: string; readonly glow: string; readonly rgb: string }

export const DISC: Readonly<Record<Kind, DiscColour>> = {
  1: { base: '#ff4d6a', light: '#ffa3b0', dark: '#a3102f', glow: '#ff7a90', rgb: '255,77,106' },
  2: { base: '#ffb81f', light: '#ffe596', dark: '#a85f00', glow: '#ffd05c', rgb: '255,184,31' },
  3: { base: '#2fd47a', light: '#a2f5c6', dark: '#07693c', glow: '#6cf0a8', rgb: '47,212,122' },
  4: { base: '#35b5ff', light: '#a8e0ff', dark: '#07559f', glow: '#7accff', rgb: '53,181,255' },
  5: { base: '#b479ff', light: '#e0c9ff', dark: '#4f1fa8', glow: '#cfa4ff', rgb: '180,121,255' },
  6: { base: '#2c2f52', light: '#6a6fa6', dark: '#10122a', glow: '#ffc247', rgb: '255,194,71' },
};

export const SCENE = {
  bgTop: '#0b0820',
  bgBottom: '#1c1446',
  well: '#120e30',
  wellDeep: '#0a0820',
  socket: '#1b1642',
  accent: '#7b5cf0',
  accentLight: '#b9a6ff',
  bolt: '#ffe7a3',
  text: '#f4f1ff',
  danger: '#ff3d5e',
} as const;
