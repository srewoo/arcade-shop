// Render-only animations layered over a simulation that has already moved on:
// row dissolve + collapse, stash slide. The sim result never depends on these.
import { feel } from '../config/feel';
import { HEIGHT } from '../core/board';
import type { ShapeId } from '../core/shapes';
import { collapseShifts } from './view';

interface Dissolve { age: number; shifts: number[]; ghosts: { row: number; colors: number[] }[] }
interface StashTween { age: number; id: ShapeId; fromX: number; fromY: number }

const ease = (k: number): number => 1 - (1 - k) * (1 - k);

export class BoardAnim {
  private dissolve: Dissolve | null = null;
  private stashTween: StashTween | null = null;

  startClear(rows: readonly number[], colors: readonly number[][]): void {
    const sorted = [...rows].sort((a, b) => a - b);
    const order = rows.map((r, i) => ({ row: r, colors: colors[i] as number[] })).sort((a, b) => a.row - b.row);
    this.dissolve = { age: 0, shifts: collapseShifts(sorted, HEIGHT), ghosts: order };
  }

  startStash(id: ShapeId, fromX: number, fromY: number): void {
    this.stashTween = { age: 0, id, fromX, fromY };
  }

  update(dt: number): void {
    if (this.dissolve) {
      this.dissolve.age += dt;
      if (this.dissolve.age >= feel.dissolveSeconds) this.dissolve = null;
    }
    if (this.stashTween) {
      this.stashTween.age += dt;
      if (this.stashTween.age >= feel.stashTweenSeconds) this.stashTween = null;
    }
  }

  get active(): boolean {
    return this.dissolve !== null || this.stashTween !== null;
  }

  /** Progress 0..1 of the dissolve, or 1 when idle. */
  private progress(): number {
    return this.dissolve ? Math.min(1, this.dissolve.age / feel.dissolveSeconds) : 1;
  }

  /** Extra rows (in cells, >= 0) a surviving row is still above its resting place. */
  rowOffset(row: number): number {
    const d = this.dissolve;
    if (!d) return 0;
    return (d.shifts[row] ?? 0) * (1 - ease(this.progress()));
  }

  /** Cleared rows still dissolving: old row index, stone colours and fade (1 -> 0). */
  ghosts(): { row: number; colors: number[]; fade: number }[] {
    const d = this.dissolve;
    if (!d) return [];
    const fade = 1 - this.progress();
    return d.ghosts.map((g) => ({ row: g.row, colors: g.colors, fade }));
  }

  /** Stash slide: shape id, progress 0..1 and start point in canvas pixels. */
  stash(): { id: ShapeId; k: number; fromX: number; fromY: number } | null {
    const t = this.stashTween;
    return t ? { id: t.id, k: ease(Math.min(1, t.age / feel.stashTweenSeconds)), fromX: t.fromX, fromY: t.fromY } : null;
  }
}
