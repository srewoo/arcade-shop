// Wiring: settings, canvas loop, HUD, overlays, pause/auto-pause and the optional ?debug=1 hook.
import './style.css';
import './lane.css';
import './panels.css';
import { AudioEngine } from './audio';
import { applySettings } from './applySettings';
import { announce, clearBanners, showBanner, showCallout } from './bannerView';
import { coachVisible, hideCoach, initCoach, showCoach } from './coach';
import { drawFrame } from './draw';
import { playFinale } from './finale';
import { byId } from './dom';
import { Game } from './game';
import { hudRefs, updateHudText, updateMeters } from './hud';
import { bindKeyboard } from './keyboard';
import { highScoreKey, humanScores, matchScore, type Match } from './match';
import { Menu } from './menu';
import { PauseOverlay } from './pauseView';
import { bindPointer } from './pointerInput';
import { hideResults, resultsOpen, showResults } from './results';
import { resultsDelayMs } from './resultsText';
import { Dialog } from './dialog';
import { renderScoreboard } from './scoreboardView';
import { SettingsPanel } from './settingsView';
import { addHighScore, loadHighScores, loadSettings, saveHighScores, saveSettings, type Settings } from './settings';
import { isSpare } from './match';
import { loadStats, recordGame, saveStats, tallyRolls } from './stats';
import { S } from './strings';
import { TUNING } from './tuning';

let settings: Settings = loadSettings();
let scores = loadHighScores();
let stats = loadStats();
let started = false;
let resultsTimer = 0;

const canvas = byId<HTMLCanvasElement>('lane');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D is not available');
const audio = new AudioEngine();
const refs = hudRefs();
const scoreboard = byId('scoreboard');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

function persist(next: Settings): void {
  settings = next;
  saveSettings(settings);
}

function apply(): void {
  applySettings(settings, game, audio, motion.matches);
}

function onOver(match: Match): void {
  const key = highScoreKey(match);
  const ranks = humanScores(match).map((score) => {
    const r = addHighScore(scores, key, score, Date.now());
    scores = r.scores;
    return r.rank;
  });
  saveHighScores(scores);
  menu.setScores(scores);
  if (!isSpare(match)) {
    match.players.forEach((p, i) => { if (!p.cpu) stats = recordGame(stats, matchScore(match, i), tallyRolls(match.rolls[i] ?? [])); });
    saveStats(stats);
    menu.setStats(stats);
  }
  const best = scores[key][0]?.score ?? 0;
  announce(`${S.gameOver} ${match.players.map((p, i) => `${p.name} ${matchScore(match, i)}`).join(', ')}`);
  // Payoff first: the banner and confetti play on the lane, then the tiered card opens.
  const tier = playFinale(game, audio);
  window.clearTimeout(resultsTimer);
  resultsTimer = window.setTimeout(() => showResults({ match, ranks, best }, () => startGame(), () => openMenu()), resultsDelayMs(tier, game.pres.reduced));
}

const game = new Game(audio, {
  onChange: () => renderScoreboard(scoreboard, game.match),
  onBanner: (b) => showBanner(b),
  onOver,
  onCallout: (text) => showCallout(text === 'pocket' ? S.callouts.pocket : S.callouts.nice),
  onThrow: onHumanThrow,
});

function onHumanThrow(): void {
  persist({ ...settings, seenIntro: true, throws: Math.min(1000, settings.throws + 1) });
  if (coachVisible()) hideCoach();
}

const helpDialog = new Dialog(byId('helpdlg'));
const overlayOpen = (): boolean => menu.isOpen || pause.isOpen || settingsPanel.isOpen || resultsOpen() || helpDialog.isOpen;
const activePlay = (): boolean => started && game.stage !== 'over' && !overlayOpen();

const menu = new Menu(settings, scores, {
  onStart: () => startGame(),
  onSettings: () => settingsPanel.open(),
  onChange: persist,
});
menu.setStats(stats);

const settingsPanel = new SettingsPanel(() => settings, (patch) => { persist({ ...settings, ...patch }); apply(); settingsPanel.sync(); }, () => undefined);

const pause = new PauseOverlay({
  onResume: () => resumeGame(),
  onRestart: () => { pause.close(); startGame(); },
  onSettings: () => settingsPanel.open(),
  onQuit: () => quitToTitle(),
});

function startGame(): void {
  started = true;
  window.clearTimeout(resultsTimer);
  hideResults();
  menu.close();
  pause.close();
  clearBanners();
  audio.unlock();
  game.start({ mode: settings.mode, players: settings.players, cpuLevel: settings.cpuLevel });
  if (!settings.seenIntro) showCoach();
  audio.ui('open');
}

function openMenu(): void {
  window.clearTimeout(resultsTimer);
  menu.open(settings);
}

function openPause(): void {
  if (!activePlay()) return;
  game.setPaused(true);
  pause.open();
  audio.ui('open');
  announce(S.paused);
}

function resumeGame(): void {
  pause.close(true);
  game.setPaused(false);
  audio.ui('close');
}

function quitToTitle(): void {
  window.clearTimeout(resultsTimer);
  pause.close();
  started = false;
  game.start({ mode: settings.mode, players: settings.players, cpuLevel: settings.cpuLevel });
  openMenu();
}

function openSettingsFromHeader(): void {
  audio.unlock();
  if (activePlay()) openPause();
  audio.ui('open');
  settingsPanel.open();
}

function resize(): void {
  const rect = byId('stage').getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(200, Math.round(rect.width));
  const h = Math.max(240, Math.round(rect.height));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.pres.resize(w, h);
}

function toggleMute(): void {
  persist({ ...settings, sound: !settings.sound });
  apply();
}

function togglePause(): void {
  if (pause.isOpen && !settingsPanel.isOpen) resumeGame();
  else openPause();
}

byId('menu-btn').addEventListener('click', () => { audio.unlock(); if (started && game.stage !== 'over' && !overlayOpen()) openPause(); else if (!overlayOpen()) openMenu(); });
byId('sound').addEventListener('click', () => { audio.unlock(); toggleMute(); });
byId('settings-btn').addEventListener('click', openSettingsFromHeader);
byId('help-btn').addEventListener('click', () => { audio.unlock(); if (activePlay()) openPause(); helpDialog.open(byId('help-close')); });
byId('help-close').addEventListener('click', () => helpDialog.close());
byId('lock').addEventListener('click', () => { audio.unlock(); if (game.humanTurn) game.confirm(); else game.skip(); });
byId('back').addEventListener('click', () => game.back());
for (const [id, dir] of [['left', -1], ['right', 1]] as const) {
  const b = byId(id);
  b.addEventListener('pointerdown', () => { game.hold = dir; audio.ui('tap'); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { game.hold = 0; });
  b.addEventListener('click', (e) => { if (e.detail === 0) game.nudge(dir * TUNING.timing.nudgeCm * 1.3); });
}
// One tap cue for every button; the lock button has its own meter blips.
document.addEventListener('click', (e) => { if ((e.target as Element).closest('button:not(#lock)')) audio.ui('tap'); }, true);
bindKeyboard(game, { isBlocked: overlayOpen, toggleMute, unlockAudio: () => audio.unlock(), togglePause, openPause, slideCue: () => audio.ui('tap') });
bindPointer(canvas, game, () => audio.unlock());
initCoach(() => persist({ ...settings, seenIntro: true }));
new ResizeObserver(resize).observe(byId('stage'));
motion.addEventListener('change', apply);

// Auto-pause: a hidden tab or a window that lost focus never keeps a ball rolling. Resume is manual.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { openPause(); audio.sleep(); } else audio.wake();
});
window.addEventListener('blur', () => { game.hold = 0; openPause(); });

const coarse = window.matchMedia('(pointer: coarse)');
/** One input scheme at a time: drag on touch, Space on desktop. Lives in the side column, not over the lane. */
function updateTip(): void {
  const hint = byId('hint');
  const want = game.humanTurn && !coachVisible() && !overlayOpen() ? (coarse.matches ? S.tipTouch : S.tipKeys) : '';
  if (hint.textContent !== want) hint.textContent = want;
  hint.classList.toggle('fresh', settings.throws < TUNING.input.dragHintThrows);
}

let last = performance.now();
let menuLabel = '';
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (started && !game.paused) game.update(dt);
  drawFrame(ctx!, game);
  updateHudText(refs, game);
  updateMeters(refs, game);
  const label = started && game.stage !== 'over' ? S.pause : S.menu;
  if (label !== menuLabel) { menuLabel = label; byId('menu-btn').textContent = label; }
  updateTip();
  requestAnimationFrame(frame);
}

apply();
resize();
renderScoreboard(scoreboard, game.match);
openMenu();
requestAnimationFrame(frame);

if (new URLSearchParams(location.search).has('debug')) {
  void import('./debug').then((m) => m.installDebug(game, startGame, { audio, settings: () => settings }));
}
