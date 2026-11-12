// The double-barrelled gun: two shells per load, then a break-open reload.
import { CONFIG } from './config';

export type FireResult = 'fired' | 'reloading' | 'empty';

export class Gun {
  shells: number;
  /** Seconds left on the current reload; 0 when not reloading. */
  reloadLeft = 0;
  private readonly capacity: number;

  constructor(capacity: number = CONFIG.gun.shells) {
    this.capacity = capacity;
    this.shells = capacity;
  }

  get cap(): number {
    return this.capacity;
  }

  get reloading(): boolean {
    return this.reloadLeft > 0;
  }

  /** 0..1 progress of the reload, 1 when idle. */
  get reloadProgress(): number {
    return this.reloading ? 1 - this.reloadLeft / (CONFIG.gun.reloadMs / 1000) : 1;
  }

  /** Pull the trigger. The last shell starts the reload by itself. */
  fire(): FireResult {
    if (this.reloading) return 'reloading';
    if (this.shells <= 0) return 'empty';
    this.shells -= 1;
    if (this.shells === 0) this.startReload();
    return 'fired';
  }

  /** Manual reload; false when already full or already reloading. */
  reload(): boolean {
    if (this.reloading || this.shells >= this.capacity) return false;
    this.startReload();
    return true;
  }

  private startReload(): void {
    this.reloadLeft = CONFIG.gun.reloadMs / 1000;
  }

  /** Advance time; returns true on the step the reload completes. */
  step(dt: number): boolean {
    if (!this.reloading) return false;
    this.reloadLeft -= dt;
    if (this.reloadLeft > 0) return false;
    this.reloadLeft = 0;
    this.shells = this.capacity;
    return true;
  }
}
