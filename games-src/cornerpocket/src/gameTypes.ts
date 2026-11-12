// Shared types for the game controller and its mode controllers (DOM-free).
import type { Level } from './cpu';
import type { SfxName } from './sfxNames';
import type { ShotReport } from './sim';

export type Mode = 'rack' | 'trick' | 'cpu' | 'duo';
export type Phase = 'aim' | 'rolling' | 'place' | 'over';
export type Tone = 'good' | 'bad' | 'info';

export interface GameOptions {
  mode: Mode;
  level: Level;
  trick?: number; // trick index 0..14
  seed?: number;
}

export interface OverInfo {
  mode: Mode;
  won: boolean;
  title: string;
  detail: string;
  score?: number; // rack attack
  rack?: number; // rack attack
  trick?: number;
  stars?: number;
  newBest?: boolean; // rack attack: beat the stored best (set by the app, not the mode)
  best?: number; // rack attack: best score including this run
  par?: number; // trick shots
  shots?: number; // trick shots used
  pots?: number; // balls potted this run
  shotsTaken?: number; // shots taken this run
  bestCombo?: number; // rack attack
}

export type GameEvent =
  | { t: 'shot'; power: number }
  | { t: 'hit'; speed: number }
  | { t: 'cushion'; speed: number }
  | { t: 'pot'; id: number; x: number; y: number; cue: boolean }
  | { t: 'text'; text: string; tone: Tone }
  | { t: 'combo'; level: number }
  | { t: 'sfx'; name: SfxName; n?: number }
  | { t: 'over'; info: OverInfo };

export interface Hud {
  stats: { label: string; value: string }[];
  status: string;
}

/** Per-mode controller: owns the rules/state for one game mode. */
export interface ModeCtl {
  start(): void;
  tick(dt: number): void;
  onShotEnd(report: ShotReport): void;
  humanTurn(): boolean;
  hud(): Hud;
  /** Seconds left on a visible countdown (null when none or not started). */
  clock?(): number | null;
  /** The player took a shot (called before the balls move). */
  onShot?(): void;
  /** Ball ids the player may legally hit first (for the N key). */
  targets(): number[];
  /** Ball ids to ring on the table for the human (8-ball groups only). */
  highlight(): number[];
}
