// 7-bag randomiser: every shape appears exactly once per consecutive group of 7.
import { Rng } from './rng';
import { SHAPE_IDS, type ShapeId } from './shapes';

export class Bag {
  private queue: ShapeId[] = [];
  constructor(private readonly rng: Rng) {}

  private refill(): void {
    const bag = [...SHAPE_IDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = this.rng.int(i + 1);
      [bag[i], bag[j]] = [bag[j] as ShapeId, bag[i] as ShapeId];
    }
    this.queue.push(...bag);
  }

  peek(n: number): ShapeId[] {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }

  next(): ShapeId {
    this.peek(1);
    return this.queue.shift() as ShapeId;
  }
}
