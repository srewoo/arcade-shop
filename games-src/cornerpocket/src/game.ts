// Game controller: owns the table, the fixed-timestep loop and the active mode.
// DOM-free so it can be driven by tests, the CPU and the renderer alike.
import { CUE_START, MAX_SHOT_SECONDS, STEP } from './constants';
import { type AimGuide, computeAim } from './aim';
import { type GameEvent, type GameOptions, type ModeCtl, type Phase, type Tone } from './gameTypes';
import { freeSpotNear, validSpot } from './layouts';
import { EightMode } from './modes/eightMode';
import { RackMode } from './modes/rackMode';
import { TrickMode } from './modes/trickMode';
import { type Ball, type SimEvent, isMoving, makeBall, stepWorld } from './physics';
import { type Shot, type ShotReport, applyShot, clamp, foldEvents, newReport } from './sim';

export type Listener = (e: GameEvent) => void;

export class Game {
  balls: Ball[] = [makeBall(0, CUE_START.x, CUE_START.y)];
  phase: Phase = 'aim';
  angle = 0;
  power = 0;
  spin = 0;
  paused = false;
  readonly ctl: ModeCtl;
  /** Previous-step ball positions, for render interpolation. Parallel to `balls`. */
  prevX: number[] = [];
  prevY: number[] = [];
  private targetIdx = -1;
  private readonly listeners: Listener[] = [];
  private readonly simEvents: SimEvent[] = [];
  private report: ShotReport = newReport(this.balls);
  private acc = 0;
  private shotSteps = 0;

  constructor(readonly opts: GameOptions) {
    this.ctl = opts.mode === 'rack' ? new RackMode(this)
      : opts.mode === 'trick' ? new TrickMode(this, opts.trick ?? 0)
        : new EightMode(this, opts.mode === 'cpu', opts.level, opts.seed ?? 1);
    this.ctl.start();
  }

  on(l: Listener): void { this.listeners.push(l); }
  emit(e: GameEvent): void { for (const l of this.listeners) l(e); }
  say(text: string, tone: Tone = 'info'): void { this.emit({ t: 'text', text, tone }); }

  get cue(): Ball { return this.balls[0]!; }
  get humanTurn(): boolean { return this.phase !== 'over' && this.ctl.humanTurn(); }

  /** Install a new layout (cue ball first) and aim at the middle of the object balls. */
  setBalls(balls: Ball[]): void {
    this.balls = balls;
    this.snapshot();
    this.phase = 'aim';
    this.power = 0;
    this.autoAim();
  }

  private snapshot(): void {
    this.prevX = this.balls.map((b) => b.x);
    this.prevY = this.balls.map((b) => b.y);
  }

  /** Fraction of a physics step not yet simulated (0..1); 1 when nothing is rolling. */
  get alpha(): number { return this.phase === 'rolling' ? Math.min(1, this.acc / STEP) : 1; }

  /** Position to draw ball `i` at: interpolated between the last two steps while rolling. */
  drawPos(i: number): { x: number; y: number } {
    const b = this.balls[i]!;
    const a = this.alpha;
    const px = this.prevX[i]; const py = this.prevY[i];
    if (a >= 1 || b.pocketed || px === undefined || py === undefined) return { x: b.x, y: b.y };
    return { x: px + (b.x - px) * a, y: py + (b.y - py) * a };
  }

  setPaused(p: boolean): void {
    if (this.phase === 'over') return;
    this.paused = p;
  }

  /** Aim at the next legal target ball (keyboard shortcut). Returns the ball id or null. */
  aimAtNext(): number | null {
    if (this.phase !== 'aim') return null;
    const ids = this.ctl.targets().filter((id) => this.balls.some((b) => b.id === id && !b.pocketed));
    if (ids.length === 0) return null;
    this.targetIdx = (this.targetIdx + 1) % ids.length;
    const id = ids[this.targetIdx]!;
    const t = this.balls.find((b) => b.id === id)!;
    this.angle = Math.atan2(t.y - this.cue.y, t.x - this.cue.x);
    return id;
  }

  autoAim(): void {
    this.targetIdx = -1;
    const obj = this.balls.filter((b) => b.id !== 0 && !b.pocketed);
    if (obj.length === 0) return;
    const mx = obj.reduce((s, b) => s + b.x, 0) / obj.length;
    const my = obj.reduce((s, b) => s + b.y, 0) / obj.length;
    this.angle = Math.atan2(my - this.cue.y, mx - this.cue.x);
  }

  guide(): AimGuide | null {
    return this.phase === 'aim' ? computeAim(this.balls, this.angle) : null;
  }

  /** Bring a potted cue ball back at (or near) the given spot. */
  respawnCue(x: number = CUE_START.x, y: number = CUE_START.y): void {
    const cue = this.cue;
    cue.pocketed = false; cue.vx = 0; cue.vy = 0;
    const p = freeSpotNear(this.balls.filter((b) => b.id !== 0), x, y);
    cue.x = p.x; cue.y = p.y;
  }

  shoot(shot?: Shot): boolean {
    if (this.phase !== 'aim' || this.paused) return false;
    const s = shot ?? { angle: this.angle, power: this.power, spin: this.spin };
    const power = clamp(s.power, 0.03, 1);
    this.report = newReport(this.balls);
    this.snapshot();
    this.ctl.onShot?.();
    applyShot(this.balls, { ...s, power });
    this.phase = 'rolling';
    this.acc = 0; this.shotSteps = 0; this.power = 0;
    this.emit({ t: 'shot', power });
    return true;
  }

  /** Ball in hand: move the cue ball preview if the spot is legal. */
  movePlacing(x: number, y: number): boolean {
    if (this.phase !== 'place' || !validSpot(this.balls, x, y)) return false;
    this.cue.x = x; this.cue.y = y;
    return true;
  }

  confirmPlace(): void {
    if (this.phase !== 'place') return;
    this.phase = 'aim';
    this.autoAim();
  }

  update(dt: number): void {
    if (this.phase === 'over' || this.paused) return;
    this.ctl.tick(dt);
    if (this.phase !== 'rolling') return;
    this.acc += Math.min(dt, 0.05);
    let n = 0;
    while (this.acc >= STEP && n++ < 40 && this.phase === 'rolling') {
      this.acc -= STEP;
      this.stepOnce();
    }
  }

  private stepOnce(): void {
    this.simEvents.length = 0;
    for (let i = 0; i < this.balls.length; i++) { this.prevX[i] = this.balls[i]!.x; this.prevY[i] = this.balls[i]!.y; }
    stepWorld(this.balls, this.simEvents);
    foldEvents(this.report, this.simEvents);
    for (const e of this.simEvents) {
      if (e.t === 'hit') this.emit({ t: 'hit', speed: e.speed });
      else if (e.t === 'cushion') this.emit({ t: 'cushion', speed: e.speed });
      else this.emit({ t: 'pot', id: e.id, x: e.x, y: e.y, cue: e.id === 0 });
    }
    this.shotSteps++;
    if (!isMoving(this.balls) || this.shotSteps * STEP > MAX_SHOT_SECONDS) this.finishShot();
  }

  private finishShot(): void {
    for (const b of this.balls) { b.vx = 0; b.vy = 0; }
    this.phase = 'aim';
    this.acc = 0;
    this.ctl.onShotEnd(this.report);
    if (this.phase === 'aim') this.autoAim();
  }

  /** Test/debug helper: step the simulation until the current shot ends. */
  runToRest(): void {
    let guard = 0;
    while (this.phase === 'rolling' && guard++ < 10000) this.update(0.05);
  }
}
