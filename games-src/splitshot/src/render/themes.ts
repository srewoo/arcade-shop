// Per-stage art palettes. Every scene stays dark/mid-tone behind the playfield so the bright
// bubbles keep >= 3:1 contrast (also helped by their dark outline).
import type { Theme } from '../sim/types';

export interface ThemeArt {
  name: string;
  sky: readonly (readonly [number, string])[];
  /** World y of the horizon line. */
  horizon: number;
  glow: string;
  far: string;
  mid: string;
  midHi: string;
  near: string;
  floorTop: string;
  floorBot: string;
  floorLine: string;
  ledge: string;
  ledgeHi: string;
  ledgeLo: string;
  block: string;
  blockHi: string;
  blockLo: string;
  dust: string;
  ambient: 'bubbles' | 'embers' | 'snow' | 'rain' | 'fireflies' | 'motes';
}

export const THEME_ART: Readonly<Record<Theme, ThemeArt>> = {
  harbour: {
    name: 'Harbour dusk',
    sky: [[0, '#141d4a'], [0.45, '#4a2f6e'], [0.75, '#c2587a'], [1, '#f39a62']],
    horizon: 292, glow: '#ffb27a', far: '#3a2b64', mid: '#24204a', midHi: '#6a4a8c', near: '#14122c',
    floorTop: '#8a5e3c', floorBot: '#4a2f22', floorLine: '#2e1c14',
    ledge: '#a8754a', ledgeHi: '#e2b074', ledgeLo: '#4a2c1a',
    block: '#b9855a', blockHi: '#f0c48a', blockLo: '#5a3620',
    dust: '#e9c89a', ambient: 'motes',
  },
  coral: {
    name: 'Coral shallows',
    sky: [[0, '#0a3f6e'], [0.5, '#0b5f8f'], [1, '#0d3b66']],
    horizon: 300, glow: '#7fe6ff', far: '#0e5a86', mid: '#12507a', midHi: '#3fa6c4', near: '#0a2f55',
    floorTop: '#c9a874', floorBot: '#7a6140', floorLine: '#5a4730',
    ledge: '#d86e8e', ledgeHi: '#ffb3c6', ledgeLo: '#7a2b4a',
    block: '#e48a58', blockHi: '#ffcf9a', blockLo: '#8a3f20',
    dust: '#f0dcb0', ambient: 'bubbles',
  },
  kelp: {
    name: 'Kelp forest',
    sky: [[0, '#06302f'], [0.55, '#0c5446'], [1, '#08392f']],
    horizon: 300, glow: '#8cf0b0', far: '#0b4a3c', mid: '#0a5f45', midHi: '#38b078', near: '#04241c',
    floorTop: '#4a6a44', floorBot: '#243a28', floorLine: '#162618',
    ledge: '#6f8f4a', ledgeHi: '#b6d880', ledgeLo: '#2a3f20',
    block: '#8a7a54', blockHi: '#cfc08a', blockLo: '#433a22',
    dust: '#bfe0a0', ambient: 'bubbles',
  },
  lantern: {
    name: 'Lantern caves',
    sky: [[0, '#150b1e'], [0.6, '#33172c'], [1, '#5a2a30']],
    horizon: 300, glow: '#ffc15a', far: '#2a1530', mid: '#3a1c36', midHi: '#a8586a', near: '#12081a',
    floorTop: '#6a5060', floorBot: '#32222e', floorLine: '#1c121a',
    ledge: '#8a6a74', ledgeHi: '#d2aab0', ledgeLo: '#3a2430',
    block: '#a97a58', blockHi: '#e8bf92', blockLo: '#4e3220',
    dust: '#e2b890', ambient: 'embers',
  },
  storm: {
    name: 'Storm cliffs',
    sky: [[0, '#10161f'], [0.5, '#2b3748'], [1, '#56687e']],
    horizon: 296, glow: '#b5d4ff', far: '#2e3a4c', mid: '#1c2532', midHi: '#586c86', near: '#0c1118',
    floorTop: '#4a5666', floorBot: '#242c36', floorLine: '#141a22',
    ledge: '#667488', ledgeHi: '#a8bad0', ledgeLo: '#2a323e',
    block: '#7c8aa0', blockHi: '#c4d2e6', blockLo: '#333c4a',
    dust: '#b8c8dc', ambient: 'rain',
  },
  aurora: {
    name: 'Aurora floe',
    sky: [[0, '#050a22'], [0.55, '#0d2a52'], [1, '#1c4c7a']],
    horizon: 300, glow: '#7dffc8', far: '#18406e', mid: '#1f5486', midHi: '#9fd8f0', near: '#0b2646',
    floorTop: '#7db4d4', floorBot: '#3a6a94', floorLine: '#244a6e',
    ledge: '#a8d6ee', ledgeHi: '#f0faff', ledgeLo: '#4a7ea0',
    block: '#8ec8e6', blockHi: '#ffffff', blockLo: '#3e7096',
    dust: '#e6f6ff', ambient: 'snow',
  },
};

/** Bubble body colours by size (tiny..large), chosen to differ in lightness as well as hue. */
export const BUBBLE_COLORS: readonly { body: string; light: string; dark: string }[] = [
  { body: '#4fc3ff', light: '#d6f3ff', dark: '#0f5f9a' },
  { body: '#4be39b', light: '#d2ffe9', dark: '#0f7a4e' },
  { body: '#ffb32e', light: '#fff0c4', dark: '#a8620a' },
  { body: '#ff4f94', light: '#ffd3e6', dark: '#9a1a52' },
];

export const POWER_COLORS = { double: '#4de0ff', sticky: '#b6ff5c', slow: '#c9a8ff', shield: '#ffd45a' } as const;
