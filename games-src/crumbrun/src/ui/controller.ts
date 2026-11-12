// Wires the pause menu, confirmations, settings, how-to and game-over panels to the Game.
// All the "which dialog is up, what does Esc do" logic lives here, away from the DOM builders.
import type { Game, Phase } from '../flow';
import { STR } from '../strings';
import type { ScoreEntry, Settings, Stats } from '../storage';
import type { Announcer } from './announcer';
import { ModalHost } from './dialog';
import { confirmView, gameOverView, howToView, pauseView } from './views';
import { settingsView } from './settingsView';

export type View = 'none' | 'pause' | 'confirm' | 'settings' | 'howto' | 'gameover';

export interface UiDeps {
  readonly game: Game;
  readonly root: HTMLElement;
  readonly say: Announcer;
  readonly getSettings: () => Settings;
  readonly changeSettings: (patch: Partial<Settings>) => void;
  readonly getScores: () => ScoreEntry[];
  readonly getStats: () => Stats;
  readonly sound: { ui: () => void };
}

export class Ui {
  view: View = 'none';
  private readonly host: ModalHost;
  private settingsFrom: 'pause' | 'free' = 'free';
  private howReturn: 'title' | 'settings' = 'settings';

  constructor(private readonly d: UiDeps) {
    this.host = new ModalHost(d.root, () => d.sound.ui());
  }

  get modalOpen(): boolean {
    return this.view !== 'none';
  }

  private present(view: View, content: HTMLElement, label: string, onBackdrop?: () => void, anyInput?: () => void): void {
    this.view = view;
    this.host.show(content, {
      label, onBackdrop, onAnyInput: anyInput,
      initialFocus: () => this.d.root.querySelector<HTMLElement>('[data-initial]'),
    });
  }

  private close(): void {
    this.view = 'none';
    this.host.hide();
  }

  /** Game paused or resumed (button, key, blur, hidden tab). */
  onPause(paused: boolean, auto: boolean): void {
    if (paused) {
      this.d.say.say(STR.announce.paused, true);
      if (this.view === 'none') this.showPause(auto);
    } else if (this.view === 'pause' || this.view === 'confirm' || (this.view === 'settings' && this.settingsFrom === 'pause')) {
      this.close();
      this.d.say.say(STR.announce.resumed, true);
    }
  }

  onPhase(p: Phase): void {
    if (p === 'gameover') this.showGameOver();
    else if (this.view === 'gameover') this.close();
  }

  showPause(auto: boolean): void {
    const g = this.d.game;
    this.present('pause', pauseView({
      auto, resume: () => g.resume(), restart: () => this.showConfirm('restart'),
      settings: () => this.showSettings('pause'), quit: () => this.showConfirm('quit'),
    }), STR.pause.title, () => g.resume());
  }

  private showConfirm(kind: 'restart' | 'quit'): void {
    const g = this.d.game;
    this.present('confirm', confirmView({
      kind,
      yes: () => {
        this.close();
        if (kind === 'restart') g.restart();
        else g.quitToTitle();
      },
      cancel: () => this.showPause(g.autoPaused),
    }), kind === 'restart' ? STR.pause.confirmRestart : STR.pause.confirmQuit, () => this.showPause(g.autoPaused));
  }

  showSettings(from: 'pause' | 'free'): void {
    this.settingsFrom = from;
    if (from === 'free') this.d.game.setFrozen(true);
    const done = (): void => this.closeSettings();
    this.present('settings', settingsView({
      get: this.d.getSettings, change: this.d.changeSettings, howTo: () => this.showHowTo('settings'), done,
    }), STR.settings.title, done);
  }

  private closeSettings(): void {
    if (this.settingsFrom === 'pause') this.showPause(this.d.game.autoPaused);
    else {
      this.close();
      this.d.game.setFrozen(false);
    }
  }

  /** `title`: opened from the title screen (demo frozen meanwhile); `settings`: opened from the settings panel. */
  showHowTo(ret: 'title' | 'settings'): void {
    this.howReturn = ret;
    if (ret === 'title') this.d.game.setFrozen(true);
    const dismiss = (): void => this.dismissHowTo();
    this.present('howto', howToView(), STR.howTo.title, dismiss, dismiss);
  }

  private dismissHowTo(): void {
    if (this.howReturn === 'settings') {
      this.showSettings(this.settingsFrom);
      return;
    }
    this.d.changeSettings({ seen: true });
    this.close();
    this.d.game.setFrozen(false);
  }

  private showGameOver(): void {
    const run = this.d.game.lastRun;
    if (!run) return;
    this.present('gameover', gameOverView({
      run, scores: this.d.getScores(), best: this.d.getStats(),
      again: () => {
        this.close();
        this.d.game.startGame();
      },
      title: () => {
        this.close();
        this.d.game.toTitle();
      },
    }), STR.gameOver.title);
  }

  /** `O` key or the settings button. During a run this pauses first so the simulation stands still. */
  openSettings(): void {
    if (this.view === 'settings') return;
    if (this.modalOpen && this.view !== 'pause') return;
    const g = this.d.game;
    if (this.view === 'pause') {
      this.showSettings('pause');
      return;
    }
    if (g.phase === 'play' || g.phase === 'ready' || g.phase === 'dying') {
      g.togglePause();
      this.showSettings('pause');
    } else if (g.phase === 'title' || g.phase === 'summary') this.showSettings('free');
  }

  /** P / Esc. One handler so both keys always agree. */
  pauseKey(): void {
    switch (this.view) {
      case 'none': this.d.game.togglePause(); break;
      case 'pause': this.d.game.resume(); break;
      case 'confirm': this.showPause(this.d.game.autoPaused); break;
      case 'settings': this.closeSettings(); break;
      case 'howto': this.dismissHowTo(); break;
      case 'gameover': break;
    }
  }
}
