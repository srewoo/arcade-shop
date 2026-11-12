// Events the simulation emits for the audio, effects and HUD layers.
import type { ClayKind, Side } from './clay';
import type { ThrowKind } from './throws';

export type RoundOutcome = 'complete' | 'timeout';

export type SimEvent =
  | { readonly type: 'pull' }
  | { readonly type: 'launch'; readonly id: number; readonly kind: ClayKind; readonly side: Side; readonly throwKind: ThrowKind; readonly wind: number }
  | { readonly type: 'shot'; readonly x: number; readonly y: number; readonly shells: number }
  | { readonly type: 'dry' }
  | { readonly type: 'reload' }
  | { readonly type: 'loaded' }
  | { readonly type: 'break'; readonly id: number; readonly x: number; readonly y: number; readonly kind: ClayKind; readonly points: number; readonly mult: number; readonly streak: number }
  | { readonly type: 'miss'; readonly id: number; readonly x: number; readonly y: number }
  | { readonly type: 'double'; readonly points: number; readonly x: number; readonly y: number }
  | { readonly type: 'lowtime'; readonly seconds: number }
  | { readonly type: 'end'; readonly outcome: RoundOutcome };

export interface RoundResult {
  readonly outcome: RoundOutcome;
  readonly hits: number;
  readonly total: number;
  readonly score: number;
  readonly timeBonus: number;
  readonly perfectBonus: number;
  readonly finalScore: number;
  readonly passed: boolean;
  readonly shotsFired: number;
  readonly doubles: number;
  readonly bestStreak: number;
  readonly secondsLeft: number;
}
