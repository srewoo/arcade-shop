// Overlay flow: title, pause (with confirmations), result, and first-run help.
import type { Ambient } from './audio/ambient';
import type { AudioEngine } from './audio/engine';
import { feel } from './config/feel';
import type { ModeId } from './core/modes';
import type { Controls } from './input/controls';
import { RecordBook, type ResultInfo } from './records';
import type { Session } from './session';
import { loadHelpSeen, saveHelpSeen, type Settings } from './settings';
import { S } from './strings';
import { confirmCard, pauseCard, resultCard, titleCard } from './ui/cards';
import type { Hud } from './ui/hud';
import type { Screens } from './ui/screens';
import { copySeed } from './ui/share';

export interface FlowDeps {
  session: Session;
  screens: Screens;
  audio: AudioEngine;
  ambient: Ambient;
  hud: Hud;
  controls: Controls;
  book: RecordBook;
  settings(): Settings;
  update(p: Partial<Settings>): void;
  start(mode: ModeId): void;
  openSettings(): void;
  /** True while the Settings dialog is open (it sits in the top layer, above the overlay). */
  isSettingsOpen(): boolean;
  touch: boolean;
}

export class Flow {
  private helpSeen = loadHelpSeen();
  private resultTimer: number | null = null;
  private pendingResult: (() => void) | null = null;

  constructor(private readonly d: FlowDeps) {
    if (this.helpSeen) document.documentElement.dataset.help = 'seen';
  }

  showTitle(): void {
    const d = this.d;
    this.cancelResult();
    d.session.toTitle();
    d.ambient.stop();
    d.audio.duckMusic(false);
    const s = d.settings();
    const card = titleCard({ selected: s.mode, records: d.book.records, zenGarbage: s.zenGarbage, helpSeen: this.helpSeen, touch: d.touch }, {
      onSelect: (m) => d.update({ mode: m }),
      onPlay: () => d.start(d.settings().mode),
      onSettings: () => d.openSettings(),
      onZenGarbage: (on) => d.update({ zenGarbage: on }),
      onHelpDismiss: () => this.markHelpSeen(),
    });
    d.screens.show('title', card, '#btn-play');
  }

  markHelpSeen(): void {
    if (this.helpSeen) return;
    this.helpSeen = true;
    saveHelpSeen();
    document.documentElement.dataset.help = 'seen';
  }

  /** A run is starting: first-run coach on touch, and the help strip counts as shown. */
  onStart(): void {
    this.cancelResult();
    if (!this.helpSeen && this.d.touch) {
      const el = document.getElementById('coach') as HTMLElement;
      el.textContent = S.help.coach;
      el.hidden = false;
      window.setTimeout(() => (el.hidden = true), feel.coachSeconds * 1000);
    }
    this.markHelpSeen();
  }

  pause(): void {
    const d = this.d;
    if (!d.session.pause()) return;
    d.controls.releaseAll();
    d.audio.play('pause');
    d.audio.duckMusic(true);
    d.ambient.halt();
    d.hud.announce(S.live.paused);
    this.showPauseCard();
  }

  private showPauseCard(): void {
    const d = this.d;
    const g = d.session.game;
    const summary = g ? S.pause.summary(g.rules.label, g.score.toLocaleString(), g.lines) : '';
    d.screens.show('pause', pauseCard(summary, {
      onResume: () => this.resume(),
      onRestart: () => this.confirm('restart', () => d.start(d.session.game?.cfg.mode ?? d.settings().mode)),
      onQuit: () => this.confirm('quit', () => this.showTitle()),
      onSettings: () => d.openSettings(),
    }), '#btn-resume');
  }

  private confirm(kind: 'restart' | 'quit', yes: () => void): void {
    this.d.screens.show('confirm', confirmCard(kind, yes, () => this.showPauseCard()), '#btn-keep');
  }

  resume(): void {
    const d = this.d;
    if (!d.session.resume()) return;
    d.controls.releaseAll();
    d.screens.show(null, null);
    d.audio.duckMusic(false);
    d.audio.play('resume');
    d.ambient.resume();
    d.hud.announce(S.live.resumed);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  /** P / Esc / Start: pause while playing; on the Pause card resume, on a confirmation go back. */
  toggle(): void {
    const d = this.d;
    if (d.session.phase === 'playing') this.pause();
    else if (d.session.phase === 'paused') {
      if (d.screens.kind === 'confirm') this.showPauseCard();
      else this.resume();
    }
  }

  cancelResult(): void {
    if (this.resultTimer !== null) window.clearTimeout(this.resultTimer);
    this.resultTimer = null;
    this.pendingResult = null;
  }

  /** Settings closed: show a result card that was held back while the dialog was open. */
  onSettingsClosed(): void {
    const show = this.pendingResult;
    this.pendingResult = null;
    show?.();
  }

  finish(info: ResultInfo): void {
    const d = this.d;
    d.controls.releaseAll();
    d.ambient.halt();
    const { previous, newBest } = d.book.commit(info);
    const show = (): void => {
      if (d.session.phase !== 'ended') return;
      d.screens.showResult(resultCard(info, previous, newBest, {
        onAgain: () => d.start(info.mode),
        onQuit: () => this.showTitle(),
        onCopySeed: () => void copySeed(info.seed, document.getElementById('seed-out')),
      }));
    };
    this.resultTimer = window.setTimeout(() => {
      this.resultTimer = null;
      if (d.isSettingsOpen()) this.pendingResult = show; // never layer the card under the dialog
      else show();
    }, feel.resultDelayMs);
  }
}
