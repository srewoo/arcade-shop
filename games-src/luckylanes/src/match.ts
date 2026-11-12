// Turn management for a whole match: players, rolls, rack carry-over, spare challenge.
import { currentFrame, ballInFrame, freshRackNext, isGameComplete, isValidRoll, totalScore } from './scoring';
import { SPARE_LEAVES, countStanding, fullRack, maskFromNumbers, type PinMask } from './pins';
import { createRng } from './rng';
import type { CpuLevel } from './tuning';
import type { HighScoreKey, Mode } from './settings';

export interface PlayerInfo {
  readonly name: string;
  readonly cpu: boolean;
}

export interface MatchConfig {
  readonly mode: Mode;
  readonly players: number;
  readonly cpuLevel: CpuLevel;
  readonly seed?: number;
}

export interface Match {
  readonly mode: Mode;
  readonly cpuLevel: CpuLevel;
  readonly players: readonly PlayerInfo[];
  /** Per-player flat roll lists (bowling) or pins knocked per leave (spare). */
  readonly rolls: readonly (readonly number[])[];
  readonly current: number;
  /** Pins standing before the next roll. */
  readonly mask: PinMask;
  /** Spare challenge only: the ten leaves, as pin numbers. */
  readonly leaves: readonly (readonly number[])[];
  readonly over: boolean;
}

export const SPARE_ROUNDS = 10;
export const SPARE_CLEAR_BONUS = 5;

const CPU_NAME: Record<CpuLevel, string> = { casual: 'CPU Casual', easy: 'CPU Easy', pro: 'CPU Pro' };

function makePlayers(cfg: MatchConfig): PlayerInfo[] {
  if (cfg.mode === 'cpu') return [{ name: 'You', cpu: false }, { name: CPU_NAME[cfg.cpuLevel], cpu: true }];
  if (cfg.mode === 'hotseat') return Array.from({ length: cfg.players }, (_, i) => ({ name: `Player ${i + 1}`, cpu: false }));
  return [{ name: 'You', cpu: false }];
}

/** Ten distinct leaves in a seeded order. */
export function pickLeaves(seed: number): number[][] {
  const rng = createRng(seed);
  const pool = SPARE_LEAVES.map((l) => [...l]);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as number[], pool[i] as number[]];
  }
  return pool.slice(0, SPARE_ROUNDS);
}

export function createMatch(cfg: MatchConfig): Match {
  const players = makePlayers(cfg);
  const leaves = cfg.mode === 'spare' ? pickLeaves(cfg.seed ?? Date.now()) : [];
  return {
    mode: cfg.mode, cpuLevel: cfg.cpuLevel, players, rolls: players.map(() => []), current: 0,
    mask: leaves[0] ? maskFromNumbers(leaves[0]) : fullRack(), leaves, over: false,
  };
}

export const isSpare = (m: Match): boolean => m.mode === 'spare';

/** Points for one spare-challenge leave. */
export const sparePoints = (knocked: number, leaveSize: number): number => knocked + (knocked === leaveSize ? SPARE_CLEAR_BONUS : 0);

export function matchScore(m: Match, player: number): number {
  const rolls = m.rolls[player] ?? [];
  if (!isSpare(m)) return totalScore(rolls);
  return rolls.reduce((sum, knocked, i) => sum + sparePoints(knocked, (m.leaves[i] ?? []).length), 0);
}

/** Record the pins left standing after a roll and advance the turn. */
export function recordRoll(m: Match, after: PinMask): Match {
  const before = countStanding(m.mask);
  const knocked = before - countStanding(after);
  const cur = m.rolls[m.current] ?? [];
  if (knocked < 0 || (!isSpare(m) && !isValidRoll(cur, knocked))) throw new Error(`invalid roll: ${knocked} pins`);
  const rolls = m.rolls.map((r, i) => (i === m.current ? [...r, knocked] : r));
  return isSpare(m) ? advanceSpare({ ...m, rolls }) : advanceBowling({ ...m, rolls }, after);
}

function advanceSpare(m: Match): Match {
  const n = m.rolls[0]?.length ?? 0;
  const leave = m.leaves[n];
  return leave ? { ...m, mask: maskFromNumbers(leave) } : { ...m, over: true };
}

function advanceBowling(m: Match, after: PinMask): Match {
  const mine = m.rolls[m.current] as number[];
  const stay = !isGameComplete(mine) && ballInFrame(mine) > 1;
  let next = m.current;
  if (!stay) {
    for (let k = 1; k <= m.players.length; k++) {
      const cand = (m.current + k) % m.players.length;
      if (!isGameComplete(m.rolls[cand] as number[])) {
        next = cand;
        break;
      }
    }
  }
  const over = m.rolls.every((r) => isGameComplete(r));
  const mask = freshRackNext(m.rolls[next] as number[]) ? fullRack() : after;
  return { ...m, current: next, mask, over };
}

export interface MatchStatus {
  readonly player: number;
  /** 1-based frame / round, capped at 10. */
  readonly frame: number;
  readonly ball: number;
}

export function status(m: Match): MatchStatus {
  const rolls = m.rolls[m.current] ?? [];
  if (isSpare(m)) return { player: 0, frame: Math.min(10, rolls.length + 1), ball: 1 };
  return { player: m.current, frame: Math.min(10, currentFrame(rolls) + 1), ball: Math.max(1, ballInFrame(rolls)) };
}

const CPU_KEY: Record<CpuLevel, HighScoreKey> = { casual: 'cpuCasual', easy: 'cpuEasy', pro: 'cpuPro' };

export function highScoreKey(m: Match): HighScoreKey {
  if (m.mode === 'cpu') return CPU_KEY[m.cpuLevel];
  return m.mode;
}

/** Scores that go to the high-score table: every human player. */
export function humanScores(m: Match): number[] {
  return m.players.flatMap((p, i) => (p.cpu ? [] : [matchScore(m, i)]));
}

export function winners(m: Match): number[] {
  const scores = m.players.map((_, i) => matchScore(m, i));
  const best = Math.max(...scores);
  return scores.flatMap((s, i) => (s === best ? [i] : []));
}
