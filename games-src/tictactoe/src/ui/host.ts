// What the input and panel modules need from the app (kept narrow on purpose).
import type { Controller } from '../controller';
import type { SettingKey, Settings } from '../settings';

export interface Host {
  readonly ctrl: Controller;
  settings(): Settings;
  /** Validate and apply one setting; may ask before abandoning a round. */
  changeSetting(key: SettingKey, raw: unknown): void;
  /** Settings change confirmed through the inline bar. */
  confirmPending(yes: boolean): void;
  /** New round, asking first when a round is in progress (button, N, pause menu). */
  requestNewRound(): void;
  /** New round, no questions (already confirmed). */
  startRound(advance: boolean): void;
  resetScores(): void;
  attempt(index: number): void;
  announce(text: string): void;
  render(): void;
}
