// Main-thread side of puzzle generation: a worker for requests, a second worker that
// pre-builds slow (Hard) puzzles in the background, and a main-thread fallback.
import { z } from 'zod';
import { generatePuzzle, gradeLevel } from './core/generator';
import { parseGrid, isValidSolution } from './core/grid';
import { countSolutions } from './core/counter';
import type { Difficulty } from './core/grader';
import { dailySeed, dateKey } from './core/rng';
import { POOL } from './config/timing';
import { KEYS, readJson, writeJson } from './storage';

export interface MadePuzzle {
  readonly puzzle: number[];
  readonly solution: number[];
  readonly difficulty: Difficulty;
  readonly clues: number;
}

const ReplySchema = z.object({
  id: z.number().int(),
  puzzle: z.string().regex(/^[0-9.]{81}$/),
  solution: z.string().regex(/^[0-9.]{81}$/),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  clues: z.number().int(),
});

function toPuzzle(r: z.infer<typeof ReplySchema>): MadePuzzle | null {
  const puzzle = parseGrid(r.puzzle);
  const solution = parseGrid(r.solution);
  return puzzle && solution ? { puzzle, solution, difficulty: r.difficulty, clues: r.clues } : null;
}

class Job {
  private nextId = 1;

  /** Returns a promise plus a cancel function. */
  run(difficulty: Difficulty, seed: number): { promise: Promise<MadePuzzle>; cancel: () => void } {
    const id = this.nextId++;
    let cancel = (): void => undefined;
    const promise = new Promise<MadePuzzle>((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL('./worker/gen.worker.ts', import.meta.url), { type: 'module' });
      } catch {
        setTimeout(() => resolve(fallback(difficulty, seed)), 0);
        return;
      }
      cancel = () => {
        worker.terminate();
        reject(new Error('cancelled'));
      };
      worker.onmessage = (e: MessageEvent<unknown>) => {
        const parsed = ReplySchema.safeParse(e.data);
        worker.terminate();
        const made = parsed.success && parsed.data.id === id ? toPuzzle(parsed.data) : null;
        if (made) resolve(made);
        else reject(new Error('bad worker reply'));
      };
      worker.onerror = () => {
        worker.terminate();
        resolve(fallback(difficulty, seed));
      };
      worker.postMessage({ id, difficulty, seed });
    });
    return { promise, cancel };
  }
}

function fallback(difficulty: Difficulty, seed: number): MadePuzzle {
  const g = generatePuzzle(difficulty, seed);
  return { puzzle: g.puzzle, solution: g.solution, difficulty: g.difficulty, clues: g.clues };
}

export const randomSeed = (): number => Math.floor(Math.random() * 0x100000000) >>> 0;

export function requestPuzzle(difficulty: Difficulty, seed: number): { promise: Promise<MadePuzzle>; cancel: () => void } {
  return new Job().run(difficulty, seed);
}

// ---- background pool for Hard puzzles (they take a second or two on average) ----------

const Stored = z.object({ puzzle: z.string().regex(/^[0-9.]{81}$/), solution: z.string().regex(/^[0-9.]{81}$/) }).strict();
const PoolSchema = z.array(Stored).max(POOL.max);
const POOL_TARGET = POOL.target;
const POOL_DIFFICULTY: Difficulty = 'hard';
let pool: MadePuzzle[] = [];
let filling = false;

function verify(r: { puzzle: string; solution: string }): MadePuzzle | null {
  const puzzle = parseGrid(r.puzzle);
  const solution = parseGrid(r.solution);
  if (!puzzle || !solution || !isValidSolution(solution)) return null;
  if (puzzle.some((p, i) => p !== 0 && p !== solution[i])) return null;
  if (countSolutions(puzzle, 2) !== 1 || gradeLevel(puzzle) !== POOL_DIFFICULTY) return null;
  return { puzzle, solution, difficulty: POOL_DIFFICULTY, clues: puzzle.filter(Boolean).length };
}

function savePool(): void {
  writeJson(KEYS.pool, pool.map((p) => ({ puzzle: p.puzzle.map((d) => d || '.').join(''), solution: p.solution.join('') })));
}

export function loadPool(): void {
  const parsed = PoolSchema.safeParse(readJson(KEYS.pool));
  pool = parsed.success ? parsed.data.map(verify).filter((p): p is MadePuzzle => p !== null) : [];
}

/** A ready Hard puzzle from the pool, if any. Triggers a refill. */
export function takePooled(difficulty: Difficulty): MadePuzzle | null {
  if (difficulty !== POOL_DIFFICULTY) return null;
  const made = pool.shift() ?? null;
  savePool();
  fillPool();
  return made;
}

export function fillPool(): void {
  if (filling || pool.length >= POOL_TARGET) return;
  filling = true;
  let failed = false;
  const { promise } = new Job().run(POOL_DIFFICULTY, randomSeed());
  promise
    .then((made) => {
      if (made.difficulty === POOL_DIFFICULTY) pool.push(made);
      savePool();
    })
    .catch(() => {
      failed = true;
    })
    .finally(() => {
      filling = false;
      if (failed) return;
      if (pool.length < POOL_TARGET) fillPool();
      else prebuildDaily();
    });
}

// ---- Daily Hard puzzles: built ahead of time (today's and tomorrow's) -----------------------

const DailyCacheSchema = z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), Stored);
let dailyCache: Record<string, { puzzle: string; solution: string }> = {};
let dailyBuilding = false;

export function loadDailyCache(): void {
  const parsed = DailyCacheSchema.safeParse(readJson(KEYS.dailyCache));
  dailyCache = parsed.success ? parsed.data : {};
}

/** A prebuilt Daily Hard puzzle for `date`, re-verified on read (so a tampered cache is ignored). */
export function takeDailyCached(date: string, difficulty: Difficulty): MadePuzzle | null {
  if (difficulty !== POOL_DIFFICULTY) return null;
  const hit = dailyCache[date];
  return hit ? verify(hit) : null;
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateKey(d);
}

/** Builds the Daily Hard puzzle for today, then tomorrow, in the background (one at a time). */
export function prebuildDaily(): void {
  if (dailyBuilding) return;
  const next = [dateKey(), tomorrowKey()].find((d) => dailyCache[d] === undefined);
  if (!next) return;
  dailyBuilding = true;
  const { promise } = new Job().run(POOL_DIFFICULTY, dailySeed(next, POOL_DIFFICULTY));
  promise
    .then((made) => {
      if (made.difficulty !== POOL_DIFFICULTY) return;
      dailyCache[next] = { puzzle: made.puzzle.map((d) => d || '.').join(''), solution: made.solution.join('') };
      const keep = Object.keys(dailyCache).sort().slice(-3);
      dailyCache = Object.fromEntries(keep.map((k) => [k, dailyCache[k] as { puzzle: string; solution: string }]));
      writeJson(KEYS.dailyCache, dailyCache);
    })
    .catch(() => undefined)
    .finally(() => {
      dailyBuilding = false;
    });
}
