// Keyboard + touch input folded into one Controls value.
import type { Controls } from '../car';

const UP = new Set(['ArrowUp', 'w', 'W']);
const DOWN = new Set(['ArrowDown', 's', 'S']);
const LEFT = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT = new Set(['ArrowRight', 'd', 'D']);

export class Input {
  private keys = { up: false, down: false, left: false, right: false, brake: false };
  /** Touch wheel position in -1..1, or null when not held. */
  wheel: number | null = null;
  pad = { fwd: false, rev: false, brake: false };

  /** Returns true when the key belongs to driving (so the caller can preventDefault). */
  key(e: KeyboardEvent, down: boolean): boolean {
    const k = e.key;
    if (UP.has(k)) this.keys.up = down;
    else if (DOWN.has(k)) this.keys.down = down;
    else if (LEFT.has(k)) this.keys.left = down;
    else if (RIGHT.has(k)) this.keys.right = down;
    else if (k === ' ') this.keys.brake = down;
    else return false;
    return true;
  }

  clear(): void {
    this.keys = { up: false, down: false, left: false, right: false, brake: false };
    this.wheel = null;
    this.pad = { fwd: false, rev: false, brake: false };
  }

  controls(): Controls {
    const k = this.keys;
    const throttle = (k.up || this.pad.fwd ? 1 : 0) - (k.down || this.pad.rev ? 1 : 0);
    const keySteer = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    return { throttle, brake: k.brake || this.pad.brake, steer: this.wheel ?? keySteer };
  }
}
