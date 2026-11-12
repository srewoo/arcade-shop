// Last-used players/course and best rounds, validated on load.
import * as z from 'zod/mini';
import { COURSE_IDS, type CourseId } from './course';
import { COLOR_IDS, MAX_NAME, cleanName, dedupeColors, defaultPlayers, type Player } from './game/players';
import { readJson, writeJson } from './storage';

export const SETUP_KEY = 'tinylinks:setup';
export const BEST_KEY = 'tinylinks:best';
export const ONBOARD_KEY = 'tinylinks:onboarded';

const PlayerSchema = z.strictObject({ name: z.string().check(z.maxLength(MAX_NAME * 2)), color: z.enum(COLOR_IDS) });
const SetupSchema = z.strictObject({
  course: z.enum(COURSE_IDS),
  players: z.array(PlayerSchema).check(z.minLength(1), z.maxLength(4)),
});
export interface Setup { course: CourseId; players: Player[] }

export const DEFAULT_SETUP: Readonly<Setup> = Object.freeze({ course: 'front9', players: defaultPlayers(1) });

export function parseSetup(raw: unknown): Setup {
  const r = z.safeParse(SetupSchema, raw);
  if (!r.success) return { course: DEFAULT_SETUP.course, players: defaultPlayers(1) };
  const players = dedupeColors(r.data.players.map((p, i) => ({ name: cleanName(p.name, i), color: p.color })));
  return { course: r.data.course, players };
}

export const loadSetup = (): Setup => parseSetup(readJson(SETUP_KEY));
export const saveSetup = (s: Setup): void => void writeJson(SETUP_KEY, s);

const BestSchema = z.partialRecord(z.enum(COURSE_IDS), z.int().check(z.gte(1), z.lte(999)));
export type Best = Partial<Record<CourseId, number>>;

export function parseBest(raw: unknown): Best {
  const r = z.safeParse(BestSchema, raw);
  return r.success ? (r.data as Best) : {};
}
export const loadBest = (): Best => parseBest(readJson(BEST_KEY));

/** Record a solo round; returns true when it beats the stored best. */
export function recordBest(course: CourseId, strokes: number): boolean {
  const best = loadBest();
  const prev = best[course];
  if (prev !== undefined && prev <= strokes) return false;
  writeJson(BEST_KEY, { ...best, [course]: strokes });
  return true;
}
