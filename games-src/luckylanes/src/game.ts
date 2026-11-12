// Game controller: owns the match, shot input, physics world and turn flow.
// update(dt) is time-driven (no DOM), so the whole game can be fast-forwarded.
import type { Banner } from './announce';
import type { AudioEngine } from './audio';
import { HEAD_Y } from './constants';
import { chooseShot } from './cpu';
import { updateCamera } from './cameraRig';
import type { RenderView } from './interp';
import { back, confirm, createInput, isRolling, moveStart, setStart, shotOf, throwWith, tick, type InputState } from './inputFsm';
import { gutterThud, resetForThrow } from './juice';
import { createMatch, type Match, type MatchConfig } from './match';
import { createWorld } from './physics';
import type { PinMask } from './pins';
import { Presentation } from './presentation';
import { Rolling } from './rolling';
import { createRng, type Rng } from './rng';
import { analyseShot } from './shotInfo';
import { TUNING } from './tuning';
import { celebrate, resolveRoll } from './turnEnd';
import { Pacing, type Stage } from './turnFlow';
import type { Shot, World } from './worldTypes';

export type { Stage } from './turnFlow';

export interface GameEvents {
  onChange(): void;
  onBanner(banner: Banner): void;
  onOver(match: Match): void;
  /** "Pocket!" / "Nice!" shot feedback at release. */
  onCallout?(text: string): void;
  /** A human throw was released (for the first-throws hint counter). */
  onThrow?(): void;
}

const T = TUNING.timing;
const IDLE_SHOT: Shot = { x: 0, aim: 0, power: 0, spin: 0 };

const rackWorld = (mask: PinMask): World => {
  const w = createWorld(mask, IDLE_SHOT);
  w.ball.active = false;
  return w;
};

export class Game {
  match: Match;
  input: InputState = createInput();
  world: World;
  stage: Stage = 'ready';
  stageT = 0;
  /** Camera, particles, juice and canvas size: render-side only. */
  readonly pres = new Presentation();
  sweepY = 0;
  cpuShot: Shot | null = null;
  /** -1, 0 or 1: held left/right while positioning. */
  hold = 0;
  paused = false;
  /** Wide-pocket assist, from settings. */
  assist = false;
  readonly pacing = new Pacing();
  private readonly roll = new Rolling();
  private bannerT = 0;
  private readonly rng: Rng;
  private readonly fxRng: Rng;
  private readonly turnRng: Rng;

  constructor(private readonly audio: AudioEngine, private readonly ev: GameEvents, seed = Date.now()) {
    this.rng = createRng(seed);
    this.fxRng = createRng(seed ^ 0x9e3779b9);
    this.turnRng = createRng(seed ^ 0x85ebca6b);
    this.match = createMatch({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    this.world = rackWorld(this.match.mask);
  }

  /** Pause or resume the simulation and the roll audio. Held keys are cleared. */
  setPaused(on: boolean): void {
    if (on === this.paused) return;
    this.paused = on;
    this.hold = 0;
    this.pres.dragTrail = [];
    if (on) this.audio.pause();
    else this.audio.resume();
  }

  start(cfg: MatchConfig): void {
    this.match = createMatch(cfg);
    this.paused = false;
    this.audio.stopRoll();
    this.audio.resume();
    this.beginTurn(0);
  }

  get player() {
    return this.match.players[this.match.current] as Match['players'][number];
  }

  /** A skip would apply right now (never during the pin-fall after a human throw). */
  get canSkipNow(): boolean {
    return !this.paused && this.pacing.can(this.stage, this.stageT);
  }

  get humanTurn(): boolean {
    return this.stage === 'ready' && !this.player.cpu;
  }

  /** What to draw: positions blended between the last two physics steps. */
  view(): RenderView {
    return this.stage === 'rolling' ? this.roll.view(this.world) : { ball: this.world.ball, pins: this.world.pins };
  }

  private beginTurn(startX: number): void {
    this.world = rackWorld(this.match.mask);
    const r = this.turnRng;
    this.input = createInput(startX, { assist: this.assist, offsets: { aim: r(), power: r(), spin: r() } });
    this.cpuShot = null;
    this.pacing.reset();
    this.roll.begin(this.world);
    this.stageT = 0;
    this.stage = this.match.over ? 'over' : this.player.cpu ? 'cpu' : 'ready';
    this.ev.onChange();
    if (this.stage === 'over') this.finish();
  }

  /** Lock the current meter (or throw on the last one). */
  confirm(): void {
    if (!this.humanTurn || this.paused) return;
    const step = ['position', 'aim', 'power', 'spin'].indexOf(this.input.phase);
    this.input = confirm(this.input);
    if (isRolling(this.input)) this.launch(shotOf(this.input));
    else {
      this.audio.tick(step);
      this.ev.onChange();
    }
  }

  back(): void {
    if (!this.humanTurn || this.paused) return;
    this.input = back(this.input);
    this.audio.ui('tap');
    this.ev.onChange();
  }

  /** Space, Enter or a tap during a non-physics wait: fast-forward it. */
  skip(): boolean {
    return !this.paused && this.pacing.request(this.stage, this.stageT);
  }

  /** Slide the ball along the foul line (position phase only). */
  nudge(dx: number): void {
    if (this.humanTurn && !this.paused) this.input = moveStart(this.input, dx);
  }

  placeAt(x: number): void { if (this.humanTurn && !this.paused) this.input = setStart(this.input, x); }

  /** Drag-to-throw / debug: skip the meters and throw this shot now. */
  throwShot(shot: Shot): void {
    if (!this.humanTurn || this.paused) return;
    this.input = throwWith(setStart(createInput(shot.x, { assist: this.assist }), shot.x), shot);
    this.launch(shotOf(this.input));
  }

  private launch(shot: Shot): void {
    const human = !this.player.cpu;
    const info = analyseShot(this.match.mask, shot);
    this.pacing.noteThrow(!human);
    this.world = createWorld(this.match.mask, shot);
    resetForThrow(this.pres.juice, info.clears);
    this.roll.begin(this.world);
    this.stage = 'rolling';
    this.stageT = 0;
    this.audio.release();
    this.audio.startRoll();
    if (human) {
      if (info.call) this.ev.onCallout?.(info.call);
      this.ev.onThrow?.();
    }
    this.ev.onChange();
  }

  update(dt: number): void {
    if (this.paused) return;
    this.pres.update(dt);
    this.stageT += dt * this.pacing.scale(this.stage);
    switch (this.stage) {
      case 'ready': this.updateReady(dt); break;
      case 'cpu': this.updateCpu(); break;
      case 'rolling': this.updateRolling(dt); break;
      case 'settle': if (this.stageT >= T.settleS) this.enter('sweep'); break;
      case 'sweep': this.updateSweep(); break;
      case 'banner': if (this.stageT >= this.bannerT) this.beginTurn(this.input.startX); break;
      default: break;
    }
    updateCamera(this.pres.cam, this.stage, this.stageT, this.world.ball, dt);
  }

  private enter(stage: Stage): void { this.stage = stage; this.stageT = 0; }

  private updateReady(dt: number): void {
    if (this.input.phase === 'position' && this.hold !== 0) this.nudge(this.hold * T.moveCmPerS * dt);
    this.input = tick(this.input, dt * (this.pres.reduced ? TUNING.meters.reducedSlow : 1));
  }

  private updateCpu(): void {
    if (!this.cpuShot && this.stageT >= T.cpuThinkS) {
      this.cpuShot = chooseShot(this.match.mask, this.match.cpuLevel, this.rng);
      this.input = createInput(this.cpuShot.x);
      this.ev.onChange();
    }
    if (this.cpuShot && this.stageT >= T.cpuThinkS + T.cpuAimS) {
      this.input = throwWith(this.input, this.cpuShot);
      this.launch(this.cpuShot);
    }
  }

  private updateRolling(dt: number): void {
    this.roll.advance(this.world, dt, this.pres.juice, this.pres.fx(this.audio, this.fxRng), this.audio);
    if (this.world.done) {
      this.audio.stopRoll();
      this.enter('settle');
    }
  }

  private updateSweep(): void {
    this.sweepY = HEAD_Y - 80 + (this.stageT / T.sweepS) * 360;
    if (this.stageT >= T.sweepS) this.resolve();
  }

  private resolve(): void {
    const { match, banner } = resolveRoll(this.match, this.world);
    const ball = this.world.ball;
    this.match = match;
    this.world = rackWorld(match.mask);
    this.bannerT = banner ? T.bannerS : T.bannerQuietS;
    this.enter('banner');
    if (banner) {
      celebrate(this.audio, this.pres.particles, this.fxRng, this.pres.size, banner);
      if (banner.kind === 'gutter') gutterThud(this.pres.juice, this.pres.fx(this.audio, this.fxRng), ball.x, ball.y);
      this.ev.onBanner(banner);
    }
    this.ev.onChange();
  }

  private finish(): void { this.audio.jingle('over'); this.ev.onOver(this.match); }
}
