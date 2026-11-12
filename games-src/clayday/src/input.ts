// Pointer and keyboard aiming. The aim point lives in world coordinates.
import { CONFIG } from './config';
import { clampToWorld, clientToWorld, type Fit, type World } from './world';

export interface InputTarget {
  readonly canvas: HTMLCanvasElement;
  fit(): Fit;
  world(): World;
  onFire(x: number, y: number): void;
  onReload(): void;
  active(): boolean;
}

const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
};

export class Input {
  aim = { x: 0, y: 0 };
  private readonly held = new Set<string>();

  constructor(private readonly t: InputTarget) {
    const c = t.canvas;
    c.addEventListener('pointermove', (e) => this.point(e));
    c.addEventListener('pointerdown', (e) => this.down(e));
    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (t.active()) t.onReload();
    });
    document.addEventListener('keydown', (e) => this.key(e, true));
    document.addEventListener('keyup', (e) => this.key(e, false));
  }

  centre(): void {
    const w = this.t.world();
    this.aim = { x: w.w / 2, y: w.h * 0.4 };
  }

  clear(): void {
    this.held.clear();
  }

  private point(e: PointerEvent): void {
    const r = this.t.canvas.getBoundingClientRect();
    const p = clientToWorld(this.t.fit(), e.clientX - r.left, e.clientY - r.top);
    this.aim = clampToWorld(this.t.world(), p.x, p.y);
  }

  private down(e: PointerEvent): void {
    if (e.button > 0 && e.pointerType === 'mouse') return;
    this.point(e);
    this.t.canvas.focus({ preventScroll: true });
    if (this.t.active()) this.t.onFire(this.aim.x, this.aim.y);
  }

  private key(e: KeyboardEvent, down: boolean): void {
    const tag = (e.target as HTMLElement | null)?.tagName;
    const inField = tag === 'INPUT' || tag === 'BUTTON' || tag === 'SUMMARY';
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!down) {
      this.held.delete(k);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || !this.t.active()) return;
    if (k in KEYS && !inField) {
      this.held.add(k);
      e.preventDefault();
    } else if ((k === ' ' || k === 'Enter') && !inField && !e.repeat) {
      e.preventDefault();
      this.t.onFire(this.aim.x, this.aim.y);
    } else if (k === 'r' && !e.repeat) {
      this.t.onReload();
    }
  }

  /** Keyboard aim: call once per frame with the frame time. */
  update(dt: number): void {
    if (this.held.size === 0) return;
    let dx = 0;
    let dy = 0;
    for (const k of this.held) {
      const v = KEYS[k];
      if (v) {
        dx += v[0];
        dy += v[1];
      }
    }
    const speed = CONFIG.gun.kbSpeed * dt;
    this.aim = clampToWorld(this.t.world(), this.aim.x + dx * speed, this.aim.y + dy * speed);
  }
}
