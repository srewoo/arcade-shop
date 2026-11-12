import './style.css';
// Wiring: fixed-timestep loop, input, screens, persistence and audio.
import { playEvent, setSoundEnabled, setVolume, unlockAudio } from './audio';
import { fitCanvas } from './canvasFit';
import { Phase, advanceClock, shouldSimulate } from './clock';
import { byId } from './dom';
import { updateHud } from './hud';
import { pendingHint } from './hints';
import { bindInput } from './input';
import { PUZZLES } from './levels';
import { bindOverlayKeys, goBack } from './overlay';
import { render } from './render';
import { RenderOpts } from './renderTypes';
import { buildResult } from './result';
import {
  Actions, hideOverlay, overlayOpen, showConfirm, showHelp, showPause, showPuzzles, showResult, showTitle,
} from './screens';
import { Scores, Settings, dailyTodayBest, dayNumber, loadScores, loadSettings, recordScore, saveScores, saveSettings } from './settings';
import { showSettings } from './settingsScreen';
import { aim, requestFire, swap } from './shoot';
import { Game, Mode, newGame } from './state';
import { S } from './strings';
import { TUNING } from './config';
import { STEP, Held, update } from './update';

let settings: Settings = loadSettings();
let scores: Scores = loadScores();
let game: Game = newGame('arcade', { seed: 7 });
let phase: Phase = 'menu';
let pauseScreen = false;
let resultAt = 0;
let hintTimer = 0;
let alpha = 1;
const held: Held = { left: false, right: false };
const canvas = byId<HTMLCanvasElement>('game');
const ctx2d = canvas.getContext('2d') as CanvasRenderingContext2D;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const opts: RenderOpts = { symbols: false, time: 0, alpha: 1, textScale: 1, highContrast: false, scale: 1, highlight: null };
const today = (): number => dayNumber(new Date());

const reducedMotion = (): boolean => settings.motion === 'reduce' || (settings.motion === 'system' && motionQuery.matches);
const announce = (text: string): void => {
  byId('sr-status').textContent = text;
};

function applySettings(): void {
  const root = document.documentElement;
  if (settings.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = settings.theme;
  root.dataset.motion = reducedMotion() ? 'reduce' : 'full';
  root.dataset.text = String(settings.textScale);
  root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  root.style.setProperty('--ui-scale', String(settings.textScale / 100));
  game.reduced = reducedMotion();
  setSoundEnabled(settings.sound);
  setVolume(settings.volume);
  const mute = byId('mute');
  mute.setAttribute('aria-pressed', String(!settings.sound));
  mute.setAttribute('aria-label', settings.sound ? S.soundOnLabel : S.soundOffLabel);
  opts.symbols = settings.symbols;
  opts.textScale = settings.textScale / 100;
  opts.highContrast = settings.highContrast;
}

function changeSettings(patch: Partial<Settings>): void {
  settings = { ...settings, ...patch };
  saveSettings(settings);
  applySettings();
}

const titleInfo = (): { scores: Scores; symbols: boolean; dailyToday: number } =>
  ({ scores, symbols: settings.symbols, dailyToday: dailyTodayBest(scores, today()) });

function beginPlay(): void {
  phase = 'play';
  held.left = held.right = false;
  resultAt = 0;
  acc = 0;
  byId('hint').classList.remove('show');
  hideOverlay();
  canvas.focus();
  playEvent({ type: 'start', n: 0 });
}

function startGame(mode: Mode, puzzleIndex = 0): void {
  if (mode === 'puzzle' && puzzleIndex < 0) return showPuzzles(scores, actions);
  game = newGame(mode, { puzzleIndex, reduced: reducedMotion(), seed: mode === 'daily' ? today() : undefined });
  beginPlay();
  if (!settings.seenTutorial) {
    // Non-blocking first-run hint in the reserved strip beside/below the board.
    showHintText(S.firstRunHint, TUNING.timers.firstRunHintMs);
    changeSettings({ seenTutorial: true });
  }
}

const toMenu = (): void => {
  phase = 'menu';
  pauseScreen = false;
  game = newGame('arcade', { seed: 7, reduced: reducedMotion() });
  showTitle(titleInfo(), actions);
};

const returnScreen = (key: string): (() => void) => (phase === 'pause' ? () => showPauseScreen(key) : () => showTitle(titleInfo(), actions, key));

function showPauseScreen(focusKey?: string): void {
  pauseScreen = true;
  showPause(actions, () => confirm(S.confirmRestart, S.yesRestart, restart), () => confirm(S.confirmQuit, S.yesQuit, toMenu), focusKey);
}

function confirm(title: string, yes: string, run: () => void): void {
  pauseScreen = false;
  showConfirm(title, yes, run, () => showPauseScreen('resume'));
}

function restart(): void {
  pauseScreen = false;
  startGame(game.mode, game.puzzleIndex);
}

const actions: Actions = {
  start: startGame,
  menu: toMenu,
  resume: () => setPaused(false),
  restart,
  settings: changeSettings,
  openSettings: () => {
    pauseScreen = false;
    showSettings(actions, () => settings, returnScreen('settings'));
  },
  openHelp: () => {
    pauseScreen = false;
    showHelp(returnScreen('help'));
  },
};

function setPaused(on: boolean): void {
  if (on && phase === 'play') {
    phase = 'pause';
    held.left = held.right = false;
    playEvent({ type: 'pause', n: 0 });
    announce(S.status.paused);
    showPauseScreen();
  } else if (!on && phase === 'pause') {
    phase = 'play';
    pauseScreen = false;
    acc = 0;
    hideOverlay();
    canvas.focus();
    playEvent({ type: 'resume', n: 0 });
    announce(S.status.resumed);
  }
}

function finishGame(): void {
  const g = game;
  const puzzle = g.mode === 'puzzle' && g.status === 'won' ? { index: g.puzzleIndex, stars: g.stars } : undefined;
  const rec = recordScore(scores, g.mode, g.score, puzzle, today());
  scores = rec.scores;
  saveScores(scores);
  phase = 'result';
  if (rec.best && g.score > 0) playEvent({ type: 'best', n: 0 });
  const next = g.status === 'won' && g.puzzleIndex + 1 < PUZZLES.length
    ? { label: S.nextLevel, run: () => startGame('puzzle', g.puzzleIndex + 1) }
    : undefined;
  showResult(buildResult(g, rec.best, () => startGame(g.mode, g.puzzleIndex), next), actions, reducedMotion());
  announce(g.status === 'won' ? S.status.won(g.stars, g.score) : g.status === 'finished' ? S.status.timesUp(g.score) : S.status.gameOver(g.score));
}

function showHintText(text: string, ms: number): void {
  const el = byId('hint');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => el.classList.remove('show'), ms);
}

function showHint(kind: Parameters<typeof pendingHint>[1][number]): void {
  showHintText(S.hints[kind], TUNING.timers.hintMs);
  changeSettings({ seenHints: [...settings.seenHints, kind] });
}

function resize(): void {
  opts.scale = fitCanvas(canvas, ctx2d, byId('stage'));
}

let last = performance.now();
let acc = 0;
function frame(now: number): void {
  const simulating = shouldSimulate(phase);
  const clock = advanceClock(acc, (now - last) / 1000);
  last = now;
  acc = simulating ? clock.acc : 0;
  alpha = simulating ? clock.alpha : 1;
  for (let i = 0; simulating && i < clock.steps; i++) {
    update(game, STEP, phase === 'play' ? held : { left: false, right: false });
    for (const e of game.events) playEvent(e);
    game.events.length = 0;
  }
  if (phase === 'play') afterPlayFrame(now);
  opts.time = now / 1000;
  opts.alpha = alpha;
  opts.highlight = null;
  render(ctx2d, game, opts);
  updateHud(game, scores, today(), !!game.ball);
  requestAnimationFrame(frame);
}

function afterPlayFrame(now: number): void {
  if (game.status !== 'playing' && game.status !== 'cleared') {
    resultAt ||= now + TUNING.timers.resultDelayMs;
    if (now >= resultAt) {
      resultAt = 0;
      finishGame();
    }
  }
  const hint = pendingHint(game, settings.seenHints);
  if (hint) showHint(hint);
}

const active = (): boolean => phase === 'play' && !overlayOpen();
const fireNow = (): void => void (active() && requestFire(game));
bindInput(canvas, held, {
  active,
  aim: (a) => aim(game, a),
  fire: fireNow,
  swap: () => void swap(game),
  pause: () => (phase === 'play' ? setPaused(true) : phase === 'pause' && pauseScreen ? setPaused(false) : undefined),
  back: () => {
    if (!goBack() && phase === 'play') setPaused(true);
  },
  mute: () => changeSettings({ sound: !settings.sound }),
  gesture: unlockAudio,
});
bindOverlayKeys();
byId('btn-fire').addEventListener('click', fireNow);
byId('btn-swap').addEventListener('click', () => active() && swap(game));
byId('btn-pause').addEventListener('click', () => setPaused(phase === 'play'));
byId('mute').addEventListener('click', () => {
  unlockAudio();
  changeSettings({ sound: !settings.sound });
});
motionQuery.addEventListener('change', applySettings);
document.addEventListener('visibilitychange', () => document.hidden && setPaused(true));
window.addEventListener('blur', () => setPaused(true));
window.addEventListener('resize', resize);
document.addEventListener('pointerdown', unlockAudio, { capture: true });
new ResizeObserver(resize).observe(byId('stage'));

applySettings();
resize();
showTitle(titleInfo(), actions);
if (import.meta.env.DEV || import.meta.env.VITE_E2E === '1') {
  void (async () => {
    const { installDebug } = await import('./debug');
    installDebug({ get: () => game, set: (g) => { g.reduced = reducedMotion(); game = g; phase = 'play'; hideOverlay(); }, phase: () => phase });
  })();
}
requestAnimationFrame(frame);
