// Application controller: screens, pause, attempts, results. DOM-aware glue around the pure sim.
import { Sfx } from './audio';
import { LEVELS } from './levels';
import type { Level } from './levels/types';
import { loadProgress, mergeRecord, saveProgress, SEEN_KEY } from './progress';
import type { Progress } from './progress';
import { Renderer } from './render/renderer';
import { drawTitleArt } from './render/titleArt';
import { Session } from './session';
import { loadSettings, saveSettings } from './settings';
import type { Settings } from './settings';
import type { SimEvent } from './sim';
import { CONFIG } from './config';
import { readFlag, writeFlag } from './storage';
import { S } from './strings';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { el, isTouchCapable } from './ui/dom';
import { Hud } from './ui/hud';
import { Input } from './ui/input';
import { renderLevelGrid } from './ui/levelSelect';
import { closeOverlay, isOverlayOpen, openOverlay } from './ui/overlay';
import { showResult, summarise } from './ui/result';
import type { ResultView } from './ui/result';
import { renderSettings } from './ui/settingsPanel';

export type ScreenName = 'title' | 'levels' | 'game';

export class App {
  settings: Settings = loadSettings();
  progress: Progress = loadProgress(LEVELS.length);
  readonly input = new Input();
  readonly audio = new Sfx();
  readonly session = new Session(LEVELS[0] as Level);
  readonly renderer: Renderer;
  readonly hud = new Hud();
  screen: ScreenName = 'title';
  paused = false;
  private attempt = 0;
  private hintTimer = 0;
  private last = 0;
  private lastResult: ResultView | null = null;
  private readonly reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor() {
    this.renderer = new Renderer(el<HTMLCanvasElement>('canvas'));
    el('canvas').setAttribute('aria-label', S.canvasLabel);
    const syncSize = (): void => {
      this.renderer.topInset = el('top').offsetHeight;
      this.renderer.resize();
    };
    const ro = new ResizeObserver(syncSize);
    ro.observe(el('canvas'));
    ro.observe(el('top'));
    const art = el<HTMLCanvasElement>('title-art');
    new ResizeObserver(() => drawTitleArt(art)).observe(art);
    el('how-goal').textContent = S.levelGuide;
    el('how-keys').textContent = isTouchCapable() ? S.controlsGuideTouch : S.controlsGuide;
    this.reducedQuery.addEventListener('change', () => this.applySettings(this.settings, false));
    this.applySettings(this.settings, false);
    this.refreshMenus();
    requestAnimationFrame((t) => this.frame(t));
  }

  get level(): Level {
    return this.session.level;
  }

  get hasNext(): boolean {
    return this.level.id < LEVELS.length;
  }

  announce(text: string): void {
    el('status').textContent = text;
  }

  applySettings(next: Settings, persist = true): void {
    this.settings = next;
    if (persist) saveSettings(next);
    applyAppearance(next, this.reducedQuery.matches);
    this.audio.configure(next);
    this.renderer.fx.reduced = isReducedMotion(next.reduceMotion, this.reducedQuery.matches);
    renderSettings(next);
    const btn = el('btn-sound');
    btn.setAttribute('aria-pressed', String(next.sound));
    btn.setAttribute('aria-label', next.sound ? S.unmuted : S.muted);
  }

  refreshMenus(): void {
    renderLevelGrid(LEVELS, this.progress, (id) => this.startLevel(id));
    const started = Object.keys(this.progress).length > 0;
    el('btn-play').textContent = started ? S.continue : S.play;
  }

  showScreen(name: ScreenName): void {
    this.screen = name;
    for (const s of ['title', 'levels', 'game'] as const) el(`screen-${s}`).hidden = s !== name;
    this.input.clear();
    if (name !== 'game') this.audio.silence();
    const focus = name === 'title' ? 'btn-play' : name === 'levels' ? 'levels-back' : 'canvas';
    el(focus).focus({ preventScroll: true });
    if (name === 'game') requestAnimationFrame(() => this.renderer.resize());
  }

  /** Lowest unlocked level without a star, else level 1. */
  continueId(): number {
    const open = LEVELS.find((l) => (this.progress[l.id]?.stars ?? 0) === 0);
    return open?.id ?? 1;
  }

  startLevel(id: number): void {
    const level = LEVELS[id - 1];
    if (!level) return;
    this.attempt++;
    this.paused = false;
    this.session.reset(level);
    this.renderer.fx.clear();
    this.hud.setLevel(level);
    this.showScreen('game');
    this.renderer.resize();
    this.announce(S.levelStart(level.id, level.name) + '. ' + level.tip);
    const hint = el('hint');
    const first = !readFlag(SEEN_KEY);
    el('hint-text').textContent = first ? (isTouchCapable() ? S.hintTouch : S.hint) : level.tip;
    hint.hidden = !first;
    window.clearTimeout(this.hintTimer);
    if (first) this.hintTimer = window.setTimeout(() => this.dismissHint(), CONFIG.ui.hintMs);
    this.audio.unlock();
  }

  dismissHint(): void {
    window.clearTimeout(this.hintTimer);
    el('hint').hidden = true;
    writeFlag(SEEN_KEY);
  }

  get active(): boolean {
    return this.screen === 'game' && !this.paused && !isOverlayOpen() && !this.session.finished;
  }

  pause(): void {
    if (this.screen !== 'game' || this.session.finished || this.paused) return;
    this.paused = true;
    this.input.clear();
    this.audio.silence();
    el('pause-confirm').hidden = true;
    el('pause-note').textContent = this.level.tip;
    openOverlay(el('pause-overlay'), el('btn-pause'), () => this.afterPauseClosed(), el('pause-resume'));
  }

  private afterPauseClosed(): void {
    this.paused = false;
    this.input.clear();
  }

  resume(): void {
    closeOverlay(el('pause-overlay'));
    this.afterPauseClosed();
    el('canvas').focus({ preventScroll: true });
  }

  quitToLevels(): void {
    for (const id of ['pause-overlay', 'result-overlay']) closeOverlay(el(id));
    this.paused = false;
    this.attempt++;
    this.refreshMenus();
    this.showScreen('levels');
  }

  restart(): void {
    for (const id of ['pause-overlay', 'result-overlay']) closeOverlay(el(id));
    this.startLevel(this.level.id);
  }

  private handle(events: readonly SimEvent[]): void {
    for (const e of events) {
      if (e === 'start') {
        this.audio.start();
        this.dismissHint();
      } else if (e === 'hit') this.onHit();
      else if (e === 'parked' || e === 'timeout' || e === 'wrecked') this.onFinish();
    }
  }

  private onHit(): void {
    const sim = this.session.curr;
    this.audio.hit(sim.lastImpact);
    const p = this.renderer.carPoint(sim.car);
    this.renderer.fx.burst(p.x, p.y, sim.lastImpact);
    this.hud.bump();
    this.flashField('hit');
    this.announce(`${S.bumped} ${sim.damage}`);
  }

  private onFinish(): void {
    const sim = this.session.curr;
    const view = summarise(sim, this.level);
    this.lastResult = view;
    if (sim.status === 'parked') {
      this.progress = { ...this.progress, [this.level.id]: mergeRecord(this.progress[this.level.id], { stars: view.stars as 0 | 1 | 2 | 3, time: Math.max(0.1, sim.time), damage: sim.damage, score: view.score }) };
      saveProgress(this.progress);
      this.audio.parked(view.stars);
      this.celebrate(view.score);
      this.announce(S.statusParked(this.level.id, sim.time.toFixed(1) + ' seconds', sim.damage));
    } else {
      this.audio.fail();
      this.announce(S.statusFail(view.title));
    }
    const token = this.attempt;
    const delay = sim.status === 'parked' && !this.renderer.fx.reduced ? CONFIG.ui.payoffMs : CONFIG.ui.resultDelayMs;
    window.setTimeout(() => token === this.attempt && this.openResult(), delay);
  }

  /** Payoff before the card: confetti from the bay, a green flash and a +score pop. */
  private celebrate(score: number): void {
    const bay = this.level.bay;
    this.renderer.fx.confetti(bay.x, bay.y);
    this.flashField('win');
    const pop = el('pop');
    pop.textContent = S.scorePop(score);
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
    window.setTimeout(() => pop.classList.remove('show'), CONFIG.ui.payoffMs + 400);
  }

  /** One-shot flash class on the field; the CSS only animates when Reduce motion is off. */
  private flashField(kind: 'hit' | 'win'): void {
    const f = el('field');
    f.classList.remove('flash-hit', 'flash-win');
    void f.offsetWidth;
    f.classList.add(`flash-${kind}`);
  }

  private openResult(): void {
    const view = this.lastResult;
    if (!view) return;
    this.input.clear();
    showResult(this.session.curr, this.level, view, this.progress[this.level.id], this.hasNext);
    this.refreshMenus();
    const primary = el(this.session.curr.status === 'parked' && this.hasNext ? 'result-next' : 'result-retry');
    openOverlay(el('result-overlay'), null, () => this.quitToLevels(), primary);
  }

  private frame(now: number): void {
    const dt = this.last === 0 ? 16 : now - this.last;
    this.last = now;
    if (this.screen === 'game') this.tickGame(dt, now);
    requestAnimationFrame((t) => this.frame(t));
  }

  private tickGame(dt: number, now: number): void {
    const controls = this.input.controls();
    if (this.active) this.handle(this.session.advance(dt, controls));
    const sim = this.session.curr;
    this.audio.drive(sim.car.v, controls.throttle, this.active && sim.status === 'playing');
    this.renderer.fx.update(dt / 1000);
    this.hud.update(sim, this.level, controls.throttle);
    this.renderer.draw({ level: this.level, prev: this.session.prev, curr: sim, alpha: this.paused ? 1 : this.session.alpha, time: now / 1000, assist: this.settings.colorAssist, throttle: controls.throttle });
  }
}
