// Day/night + biome palettes (pure maths; world/daynight.js applies them to the scene).
// The cycle is driven by score: day desert -> dusk canyon -> moonlit night -> dawn -> day ...
import { PALETTE as C, FOG_NEAR, FOG_FAR } from '../config.js';
import { parseWeather } from './weatherModes.js';

export const CYCLE_SCORE = 3200; // score for one full day/night loop
export const PLATEAU = 0.35; // fraction of each quarter spent at the pure keyframe before blending on

const k = (o) => o;
/** Colour fields are 0xRRGGBB; the rest are plain numbers.  `day` reproduces the original desert exactly. */
export const KEYFRAMES = [
  k({
    name: 'Desert', skyTop: C.skyTop, skyMid: C.skyMid, skyLow: C.skyLow, horizon: C.horizon, sunGlow: C.sunGlow,
    sunDisc: C.sunDisc, sunLight: C.sunLight, hemiSky: C.skyFill, hemiGround: C.bounce, rim: C.rim, ground: 0xffffff,
    mesa: 0xffffff, cloud: 8218226, sunIntensity: 5.6, hemiIntensity: 0.85, rimIntensity: 1.1, stars: 0, sunY: 0.2, propGlow: 0, fogNear: FOG_NEAR, fogFar: FOG_FAR, fillLight: 0, sunShow: 1, snow: 0, wet: 0,
  }),
  k({
    name: 'Dusk Canyon', skyTop: 0x3b2a5e, skyMid: 0xb5506a, skyLow: 0xf0905a, horizon: 0xf2a064, sunGlow: 0xff7a3a,
    sunDisc: 0xffb070, sunLight: 0xff8a4a, hemiSky: 0xd09ab0, hemiGround: 0xb0705a, rim: 0xc090d0, ground: 0xeeb48c,
    mesa: 0xe89478, cloud: 0x9a4a3a, sunIntensity: 4.2, hemiIntensity: 1.15, rimIntensity: 1.2, stars: 0.12, sunY: 0.04, propGlow: 0.6, fogNear: FOG_NEAR, fogFar: FOG_FAR, fillLight: 0, sunShow: 1, snow: 0, wet: 0,
  }),
  k({
    name: 'Moonlit Desert', skyTop: 0x050816, skyMid: 0x0e1736, skyLow: 0x1c2a52, horizon: 0x24305c, sunGlow: 0x4a5a9a,
    sunDisc: 0xdfe8ff, sunLight: 0x8fa6ff, hemiSky: 0x3a4a8a, hemiGround: 0x1a1e3a, rim: 0x5a6ac0, ground: 0x6a76a4,
    mesa: 0x7a8ab8, cloud: 0x2a3354, sunIntensity: 1.8, hemiIntensity: 1.05, rimIntensity: 0.9, stars: 1, sunY: 0.3, propGlow: 1, fogNear: 60, fogFar: 280, fillLight: 55, sunShow: 1, snow: 0, wet: 0,
  }),
  k({
    name: 'Dawn Dunes', skyTop: 0x4a5a9a, skyMid: 0xd08aa0, skyLow: 0xffc08a, horizon: 0xffd2a0, sunGlow: 0xffa070,
    sunDisc: 0xffe0b0, sunLight: 0xffc890, hemiSky: 0xc0a0c0, hemiGround: 0xc08a70, rim: 0x9aa0e0, ground: 0xf0d0bc,
    mesa: 0xe8b0a0, cloud: 0xb87a78, sunIntensity: 4.2, hemiIntensity: 1, rimIntensity: 1.1, stars: 0.2, sunY: 0.08, propGlow: 0.35, fogNear: FOG_NEAR, fogFar: FOG_FAR, fillLight: 0, sunShow: 1, snow: 0, wet: 0,
  }),
];

/** Fixed palettes for the Snow and Rain environments (not part of the score-driven cycle). */
export const WEATHER_KEYFRAMES = {
  snow: k({
    name: 'Snowfield', skyTop: 0x9db4cc, skyMid: 0xc2d2e0, skyLow: 0xe0e8ef, horizon: 0xe6edf3, sunGlow: 0xf2f6fb,
    sunDisc: 0xf6f8fb, sunLight: 0xe2eaf6, hemiSky: 0xe3ecf6, hemiGround: 0xbfcad8, rim: 0xb8c8e8, ground: 0xffffff,
    mesa: 0xdfe6f0, cloud: 0xaab6c6, sunIntensity: 2.9, hemiIntensity: 1.35, rimIntensity: 0.9, stars: 0, sunY: 0.14,
    propGlow: 0.1, fogNear: 40, fogFar: 210, fillLight: 0, sunShow: 0.35, snow: 1, wet: 0,
  }),
  rain: k({
    name: 'Rainstorm', skyTop: 0x3c434d, skyMid: 0x5a626c, skyLow: 0x7c858f, horizon: 0x838c96, sunGlow: 0x7c858f,
    sunDisc: 0x838c96, sunLight: 0xb4c0d0, hemiSky: 0x8e9aa8, hemiGround: 0x4a5058, rim: 0x8aa0c0, ground: 0x7d838c,
    mesa: 0xc4ccd8, cloud: 0x3a4048, sunIntensity: 2.2, hemiIntensity: 1.05, rimIntensity: 0.9, stars: 0, sunY: 0.22,
    propGlow: 0.25, fogNear: 28, fogFar: 170, fillLight: 0, sunShow: 0, snow: 0, wet: 1,
  }),
};

const COLOR_FIELDS = ['skyTop', 'skyMid', 'skyLow', 'horizon', 'sunGlow', 'sunDisc', 'sunLight', 'hemiSky', 'hemiGround', 'rim', 'ground', 'mesa', 'cloud'];
const NUMBER_FIELDS = ['sunIntensity', 'hemiIntensity', 'rimIntensity', 'stars', 'sunY', 'propGlow', 'fogNear', 'fogFar', 'fillLight', 'sunShow', 'snow', 'wet'];

export const smoothstep = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Linear blend of two 0xRRGGBB colours. */
export function mixHex(a, b, t) {
  const ch = (shift) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Position on the cycle: quarter index, fraction through it and blend amount toward the next keyframe. */
export function cyclePosition(score) {
  const n = KEYFRAMES.length;
  const s = ((Math.max(0, score) % CYCLE_SCORE) / CYCLE_SCORE) * n;
  const index = Math.min(n - 1, Math.floor(s));
  const frac = s - index;
  return { index, frac, blend: smoothstep((frac - PLATEAU) / (1 - PLATEAU)) };
}

/** Name of the biome the score is currently closest to. */
export function biomeName(score) {
  const { index, frac } = cyclePosition(score);
  return KEYFRAMES[(index + (frac >= 0.8 ? 1 : 0)) % KEYFRAMES.length].name;
}

/** Palette (all fields of a keyframe, blended) at `score`. */
export function samplePalette(score) {
  const { index, blend } = cyclePosition(score);
  const a = KEYFRAMES[index];
  const b = KEYFRAMES[(index + 1) % KEYFRAMES.length];
  const out = { name: biomeName(score) };
  for (const f of COLOR_FIELDS) out[f] = mixHex(a[f], b[f], blend);
  for (const f of NUMBER_FIELDS) out[f] = a[f] + (b[f] - a[f]) * blend;
  return out;
}

/**
 * Palette for an environment.  auto = the score-driven cycle, day/night = that keyframe locked,
 * snow/rain = their fixed palettes.
 */
export function paletteFor(weather, score = 0) {
  switch (parseWeather(weather)) {
    case 'day': return { ...samplePalette(0), name: 'Day' };
    case 'night': return { ...samplePalette(CYCLE_SCORE * 0.5), name: 'Night' };
    case 'snow': return { ...WEATHER_KEYFRAMES.snow };
    case 'rain': return { ...WEATHER_KEYFRAMES.rain };
    default: return samplePalette(score);
  }
}

/** Auto cycle: score -> time of day name and phase (0..1 through the loop). */
export function timeOfDay(score) {
  const n = KEYFRAMES.length;
  const { index, frac } = cyclePosition(score);
  const names = ['day', 'dusk', 'night', 'dawn'];
  return { name: names[(index + (frac >= 0.8 ? 1 : 0)) % n], phase: (Math.max(0, score) % CYCLE_SCORE) / CYCLE_SCORE };
}
