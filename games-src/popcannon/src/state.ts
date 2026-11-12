// Game state, board loading and shooter-queue handling. No DOM.
import { TUNING } from './config';
import { Effects, newEffects } from './effects';
import { Bubble, Grid, createGrid, rowLen } from './hex';
import { PUZZLES, parseLevel } from './levels';
import {
  Difficulty, RUSH_DIFFICULTY, Rng, arcadeDifficulty, colorsOnBoard, makeRowFiller, mulberry32, shooterBubble,
} from './rules';

/** `daily` is arcade with a date seed. */
export type Mode = 'arcade' | 'puzzle' | 'rush' | 'daily';
export type Status = 'playing' | 'cleared' | 'won' | 'lost' | 'finished';
export type EventType =
  | 'fire' | 'swap' | 'stick' | 'pop' | 'bomb' | 'fall' | 'ceiling' | 'levelup' | 'win' | 'lose' | 'finish'
  | 'warn' | 'danger' | 'tick' | 'ui' | 'start' | 'pause' | 'resume' | 'best' | 'star' | 'locked';
export interface GameEvent { type: EventType; n: number; combo?: number }

export const RUSH_SECONDS = TUNING.rush.seconds;

/** x/y: collision position (fixed substeps). rx/ry: smooth render position, px/py: render position one tick ago. */
export interface Ball { x: number; y: number; vx: number; vy: number; rx: number; ry: number; px: number; py: number }

export interface Game {
  mode: Mode;
  level: number;
  puzzleIndex: number;
  grid: Grid;
  diff: Difficulty;
  queue: Bubble[];
  queuePos: number;
  cur: Bubble | null;
  next: Bubble | null;
  ball: Ball | null;
  /** Distance (px) the ball may still travel, consumed in fixed substeps. */
  ballAcc: number;
  flying: Bubble | null;
  angle: number;
  /** Shots since the last pop (a "miss budget"); a pop resets it. */
  sinceDrop: number;
  shots: number;
  /** Shots that popped something (for accuracy). */
  hits: number;
  limit: number;
  par: number;
  score: number;
  combo: number;
  bestCombo: number;
  timeLeft: number;
  status: Status;
  clearTimer: number;
  stars: number;
  fx: Effects;
  shake: number;
  dropAnim: number;
  prevDropAnim: number;
  recoil: number;
  flash: number;
  /** Seconds left in which a fire press is remembered while the ball flies. */
  fireBuffer: number;
  /** Bumped whenever the board changes; render caches key off it. */
  version: number;
  /** Row that crossed the danger line on a loss, else -1. */
  loseRow: number;
  /** True while a bubble sits within two rows of the danger line (edge-triggers the warning sound). */
  dangerNear: boolean;
  /** Last whole second announced by the Rush tick. */
  tickSecond: number;
  events: GameEvent[];
  rng: Rng;
  reduced: boolean;
}

export interface NewGameOptions { level?: number; puzzleIndex?: number; seed?: number; reduced?: boolean }

export function emit(g: Game, type: EventType, n = 0): void {
  g.events.push({ type, n, combo: g.combo });
}

/** Next shooter bubble: from the puzzle queue, or random from what is on the board. */
export function drawNext(g: Game): Bubble | null {
  if (g.mode === 'puzzle') return g.queue[g.queuePos++] ?? null;
  const on = colorsOnBoard(g.grid);
  const palette = on.length ? on : [0];
  return shooterBubble(g.rng, palette, g.diff.specials);
}

/** (Re)build the board for the current mode and level. */
export function loadBoard(g: Game): void {
  g.ball = null;
  g.flying = null;
  g.ballAcc = 0;
  g.sinceDrop = 0;
  g.fireBuffer = 0;
  g.loseRow = -1;
  g.dangerNear = false;
  g.version++;
  g.fx = newEffects();
  if (g.mode === 'puzzle') {
    const lv = parseLevel(PUZZLES[g.puzzleIndex] ?? (PUZZLES[0] as (typeof PUZZLES)[number]));
    g.grid = lv.grid;
    g.queue = lv.queue;
    g.queuePos = 0;
    g.limit = lv.limit;
    g.par = lv.par;
    g.diff = { colors: lv.colors.length, rows: 0, dropEvery: 0, specials: true };
  } else {
    g.diff = g.mode === 'rush' ? RUSH_DIFFICULTY : arcadeDifficulty(g.level);
    g.grid = createGrid(0);
    const fill = makeRowFiller(g.rng, g.diff);
    for (let r = 0; r < g.diff.rows; r++) g.grid.rows.push(fill(rowLen(r, 0)));
  }
  g.cur = drawNext(g);
  g.next = drawNext(g);
}

export function newGame(mode: Mode, opts: NewGameOptions = {}): Game {
  const g: Game = {
    mode, level: opts.level ?? 1, puzzleIndex: opts.puzzleIndex ?? 0,
    grid: createGrid(0), diff: arcadeDifficulty(1), queue: [], queuePos: 0, cur: null, next: null,
    ball: null, ballAcc: 0, flying: null, angle: 0, sinceDrop: 0, shots: 0, hits: 0, limit: 0, par: 0, score: 0,
    combo: 0, bestCombo: 0, timeLeft: mode === 'rush' ? RUSH_SECONDS : 0, status: 'playing', clearTimer: 0, stars: 0,
    fx: newEffects(), shake: 0, dropAnim: 0, prevDropAnim: 0, recoil: 0, flash: 0, fireBuffer: 0, version: 0,
    loseRow: -1, dangerNear: false, tickSecond: -1, events: [], rng: mulberry32(opts.seed ?? Date.now()), reduced: opts.reduced ?? false,
  };
  if (mode === 'puzzle') g.level = g.puzzleIndex + 1;
  loadBoard(g);
  return g;
}

export const shotsLeft = (g: Game): number => (g.mode === 'puzzle' ? g.limit - g.shots : Infinity);
