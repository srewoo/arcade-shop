// Screen flow: title, run start/restart/quit, pause, results and settings dialogs.
import { CONFIG } from '../config';
import { LEVELS, LEVEL_COUNT } from '../levels';
import { clearTier, type ClearTier } from '../sim/scoring';
import { recordCampaign, recordEndless, saveProgress } from '../progress';
import { advance, newRun, type Mode } from '../run';
import { saveSettings } from '../settings';
import { S } from '../strings';
import { $ } from './dom';
import { resetHudCache } from './hud';
import { closeOverlay, isOpen, openOverlay } from './overlays';
import { app, fx, say } from './state';
import { syncSettingsUi } from './settingsUi';
import { applyAll } from './apply';
import { markHintSeen, maybeShowHint } from './onboard';
import { renderTitleStats } from './menu';

type Confirm = 'restart' | 'quit' | null;
let confirming: Confirm = null;
let payoffTimer = 0;

/** Let the clear / game-over payoff (banner, confetti, shake) play before the result card appears. */
function afterPayoff(fn: () => void): void {
  window.clearTimeout(payoffTimer);
  const ms = app.reduced ? CONFIG.fx.payoffReducedMs : CONFIG.fx.payoffMs;
  payoffTimer = window.setTimeout(fn, ms);
}

const focusCanvas = (): void => $('canvas').focus({ preventScroll: true });

export function showScreen(screen: 'title' | 'game'): void {
  app.screen = screen;
  $('app').dataset.screen = screen;
  $('title').hidden = screen !== 'title';
  $('game').hidden = screen !== 'game';
}

export function showTitle(): void {
  closeAll();
  app.run = null;
  app.paused = false;
  showScreen('title');
  renderTitleStats();
  $('btn-play').focus();
}

function closeAll(): void {
  window.clearTimeout(payoffTimer);
  for (const id of ['pause-overlay', 'result-overlay', 'settings-overlay', 'levels-overlay', 'how-overlay']) {
    const el = $(id);
    if (isOpen(el)) closeOverlay(el);
  }
  hideConfirm();
}

export function startRun(mode: Mode, level: number): void {
  closeAll();
  app.run = newRun(mode, level, app.seed);
  app.paused = false;
  app.acc = 0;
  app.input?.clearHeld();
  fx.clear();
  resetHudCache();
  showScreen('game');
  say(titleFor());
  maybeShowHint();
  focusCanvas();
}

export function titleFor(): string {
  const run = app.run;
  if (!run) return '';
  const n = run.world.level;
  return run.mode === 'endless' ? S.endlessTitle(n) : S.levelTitle(n, LEVELS[n - 1]?.name ?? '');
}

/** Persist best scores for the current run (called when it ends or is left). */
export function commitRun(): void {
  const run = app.run;
  if (!run) return;
  const p = app.progress;
  app.progress = run.mode === 'campaign' ? { ...p, bestCampaign: Math.max(p.bestCampaign, run.world.score) } : recordEndless(p, run.world.level, run.world.score);
  saveProgress(app.progress);
}

export function pauseGame(): void {
  if (app.screen !== 'game' || app.paused || !app.run) return;
  const ph = app.run.world.phase;
  if (ph !== 'ready' && ph !== 'playing') return;
  app.paused = true;
  app.input?.clearHeld();
  say(S.announce.paused);
  hideConfirm();
  openOverlay($('pause-overlay'), { onEsc: resumeGame, focus: $('pause-resume'), fallback: $('canvas') });
}

export function resumeGame(): void {
  if (!app.paused) return;
  hideConfirm();
  app.paused = false;
  app.acc = 0;
  closeOverlay($('pause-overlay'));
  focusCanvas();
}

export const togglePause = (): void => (app.paused ? resumeGame() : pauseGame());

function hideConfirm(): void {
  confirming = null;
  $('pause-confirm').hidden = true;
}

export function askConfirm(kind: Exclude<Confirm, null>): void {
  confirming = kind;
  $('pause-confirm-text').textContent = kind === 'restart' ? S.confirmRestart : S.confirmQuit;
  $('pause-confirm').hidden = false;
  $('pause-confirm-no').focus();
}

export function acceptConfirm(): void {
  const kind = confirming;
  hideConfirm();
  if (kind === 'quit') {
    commitRun();
    showTitle();
  } else if (kind === 'restart' && app.run) {
    commitRun();
    startRun(app.run.mode, app.run.world.level);
  }
}

export function cancelConfirm(): void {
  hideConfirm();
  $('pause-resume').focus();
}

export function openSettings(): void {
  syncSettingsUi(app.settings);
  if (app.screen === 'game') pauseGame();
  openOverlay($('settings-overlay'), { focus: $('settings-close') });
}

export function closeSettings(): void {
  saveSettings(app.settings);
  closeOverlay($('settings-overlay'));
}

function showResult(title: string, body: string, buttons: { next: boolean; retry: boolean }, tier: ClearTier | null = null): void {
  $('result-title').textContent = title;
  $('result-body').textContent = body;
  const badge = $('result-tier');
  badge.hidden = tier === null;
  if (tier) {
    badge.dataset.tier = tier;
    badge.textContent = S.tier[tier];
  }
  $('result-next').hidden = !buttons.next;
  $('result-retry').hidden = !buttons.retry;
  app.resultOpen = true;
  const focus = buttons.next ? $('result-next') : buttons.retry ? $('result-retry') : $('result-menu');
  openOverlay($('result-overlay'), { onEsc: () => undefined, focus, fallback: $('canvas') });
}

export function onClear(): void {
  const run = app.run;
  if (!run) return;
  const w = run.world;
  const prevBest = run.mode === 'campaign' ? app.progress.bestCampaign : app.progress.bestEndless;
  commitRun();
  if (run.mode === 'campaign') {
    app.progress = recordCampaign(app.progress, w.level, w.score);
    saveProgress(app.progress);
  }
  const last = run.mode === 'campaign' && w.level >= LEVEL_COUNT;
  const tier = clearTier(Math.max(0, run.levelStartLives - w.lives));
  const body = `${S.score} ${w.score} · ${S.lives} ${w.lives}${w.score > prevBest ? ` · ${S.newBest}` : ''} ${S.tierBody[tier]}`;
  afterPayoff(() => showResult(last ? S.campaignDone : S.cleared, body, { next: !last, retry: false }, tier));
}

export function onOver(): void {
  const run = app.run;
  if (!run) return;
  const prevBest = run.mode === 'campaign' ? app.progress.bestCampaign : app.progress.bestEndless;
  commitRun();
  const extra = run.world.score > prevBest ? ` · ${S.newBest}` : '';
  afterPayoff(() => showResult(S.gameOver, `${S.score} ${run.world.score} · ${S.level} ${run.world.level}${extra}`, { next: false, retry: true }));
}

export function nextLevel(): void {
  const run = app.run;
  if (!run) return;
  closeOverlay($('result-overlay'));
  app.resultOpen = false;
  if (advance(run)) {
    app.acc = 0;
    fx.clear();
    resetHudCache();
    say(titleFor());
    focusCanvas();
  } else showTitle();
}

export function retryRun(): void {
  const run = app.run;
  if (!run) return;
  app.resultOpen = false;
  startRun(run.mode, run.world.level);
}

export function applySettings(next: typeof app.settings): void {
  app.settings = next;
  applyAll();
  saveSettings(next);
}

export { markHintSeen };
