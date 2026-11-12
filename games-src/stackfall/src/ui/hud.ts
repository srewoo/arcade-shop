// HUD (DOM) plus the off-screen live status line.
import { MODES, TICKS_PER_SECOND } from '../core/modes';
import type { GameState } from '../core/state';
import { feel } from '../config/feel';
import { liveBest, ticksToMs } from '../records';
import type { Records } from '../settings';
import { S } from '../strings';
import { formatRecord } from './cards';
import { formatTime } from './dom';
import { secondsLeft } from './view';

const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

export class Hud {
  private cache = new Map<string, string>();
  private readonly live = $('sr-status');
  private queue: string[] = [];
  private flushTimer: number | null = null;

  private set(id: string, text: string): void {
    if (this.cache.get(id) === text) return;
    this.cache.set(id, text);
    $(id).textContent = text;
  }

  update(g: GameState | null, mode: keyof typeof MODES, records: Records): void {
    const rules = g ? g.rules : MODES[mode];
    const ms = g ? ticksToMs(g.ticks) : 0;
    const limit = rules.timeLimitTicks;
    const dig = rules.id === 'dig';
    this.set('hud-score', (g?.score ?? 0).toLocaleString());
    this.set('hud-lines', dig ? String(g?.garbageLeft ?? rules.digRows * 9) : rules.goalLines !== null ? `${g?.lines ?? 0}/${rules.goalLines}` : String(g?.lines ?? 0));
    this.set('hud-lines-k', dig ? S.hud.blocksLeft : 'Lines');
    this.set('hud-level', String(g?.level ?? rules.fixedLevel));
    this.set('hud-time-k', limit !== null ? S.hud.timeLeft : 'Time');
    this.set('hud-time', limit !== null ? formatTime(Math.max(0, (limit * 1000) / TICKS_PER_SECOND - ms)) : formatTime(ms));
    const left = g ? secondsLeft(g) : null;
    $('hud-time-cell').classList.toggle('urgent', left !== null && left > 0 && left <= feel.ultraWarnSeconds);
    this.updateBest(g, rules.id, records);
  }

  private updateBest(g: GameState | null, id: keyof typeof MODES, records: Records): void {
    const lb = liveBest(id, records[id], g?.score ?? 0);
    $('hud-best-cell').hidden = id === 'zen';
    this.set('hud-best', lb.value === null ? '-' : formatRecord(id, lb.value).replace('Best ', ''));
    this.set('hud-best-k', lb.passed ? S.hud.bestLive : S.hud.best);
    $('hud-best-cell').classList.toggle('passed', lb.passed);
  }

  /** Queue a short status line for assistive tech; lines are spoken one at a time. */
  announce(...lines: string[]): void {
    this.queue.push(...lines);
    if (this.queue.length > 4) this.queue.splice(0, this.queue.length - 4);
    if (this.flushTimer === null) this.flush();
  }

  private flush(): void {
    const next = this.queue.shift();
    if (next === undefined) {
      this.flushTimer = null;
      return;
    }
    this.live.textContent = next;
    this.flushTimer = window.setTimeout(() => this.flush(), 900);
  }
}
