// Getting a puzzle onto the screen: pool and Daily cache first, else a cancellable worker job
// with a visible "Building" state.
import { dailySeed, dateKey } from '../core/rng';
import type { Difficulty } from '../core/grader';
import { randomSeed, requestPuzzle, takeDailyCached, takePooled, type MadePuzzle } from '../generation';
import { $ } from '../ui/dom';

export class Starter {
  private cancelJob: (() => void) | null = null;

  private setBusy(text: string, cancellable: boolean): void {
    const status = $('gen-status');
    status.textContent = text;
    if (cancellable) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn small';
      btn.textContent = 'Cancel';
      btn.addEventListener('click', () => this.cancelJob?.());
      status.append(' ', btn);
    }
    $('gen-bar').hidden = text === '';
    for (const id of ['btn-play', 'btn-daily', 'btn-custom', 'btn-continue']) $<HTMLButtonElement>(id).disabled = text !== '';
  }

  /** Resolves to null when the player cancels. */
  async acquire(difficulty: Difficulty, daily: boolean): Promise<MadePuzzle | null> {
    const ready = daily ? takeDailyCached(dateKey(), difficulty) : takePooled(difficulty);
    if (ready) return ready;
    const seed = daily ? dailySeed(dateKey(), difficulty) : randomSeed();
    const job = requestPuzzle(difficulty, seed);
    this.cancelJob = job.cancel;
    const slow = difficulty === 'hard' ? ' (X-wing puzzles are rare, this can take a few seconds)' : '';
    this.setBusy(`Building a ${difficulty} puzzle${slow}...`, true);
    try {
      return await job.promise;
    } catch {
      return null;
    } finally {
      this.cancelJob = null;
      this.setBusy('', false);
    }
  }

  setNote(text: string): void {
    $('gen-status').textContent = text;
  }
}
