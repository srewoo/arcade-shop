import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS, SETTINGS_KEY, validateSettings, validateSetting, loadSettings, saveSettings,
  leaderboardEligible, PAD_COUNTS, QUALITY_SCALE, RANGE_KEYS, resolveReduceMotion, hudScaleFactor, particleScale,
} from "../src/logic/settings.js";

const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = String(v)), removeItem: (k) => void delete data[k], data };
};

describe("validateSettings", () => {
  it("returns defaults for null, arrays and primitives", () => {
    for (const bad of [null, undefined, [], "x", 5, true]) expect(validateSettings(bad)).toEqual(DEFAULT_SETTINGS);
  });
  it("keeps valid values", () => {
    const s = { difficulty: "insane", opponents: 5, laps: 5, padDensity: "more", camera: "topdown", volume: 0.35, quality: "low", theme: "winter", pattern: "persian", floor: "tiles" };
    expect(validateSettings(s)).toEqual({ ...DEFAULT_SETTINGS, ...s });
  });
  it("replaces each invalid field with its default and drops unknown keys", () => {
    const out = validateSettings({ difficulty: "nightmare", opponents: 6, laps: 2, padDensity: "lots", camera: "sky", volume: 7, quality: 3, evil: 1 });
    expect(out).toEqual(DEFAULT_SETTINGS);
    expect(out).not.toHaveProperty("evil");
  });
  it("rejects numeric strings and non-integers for enumerated numbers", () => {
    expect(validateSetting("opponents", "3")).toBe(3); // default happens to be 3
    expect(validateSetting("opponents", "5")).toBe(DEFAULT_SETTINGS.opponents);
    expect(validateSetting("laps", 3.5)).toBe(DEFAULT_SETTINGS.laps);
    expect(validateSetting("opponents", 0)).toBe(0);
  });
  it("rejects NaN / Infinity / out-of-range volume and rounds valid volume", () => {
    for (const v of [NaN, Infinity, -0.1, 1.01, "0.5", null]) expect(validateSetting("volume", v)).toBe(1);
    expect(validateSetting("volume", 0.123456)).toBe(0.12);
    expect(validateSetting("volume", 0)).toBe(0);
  });
  it("default settings reproduce the original game configuration", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ difficulty: "normal", opponents: 3, laps: 3, padDensity: "normal" });
    expect(PAD_COUNTS).toEqual({ normal: 5, more: 8 });
    expect(QUALITY_SCALE.auto).toBe(1);
  });
});

describe("load / save", () => {
  it("round-trips through storage", () => {
    const storage = memoryStorage();
    const s = { ...DEFAULT_SETTINGS, difficulty: "hard", laps: 5, volume: 0.5 };
    expect(saveSettings(storage, s)).toBe(true);
    expect(loadSettings(storage)).toEqual(s);
  });
  it("falls back to defaults on corrupt JSON or partial data", () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: "{not json" }))).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{"laps":1,"difficulty":"zzz"}' }))).toEqual({ ...DEFAULT_SETTINGS, laps: 1 });
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
  });
  it("never throws when storage is missing or throws", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("full"); } };
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(broken, DEFAULT_SETTINGS)).toBe(false);
    expect(saveSettings(null, DEFAULT_SETTINGS)).toBe(false);
  });
});

describe("leaderboardEligible", () => {
  const base = { kind: "race", laps: 3, opponents: 3, padDensity: "normal" };
  it("accepts only the default race configuration", () => {
    expect(leaderboardEligible(base)).toBe(true);
    expect(leaderboardEligible({ ...base, opponents: 1 })).toBe(true);
    expect(leaderboardEligible({ ...base, kind: "timetrial" })).toBe(false);
    expect(leaderboardEligible({ ...base, laps: 1 })).toBe(false);
    expect(leaderboardEligible({ ...base, laps: 5 })).toBe(false);
    expect(leaderboardEligible({ ...base, opponents: 0 })).toBe(false);
    expect(leaderboardEligible({ ...base, padDensity: "more" })).toBe(false);
  });
});

import { THEME_IDS, PATTERN_IDS, FLOOR_IDS, gradeRgb, stylePropRgb, THEMES, PATTERNS, FLOORS, THEME_PALETTES, FLOOR_ENV } from "../src/logic/appearance.js";

describe("theme / pattern / floor settings", () => {
  it("defaults are classic / playmat / parquet", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ theme: "classic", pattern: "playmat", floor: "parquet" });
  });
  it("accepts every declared id and rejects others", () => {
    for (const theme of THEME_IDS) expect(validateSetting("theme", theme)).toBe(theme);
    for (const pattern of PATTERN_IDS) expect(validateSetting("pattern", pattern)).toBe(pattern);
    for (const floor of FLOOR_IDS) expect(validateSetting("floor", floor)).toBe(floor);
    expect(validateSetting("theme", "vaporwave")).toBe("classic");
    expect(validateSetting("pattern", 3)).toBe("playmat");
    expect(validateSetting("floor", "lava")).toBe("parquet");
    expect(validateSettings({ theme: "neon", pattern: "blueprint", floor: "grass" })).toMatchObject({ theme: "neon", pattern: "blueprint", floor: "grass" });
  });
  it("lists 5 themes, 3 patterns and 4 floors with palettes / environments for each", () => {
    expect(THEMES).toHaveLength(5);
    expect(PATTERNS).toHaveLength(3);
    expect(FLOORS).toHaveLength(4);
    for (const id of THEME_IDS) expect(THEME_PALETTES[id]).toBeDefined();
    for (const id of FLOOR_IDS) expect(FLOOR_ENV[id]).toBeDefined();
    expect(FLOOR_ENV.grass.walls).toBe(false);
  });
  it("classic grading is the identity and every grade stays in range", () => {
    expect(gradeRgb("classic", 0.2, 0.5, 0.3)).toEqual([0.2, 0.5, 0.3]);
    for (const theme of THEME_IDS)
      for (const pattern of PATTERN_IDS)
        for (const c of [[0, 0, 0], [1, 1, 1], [0.3, 0.7, 0.2], [0.8, 0.1, 0.1], [0.2, 0.5, 0.9]])
          for (const v of stylePropRgb(theme, pattern, ...c)) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
          }
  });
  it("themes visibly change green grass in the intended direction", () => {
    const grass = [0.35, 0.66, 0.23];
    const autumn = gradeRgb("autumn", ...grass);
    expect(autumn[0]).toBeGreaterThan(autumn[1] * 0.9); // orange/gold, not green
    const winter = gradeRgb("winter", ...grass);
    expect(Math.min(...winter)).toBeGreaterThan(0.6); // near white
    const neon = gradeRgb("neon", ...grass);
    expect(Math.max(...neon)).toBeLessThan(0.25); // dark night grass
    expect(gradeRgb("neon", 0.97, 0.97, 0.96)[2]).toBe(1); // road lines become neon cyan
  });
});

describe("accessibility and audio settings", () => {
  it("defaults: System reduce motion, colour-blind off, 100 % HUD, hold nitro, full channels", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ reduceMotion: "system", colourBlind: false, hudScale: 100, boostMode: "hold", sfxVolume: 1, engineVolume: 1 });
  });
  it("validates each new field and falls back per field", () => {
    expect(validateSetting("reduceMotion", "on")).toBe("on");
    expect(validateSetting("reduceMotion", true)).toBe("system");
    expect(validateSetting("colourBlind", true)).toBe(true);
    expect(validateSetting("colourBlind", "yes")).toBe(false);
    expect(validateSetting("hudScale", 125)).toBe(125);
    expect(validateSetting("hudScale", "150")).toBe(100);
    expect(validateSetting("hudScale", 90)).toBe(100);
    expect(validateSetting("boostMode", "toggle")).toBe("toggle");
    expect(validateSetting("boostMode", "tap")).toBe("hold");
  });
  it("all slider channels share the 0..1 validation", () => {
    expect(RANGE_KEYS).toEqual(["volume", "sfxVolume", "engineVolume"]);
    for (const key of RANGE_KEYS) {
      expect(validateSetting(key, 0.5)).toBe(0.5);
      for (const bad of [NaN, -1, 2, "1", undefined]) expect(validateSetting(key, bad)).toBe(1);
    }
  });
  it("old saved settings without the new keys still load (no data loss)", () => {
    const old = { difficulty: "hard", laps: 5, volume: 0.4 };
    const store = memoryStorage({ [SETTINGS_KEY]: JSON.stringify(old) });
    expect(loadSettings(store)).toEqual({ ...DEFAULT_SETTINGS, ...old });
  });
  it("Reduce motion: On / Off win, System follows the OS", () => {
    expect(resolveReduceMotion("on", false)).toBe(true);
    expect(resolveReduceMotion("off", true)).toBe(false);
    expect(resolveReduceMotion("system", true)).toBe(true);
    expect(resolveReduceMotion("system", false)).toBe(false);
    expect(resolveReduceMotion("system", undefined)).toBe(false);
  });
  it("HUD scale factor and particle scale", () => {
    expect([100, 125, 150].map(hudScaleFactor)).toEqual([1, 1.25, 1.5]);
    expect(hudScaleFactor(77)).toBe(1);
    expect(particleScale(true)).toBeLessThanOrEqual(0.4);
    expect(particleScale(false)).toBe(1);
  });
});
