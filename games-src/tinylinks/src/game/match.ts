// Match bookkeeping: who plays which hole, in what order, and what they scored. DOM-free.
import { CONFIG } from '../config';
import { holesFor, type CourseId } from '../course';
import type { HoleDef } from '../physics/types';
import { holeOrder, winners } from './scoring';
import type { Player } from './players';

export interface MatchSetup { course: CourseId; players: Player[]; /** Debug/test: begin on this hole index. */ startHole?: number }

export class Match {
  readonly holes: readonly HoleDef[];
  readonly players: readonly Player[];
  /** scores[player][holeIndex]: strokes taken (null = not played yet). */
  readonly scores: (number | null)[][];
  readonly pickups: boolean[][];
  holeIdx = 0;
  order: number[] = [];
  turn = 0;

  constructor(readonly setup: MatchSetup) {
    this.holes = holesFor(setup.course);
    this.players = setup.players.slice(0, CONFIG.flow.maxPlayers);
    this.scores = this.players.map(() => this.holes.map(() => null));
    this.pickups = this.players.map(() => this.holes.map(() => false));
    this.beginHole(Math.min(Math.max(setup.startHole ?? 0, 0), this.holes.length - 1));
  }

  get hole(): HoleDef { return this.holes[this.holeIdx] as HoleDef; }
  get player(): number { return this.order[this.turn] as number; }
  get isLastHole(): boolean { return this.holeIdx >= this.holes.length - 1; }

  beginHole(i: number): void {
    this.holeIdx = i;
    this.turn = 0;
    const prev = i === 0 ? null : this.players.map((_, p) => this.scores[p]?.[i - 1] ?? null);
    const o = prev ? holeOrder(prev) : [];
    this.order = o.length ? o : this.players.map((_, p) => p);
  }

  record(player: number, strokes: number, pickedUp = false): void {
    const row = this.scores[player];
    const picks = this.pickups[player];
    if (!row || !picks) return;
    row[this.holeIdx] = strokes;
    picks[this.holeIdx] = pickedUp;
  }

  /** Advance to the next player on this hole. Returns false when everyone has finished. */
  nextTurn(): boolean {
    this.turn++;
    return this.turn < this.order.length;
  }

  /** Strokes and par over the holes `player` has finished. */
  total(player: number): { strokes: number; par: number; played: number } {
    let strokes = 0;
    let par = 0;
    let played = 0;
    this.holes.forEach((h, i) => {
      const s = this.scores[player]?.[i];
      if (s == null) return;
      strokes += s; par += h.par; played++;
    });
    return { strokes, par, played };
  }

  standings(): { winners: number[]; totals: number[] } {
    const totals = this.players.map((_, p) => this.total(p).strokes);
    return { winners: winners(totals), totals };
  }
}
