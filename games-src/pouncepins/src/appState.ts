// Shared mutable app state (one object, passed to the flow/input/loop modules).
import type { Match } from './match';
import type { Scores } from './scores';
import type { Settings } from './settings';
import type { Fx } from './render/fx';
import type { View } from './render/render';
import type { Els } from './ui/dom';

export type Screen = 'title' | 'play' | 'over';

export interface App {
  readonly els: Els;
  readonly view: View;
  readonly fx: Fx;
  settings: Settings;
  scores: Scores;
  match: Match | null;
  screen: Screen;
  /** Lane clock (seconds), advances only while the sim runs. */
  time: number;
  systemReduced: boolean;
  /** Hits that already made a sound this ball (keeps pile-ups from clipping). */
  hitSounds: number;
  /** Overrides the random seed (debug / tests). */
  fixedSeed: number | null;
}

export const isReduced = (a: App): boolean =>
  a.settings.reduceMotion === 'on' || (a.settings.reduceMotion === 'system' && a.systemReduced);
