// Run lifecycle and screen flow: title, play, pause, continue, end. No rendering here.
import { A } from './appState';
import { applyAppearance } from './appearance';
import { configureAudio, emit } from './audio';
import { type DifficultyId, type ModeId } from './config';
import { announce, reduced } from './events';
import { accuracy, tierFor } from './summary';
import type { GameState } from './types';
import { bestFor, recordRun, saveScores } from './scores';
import { createFx } from './fx';
import { saveSettings, type SettingKey, type Settings } from './settings';
import { createGame, useContinue } from './state';
import { readFlag, writeFlag } from './storage';
import { S } from './strings';
import { byId } from './ui/dom';
import { hideOverlay } from './ui/overlay';
import { resetHud } from './ui/hud';
import { showContinue, showConfirm, showEnd, showPause, showTitle, type RunSummary } from './ui/screens';
import { showSettings } from './ui/settingsScreen';
import type { InputDevice } from './input';

const HINT_KEY = 'sky-hint-seen';
let input: InputDevice | null = null;
export const bindInput = (i: InputDevice): void => void (input = i);

export function applySettings(): void {
  applyAppearance(A.settings);
  configureAudio({ enabled: A.settings.sound, volume: A.settings.volume });
  saveSettings(A.settings);
}

function setSetting<K extends SettingKey>(key: K, value: Settings[K]): void {
  A.settings = { ...A.settings, [key]: value };
  applySettings();
}

const openSettings = (back: () => void): void =>
  showSettings({ get: () => A.settings, set: (k, v) => setSetting(k, v), onBack: back });

export function toTitle(focusKey?: string): void {
  A.screen = 'title';
  A.payoffT = undefined;
  A.game = null;
  byId('hint').hidden = true;
  const { difficulty, mode } = A.settings;
  showTitle({
    difficulty, mode, best: bestFor(A.scores, mode, difficulty),
    onDifficulty: (v: DifficultyId) => (setSetting('difficulty', v), toTitle(`level-${v}`)),
    onMode: (v: ModeId) => (setSetting('mode', v), toTitle(`mode-${v}`)),
    onPlay: startRun,
    onSettings: () => openSettings(() => toTitle('settings')),
  }, focusKey);
}

export function startRun(): void {
  const { mode, difficulty } = A.settings;
  A.game = createGame((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0, mode, difficulty);
  A.banner = null;
  A.payoffT = undefined;
  A.fx = createFx();
  resetHud();
  input?.clear();
  hideOverlay(false);
  A.screen = 'play';
  announce(S.live.start(1));
  if (!readFlag(HINT_KEY)) {
    byId('hint').hidden = false;
    byId('hint').dataset.fade = 'false';
    A.hintTimer = 9;
  }
}

export function dismissHint(): void {
  byId('hint').hidden = true;
  A.hintTimer = 0;
  writeFlag(HINT_KEY);
}

export function pauseGame(): void {
  if (A.screen !== 'play') return;
  A.screen = 'pause';
  input?.clear();
  announce(S.live.paused);
  pausePanel();
}

function pausePanel(focusKey?: string): void {
  showPause(resumeGame, () => confirmRestart(), () => openSettings(() => pausePanel('settings')), () => confirmQuit(), focusKey);
}

export function resumeGame(): void {
  if (A.screen !== 'pause') return;
  hideOverlay();
  A.screen = 'play';
  announce(S.live.resumed);
}

const confirmRestart = (): void => showConfirm(S.restart, S.confirmRestart, startRun, () => pausePanel('restart'));
const confirmQuit = (): void => showConfirm(S.quit, S.confirmQuit, () => finishRun(false, true), () => pausePanel('quit'));

/** End the run, save its score, then show the end screen (or go straight to the title when quitting). */
export function finishRun(won: boolean, quit = false): void {
  const g = A.game;
  if (!g) return toTitle();
  const { mode, difficulty } = A.settings;
  const { book, isBest } = recordRun(A.scores, mode, difficulty, g.score, g.wave.index);
  A.scores = book;
  saveScores(book);
  if (quit) return toTitle();
  A.screen = 'end';
  announce(won ? S.live.win(g.score) : S.live.over(g.score));
  showEnd({ won, summary: summaryOf(g), tier: tierFor(won, g.wave.index), isBest, best: bestFor(book, mode, difficulty), continuesUsed: g.continuesUsed }, startRun, () => toTitle(), reduced());
}

function summaryOf(g: GameState): RunSummary {
  return { score: g.score, wave: g.wave.index, kills: g.kills, accuracy: accuracy(g.stats), bestMult: g.stats.bestMult, bosses: g.bossesDown };
}

/** Seconds the explosion plays before the results card appears (the payoff comes first). */
export const payoffDelay = (won: boolean, reduce: boolean): number => (reduce ? 0.3 : won ? 1.6 : 1);

/** Called by the loop each frame while the sim is out of the 'playing' phase. */
export function onRunStopped(dt: number): void {
  const g = A.game;
  if (!g) return;
  input?.clear();
  A.payoffT ??= payoffDelay(g.phase === 'won', reduced());
  A.payoffT -= dt;
  if (A.payoffT > 0) return;
  A.payoffT = undefined;
  if (g.phase === 'won') return finishRun(true);
  if (g.continuesLeft <= 0) return finishRun(false);
  A.screen = 'continue';
  showContinue(g.continuesLeft, summaryOf(g), () => {
    if (useContinue(g)) {
      emit('pickup');
      hideOverlay(false);
      A.screen = 'play';
    }
  }, () => finishRun(false), reduced());
}
