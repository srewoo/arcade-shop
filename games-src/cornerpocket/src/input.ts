// Pointer (slingshot pull-back) and keyboard (arrows + Space-hold power) input.
// Translates raw events into Game aim state; never touches rules.
import { INPUT } from './config/input';
import type { Game } from './game';
import { grabRadius, pullPower } from './pull';
import { clamp } from './sim';
import { type View, toTable } from './view';

type KeyHandler = (k: string) => void;
const ALWAYS = new Set(['Escape', 'm', 'p']); // still forwarded while a dialog or pause blocks the game

export class Input {
  private dragging = false;
  private pointerId = -1;
  private readonly keys = new Set<string>();
  private charging = false;
  /** Seconds left of the grab-area hint, shown after a tap that missed the cue ball. */
  grabFlash = 0;
  view: View | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly getGame: () => Game | null,
    private readonly onKey: KeyHandler,
    private readonly blocked: () => boolean = () => false,
  ) {
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.cancel(e));
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.keyUp(e));
    window.addEventListener('blur', () => this.reset());
  }

  get isDragging(): boolean { return this.dragging; }
  get scale(): number { return this.view?.scale ?? 1; }
  get grab(): number { return grabRadius(this.scale); }

  /** Drop every held key and any drag in progress (pause, blur, dialogs). */
  reset(): void {
    this.keys.clear(); this.charging = false; this.dragging = false; this.grabFlash = 0;
    const g = this.getGame();
    if (g && g.phase === 'aim') g.power = 0;
  }

  private point(e: PointerEvent): { x: number; y: number } | null {
    if (!this.view) return null;
    const r = this.canvas.getBoundingClientRect();
    return toTable(this.view, e.clientX - r.left, e.clientY - r.top);
  }

  private down(e: PointerEvent): void {
    const g = this.getGame();
    const p = this.point(e);
    if (!g || !p || !g.humanTurn || g.paused || this.blocked()) return;
    if (g.phase === 'place') { g.movePlacing(p.x, p.y); this.capture(e); return; }
    if (g.phase !== 'aim') return;
    const d = Math.hypot(p.x - g.cue.x, p.y - g.cue.y);
    if (d <= this.grab) { this.capture(e); this.pull(g, p); }
    else { g.angle = Math.atan2(p.y - g.cue.y, p.x - g.cue.x); this.grabFlash = INPUT.grabFlashSeconds; } // tap elsewhere: aim there
  }

  private capture(e: PointerEvent): void {
    this.dragging = true; this.pointerId = e.pointerId;
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* not all browsers allow it */ }
  }

  private pull(g: Game, p: { x: number; y: number }): void {
    const dx = g.cue.x - p.x; const dy = g.cue.y - p.y;
    const len = Math.hypot(dx, dy);
    if (len < INPUT.pullMin) { g.power = 0; return; }
    g.angle = Math.atan2(dy, dx);
    g.power = pullPower(len, this.scale);
  }

  private move(e: PointerEvent): void {
    const g = this.getGame();
    const p = this.point(e);
    if (!g || !p || !this.dragging || e.pointerId !== this.pointerId) return;
    if (g.phase === 'place') g.movePlacing(p.x, p.y);
    else if (g.phase === 'aim') this.pull(g, p);
  }

  private up(e: PointerEvent): void {
    const g = this.getGame();
    if (!g || !this.dragging || e.pointerId !== this.pointerId) return;
    this.dragging = false;
    if (g.phase === 'place') g.confirmPlace();
    else if (g.phase === 'aim') {
      if (g.power > INPUT.minShoot) g.shoot(); else g.power = 0;
    }
  }

  private cancel(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.dragging = false;
    const g = this.getGame();
    if (g && g.phase === 'aim') g.power = 0;
  }

  private keyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (this.blocked()) { if (ALWAYS.has(k) && !e.repeat) this.onKey(k); return; }
    const onButton = t?.tagName === 'BUTTON';
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k) && !onButton) e.preventDefault();
    if ((k === ' ' || k === 'Enter') && onButton) return; // a focused button handles its own Space/Enter
    if (e.repeat) return;
    this.keys.add(k);
    this.handleKey(k);
  }

  private handleKey(k: string): void {
    const g = this.getGame();
    const aim = !!g && g.humanTurn && g.phase === 'aim' && !g.paused;
    if (k === ' ' && aim) { this.charging = true; g!.power = Math.max(g!.power, 0.02); }
    else if (aim && (k === 'ArrowUp' || k === 'ArrowDown')) {
      g!.spin = clamp(Math.round((g!.spin + (k === 'ArrowUp' ? 0.5 : -0.5)) * 2) / 2, -1, 1);
      this.onKey('spin');
    } else if (aim && (k === '1' || k === '2' || k === '3')) g!.power = INPUT.presets[Number(k) - 1] ?? INPUT.defaultShoot;
    else if (aim && k === 'n') g!.aimAtNext();
    else if (k === 'Enter' && aim) this.onKey('Enter'); // main decides: dismiss coachmark or shoot
    else if (k === 'Enter' && g?.phase === 'place' && g.humanTurn) g.confirmPlace();
    else this.onKey(k);
  }

  private keyUp(e: KeyboardEvent): void {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    this.keys.delete(k);
    const g = this.getGame();
    if (k === ' ' && this.charging) {
      this.charging = false;
      if (g && g.phase === 'aim' && g.humanTurn && !g.paused) { if (g.power > INPUT.minShoot) g.shoot(); else g.power = 0; }
    }
  }

  /** Fire at the charged/preset power (Enter key and the Shoot button). */
  shootNow(): void {
    const g = this.getGame();
    if (!g || !g.humanTurn || g.paused) return;
    if (g.phase === 'place') { g.confirmPlace(); return; }
    if (g.power < INPUT.minShoot + 0.01) g.power = INPUT.defaultShoot;
    g.shoot();
  }

  /** Per-frame held-key handling: rotate aim, charge power, nudge the cue ball in placement. */
  update(dt: number): void {
    this.grabFlash = Math.max(0, this.grabFlash - dt);
    const g = this.getGame();
    if (!g || !g.humanTurn || g.paused) return;
    const dir = (this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('ArrowLeft') ? 1 : 0);
    if (g.phase === 'aim') {
      const fine = this.keys.has('Shift');
      g.angle += dir * dt * (fine ? INPUT.turnRateFine : INPUT.turnRate);
      if (this.charging) g.power = clamp(g.power + INPUT.chargeRate * dt, 0, 1);
    } else if (g.phase === 'place') {
      const dy = (this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('ArrowUp') ? 1 : 0);
      const sp = INPUT.nudgeSpeed * dt;
      if (dir || dy) g.movePlacing(g.cue.x + dir * sp, g.cue.y + dy * sp);
    }
  }

  /** On-screen aim buttons (touch/mouse hold) feed the same path as the arrow keys. */
  holdKey(k: string, on: boolean): void { if (on) this.keys.add(k); else this.keys.delete(k); }
}
