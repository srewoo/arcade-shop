// Shared data shapes for the physics world (no DOM).

export interface Shot {
  /** Start position across the foul line, cm (0 = centre). */
  readonly x: number;
  /** Launch angle in radians, positive = toward +x (right). */
  readonly aim: number;
  /** 0..1 */
  readonly power: number;
  /** -1..1 hook, positive curves toward +x. */
  readonly spin: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  active: boolean;
  inGutter: boolean;
  /** Accumulated roll angle, for drawing. */
  roll: number;
}

export type PinState = 'standing' | 'falling' | 'down';

export interface Pin {
  readonly index: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: PinState;
  /** Accumulated hit strength; drives wobble and toppling. */
  stress: number;
  fallT: number;
  fallDx: number;
  fallDy: number;
}

export type SimEventKind = 'ballPin' | 'pinPin' | 'gutter' | 'pit' | 'pinFall';

export interface SimEvent {
  readonly kind: SimEventKind;
  readonly x: number;
  readonly y: number;
  /** Rough impact strength, 0 upward. */
  readonly strength: number;
}

export interface World {
  ball: Ball;
  pins: Pin[];
  time: number;
  done: boolean;
  events: SimEvent[];
  readonly startMask: readonly boolean[];
}
