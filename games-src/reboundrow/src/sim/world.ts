// World state for one run. DOM-free; advanced only by stepWorld.
import { CONFIG } from '../config';
import type { Cell, PowerKind } from '../levels/format';
import { createRng, type Rng } from '../rng';

export interface Brick { hp: number; maxHp: number; steel: boolean; power: PowerKind | null }
export interface Ball { x: number; y: number; px: number; py: number; vx: number; vy: number; stuck: boolean }
export interface Capsule { x: number; y: number; px: number; py: number; kind: PowerKind }
export interface Bolt { x: number; y: number; py: number }
export type Phase = 'ready' | 'playing' | 'clear' | 'over';
export type EventType =
  | 'wall' | 'paddle' | 'steel' | 'hit' | 'break' | 'catch' | 'laser'
  | 'launch' | 'lost' | 'clear' | 'over' | 'life' | 'multi';
export interface GameEvent { type: EventType; x: number; y: number; kind?: PowerKind; points?: number; combo?: number }
export interface Effects { wide: number; slow: number; laser: number }

export interface Field { w: number; h: number }

export interface World {
  /** Logical playfield, chosen by the layout while the ball is on the paddle. */
  field: Field;
  /** Left offset that centres the 600-wide brick grid when the field is wider. */
  ox: number;
  paddleY: number;
  rows: number;
  bricks: (Brick | null)[];
  remaining: number;
  paddle: { x: number; px: number; w: number };
  balls: Ball[];
  capsules: Capsule[];
  bolts: Bolt[];
  effects: Effects;
  phase: Phase;
  lives: number;
  score: number;
  combo: number;
  nextLife: number;
  level: number;
  speed: number;
  time: number;
  laserCd: number;
  rng: Rng;
  events: GameEvent[];
}

export const levelSpeed = (level: number, perLevel: number = CONFIG.ball.perLevel): number =>
  Math.min(CONFIG.ball.maxSpeed, CONFIG.ball.baseSpeed + (level - 1) * perLevel);

export const ballSpeed = (w: World): number => w.speed * (w.effects.slow > 0 ? CONFIG.ball.slowMul : 1);

export function emit(w: World, ev: GameEvent): void {
  w.events.push(ev);
}

export function createWorld(seed: number): World {
  const w: World = {
    field: { w: CONFIG.field.w, h: CONFIG.field.h },
    ox: 0,
    paddleY: CONFIG.paddle.y,
    rows: 0,
    bricks: [],
    remaining: 0,
    paddle: { x: CONFIG.field.w / 2, px: CONFIG.field.w / 2, w: CONFIG.paddle.w },
    balls: [],
    capsules: [],
    bolts: [],
    effects: { wide: 0, slow: 0, laser: 0 },
    phase: 'ready',
    lives: CONFIG.lives.start,
    score: 0,
    combo: 0,
    nextLife: CONFIG.lives.extraEvery,
    level: 1,
    speed: levelSpeed(1),
    time: 0,
    laserCd: 0,
    rng: createRng(seed),
    events: [],
  };
  resetServe(w);
  return w;
}

/** Fill the grid from parsed cells and put the ball back on the paddle. Score and lives carry over. */
export function loadLevel(w: World, cells: readonly (readonly Cell[])[], level: number, speed = levelSpeed(level)): void {
  w.bricks = new Array<Brick | null>(CONFIG.field.cols * CONFIG.field.maxRows).fill(null);
  w.remaining = 0;
  cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === null) return;
      const steel = cell.kind === 'steel';
      const hp = cell.kind === 'brick' ? cell.hp : 1;
      w.bricks[r * CONFIG.field.cols + c] = { hp, maxHp: hp, steel, power: cell.kind === 'brick' ? cell.power : null };
      if (!steel) w.remaining++;
    }),
  );
  w.rows = cells.length;
  w.level = level;
  w.speed = speed;
  w.combo = 0;
  resetServe(w);
}

/** Resize the logical field. Only meaningful while the ball is on the paddle (phase 'ready'). */
export function setField(w: World, f: Field): void {
  w.field = { w: f.w, h: f.h };
  w.ox = Math.round((f.w - CONFIG.field.cols * CONFIG.field.brickW) / 2);
  w.paddleY = f.h - CONFIG.field.paddleBottom;
  resetServe(w);
}

/** Ball on the paddle, power-ups cleared. */
export function resetServe(w: World): void {
  w.capsules = [];
  w.bolts = [];
  w.effects = { wide: 0, slow: 0, laser: 0 };
  w.paddle.w = CONFIG.paddle.w;
  w.paddle.x = w.paddle.px = w.field.w / 2;
  const y = w.paddleY - CONFIG.ball.r;
  w.balls = [{ x: w.paddle.x, y, px: w.paddle.x, py: y, vx: 0, vy: 0, stuck: true }];
  w.phase = 'ready';
}

export const brickRect = (idx: number, ox = 0): { left: number; top: number; right: number; bottom: number } => {
  const { cols, brickW, brickH, top } = CONFIG.field;
  const c = idx % cols;
  const r = Math.floor(idx / cols);
  return { left: ox + c * brickW, top: top + r * brickH, right: ox + (c + 1) * brickW, bottom: top + (r + 1) * brickH };
};

/** Add points; awards extra lives at each threshold. */
export function addScore(w: World, points: number): void {
  w.score += points;
  while (w.score >= w.nextLife) {
    w.nextLife += CONFIG.lives.extraEvery;
    if (w.lives < CONFIG.lives.max) {
      w.lives++;
      emit(w, { type: 'life', x: w.field.w / 2, y: w.paddleY });
    }
  }
}


export function spawnCapsule(w: World, x: number, y: number, kind: PowerKind): void {
  w.capsules.push({ x, y, px: x, py: y, kind });
}
