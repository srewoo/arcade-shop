// The one shared bag of mutable app state (screen, settings, current run). Kept tiny and explicit.
import { createFx, type Fx } from './fx';
import { loadScores, type ScoreBook } from './scores';
import { loadSettings, type Settings } from './settings';
import type { GameState } from './types';

export type Screen = 'title' | 'play' | 'pause' | 'continue' | 'end';

export interface AppState {
  settings: Settings;
  scores: ScoreBook;
  game: GameState | null;
  screen: Screen;
  fx: Fx;
  banner: { text: string; t: number } | null;
  /** Interpolation blend for the current frame. */
  alpha: number;
  /** Cosmetic wall-clock seconds (frozen while paused). */
  clock: number;
  god: boolean;
  hintTimer: number;
  /** Seconds left before the results card replaces the end-of-run explosion. */
  payoffT: number | undefined;
}

export const A: AppState = {
  settings: loadSettings(),
  scores: loadScores(),
  game: null,
  screen: 'title',
  fx: createFx(),
  banner: null,
  alpha: 1,
  clock: 0,
  god: false,
  hintTimer: 0,
  payoffT: undefined,
};
