// The game controller: state machine (title, play, pause, result), the fixed
// timestep loop with interpolated rendering, and the glue between modules.
import { configureAudio, emit } from './audio';
import { advanceClock } from './clock';
import { CONFIG } from './config';
import { Renderer } from './draw/renderer';
import { drawTitleArt } from './draw/titleArt';
import { handleEvent, type FeedbackSink } from './feedback';
import { Fx } from './fx';
import { Input } from './input';
import { advance, buildRound, finishRound, newSession, randomSeed, type Session, type Verdict } from './session';
import { saveSettings, type Settings } from './settings';
import type { Round } from './sim';
import { loadStats, recordRound, saveStats, type Stats } from './stats';
import { applyChange } from './store';
import { S } from './strings';
import { installHotkeys } from './ui/hotkeys';
import { buildResultView } from './resultView';
import { applyAppearance } from './ui/appearance';
import { byId } from './ui/dom';
import { Hint, shouldShowHint } from './ui/hint';
import { HudView } from './ui/hudView';
import { Screens } from './ui/screens';
import { makeWorld, worldForStage, type World } from './world';

export type GameState = 'title' | 'play' | 'pause' | 'result';

const END_HOLD = 0.9;

export class Game implements FeedbackSink {
  state: GameState = 'title';
  round: Round | null = null;
  session: Session;
  verdict: Verdict = 'next';
  stats: Stats = loadStats();
  world: World = makeWorld(1000, 600);
  readonly fx = new Fx();
  readonly stage = byId('stage');
  readonly canvas = byId<HTMLCanvasElement>('field');
  readonly renderer = new Renderer(this.canvas);
  readonly hud = new HudView();
  readonly screens: Screens;
  readonly input: Input;
  private readonly sr = byId('sr-status');
  private readonly calloutEl = byId('callout');
  private readonly motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  private calloutTimer = 0;
  private readonly hint = new Hint();
  private acc = 0;
  private last = 0;
  private time = 0;
  private endHold = 0;
  private carry = 0;
  private dirty = true;

  constructor(public settings: Settings, private readonly seedOverride: number | null) {
    this.session = newSession(settings.mode, 1, seedOverride ?? randomSeed());
    this.screens = new Screens({
      resume: () => this.resume(), restart: () => this.restart(), quit: () => this.quit(),
      start: () => this.start(), next: () => this.next(), toTitle: () => this.quit(),
      change: (k, v) => this.change(k, v), settingsClosed: () => this.settingsClosed(),
    });
    this.input = new Input({
      canvas: this.canvas, fit: () => this.renderer.fit, world: () => this.world,
      onFire: (x, y) => this.fire(x, y), onReload: () => void this.round?.reload(),
      active: () => this.state === 'play' && this.round?.phase !== 'done',
    });
    this.canvas.setAttribute('aria-label', S.canvasLabel);
    const art = byId('title-art') as HTMLCanvasElement;
    new ResizeObserver(() => drawTitleArt(art)).observe(art);
    this.bind();
    this.change('', '');
    this.screens.openTitle();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---- FeedbackSink
  say(text: string): void {
    this.sr.textContent = text;
  }
  callout(text: string): void {
    window.clearTimeout(this.calloutTimer);
    this.calloutEl.textContent = text;
    this.calloutEl.classList.remove('pop');
    void this.calloutEl.offsetWidth;
    this.calloutEl.classList.add('pop');
    this.calloutTimer = window.setTimeout(() => (this.calloutEl.textContent = ''), 900);
  }
  aim(): { x: number; y: number } {
    return this.input.aim;
  }

  change(key: string, raw: string | number | boolean): void {
    if (key) {
      const next = applyChange(this.settings, key as keyof Settings, raw);
      if (next === this.settings) return;
      this.settings = next;
      saveSettings(next);
    }
    const s = this.settings;
    applyAppearance(s, this.motionQuery.matches);
    configureAudio({ enabled: s.sound, volume: s.volume });
    this.fx.reduced = document.documentElement.dataset.motion === 'reduce';
    this.screens.sync(s, this.bestLine());
    this.dirty = true;
  }

  private bestLine(): string {
    return this.stats.bestRun > 0 ? `${S.best}: ${this.stats.bestRun} (round ${this.stats.bestRound})` : '';
  }

  start(): void {
    const s = this.settings;
    const seed = this.seedOverride ?? randomSeed();
    this.session = newSession(s.mode, s.mode === 'practice' ? s.practiceRound : 1, seed);
    this.screens.closeTitle();
    this.beginRound();
  }

  beginRound(): void {
    this.world = worldForStage(this.stage.clientWidth, this.stage.clientHeight);
    this.carry = this.session.runScore;
    this.round = buildRound(this.session, this.world);
    this.renderer.resize(this.world);
    this.hud.reset(this.round);
    this.input.centre();
    this.fx.clear();
    this.acc = 0;
    this.endHold = 0;
    this.state = 'play';
    this.stage.classList.add('playing');
    this.showHint();
    this.callout(S.ready);
    this.say(`${S.round} ${this.session.round}. ${S.ready}`);
    this.focusField();
  }

  private showHint(): void {
    let storage: Storage | null = null;
    try {
      storage = localStorage;
    } catch {
      /* blocked */
    }
    if (shouldShowHint(storage)) this.hint.show(S.hint);
  }

  private fire(x: number, y: number): void {
    this.round?.fire(x, y);
    this.hint.dismiss();
  }

  private focusField(): void {
    this.canvas.focus({ preventScroll: true });
  }

  pause(opener: HTMLElement | null = null): void {
    if (this.state !== 'play' || !this.round || this.round.phase === 'done') return;
    this.state = 'pause';
    this.input.clear();
    window.clearTimeout(this.calloutTimer);
    this.calloutEl.textContent = '';
    this.screens.openPause(opener ?? byId('pause'));
  }

  resume(): void {
    if (this.state !== 'pause') return;
    this.state = 'play';
    this.last = 0;
    this.screens.closePause();
    this.focusField();
  }

  restart(): void {
    this.screens.closePause();
    this.beginRound();
  }

  quit(): void {
    this.screens.closePause();
    this.screens.closeResult();
    this.state = 'title';
    this.round = null;
    this.stage.classList.remove('playing');
    this.hint.hide();
    this.calloutEl.textContent = '';
    this.dirty = true;
    this.screens.sync(this.settings, this.bestLine());
    this.screens.openTitle();
  }

  next(): void {
    this.screens.closeResult();
    if (this.verdict === 'next') this.session = advance(this.session);
    else this.session = newSession(this.session.mode, this.verdict === 'practice' ? this.session.round : 1, this.seedOverride ?? randomSeed());
    this.beginRound();
  }

  openSettings(opener: HTMLElement): void {
    if (this.state === 'play') this.pause(opener);
    this.screens.openSettings(opener);
  }

  private settingsClosed(): void {
    if (this.state === 'pause') byId('pause-resume').focus();
  }

  private finish(): void {
    const round = this.round;
    const r = round?.result;
    if (!round || !r) return;
    const out = finishRound(this.session, r);
    this.session = out.session;
    this.verdict = out.verdict;
    const counted = this.session.mode === 'campaign';
    this.stats = recordRound(this.stats, { runScore: this.session.runScore, round: this.session.round, bestRoundHits: r.hits, counted });
    saveStats(this.stats);
    this.state = 'result';
    this.stage.classList.remove('playing');
    this.hint.hide();
    emit(out.verdict === 'over' ? 'fail' : 'pass');
    this.screens.sync(this.settings, this.bestLine());
    const view = buildResultView(round, out.verdict, this.session);
    this.say(`${view.title}. ${view.big}. ${view.rating}`);
    this.screens.openResult(view);
  }

  // ---- loop
  private bind(): void {
    document.addEventListener('visibilitychange', () => document.hidden && this.pause());
    window.addEventListener('blur', () => this.pause());
    installHotkeys({
      state: () => this.state, pause: () => this.pause(), resume: () => this.resume(),
      toggleSound: () => this.change('sound', !this.settings.sound),
    });
    byId('pause').addEventListener('click', () => this.pause(byId('pause')));
    byId('open-settings').addEventListener('click', () => this.openSettings(byId('open-settings')));
    byId('sound').addEventListener('click', () => this.change('sound', !this.settings.sound));
    byId('reload').addEventListener('click', () => {
      this.round?.reload();
      this.focusField();
    });
    byId('onboard-close').addEventListener('click', () => {
      this.hint.dismiss();
      this.focusField();
    });
    new ResizeObserver(() => (this.dirty = true)).observe(this.stage);
    this.motionQuery.addEventListener('change', () => this.change('', ''));
  }

  private loop(ts: number): void {
    const dt = this.last ? (ts - this.last) / 1000 : 0;
    this.last = ts;
    if (this.dirty) this.syncSize();
    const playing = this.state === 'play' && this.round !== null;
    if (this.state !== 'pause') this.time += Math.min(dt, CONFIG.sim.maxFrame);
    if (this.state !== 'pause') this.fx.update(Math.min(dt, CONFIG.sim.maxFrame));
    let alpha = 1;
    if (playing) alpha = this.advance(dt);
    this.draw(alpha);
    if (this.round) this.hud.update(this.round, this.session.round, this.carry);
    requestAnimationFrame((t) => this.loop(t));
  }

  private advance(dt: number): number {
    const round = this.round!;
    this.input.update(Math.min(dt, CONFIG.sim.maxFrame));
    const c = advanceClock(this.acc, dt);
    this.acc = c.acc;
    for (let i = 0; i < c.steps; i++) round.step(CONFIG.sim.step);
    this.drain(round);
    if (round.phase === 'done') {
      this.endHold += dt;
      if (this.endHold >= END_HOLD) this.finish();
    }
    return c.alpha;
  }

  private drain(round: Round): void {
    for (const ev of round.events.splice(0)) {
      handleEvent(ev, this);
      if (ev.type === 'end') this.callout(ev.outcome === 'timeout' ? "Time!" : 'Done!');
    }
  }

  private syncSize(): void {
    this.dirty = false;
    if (!this.round) this.world = worldForStage(this.stage.clientWidth, this.stage.clientHeight);
    this.renderer.resize(this.world);
    if (!this.round) this.input.centre();
  }

  private draw(alpha: number): void {
    const round = this.round;
    this.fx.spread = round?.params.spread ?? CONFIG.gun.spread;
    this.renderer.draw({
      round, world: this.world, alpha, aim: this.input.aim, time: this.time,
      assist: this.settings.colorAssist, still: this.fx.reduced, showReticle: round !== null && this.state !== 'result',
      wind: round?.wind ?? 0,
    }, this.fx);
  }
}
