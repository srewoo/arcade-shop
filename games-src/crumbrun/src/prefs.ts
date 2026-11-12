// Pure helpers that turn saved settings into runtime values.
import type { Settings } from './storage';

export function resolveReducedMotion(setting: Settings['reduceMotion'], systemReduced: boolean): boolean {
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return systemReduced;
}

export function textScale(size: Settings['textSize']): number {
  return size / 100;
}

/** Master gain 0..1 for the audio graph given volume (0-100) and mute. */
export function volumeLevel(volume: number, muted: boolean): number {
  if (muted) return 0;
  return Math.min(1, Math.max(0, volume / 100));
}
