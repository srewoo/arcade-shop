// Rug colour themes, print patterns and floor options: ids, labels, palette overrides, environment
// parameters and the colour-grading maths shared by the canvas print and the prop vertex colours.
// Pure (no three, no DOM).

export const THEMES = Object.freeze([
  { id: "classic", label: "Classic" },
  { id: "autumn", label: "Autumn" },
  { id: "winter", label: "Winter" },
  { id: "neon", label: "Neon Night" },
  { id: "pastel", label: "Pastel" },
]);
export const PATTERNS = Object.freeze([
  { id: "playmat", label: "Playmat" },
  { id: "persian", label: "Persian" },
  { id: "blueprint", label: "Blueprint" },
]);
export const FLOORS = Object.freeze([
  { id: "parquet", label: "Parquet" },
  { id: "darkwood", label: "Dark wood" },
  { id: "tiles", label: "Tiles" },
  { id: "grass", label: "Outdoor grass" },
]);

export const THEME_IDS = THEMES.map((t) => t.id);
export const PATTERN_IDS = PATTERNS.map((p) => p.id);
export const FLOOR_IDS = FLOORS.map((f) => f.id);

/** Painter palette overrides per theme (merged over COLORS while the playmat print is painted). */
export const THEME_PALETTES = Object.freeze({
  classic: {},
  autumn: { grass: "#9a8a34", grassDark: "#7a5a22", grassEdge: "#6b4a1e", tree: "#b5521e", treeMid: "#d9822b", treeLight: "#e8b23c", field: "#c49a38", fieldDark: "#a67a2a", water: "#4a8fa8", waterDeep: "#3a7a94", waterLight: "#7fb4c4" },
  winter: { grass: "#e4ecf2", grassDark: "#b8c8d6", grassEdge: "#a8bccc", tree: "#6f8a86", treeMid: "#8fa8a4", treeLight: "#dfe9ee", field: "#d6e2ea", fieldDark: "#c3d3de", water: "#a9d6ea", waterDeep: "#8cc2dc", waterLight: "#d8f0fa", sand: "#e8e4dc" },
  neon: {}, // graded only (see GRADES.neon): white lines -> cyan, yellow -> magenta, everything else dark
  pastel: {}, // graded only
});

/** Floor / room parameters: wall visibility, sky/background colour and light colours + intensities. */
export const FLOOR_ENV = Object.freeze({
  parquet: { walls: true, bg: "#d9c7ad", sun: "#ffdcae", sunI: 2.7, hemiSky: "#dfe8ff", hemiGround: "#c99f73", hemiI: 0.8, envI: 0.42, wall: "#efe2cc" },
  darkwood: { walls: true, bg: "#2a1f1a", sun: "#ffc98a", sunI: 2.1, hemiSky: "#b8c4e8", hemiGround: "#6a4a34", hemiI: 0.6, envI: 0.34, wall: "#4a3a34" },
  tiles: { walls: true, bg: "#dfe6ea", sun: "#fff4e6", sunI: 2.8, hemiSky: "#e8f0ff", hemiGround: "#b8c4cc", hemiI: 0.9, envI: 0.46, wall: "#e8f0f4" },
  grass: { walls: false, bg: "#9fd4f5", sun: "#fff6d8", sunI: 3.2, hemiSky: "#bfe2ff", hemiGround: "#6aa24a", hemiI: 1.0, envI: 0.5, wall: "#ffffff" },
});

/** Extra lighting multipliers per theme (neon night is dark; winter is cool). */
export const THEME_LIGHT = Object.freeze({
  classic: { floor: 1, sun: 1, hemi: 1, tint: "#ffffff" },
  autumn: { floor: 1, sun: 1, hemi: 1, tint: "#fff0d8" },
  winter: { floor: 1, sun: 1.05, hemi: 1.1, tint: "#eef6ff" },
  neon: { floor: 0.3, sun: 0.28, hemi: 0.35, tint: "#9aa8ff" },
  pastel: { floor: 1, sun: 1, hemi: 1.15, tint: "#fff8fc" },
});

/** Neon night: rug texture is also the emissive map so lines glow into the bloom pass. */
export const THEME_EMISSIVE = Object.freeze({ classic: 0, autumn: 0, winter: 0, neon: 1.6, pastel: 0 });

/* ---------------- colour maths (all channels 0..1) ---------------- */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h, s, l) {
  const hue = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(hue + 1 / 3), f(hue), f(hue - 1 / 3)];
}

const isGreen = (h, s) => h >= 70 && h <= 170 && s > 0.12;
const isBlue = (h, s) => h > 170 && h <= 260 && s > 0.12;

const GRADES = {
  classic: (r, g, b) => [r, g, b],
  autumn(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    if (isGreen(h, s)) return hslToRgb(l < 0.3 ? 12 : l < 0.45 ? 28 : 44, clamp01(s * 0.95 + 0.1), l * 0.98);
    if (isBlue(h, s)) return hslToRgb(h - 12, s * 0.7, l * 0.95);
    return s < 0.15 ? [clamp01(r * 1.03), g, clamp01(b * 0.94)] : [r, g, b];
  },
  winter(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    if (isGreen(h, s)) return hslToRgb(210, 0.16, 0.72 + 0.26 * l);
    if (isBlue(h, s)) return hslToRgb(198, s * 0.45, clamp01(l * 0.5 + 0.5));
    if (s < 0.15) return hslToRgb(215, 0.12, l * 0.85);
    return hslToRgb(h, s * 0.75, clamp01(l * 0.9 + 0.08));
  },
  neon(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l > 0.8 && s < 0.25) return [0.2, 0.96, 1];
    if (h >= 35 && h <= 65 && s > 0.5 && l > 0.45) return [1, 0.2, 0.82];
    if (isBlue(h, s)) return hslToRgb(222, 0.85, 0.12 + l * 0.2);
    if (isGreen(h, s)) return hslToRgb(190, 0.6, 0.05 + l * 0.12);
    if (s < 0.15) return [0.05 + l * 0.08, 0.05 + l * 0.08, 0.1 + l * 0.1];
    return hslToRgb(h, 0.9, clamp01(l * 0.45));
  },
  pastel(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    return hslToRgb(h, s * 0.55, clamp01(0.5 + l * 0.45));
  },
};

/** Grade one colour for a theme; unknown themes behave like "classic". Returns [r,g,b] in 0..1. */
export function gradeRgb(theme, r, g, b) {
  const out = (GRADES[theme] ?? GRADES.classic)(r, g, b);
  return [clamp01(out[0]), clamp01(out[1]), clamp01(out[2])];
}

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Prop colour grade for a pattern: blueprint = blue line-art tones, persian = warm dyed wool. */
export function patternPropRgb(pattern, r, g, b) {
  const y = luma(r, g, b);
  if (pattern === "blueprint") {
    const t = Math.pow(y, 0.8);
    return [0.16 + 0.78 * t, 0.36 + 0.6 * t, 0.7 + 0.28 * t].map(clamp01);
  }
  if (pattern === "persian") {
    return [clamp01(r * 0.5 + (y * 1.1 + 0.1) * 0.5), clamp01(g * 0.5 + y * 0.8 * 0.5), clamp01(b * 0.5 + y * 0.55 * 0.5)];
  }
  return [r, g, b];
}

/** Full prop grade: pattern first, then the theme. */
export function stylePropRgb(theme, pattern, r, g, b) {
  const [pr, pg, pb] = patternPropRgb(pattern, r, g, b);
  return gradeRgb(theme, pr, pg, pb);
}
