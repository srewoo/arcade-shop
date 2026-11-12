// Settings and records schemas. Everything read from storage is validated per field.
import { z } from 'zod';
import { MODE_IDS, MODES, type ModeId } from '../core/modes';
import { DEFAULT_KEYS, KeysSchema } from './keys';

const Percent = z.number().int().min(0).max(100);

export const SettingsSchema = z
  .object({
    keys: KeysSchema,
    das: z.number().int().min(0).max(500),
    arr: z.number().int().min(0).max(200),
    ghost: z.boolean(),
    sound: z.boolean(),
    music: z.boolean(),
    muted: z.boolean(),
    masterVolume: Percent,
    sfxVolume: Percent,
    musicVolume: Percent,
    touchButtons: z.boolean(),
    reducedMotion: z.enum(['system', 'on', 'off']),
    shake: z.boolean(),
    flashes: z.boolean(),
    particles: z.enum(['off', 'low', 'full']),
    colorAssist: z.boolean(),
    textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
    haptics: z.boolean(),
    swipeStep: z.number().int().min(14).max(30),
    tuning: z.enum(['classic', 'tuned']),
    mode: z.enum(['marathon', 'sprint', 'ultra', 'zen', 'dig']),
    startLevel: z.number().int().min(1).max(15),
    zenGarbage: z.boolean(),
  })
  .strict();
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  keys: DEFAULT_KEYS,
  das: 167, arr: 33, ghost: true, sound: true, music: true, muted: false,
  masterVolume: 100, sfxVolume: 100, musicVolume: 100,
  touchButtons: false, reducedMotion: 'system', shake: true, flashes: true, particles: 'full',
  colorAssist: true, textSize: 100, haptics: false, swipeStep: 14, tuning: 'classic',
  mode: 'marathon', startLevel: 1, zenGarbage: false,
});

/**
 * Parse stored settings; keeps each valid field and defaults the rest.
 * `touchDevice` only changes the default for `touchButtons`: an explicit saved
 * choice always wins.
 */
export function parseSettings(raw: unknown, touchDevice = false): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS, keys: { ...DEFAULT_KEYS }, touchButtons: touchDevice };
  if (typeof raw !== 'object' || raw === null) return out;
  const shape = SettingsSchema.shape;
  for (const key of Object.keys(shape) as (keyof Settings)[]) {
    const parsed = shape[key].safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) (out as Record<keyof Settings, unknown>)[key] = parsed.data;
  }
  return out;
}

// Records: best score (higher) or best time in ms (lower) per mode.
const Record1 = z.number().int().min(1).max(10_000_000_000).nullable();
export const RecordsSchema = z.object({
  marathon: Record1, sprint: Record1, ultra: Record1, zen: Record1, dig: Record1,
}).strict();
export type Records = z.infer<typeof RecordsSchema>;
export const EMPTY_RECORDS: Readonly<Records> = Object.freeze({ marathon: null, sprint: null, ultra: null, zen: null, dig: null });

export function parseRecords(raw: unknown): Records {
  const out: Records = { ...EMPTY_RECORDS };
  if (typeof raw !== 'object' || raw === null) return out;
  for (const id of MODE_IDS) {
    const parsed = Record1.safeParse((raw as Record<string, unknown>)[id]);
    if (parsed.success) out[id] = parsed.data;
  }
  return out;
}

export function isBetter(mode: ModeId, candidate: number, current: number | null): boolean {
  if (current === null) return true;
  return MODES[mode].best === 'time' ? candidate < current : candidate > current;
}

/** One-time onboarding flag. */
export const HelpSeenSchema = z.literal('1');
