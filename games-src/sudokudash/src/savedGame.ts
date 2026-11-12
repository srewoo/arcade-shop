// The in-progress game ("remember / recall" from the old workbook, but automatic).
import { z } from 'zod';
import { formatGrid, isValidSolution, parseGrid } from './core/grid';
import { newGame, type GameState } from './core/game';
import type { DashState } from './core/scoring';
import { DifficultySchema, KEYS, ModeSchema, readJson, removeKey, writeJson, type Mode } from './storage';
import type { Difficulty } from './core/grader';

const Cells = z.string().regex(/^[0-9.]{81}$/);
const Masks = z.array(z.number().int().min(0).max(511)).length(81);
const Ms = z.number().min(0).max(1e10);
const CellList = z.array(z.number().int().min(0).max(80)).max(81);

export const SavedGameSchema = z
  .object({
    /** 1 = original shape (no paid-cell tracking); 2 adds awarded/bestCombo/mistakeCells. */
    v: z.union([z.literal(1), z.literal(2)]),
    mode: ModeSchema,
    difficulty: DifficultySchema,
    daily: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    custom: z.boolean(),
    puzzle: Cells,
    solution: Cells,
    values: Cells,
    notes: Masks,
    elim: Masks,
    mistakes: z.number().int().min(0).max(999),
    mistakeLimit: z.boolean(),
    elapsedMs: Ms,
    hintsUsed: z.number().int().min(0).max(9999),
    assisted: z.boolean(),
    awarded: CellList.optional(),
    bestCombo: z.number().int().min(0).max(99).optional(),
    mistakeCells: CellList.optional(),
    dash: z
      .object({
        timeLeftMs: Ms,
        startMs: Ms,
        combo: z.number().int().min(0).max(99),
        lastCorrectAt: Ms.nullable(),
        score: z.number().int().min(0).max(1e9),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type SavedGame = z.infer<typeof SavedGameSchema>;

export interface Restored {
  readonly state: GameState;
  readonly mode: Mode;
  readonly difficulty: Difficulty;
  readonly daily: string | null;
  readonly custom: boolean;
  readonly mistakes: number;
  readonly mistakeLimit: boolean;
  readonly elapsedMs: number;
  readonly hintsUsed: number;
  readonly assisted: boolean;
  readonly dash: DashState | null;
  /** Cells that already paid a Dash award (so undo + re-entry cannot pay twice). */
  readonly awarded: readonly number[];
  readonly bestCombo: number;
  /** Cells where a wrong digit was entered (for the shareable Daily result). */
  readonly mistakeCells: readonly number[];
}

/** Schema check plus consistency: the solution is a valid grid, givens and entries agree with it. */
export function parseSavedGame(raw: unknown): Restored | null {
  const parsed = SavedGameSchema.safeParse(raw);
  if (!parsed.success) return null;
  const d = parsed.data;
  const puzzle = parseGrid(d.puzzle);
  const solution = parseGrid(d.solution);
  const values = parseGrid(d.values);
  if (!puzzle || !solution || !values || !isValidSolution(solution)) return null;
  if (puzzle.some((p, i) => p !== 0 && (p !== solution[i] || values[i] !== p))) return null;
  if (d.mode === 'dash' && d.dash === null) return null;
  const state: GameState = { ...newGame(puzzle, solution), values, notes: d.notes, elim: d.elim };
  // v1 saves did not track paid cells: treat every correct player entry as already paid.
  const awarded = d.awarded ?? values.flatMap((v, i) => (v !== 0 && puzzle[i] === 0 && v === solution[i] ? [i] : []));
  return {
    state, mode: d.mode, difficulty: d.difficulty, daily: d.daily, custom: d.custom, mistakes: d.mistakes,
    mistakeLimit: d.mistakeLimit, elapsedMs: d.elapsedMs, hintsUsed: d.hintsUsed, assisted: d.assisted, dash: d.dash,
    awarded, bestCombo: d.bestCombo ?? d.dash?.combo ?? 0, mistakeCells: d.mistakeCells ?? [],
  };
}

export function toSavedGame(r: Restored): SavedGame {
  return {
    v: 2,
    mode: r.mode,
    difficulty: r.difficulty,
    daily: r.daily,
    custom: r.custom,
    puzzle: formatGrid(r.state.puzzle),
    solution: formatGrid(r.state.solution),
    values: formatGrid(r.state.values),
    notes: [...r.state.notes],
    elim: [...r.state.elim],
    mistakes: r.mistakes,
    mistakeLimit: r.mistakeLimit,
    elapsedMs: Math.round(r.elapsedMs),
    hintsUsed: r.hintsUsed,
    assisted: r.assisted,
    awarded: [...r.awarded],
    bestCombo: r.bestCombo,
    mistakeCells: [...r.mistakeCells],
    dash: r.dash ? { ...r.dash, timeLeftMs: Math.round(r.dash.timeLeftMs), startMs: Math.round(r.dash.startMs), lastCorrectAt: r.dash.lastCorrectAt === null ? null : Math.round(r.dash.lastCorrectAt) } : null,
  };
}

export const loadSavedGame = (): Restored | null => parseSavedGame(readJson(KEYS.game));
export const storeGame = (r: Restored): void => writeJson(KEYS.game, toSavedGame(r));
export const clearSavedGame = (): void => removeKey(KEYS.game);
