// Shared shapes for the lane simulation (pure data, no DOM).
export type CatKind = 'plain' | 'lazy' | 'scaredy';
export type CatMode = 'stand' | 'wobble' | 'jump' | 'down';

export interface Cat {
  readonly id: number;
  readonly kind: CatKind;
  readonly coat: number;
  readonly homeX: number;
  readonly homeY: number;
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  mode: CatMode;
  /** Seconds in the current mode. */
  t: number;
  /** Struck by the ball or a flying cat (counts as a pin down). */
  hit: boolean;
  /** Removed from play (knocked down on an earlier ball of the frame). */
  gone: boolean;
  /** Dived into a cushion at the deck edge. */
  cushion: boolean;
  /** Stopped moving and landed on its feet. */
  settled: boolean;
  /** Value of `t` at the moment the cat landed (0 until then). */
  landT: number;
  /** A scaredy cat only jumps once per ball. */
  scared: boolean;
  /** Spin direction for the tumble animation (+1 / -1). */
  spin: number;
}

export interface Ball {
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  curve: number;
  active: boolean;
  gutter: boolean;
  launched: boolean;
}

export interface Fish { readonly x: number; readonly y: number; taken: boolean }

export type WorldEvent =
  | { readonly type: 'hit'; readonly id: number; readonly power: number }
  | { readonly type: 'wobble'; readonly id: number }
  | { readonly type: 'scare'; readonly id: number }
  | { readonly type: 'land'; readonly id: number }
  | { readonly type: 'cushion'; readonly id: number }
  | { readonly type: 'fish' }
  | { readonly type: 'gutter' };

export interface World {
  t: number;
  ball: Ball;
  cats: Cat[];
  fish: Fish | null;
  events: WorldEvent[];
  settled: boolean;
}

export interface FrameSetup {
  readonly kinds: readonly CatKind[];
  readonly coats: readonly number[];
  readonly fish: { readonly x: number; readonly y: number } | null;
}
