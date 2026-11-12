import type { Box } from '../geom';

export type ObstacleKind = 'car' | 'kerb' | 'wall' | 'cone' | 'pillar' | 'caravan';
export type LevelKind = 'pull-in' | 'reverse' | 'parallel' | 'angled' | 'garage' | 'trailer';
/** Which body must sit inside the bay for the park to count. */
export type Goal = 'car' | 'trailer' | 'both';

export interface Obstacle {
  readonly box: Box;
  readonly kind: ObstacleKind;
  /** Palette index for cars and caravans. */
  readonly tint: number;
}

export interface Start {
  /** Rear-axle position and heading. */
  readonly x: number;
  readonly y: number;
  readonly a: number;
}

export interface Level {
  readonly id: number;
  readonly name: string;
  readonly kind: LevelKind;
  readonly world: { readonly w: number; readonly h: number };
  readonly start: Start;
  readonly bay: Box;
  readonly goal: Goal;
  readonly trailer: boolean;
  readonly obstacles: readonly Obstacle[];
  /** Painted empty bays and road markings (drawing only). */
  readonly paint: readonly Box[];
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
}
