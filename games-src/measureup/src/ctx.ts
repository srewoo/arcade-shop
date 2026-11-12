// Shared mutable app context (one object, owned by main.ts).
import type { GameState } from './game';
import type { Progress } from './progress';
import type { Settings } from './settings';
import type { Stopwatch } from './timer';

export type ScreenName = 'title' | 'levels' | 'play';

export interface QuickInfo {
  readonly seed: number;
  readonly tier: string;
}

export interface Ctx {
  settings: Settings;
  progress: Progress;
  game: GameState | null;
  /** Jug currently picked as the source of a pour, fill or empty. */
  picked: number | null;
  screen: ScreenName;
  /** Set while playing a quick puzzle (not saved to campaign progress). */
  quick: QuickInfo | null;
  reducedSystem: boolean;
  readonly clock: Stopwatch;
}
