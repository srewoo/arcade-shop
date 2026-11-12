// Settings dialog sections: audio, display and accessibility, handling and rules.
import { msToFrames } from '../../core/das';
import { DEFAULT_SETTINGS, type Settings } from '../../settings';
import { S } from '../../strings';
import { select, slider, toggle } from './controls';

export interface Ctx {
  get(): Settings;
  patch(p: Partial<Settings>): void;
}

const pct = (v: number): string => `${v}%`;

export const AUDIO_DEFAULTS: Partial<Settings> = {
  muted: DEFAULT_SETTINGS.muted, masterVolume: DEFAULT_SETTINGS.masterVolume, sfxVolume: DEFAULT_SETTINGS.sfxVolume,
  musicVolume: DEFAULT_SETTINGS.musicVolume, sound: DEFAULT_SETTINGS.sound, music: DEFAULT_SETTINGS.music,
};

export function audioRows(c: Ctx): HTMLElement[] {
  const s = c.get();
  const t = S.settings;
  return [
    toggle(t.muted, 'opt-muted', s.muted, (v) => c.patch({ muted: v })),
    slider(t.master, 'opt-master', s.masterVolume, 0, 100, pct, (v) => c.patch({ masterVolume: v })),
    slider(t.sfx, 'opt-sfxvol', s.sfxVolume, 0, 100, pct, (v) => c.patch({ sfxVolume: v })),
    slider(t.music, 'opt-musicvol', s.musicVolume, 0, 100, pct, (v) => c.patch({ musicVolume: v })),
    toggle(t.sfxOn, 'opt-sound', s.sound, (v) => c.patch({ sound: v })),
    toggle(t.musicOn, 'opt-music', s.music, (v) => c.patch({ music: v })),
  ];
}

export const DISPLAY_DEFAULTS: Partial<Settings> = {
  reducedMotion: DEFAULT_SETTINGS.reducedMotion, shake: DEFAULT_SETTINGS.shake, flashes: DEFAULT_SETTINGS.flashes,
  particles: DEFAULT_SETTINGS.particles, colorAssist: DEFAULT_SETTINGS.colorAssist, textSize: DEFAULT_SETTINGS.textSize,
  ghost: DEFAULT_SETTINGS.ghost, touchButtons: DEFAULT_SETTINGS.touchButtons, haptics: DEFAULT_SETTINGS.haptics,
};

export function displayRows(c: Ctx): HTMLElement[] {
  const s = c.get();
  const t = S.settings;
  return [
    toggle(t.colorAssist, 'opt-assist', s.colorAssist, (v) => c.patch({ colorAssist: v })),
    select(t.motion, 'opt-motion', s.reducedMotion, [['system', t.motionSystem], ['on', t.motionOn], ['off', t.motionOff]], (v) => c.patch({ reducedMotion: v as Settings['reducedMotion'] })),
    toggle(t.shake, 'opt-shake', s.shake, (v) => c.patch({ shake: v })),
    toggle(t.flashes, 'opt-flashes', s.flashes, (v) => c.patch({ flashes: v })),
    select(t.particles, 'opt-particles', s.particles, [['off', t.particlesOff], ['low', t.particlesLow], ['full', t.particlesFull]], (v) => c.patch({ particles: v as Settings['particles'] })),
    select(t.textSize, 'opt-textsize', String(s.textSize), [['100', '100%'], ['125', '125%'], ['150', '150%']], (v) => c.patch({ textSize: Number(v) as Settings['textSize'] })),
    toggle(t.ghost, 'opt-ghost', s.ghost, (v) => c.patch({ ghost: v })),
    toggle(t.touchButtons, 'opt-touch', s.touchButtons, (v) => c.patch({ touchButtons: v })),
    toggle(t.haptics, 'opt-haptics', s.haptics, (v) => c.patch({ haptics: v })),
  ];
}

export const HANDLING_DEFAULTS: Partial<Settings> = {
  das: DEFAULT_SETTINGS.das, arr: DEFAULT_SETTINGS.arr, swipeStep: DEFAULT_SETTINGS.swipeStep,
  startLevel: DEFAULT_SETTINGS.startLevel, tuning: DEFAULT_SETTINGS.tuning,
};

export function handlingRows(c: Ctx): HTMLElement[] {
  const s = c.get();
  const t = S.settings;
  const ms = (v: number): string => `${v} ms (${S.settings.frames(msToFrames(v))})`;
  return [
    slider(t.das, 'das', s.das, 0, 400, ms, (v) => c.patch({ das: v })),
    slider(t.arr, 'arr', s.arr, 0, 150, ms, (v) => c.patch({ arr: v })),
    slider(t.swipe, 'opt-swipe', s.swipeStep, 14, 30, (v) => `${v} px`, (v) => c.patch({ swipeStep: v })),
    select(t.startLevel, 'opt-level', String(s.startLevel), Array.from({ length: 15 }, (_, i) => [String(i + 1), `Level ${i + 1}`] as const), (v) => c.patch({ startLevel: Number(v) })),
    select(t.tuning, 'opt-tuning', s.tuning, [['classic', t.tuningClassic], ['tuned', t.tuningTuned]], (v) => c.patch({ tuning: v as Settings['tuning'] })),
  ];
}
