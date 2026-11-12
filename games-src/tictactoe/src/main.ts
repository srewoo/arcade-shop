import './style/tokens.css';
import './style/base.css';
import './style/board.css';
import './style/panels.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import { CONFIG } from './config';
import { CPU, Controller, type MoveInfo } from './controller';
import { isOver, type GameState } from './game';
import { recordResult } from './results';
import { loadScores, loadStats, saveScores, saveStats, EMPTY_SCORES, type Scores, type Stats } from './scores';
import { clearSession, loadSession, saveSession } from './session';
import { RESTART_KEYS, loadSettings, parseField, saveSettings, type SettingKey, type Settings } from './settings';
import { roundStarter, shouldAutoPause, shouldOpenOptions } from './status';
import { S } from './strings';
import { readFlag, writeFlag } from './storage';
import { applyAppearance, applyFxVars, isReducedMotion } from './ui/appearance';
import { createArmed } from './ui/armed';
import { buildBoard, renderBoard } from './ui/board';
import { el, later, qs } from './ui/dom';
import { burstConfetti, shake } from './ui/fx';
import { createStrike } from './ui/strike';
import { createResult } from './ui/result';
import type { Host } from './ui/host';
import { initInput } from './ui/input';
import { isOverlayOpen, installTrap, setBackground } from './ui/overlay';
import { initPanels } from './ui/panels';
import { renderScoreboard } from './ui/scoreboard';
import { exposeDebug } from './debug';
import { renderChrome, renderStatus, type ViewContext } from './ui/render';

const THEMES = ['system', 'light', 'dark'] as const;
const SEEN_KEY = 'ttt-seen';

let settings: Settings = loadSettings();
let scores: Scores = loadScores();
let stats: Stats = loadStats();
let pendingVanish: number | null = null;
let milestone: number | null = null;
let startMessage = false;
let pendingChange: { key: SettingKey; value: unknown } | null = null;
let onboarding = !readFlag(SEEN_KEY);

const board = el('board');
const cells = buildBoard(board, (i) => host.attempt(i));
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = (): boolean => isReducedMotion(settings.reduceMotion, motion.matches);

const strike = createStrike(board, cells);
const result = createResult(() => requestNewRound());
const ctrl = new Controller(
  { settings: () => settings, onMove: handleMove, onChange: () => render() },
  settings.variant,
  roundStarter(settings.first, 0),
);
const newRoundArm = createArmed(CONFIG.ui.confirmNewRoundMs, () => render());
const resetArm = createArmed(CONFIG.ui.confirmResetMs, () => render());

const started = (): boolean => ctrl.state.moves > 0 && !isOver(ctrl.state);

function announce(text: string): void {
  const node = el('toast');
  node.textContent = '';
  window.setTimeout(() => (node.textContent = text), 30);
}

function dismissOnboarding(): void {
  if (!onboarding) return;
  onboarding = false;
  writeFlag(SEEN_KEY);
}

function saveCurrentSession(): void {
  if (isOver(ctrl.state)) clearSession();
  else saveSession({ round: ctrl.round, starter: ctrl.starter, variant: ctrl.state.variant, moves: ctrl.history });
}

function finishRound(s: GameState): void {
  const result = recordResult(loadScores(), loadStats(), s, settings.opponent);
  scores = result.scores;
  stats = result.stats;
  milestone = result.milestone;
  saveScores(scores);
  if (settings.opponent === 'cpu') saveStats(stats);
  const humanWon = s.winner !== null && (settings.opponent === 'human' || s.winner !== CPU);
  emit(s.draw ? 'draw' : humanWon ? 'win' : 'lose', 0.15);
  if (milestone) announce(S.streakMilestone(milestone));
  collapseOptions();
  celebrate(s, humanWon);
}

/** After the first finished round the setup chips step aside so the board leads. */
function collapseOptions(): void {
  if (pendingChange) return;
  qs<HTMLDetailsElement>('#options-box').open = false;
}

function celebrate(s: GameState, humanWon: boolean): void {
  if (!reduced() && s.winner) {
    later(() => {
      if (ctrl.state !== s) return;
      if (humanWon) burstConfetti(el('confetti'), CONFIG.fx.confettiCount, CONFIG.fx.confettiMs);
      else shake(el('board-wrap'), CONFIG.fx.shakeMs);
    }, CONFIG.fx.drawMs + CONFIG.fx.strokeStaggerMs);
  }
  if (!isOverlayOpen()) {
    const next = el('new-round');
    next.focus();
    next.classList.add('pulse');
    later(() => next.classList.remove('pulse'), CONFIG.ui.pulseMs * 2);
  }
}

function handleMove(info: MoveInfo, s: GameState): void {
  dismissOnboarding();
  pendingVanish = info.vanishedCell;
  const mark = info.mover === 'X' ? 'x' : 'o';
  if (info.vanished) {
    emit('vanish');
    emit(mark, 0.1);
  } else {
    emit(mark);
  }
  if (s.variant === 'vanishing' && s.moves === CONFIG.rules.vanishWarnAt) emit('warn', 0.2);
  if (isOver(s)) finishRound(s);
  saveCurrentSession();
  render();
}

function startRound(advance: boolean): void {
  newRoundArm.disarm();
  milestone = null;
  const next = ctrl.round + (advance ? 1 : 0);
  const starter = roundStarter(settings.first, next);
  startMessage = settings.opponent === 'cpu' && starter === CPU;
  if (startMessage) later(() => ((startMessage = false), render()), CONFIG.fx.startMessageMs);
  ctrl.newRound(starter, advance, settings.variant);
  saveCurrentSession();
  emit('start');
}

function requestNewRound(): void {
  if (!started() || newRoundArm.armed) return startRound(true);
  newRoundArm.arm();
  emit('deny');
}

function resetScores(): void {
  if (!resetArm.armed) return resetArm.arm();
  resetArm.disarm();
  scores = { ...EMPTY_SCORES };
  saveScores(scores);
  emit('ui');
  announce('Scores reset');
  render();
}

function commit(patch: Partial<Settings>): void {
  const restart = (Object.keys(patch) as SettingKey[]).some((k) => RESTART_KEYS.includes(k));
  settings = { ...settings, ...patch };
  saveSettings(settings);
  applyAppearance(settings, motion.matches);
  configureAudio({ enabled: settings.sound, volume: settings.volume });
  if (restart) startRound(false);
  else {
    ctrl.schedule();
    render();
  }
}

function changeSetting(key: SettingKey, raw: unknown): void {
  const value = parseField(key, raw);
  if (value === undefined || value === settings[key]) return;
  if (RESTART_KEYS.includes(key) && started()) {
    pendingChange = { key, value };
    qs<HTMLDetailsElement>('#options-box').open = true;
    render();
    el('confirm-yes').focus();
    return;
  }
  pendingChange = null;
  commit({ [key]: value });
  if (key !== 'volume' && key !== 'sound') emit('ui');
  if (key === 'sound' && settings.sound) emit('ui');
}

function confirmPending(yes: boolean): void {
  const change = pendingChange;
  pendingChange = null;
  if (yes && change) commit({ [change.key]: change.value });
  else render();
  qs('#options-box summary').focus();
}

function attempt(index: number): void {
  const result = ctrl.humanMove(index);
  if (result === 'denied' && !ctrl.paused) emit('deny');
  else if (result === 'queued') emit('ui');
}

const host: Host = {
  ctrl, settings: () => settings, changeSetting, confirmPending, requestNewRound, startRound, resetScores,
  attempt, announce, render: () => render(),
};

function viewContext(): ViewContext {
  return {
    settings, ctrl, onboarding, startMessage,
    newRoundArmed: newRoundArm.armed,
    resetArmed: resetArm.armed,
    pendingChange: pendingChange !== null,
    started: started(),
  };
}

function render(): void {
  const s = ctrl.state;
  if (pendingChange && !started()) pendingChange = null;
  renderBoard(cells, s, {
    vanished: pendingVanish, queued: ctrl.premove, reducedMotion: reduced(), vanishMs: CONFIG.fx.vanishMs,
  });
  pendingVanish = null;
  board.classList.toggle('thinking-cpu', ctrl.cpuTurn);
  strike.render(s, reduced());
  result.render(s, settings.opponent, reduced());
  renderScoreboard(s, scores, stats, settings, milestone);
  const view = viewContext();
  renderStatus(s, view);
  renderChrome(s, view);
}

function boot(): void {
  applyFxVars();
  applyAppearance(settings, motion.matches);
  configureAudio({ enabled: settings.sound, volume: settings.volume });
  installAudioUnlock();
  installTrap();
  setBackground([el('app')]);
  qs<HTMLDetailsElement>('#options-box').open = shouldOpenOptions(
    scores.X + scores.O + scores.draw,
    Math.min(window.innerWidth, window.innerHeight),
  );
  const panels = initPanels(host);
  initInput(host, panels, cells);
  el('new-round').addEventListener('click', requestNewRound);
  el('reset').addEventListener('click', resetScores);
  el('sound').addEventListener('click', () => changeSetting('sound', !settings.sound));
  el('theme').addEventListener('click', () => {
    changeSetting('theme', THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length]);
  });
  el('onboard-close').addEventListener('click', () => {
    dismissOnboarding();
    render();
  });
  // Only pause when the page truly lost focus. blur also fires as focus moves
  // between the page's own controls and dialogs, so re-check after it settles.
  const autoPause = (): void => {
    if (shouldAutoPause(ctrl.inProgress, document.hidden, document.hasFocus())) panels.openPause(true);
  };
  document.addEventListener('visibilitychange', () => document.hidden && autoPause());
  window.addEventListener('blur', () => window.setTimeout(autoPause, 0));
  motion.addEventListener('change', () => {
    applyAppearance(settings, motion.matches);
    render();
  });
  window.addEventListener('storage', (e) => {
    if (e.key !== 'ttt-scores' && e.key !== 'ttt-stats') return;
    scores = loadScores();
    stats = loadStats();
    render();
  });
  new ResizeObserver(() => strike.relayout(ctrl.state)).observe(board);
  exposeHooks();
  const saved = loadSession(settings.variant);
  if (saved) ctrl.restore(saved.state, saved.starter, saved.round, saved.history);
  else render();
  ctrl.schedule();
}

function exposeHooks(): void {
  exposeDebug({
    state: () => ctrl.state,
    settings: () => settings,
    scores: () => scores,
    stats: () => stats,
    isPaused: () => ctrl.paused,
    setScores: (next) => {
      scores = next;
      saveScores(next);
      render();
    },
  });
}

boot();
