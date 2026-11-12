import type { DifficultyId, EnemyKind, ModeId, PickupKind } from './config';
import type { Rng } from './rng';
import type { Spawn } from './waves';

/** Previous-step position (px, py) is kept on everything drawn so the renderer can interpolate. */
export interface Body {
  x: number;
  y: number;
  px: number;
  py: number;
}

export type PathId = 'straight' | 'sine' | 'sweep' | 'hold';

export interface Enemy extends Body {
  id: number;
  kind: EnemyKind | 'boss';
  hp: number;
  maxHp: number;
  r: number;
  t: number;
  x0: number;
  y0: number;
  path: PathId;
  dir: 1 | -1;
  cd: number;
  flash: number;
  /** Boss only: true once it has finished entering and can be hurt. */
  armed: boolean;
}

export interface Bullet extends Body {
  vx: number;
  vy: number;
  r: number;
}

export interface Pickup extends Body {
  kind: PickupKind;
  t: number;
}

export interface Player extends Body {
  lives: number;
  shield: number;
  spread: number;
  spreadLevel: number;
  bombs: number;
  invuln: number;
  fireCd: number;
}

export type SimEvent =
  | { type: 'shot' }
  | { type: 'hit'; x: number; y: number }
  | { type: 'hurt'; x: number; y: number }
  | { type: 'kill'; x: number; y: number; big: boolean; points: number }
  | { type: 'pickup'; kind: PickupKind; x: number; y: number }
  | { type: 'bomb'; x: number; y: number }
  | { type: 'shieldBreak'; x: number; y: number }
  | { type: 'multUp'; mult: number }
  | { type: 'wave'; index: number; boss: boolean }
  | { type: 'waveClear'; index: number; bonus: number }
  | { type: 'down' }
  | { type: 'win' };

export type RunPhase = 'playing' | 'down' | 'won';

export interface WaveRun {
  index: number;
  clock: number;
  queue: Spawn[];
  boss: boolean;
  /** Seconds left of the "WAVE n" banner; spawning starts when it ends. */
  banner: number;
  /** Seconds the field has been clear (all spawned, none alive). */
  clearFor: number;
}

/** Run statistics for the results screen. They never feed back into the simulation. */
export interface RunStats {
  fired: number;
  hit: number;
  bestMult: number;
}

export interface GameState {
  seed: number;
  rng: Rng;
  mode: ModeId;
  difficulty: DifficultyId;
  phase: RunPhase;
  time: number;
  score: number;
  mult: number;
  chain: number;
  chainTimer: number;
  kills: number;
  bossesDown: number;
  stats: RunStats;
  continuesLeft: number;
  continuesUsed: number;
  bombFlash: number;
  nextId: number;
  wave: WaveRun;
  player: Player;
  enemies: Enemy[];
  pBullets: Bullet[];
  eBullets: Bullet[];
  pickups: Pickup[];
  events: SimEvent[];
}

export interface Input {
  moveX: number;
  moveY: number;
  /** Absolute drag target in world units (touch/mouse); null when not dragging. */
  target: { x: number; y: number } | null;
  fire: boolean;
  bomb: boolean;
}

export const NO_INPUT: Readonly<Input> = Object.freeze({ moveX: 0, moveY: 0, target: null, fire: false, bomb: false });
