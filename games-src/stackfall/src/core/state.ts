// Game state shape, config and event types (no DOM).
import { lockTuning, TUNINGS, type Tuning, type TuningId } from '../config/tuning';
import { Bag } from './bag';
import { createBoard, fillGarbage, type Board, type Piece } from './board';
import { createDas, msToFrames, type DasState } from './das';
import { levelFor, MODES, type ModeId, type ModeRules } from './modes';
import { Rng } from './rng';
import type { ShapeId } from './shapes';
import type { TwistKind } from './twist';

export interface GameConfig {
  seed: number;
  mode: ModeId;
  startLevel: number;
  dasFrames: number;
  arrFrames: number;
  zenGarbage: boolean;
  tuning: TuningId;
  lockDelay: number;
  moveResetLimit: number;
}

export const defaultConfig = (over: Partial<GameConfig> = {}): GameConfig => ({
  seed: 1,
  mode: 'marathon',
  startLevel: 1,
  dasFrames: msToFrames(167),
  arrFrames: msToFrames(33),
  zenGarbage: false,
  tuning: 'classic',
  lockDelay: lockTuning.lockDelay,
  moveResetLimit: lockTuning.moveResetLimit,
  ...over,
});

export interface TickInput {
  left: boolean;
  right: boolean;
  down: boolean;
  rotCW: boolean;
  rotCCW: boolean;
  hard: boolean;
  stash: boolean;
}
export const NO_INPUT: Readonly<TickInput> = Object.freeze({
  left: false, right: false, down: false, rotCW: false, rotCCW: false, hard: false, stash: false,
});

export type GameEvent =
  | { type: 'move' | 'rotate' | 'land' | 'garbage' | 'wipe' | 'softDrop' }
  | { type: 'stash'; id: ShapeId }
  | { type: 'levelUp'; level: number }
  | { type: 'deny'; what: 'move' | 'rotate' | 'stash' }
  | { type: 'hardDrop'; rows: number }
  | { type: 'lock'; piece: Piece }
  | { type: 'clear'; rows: number[]; colors: number[][]; lines: number; twist: TwistKind; label: string; points: number; combo: number; b2b: boolean; allClear: boolean }
  | { type: 'end'; status: 'won' | 'over' | 'time' };

export type Status = 'playing' | 'won' | 'over' | 'time';

export interface GameState {
  cfg: GameConfig;
  rules: ModeRules;
  board: Board;
  bag: Bag;
  rng: Rng; // garbage / zen randomness, separate from the bag stream
  piece: Piece | null;
  stash: ShapeId | null;
  canStash: boolean;
  score: number;
  lines: number;
  level: number;
  ticks: number;
  combo: number;
  b2b: boolean;
  status: Status;
  endSent: boolean; // an `end` event has been emitted
  gravAcc: number;
  lockTimer: number;
  moveResets: number;
  lowestY: number;
  lastRotate: boolean;
  das: DasState;
  garbageTimer: number;
  piecesPlaced: number;
  garbageLeft: number;
  events: GameEvent[];
}

export function createState(cfg: GameConfig): GameState {
  const rules = MODES[cfg.mode];
  const rng = new Rng((cfg.seed ^ 0x9e3779b9) >>> 0);
  const board = createBoard();
  if (rules.digRows > 0) fillGarbage(board, rules.digRows, rng);
  return {
    cfg, rules, board, rng,
    bag: new Bag(new Rng(cfg.seed)),
    piece: null, stash: null, canStash: true,
    score: 0, lines: 0, level: levelFor(rules, cfg.startLevel, 0, TUNINGS[cfg.tuning]),
    ticks: 0, combo: -1, b2b: false, status: 'playing', endSent: false,
    gravAcc: 0, lockTimer: 0, moveResets: 0, lowestY: 0, lastRotate: false,
    das: createDas(), garbageTimer: 0, piecesPlaced: 0,
    garbageLeft: rules.digRows * 9, events: [],
  };
}

export const tuningOf = (cfg: GameConfig): Tuning => TUNINGS[cfg.tuning];
