// The App: owns settings, the current session and which screen is showing. Rendering lives in
// GameScreen, timing in GameClock, input wiring in bindings.ts.
import { playSfx, type Sfx } from '../audio';
import { TIMING } from '../config/timing';
import type { Difficulty } from '../core/grader';
import { dateKey } from '../core/rng';
import { fillPool, loadDailyCache, loadPool, type MadePuzzle } from '../generation';
import { clearSavedGame, loadSavedGame, storeGame } from '../savedGame';
import { Session, type NewGameInit, type PauseReason, type SessionEvent } from '../session';
import type { Settings } from '../storage';
import { STR } from '../strings';
import { bindCoach, hideCoach, maybeShowCoach } from '../ui/coach';
import { bindCustomDialog } from '../ui/customDialog';
import { $, focusQuietly } from '../ui/dom';
import { bindEnd, hideEnd, showEnd } from '../ui/endScreen';
import { renderHero } from '../ui/hero';
import { clearPopups } from '../ui/popups';
import { bindPauseOverlay } from '../ui/pauseOverlay';
import { bindSettingsDialog } from '../ui/settingsDialog';
import { renderRules, renderTitle } from '../ui/title';
import { bindGame, bindTitle, makeController, type Controller } from './bindings';
import { GameScreen } from './gameScreen';
import { GameClock } from './lifecycle';
import { Preferences } from './preferences';
import { Results } from './results';
import { routeEvent } from './events';
import { Starter } from './startFlow';

export class App {
  private readonly prefs = new Preferences((next) => this.onSettings(next));
  private get settings(): Settings {
    return this.prefs.value;
  }
  private readonly results = new Results();
  private session: Session | null = null;
  private again: (() => void) | null = null;
  private readonly starter = new Starter();
  private readonly screen = new GameScreen((c) => this.selectCell(c), (d) => this.session?.input(d));
  private readonly clock = new GameClock({
    session: () => this.session,
    gameVisible: () => this.screen.visible,
    paint: (s, extra) => this.screen.frame(s, extra),
    save: () => this.save(),
    autoPause: (r) => this.autoPause(r),
    onReturn: () => this.focusResume(),
  });
  private settingsUi = { open: (): void => undefined, sync: (): void => undefined };
  private customOpen: () => void = () => undefined;

  start(): void {
    this.prefs.start();
    renderRules();
    renderHero();
    loadPool();
    loadDailyCache();
    const ctl = this.controller();
    bindTitle(ctl);
    bindGame(ctl);
    bindCoach();
    this.customOpen = bindCustomDialog((p, s) => this.launchCustom(p, s)).open;
    this.settingsUi = bindSettingsDialog({
      get: () => this.settings, set: (p) => this.setSetting(p), onOpen: () => this.pauseForSettings(),
      onVolumeCommit: () => this.sfx('tap'),
    });
    bindPauseOverlay({
      resume: () => this.resume(), restart: () => this.restart(), quit: () => this.showTitle(),
      settings: () => this.settingsUi.open(),
    });
    bindEnd(() => this.results.shareString, () => this.showTitle());
    this.showTitle();
    this.clock.start();
    window.setTimeout(() => (window.requestIdleCallback ?? window.setTimeout)(fillPool), TIMING.poolStartDelayMs);
  }

  /** Test/debug handle, exposed only with ?debug=1 (see main.ts). */
  debugHandle(): { session: () => Session | null } {
    return { session: () => this.session };
  }

  private controller(): Controller {
    return makeController({
      session: () => this.session, visible: () => this.screen.visible, setSetting: (p) => this.setSetting(p),
      settings: () => this.settings, play: (d) => void this.begin(d), continueGame: () => this.continueGame(),
      openCustom: () => this.customOpen(), openSettings: () => this.settingsUi.open(), togglePause: () => this.togglePause(),
      resume: () => this.resume(), menu: () => this.showTitle(),
      playAgain: () => {
        hideEnd(false);
        this.again?.();
      },
      select: (c) => this.selectCell(c),
    });
  }

  // ---- screens -------------------------------------------------------------------------

  private hasContinuable(): boolean {
    const s = this.session;
    return (s !== null && (s.status === 'playing' || s.status === 'paused')) || loadSavedGame() !== null;
  }

  private renderTitleScreen(): void {
    renderTitle(this.settings, this.results.bests, this.results.titleInfo(this.settings, this.hasContinuable()));
  }

  /** Back to the title. The run is paused (never lost) and can be continued. */
  private showTitle(): void {
    hideCoach(false);
    hideEnd(false);
    this.session?.pause('menu');
    this.save();
    this.screen.show(false);
    this.screen.render(this.session);
    clearPopups();
    this.renderTitleScreen();
  }

  private showGame(): void {
    this.screen.show(true);
    this.screen.render(this.session);
    if (this.session?.playing) focusQuietly(this.screen.board.cells[this.session.selected]?.btn);
  }

  private sfx(name: Sfx): void {
    playSfx(name, this.settings.sound, this.prefs.volume);
  }

  private selectCell(cell: number): void {
    const s = this.session;
    if (!s) return;
    s.select(cell);
    this.screen.board.focusSelected(cell);
    this.sfx('tap');
  }

  // ---- settings, sound -------------------------------------------------------------------

  private setSetting(patch: Partial<Settings>): void {
    this.prefs.set(patch);
  }

  private onSettings(next: Settings): void {
    if (this.session) this.session.autoRemoveNotes = next.autoRemoveNotes;
    if (!this.screen.visible) this.renderTitleScreen();
    this.settingsUi.sync();
  }

  /** Opening Settings stops the clock; closing it leaves the game paused for the player to resume. */
  private pauseForSettings(): void {
    if (this.screen.visible) this.session?.pause('settings');
  }

  // ---- starting games ------------------------------------------------------------------

  private async begin(daily: boolean): Promise<void> {
    const difficulty = this.settings.difficulty;
    this.again = () => void this.begin(daily);
    const made = await this.starter.acquire(difficulty, daily);
    if (made) this.launch(made, daily ? dateKey() : null, false);
  }

  private launch(made: MadePuzzle, daily: string | null, ready: boolean): void {
    this.attach({
      puzzle: made.puzzle, solution: made.solution, mode: this.settings.mode, difficulty: made.difficulty as Difficulty,
      daily, custom: false, mistakeLimit: this.settings.mistakeLimit,
    }, ready);
  }

  private launchCustom(p: { puzzle: number[]; solution: number[]; difficulty: Difficulty }, solveNow: boolean): void {
    const init: NewGameInit = {
      puzzle: p.puzzle, solution: p.solution, mode: 'classic', difficulty: p.difficulty, daily: null, custom: true, mistakeLimit: false,
    };
    this.attach(init, false);
    if (solveNow) this.session?.solveAll();
  }

  private initFrom(s: Session): NewGameInit {
    return {
      puzzle: s.game.puzzle, solution: s.game.solution, mode: s.mode, difficulty: s.difficulty, daily: s.daily,
      custom: s.custom, mistakeLimit: s.mistakeLimit,
    };
  }

  private attach(init: NewGameInit, ready: boolean): void {
    this.again = () => this.attach(init, true);
    this.attachSession(new Session(init, (e) => this.onEvent(e)), ready, true);
  }

  private attachSession(s: Session, ready: boolean, fresh: boolean): void {
    s.autoRemoveNotes = this.settings.autoRemoveNotes;
    this.session = s;
    hideEnd(false);
    clearPopups();
    this.screen.newSession();
    this.clock.reset();
    if (ready) s.pause('ready');
    this.save();
    this.showGame();
    if (fresh && !ready) {
      this.sfx('start');
      maybeShowCoach();
    }
  }

  private continueGame(): void {
    const live = this.session;
    if (live && (live.status === 'playing' || live.status === 'paused')) {
      live.pause('ready');
      this.showGame();
      return;
    }
    const saved = loadSavedGame();
    if (!saved) {
      this.renderTitleScreen();
      this.starter.setNote(STR.savedExpired);
      return;
    }
    const s = new Session(saved, (e) => this.onEvent(e));
    this.again = () => this.attach(this.initFrom(s), true);
    this.attachSession(s, true, false);
  }

  private restart(): void {
    const s = this.session;
    if (s) this.attach(this.initFrom(s), true);
  }

  // ---- pause -----------------------------------------------------------------------------

  private togglePause(): void {
    const s = this.session;
    if (!s) return;
    if (s.status === 'paused') this.resume();
    else s.pause('manual');
  }

  private resume(): void {
    const s = this.session;
    if (!s) return;
    s.resume();
    focusQuietly(this.screen.board.cells[s.selected]?.btn);
  }

  private autoPause(reason: PauseReason): void {
    if (this.screen.visible && this.session?.playing) this.session.pause(reason);
  }

  private focusResume(): void {
    if (this.session?.status === 'paused' && this.screen.visible && !document.querySelector('dialog[open]')) focusQuietly($('btn-resume'));
  }

  // ---- events and results ---------------------------------------------------------------

  private onEvent(e: SessionEvent): void {
    const s = this.session;
    if (!s) return;
    routeEvent(e, {
      screen: this.screen, settings: this.settings, session: s, finish: () => this.finishGame(s), save: () => this.save(),
    });
  }

  private finishGame(s: Session): void {
    clearSavedGame();
    const { rec, canShare } = this.results.finish(s);
    this.screen.render(s);
    hideCoach();
    showEnd(s, rec, canShare);
    this.renderTitleScreen();
    if (rec.newTime || rec.newScore) window.setTimeout(() => this.sfx('record'), 700);
  }

  private save(): void {
    const s = this.session;
    if (s && (s.status === 'playing' || s.status === 'paused')) storeGame(s.toRestored());
  }
}
