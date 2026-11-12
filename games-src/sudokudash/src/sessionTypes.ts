// Shared types for the play session and its UI events.
import type { Sfx } from './config/audio';
import type { Difficulty } from './core/grader';
import type { Mode } from './storage';

export type Status = 'playing' | 'paused' | 'won' | 'lost';
export type LossReason = 'time' | 'mistakes';
/** Why a session is paused: drives the cover text and which cues play. */
export type PauseReason = 'manual' | 'menu' | 'hidden' | 'blur' | 'ready' | 'settings';

export type SessionEvent =
  | { readonly type: 'sfx'; readonly name: Sfx }
  | { readonly type: 'popup'; readonly cell: number; readonly text: string; readonly good: boolean }
  | { readonly type: 'clock'; readonly text: string; readonly good: boolean }
  | { readonly type: 'mistake'; readonly cell: number }
  | { readonly type: 'house'; readonly cells: readonly number[] }
  | { readonly type: 'announce'; readonly text: string }
  | { readonly type: 'change' }
  | { readonly type: 'tick' }
  | { readonly type: 'end' };

export interface NewGameInit {
  readonly puzzle: readonly number[];
  readonly solution: readonly number[];
  readonly mode: Mode;
  readonly difficulty: Difficulty;
  readonly daily: string | null;
  readonly custom: boolean;
  readonly mistakeLimit: boolean;
}
