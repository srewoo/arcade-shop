import './style/index.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import { CONFIG } from './config';
import { dailyKey, generateDaily } from './daily';
import { installDebug } from './debug';
import { findLevel, LEVELS, type Level } from './levels';
import { Play, type Summary } from './play';
import { isUnlocked, loadProgress, nextLevelId, recordResult, saveProgress, type Progress } from './progress';
import { formatTime } from './scoring';
import { loadSettings, parseField, saveSettings, type Settings } from './settings';
import { readFlag, writeFlag } from './storage';
import { S } from './strings';
import { buildAmbient, burstConfetti } from './ui/ambient';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { heroHtml, sceneSvg } from './ui/art';
import { BoardView } from './ui/boardView';
import { renderChips } from './ui/chips';
import { el } from './ui/dom';
import { hideToast, renderHud, renderTimer, say, toast } from './ui/hud';
import { nextToPlay, renderMenu } from './ui/menu';
import { closeTop, isOverlayOpen, installTrap, setBackground } from './ui/overlay';
import { initPanels } from './ui/panels';
import { attachRoving } from './ui/roving';

interface Current {
  readonly id: string;
  readonly title: string;
  readonly daily?: string;
}

let settings = loadSettings();
let progress: Progress = loadProgress();
let current: Current | null = null;
let inGame = false;
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = (): boolean => isReducedMotion(settings.reduceMotion, reduceQuery.matches);

const view = new BoardView(el('board'), el('board-box'), { onActivate: (i) => play.activate(i), reducedMotion: reduced });
const play = new Play(view, {
  say,
  sfx: (n) => void emit(n),
  changed: () => { if (play.status !== 'won') el('win-banner').hidden = true; renderHud(play); syncClock(); onFirstMove(); if (play.status !== 'stuck') hideToast(); },
  celebrate: () => celebrate(),
  won: (s) => finish(s),
  stuck: () => toast(S.stuck, CONFIG.timing.toastMs),
});
const panels = initPanels(
  {
    changed: syncClock,
    canPause: () => inGame && play.active,
    moves: () => play.session?.moves ?? 0,
    restart: () => play.restart(),
    quit: () => showMenu(),
    setting: changeSetting,
  },
  { next: () => { const id = current ? nextLevelId(current.id) : undefined; const l = id ? findLevel(id) : undefined; if (l) startLevel(l); else showMenu(); },
    replay: () => play.restart(), menu: () => showMenu() },
);

function syncClock(): void {
  play.setPaused(isOverlayOpen() || document.hidden || !inGame);
}

function changeSetting(key: keyof Settings, value: unknown): void {
  const parsed = parseField(key, value);
  if (parsed === undefined) return;
  settings = { ...settings, [key]: parsed };
  saveSettings(settings);
  applySettings();
}

function applySettings(): void {
  applyAppearance(settings, reduceQuery.matches);
  configureAudio({ enabled: settings.sound, volume: settings.volume });
  renderChips(el('settings-overlay'), settings);
  el<HTMLInputElement>('volume').value = String(settings.volume);
  el('volume-out').textContent = String(settings.volume);
  const sound = el('sound');
  sound.setAttribute('aria-pressed', String(settings.sound));
  sound.setAttribute('aria-label', settings.sound ? S.soundOn : S.soundOff);
}

function showMenu(): void {
  inGame = false;
  el('view-game').hidden = true;
  el('view-menu').hidden = false;
  renderMenu(progress, dailyKey(new Date()), { open: startLevel, locked: (m) => toast(m, CONFIG.timing.toastMs) });
  syncClock();
  el('play-next').focus({ preventScroll: true });
}

function enterGame(): void {
  inGame = true;
  el('view-menu').hidden = true;
  el('view-game').hidden = false;
  el('confetti').replaceChildren();
  el('win-banner').hidden = true;
}

function startLevel(level: Level): void {
  current = { id: level.id, title: S.levelName(S.groups[level.group], level.label) };
  begin(level.spec);
}

function startDaily(): void {
  const date = dailyKey(new Date());
  const puzzle = generateDaily(date);
  current = { id: 'daily', title: S.dailyName(date), daily: date };
  begin(puzzle.spec);
}

function begin(spec: Parameters<Play['start']>[0]): void {
  enterGame();
  el('level-title').textContent = current?.title ?? '';
  play.start(spec);
  view.fit();
  if (!readFlag(CONFIG.keys.onboarded)) {
    el('onboard-text').textContent = S.onboarding;
    el('onboard').hidden = false;
  }
  syncClock();
  view.focusPad(Math.max(0, spec.start.search(/[AB]/)));
}

function onFirstMove(): void {
  if ((play.session?.moves ?? 0) > 0 && !el('onboard').hidden) dismissOnboarding();
}

function dismissOnboarding(): void {
  el('onboard').hidden = true;
  writeFlag(CONFIG.keys.onboarded);
}

/** Win payoff: sound, confetti and a banner on the pond, before the result card appears. */
function celebrate(): void {
  emit('win');
  const banner = el('win-banner');
  banner.textContent = S.celebrate;
  banner.hidden = false;
  if (!reduced()) burstConfetti(el('confetti'), CONFIG.fx.confetti, 1600);
}

function finish(s: Summary): void {
  const cur = current;
  if (!cur) return;
  const { progress: next, improved } = recordResult(progress, cur.id, s.moves, s.ms, s.stars, cur.daily);
  progress = next;
  saveProgress(progress);
  const rec = cur.daily ? progress.daily : progress.levels[cur.id];
  panels.openResult({
    summary: s,
    newBest: improved,
    bestLine: rec ? S.bestLine(rec.bestMoves, formatTime(rec.bestMs)) : '',
    hasNext: !cur.daily && nextLevelId(cur.id) !== undefined && isUnlocked(progress, nextLevelId(cur.id) as string),
  });
}

function requestRestart(): void {
  if (!play.session) return;
  if (play.session.moves === 0 || play.status === 'won') return play.restart();
  panels.openConfirm(S.restartConfirm, S.confirmRestartYes, () => play.restart());
}

function leaveGame(): void {
  if (play.active && (play.session?.moves ?? 0) > 0) panels.openConfirm(S.quitConfirm, S.confirmQuitYes, showMenu);
  else showMenu();
}

function onKey(e: KeyboardEvent): void {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
  const key = e.key.toLowerCase();
  if (e.key === 'Escape') {
    if (!closeTop() && inGame && play.active) panels.openPause(false);
    return;
  }
  if (e.target instanceof HTMLInputElement && key !== 'm') return;
  if (key === 'm') return changeSetting('sound', !settings.sound);
  if (key === 'p' && inGame) return panels.togglePause();
  if (isOverlayOpen() || !inGame) return;
  if (key === 'u') play.undo();
  else if (key === 'h') play.hint();
  else if (key === 'r') requestRestart();
}

function autoPause(): void {
  if (inGame && play.active && !isOverlayOpen()) panels.openPause(true);
  syncClock();
}

function bind(): void {
  el('play-next').addEventListener('click', () => startLevel(nextToPlay(progress)));
  el('play-daily').addEventListener('click', startDaily);
  el('open-howto').addEventListener('click', (e) => panels.openHowto(e.currentTarget as HTMLElement));
  for (const id of ['open-settings', 'open-settings-g']) el(id).addEventListener('click', (e) => panels.openSettings(e.currentTarget as HTMLElement));
  el('sound').addEventListener('click', () => changeSetting('sound', !settings.sound));
  el('to-menu').addEventListener('click', leaveGame);
  el('undo').addEventListener('click', () => play.undo());
  el('hint').addEventListener('click', () => play.hint());
  el('restart').addEventListener('click', requestRestart);
  el('onboard-close').addEventListener('click', dismissOnboarding);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => (document.hidden ? autoPause() : syncClock()));
  window.addEventListener('blur', autoPause);
  reduceQuery.addEventListener('change', applySettings);
  document.querySelectorAll<HTMLElement>('fieldset[data-setting]').forEach((g) =>
    attachRoving(g, { columns: 1, items: () => [...g.querySelectorAll<HTMLElement>('button')] }));
  window.setInterval(() => inGame && renderTimer(play), 250);
}

function boot(): void {
  el('scene').innerHTML = sceneSvg();
  el('scene').setAttribute('viewBox', '0 0 400 240');
  buildAmbient(el('ambient'));
  el('hero').innerHTML = heroHtml();
  setBackground([el('app')]);
  installTrap();
  installAudioUnlock();
  applySettings();
  bind();
  installDebug({
    play,
    progress: () => progress,
    unlockAll: () => { progress = { ...progress, levels: Object.fromEntries(LEVELS.slice(0, -1).map((l) => [l.id, { stars: 1 as const, bestMoves: 0, bestMs: 0 }])) }; saveProgress(progress); showMenu(); },
    start: (id) => { const l = findLevel(id); if (l) startLevel(l); else if (id === 'daily') startDaily(); },
  });
  showMenu();
}

boot();
