// App wiring: DOM, settings, audio and the render loop around the Session state machine.
import { Ambient } from './audio/ambient';
import { AudioEngine } from './audio/engine';
import { cuesFor } from './audio/events';
import { msToFrames } from './core/das';
import type { ModeId } from './core/modes';
import { defaultConfig, type GameEvent, type GameState } from './core/state';
import { debugHandle } from './debug';
import { Flow } from './flow';
import { Controls } from './input/controls';
import { wirePad } from './input/pad';
import { attachTouch } from './input/touch';
import { RecordBook, type ResultInfo } from './records';
import { Session } from './session';
import { loadRecords, loadSettings, saveRecords, saveSettings, type Settings } from './settings';
import { S } from './strings';
import { announceFor } from './ui/announce';
import { applySettings } from './ui/apply';
import { LiveCues } from './ui/cues';
import { Hud } from './ui/hud';
import { Renderer } from './ui/renderer';
import { Screens } from './ui/screens';
import { openSettings } from './ui/settings/dialog';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export class App {
  private settings: Settings = loadSettings();
  private last = performance.now();
  private readonly book = new RecordBook(loadRecords(), saveRecords);
  private readonly renderer = new Renderer($<HTMLCanvasElement>('well'));
  private readonly audio = new AudioEngine();
  private readonly ambient = new Ambient(this.audio);
  private readonly hud = new Hud();
  private readonly cues = new LiveCues();
  private readonly motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly controls: Controls = new Controls(this.settings.keys, {
    isPlaying: () => this.session.phase === 'playing',
    isModalOpen: () => document.querySelector('dialog[open]') !== null,
    onPause: () => this.flow.toggle(),
    onMute: () => this.toggleMute(),
  });
  private readonly session: Session = new Session(() => this.controls.poll(), {
    onEvents: (events, g) => this.onEvents(events, g),
    onEnd: (status) => this.flow.finish(this.info(status)),
  });
  private readonly screens = new Screens($('overlay'), ['.bar', '.hud', '#pad', '#hint'].map((q) => document.querySelector(q) as HTMLElement), () => this.controls.anyHeld());
  private readonly flow: Flow = new Flow({
    session: this.session, screens: this.screens, audio: this.audio, ambient: this.ambient, hud: this.hud, controls: this.controls, book: this.book,
    settings: () => this.settings, update: (p) => this.update(p), start: (m) => this.start(m), openSettings: () => this.openSettingsDialog(),
    isSettingsOpen: () => $<HTMLDialogElement>('settings').open,
    touch: window.matchMedia('(pointer: coarse)').matches,
  });

  constructor() {
    attachTouch($('stage'), this.controls, () => this.renderer.cellSize, () => this.session.phase === 'playing', () => this.settings.swipeStep);
    $('btn-pause').addEventListener('click', () => this.flow.toggle());
    $('btn-sound').addEventListener('click', () => this.toggleMute());
    $('btn-settings').addEventListener('click', () => this.openSettingsDialog());
    wirePad($('pad'), this.controls, () => this.session.phase === 'playing', () => void this.audio.ensure());
    this.applySettings();
    new ResizeObserver(() => this.resize()).observe($('stage'));
    this.motionQuery.addEventListener('change', () => this.applySettings());
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('blur', () => this.autoPause());
    // Create the AudioContext after the first gesture (not inside the Play click task).
    const arm = (): void => void window.setTimeout(() => this.audio.ensure(), 0);
    for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, arm, { once: true, capture: true });
    document.addEventListener('click', (e) => {
      const b = (e.target as Element).closest('button');
      if (b && !b.closest('#pad')) this.audio.play('uiClick');
    });
    this.resize();
    this.flow.showTitle();
    requestAnimationFrame((t) => this.frame(t));
  }

  /** Dev/test hook, only exposed with ?debug=1 (or in dev builds). */
  debugHandle(): Record<string, unknown> {
    return debugHandle({
      state: () => this.session.game, phase: () => this.session.phase, settings: () => this.settings,
      layout: () => this.renderer.currentLayout, profile: () => this.renderer.fx.profile, audio: this.audio, ambient: this.ambient,
    });
  }

  private applySettings(): void {
    applySettings(this.settings, { renderer: this.renderer, audio: this.audio, controls: this.controls, pad: $('pad'), soundButton: $('btn-sound'), systemReduced: this.motionQuery.matches });
  }

  private update(p: Partial<Settings>): void {
    this.settings = { ...this.settings, ...p };
    saveSettings(this.settings);
    this.applySettings();
  }

  private toggleMute(): void {
    this.audio.ensure();
    this.update({ muted: !this.settings.muted });
  }

  private resize(): void {
    const r = $('stage').getBoundingClientRect();
    this.renderer.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2));
  }

  start(mode: ModeId): void {
    const s = this.settings;
    const seedParam = Number(new URLSearchParams(location.search).get('seed'));
    const seed = seedParam > 0 ? seedParam : (Math.random() * 0xffffffff) >>> 0;
    this.flow.onStart();
    this.controls.releaseAll();
    this.cues.reset();
    this.session.start(defaultConfig({ seed, mode, startLevel: s.startLevel, dasFrames: msToFrames(s.das), arrFrames: msToFrames(s.arr), zenGarbage: s.zenGarbage, tuning: s.tuning }));
    this.screens.show(null, null);
    window.setTimeout(() => { // keep audio setup out of the click task
      this.audio.duckMusic(false);
      this.audio.play('start');
      this.ambient.start();
    }, 0);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  private autoPause(): void {
    if (this.session.phase === 'playing') this.flow.pause();
  }

  private onVisibility(): void {
    if (document.hidden) {
      this.autoPause();
      this.audio.suspend();
    } else this.audio.resume();
  }

  private openSettingsDialog(): void {
    const dialog = $<HTMLDialogElement>('settings');
    if (dialog.open) return;
    if (this.session.phase === 'playing') this.flow.pause();
    openSettings(dialog, this.settings, { captureKey: (cb) => (this.controls.capture = cb), onChange: (s) => this.update(s) });
    dialog.addEventListener('close', () => { this.controls.capture = null; this.flow.onSettingsClosed(); }, { once: true });
  }

  private info(status: ResultInfo['status']): ResultInfo {
    const g = this.session.game as GameState;
    return { mode: g.cfg.mode, status, score: g.score, lines: g.lines, ticks: g.ticks, pieces: g.piecesPlaced, level: g.level, seed: g.cfg.seed };
  }

  private onEvents(events: readonly GameEvent[], g: GameState): void {
    this.renderer.handleEvents(events);
    for (const c of cuesFor(events)) this.audio.play(c.name, c.arg ?? 0, c.delay ?? 0);
    const lines = announceFor(events, g);
    if (lines.length > 0) this.hud.announce(...lines);
    if (this.settings.haptics && this.renderer.fx.profile.tweens) this.buzz(events);
  }

  private buzz(events: readonly GameEvent[]): void {
    const ms = events.some((e) => e.type === 'clear') ? 25 : events.some((e) => e.type === 'lock') ? 10 : 0;
    if (ms > 0 && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  }

  private frame(now: number): void {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const s = this.session;
    s.advance(dt);
    this.renderer.draw(s.game, dt, { ghost: this.settings.ghost, paused: s.phase === 'paused', alpha: s.alpha, prev: s.prev });
    this.hud.update(s.game, this.settings.mode, this.book.records);
    if (s.game && s.phase === 'playing') this.liveCues(s.game);
    requestAnimationFrame((t) => this.frame(t));
  }

  private liveCues(g: GameState): void {
    for (const cue of this.cues.update(g, this.book.records[g.cfg.mode])) {
      this.audio.play(cue);
      if (cue === 'warn') this.hud.announce(S.live.danger);
      else if (cue === 'newBest') this.hud.announce(S.live.newBest);
    }
  }
}
