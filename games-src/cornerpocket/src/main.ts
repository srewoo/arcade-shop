// Wiring: screens, settings, pause, game lifecycle, render loop, sound and effects.
import { Sfx } from './audio';
import { canvasSetup } from './canvasSetup';
import { coachVisible, hideCoach, showCoach } from './coach';
import { LAYOUT } from './config/layout';
import { Fx } from './fx';
import { Game } from './game';
import type { GameEvent, GameOptions, Mode, OverInfo } from './gameTypes';
import { showHelp } from './helpUi';
import { Input } from './input';
import { hideModal, modalOpen } from './modal';
import { showConfirm, showPause } from './pauseUi';
import { applyPrefs } from './prefs';
import { drawPreview } from './preview';
import { recordResult, withBest } from './progress';
import { drawFrame } from './render';
import { colorOf } from './renderBalls';
import { sfxForOver } from './sfxMap';
import { showSettings } from './settingsPanel';
import { type Progress, type Settings, loadProgress, loadSettings, parseSettings, saveProgress, saveSettings } from './settings';
import { timerSpeech } from './srTimer';
import { STR } from './strings';
import { TRICKS } from './tricks';
import { $, announce, announceTimer, hideOverlay, renderBest, renderHud, renderTrickGrid, setPower, setShootDisabled, showOverlay } from './ui';
import './style.css';

let settings: Settings = loadSettings();
let progress: Progress = loadProgress();
let game: Game | null = null;
let lastOpts: GameOptions | null = null;
let modalKind: 'none' | 'pause' | 'confirm' | 'settings' | 'help' = 'none';
let overTimer: number | undefined;
let confirmThen: (() => void) | null = null;
let textScale = 1;
let lastTimer: number | null = null;
const sfx = new Sfx();
const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
const fx = new Fx(false);
const input = new Input($<HTMLCanvasElement>('table'), () => game, onKey, () => modalOpen() || !!game?.paused);
const cv = canvasSetup($<HTMLCanvasElement>('table'), $('stage'), input);
const playVisible = (): boolean => !$('play').hidden;

function applySettings(patch: Partial<Settings> = {}, persist = true): void {
  settings = parseSettings({ ...settings, ...patch });
  if (persist) saveSettings(settings);
  const a = applyPrefs(settings, reduceMq.matches);
  fx.reduced = a.reduced;
  textScale = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;
  sfx.muted = !settings.sound;
  sfx.setVolume(settings.volume / 100);
  const s = $('sound');
  s.textContent = settings.sound ? 'Sound on' : 'Sound off';
  s.setAttribute('aria-pressed', String(settings.sound));
  document.querySelectorAll<HTMLButtonElement>('[data-setting="level"] button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset['value'] === settings.level));
  });
  renderBest(progress, settings.lastMode);
  if (!$('menu').hidden) drawPreview($<HTMLCanvasElement>('preview'));
}

function show(screen: 'menu' | 'tricks' | 'play'): void {
  $('menu').hidden = screen !== 'menu';
  $('tricks').hidden = screen !== 'tricks';
  $('play').hidden = screen !== 'play';
  $('app').classList.toggle('playing', screen === 'play');
  if (screen === 'play') cv.update();
  if (screen === 'menu') drawPreview($<HTMLCanvasElement>('preview'));
}

function toMenu(): void {
  game = null; window.clearTimeout(overTimer); fx.clear(); hideOverlay(); hideCoach(); closeModal();
  renderBest(progress, settings.lastMode);
  show('menu');
  $('play-last').focus();
}

function start(opts: GameOptions): void {
  lastOpts = opts;
  window.clearTimeout(overTimer); fx.clear(); hideOverlay(); closeModal(); lastTimer = null;
  game = new Game({ ...opts, level: settings.level, seed: opts.seed ?? (Date.now() & 0xffff) });
  game.on(onEvent);
  if (opts.mode !== settings.lastMode) applySettings({ lastMode: opts.mode });
  show('play');
  syncSpin();
  $('table').focus();
  if (!settings.seen) showCoach(dismissCoach);
}

function dismissCoach(): void {
  if (!coachVisible()) return;
  hideCoach();
  if (!settings.seen) applySettings({ seen: true });
  $('table').focus();
}

function onEvent(e: GameEvent): void {
  switch (e.t) {
    case 'shot': sfx.shot(e.power); fx.strike(game!.cue.x, game!.cue.y, e.power); dismissCoach(); break;
    case 'hit': sfx.clack(e.speed); break;
    case 'cushion': sfx.cushion(e.speed); break;
    case 'pot':
      fx.drop(e.x, e.y, e.id);
      if (e.cue) { sfx.scratch(); fx.sparkle(e.x, e.y, '#ff6a4d'); fx.scratchShake(); } else { sfx.pot(); fx.sparkle(e.x, e.y, colorOf(e.id)); }
      break;
    case 'text': fx.say(e.text, e.tone); announce(e.text); break;
    case 'combo': sfx.chime(e.level); break;
    case 'sfx': sfx.play(e.name, e.n); break;
    case 'over': onOver(e.info); break;
  }
}

function onOver(raw: OverInfo): void {
  const info = withBest(progress, raw);
  progress = recordResult(progress, info);
  saveProgress(progress);
  for (const c of sfxForOver(info)) sfx.playCall(c);
  announce(`${info.title}. ${info.detail}`);
  fx.say(info.title, info.won || info.newBest ? 'good' : 'info');
  if ((info.won || info.newBest) && !fx.reduced) { fx.sparkle(400, 200, '#ffe27a'); fx.sparkle(250, 140, '#fff6c9'); fx.sparkle(550, 260, '#ffe27a'); }
  const idx = info.trick;
  const next = info.mode === 'trick' && info.won && idx !== undefined && idx < TRICKS.length - 1 ? () => start({ mode: 'trick', level: settings.level, trick: idx + 1 }) : null;
  const g = game;
  window.clearTimeout(overTimer);
  overTimer = window.setTimeout(() => {
    if (game === g) showOverlay(info, { retry: () => lastOpts && start(lastOpts), next, menu: toMenu });
  }, (fx.reduced ? LAYOUT.resultDelayReduced : LAYOUT.resultDelaySeconds) * 1000);
}

// ---- pause, confirm, settings -------------------------------------------------------------
function closeModal(): void { hideModal($('table')); modalKind = 'none'; }

function pause(): void {
  if (!game || game.phase === 'over' || !playVisible()) return;
  if (!game.paused) { game.setPaused(true); input.reset(); announce(STR.srPaused); }
  showPausePanel();
}

function showPausePanel(): void {
  modalKind = 'pause';
  showPause({
    resume, restart: () => askAbandon(() => lastOpts && start(lastOpts)), quit: () => askAbandon(toMenu),
    settings: () => openSettings(), toggleSound: () => applySettings({ sound: !settings.sound }), soundOn: () => settings.sound,
  });
}

function resume(): void {
  if (!game) return;
  closeModal(); game.setPaused(false); announce(STR.srResumed); // hideModal restores focus to the opener (canvas if none)
}

function askAbandon(then: () => void): void {
  modalKind = 'confirm'; confirmThen = then;
  showConfirm(() => { confirmThen?.(); }, () => { if (game?.paused) showPausePanel(); else closeModal(); });
}

function openSettings(): void {
  if (game && game.phase !== 'over' && playVisible() && !game.paused) { game.setPaused(true); input.reset(); }
  modalKind = 'settings';
  showSettings(settings, (p) => applySettings(p), closeSettings);
}

function closeSettings(): void {
  if (game && game.paused && game.phase !== 'over') showPausePanel(); else closeModal();
}

function openHelp(): void {
  if (!game || !playVisible()) return;
  if (game.phase !== 'over' && !game.paused) { game.setPaused(true); input.reset(); }
  modalKind = 'help';
  showHelp(closeSettings);
}

function onKey(k: string): void {
  if (k === 'm') applySettings({ sound: !settings.sound });
  else if (k === 'Escape') onEscape();
  else if (k === 'p' && game) { if (game.paused && modalKind === 'pause') resume(); else if (!game.paused) pause(); }
  else if (k === 'r' && game && lastOpts && playVisible() && game.phase !== 'over') { pause(); askAbandon(() => lastOpts && start(lastOpts)); }
  else if (k === 'Enter') { if (coachVisible()) dismissCoach(); else input.shootNow(); }
  else if (k === 'spin') syncSpin();
}

function onEscape(): void {
  if (modalKind === 'settings' || modalKind === 'help') closeSettings();
  else if (modalKind === 'confirm') { if (game?.paused) showPausePanel(); else closeModal(); }
  else if (modalKind === 'pause') resume();
  else if (coachVisible()) dismissCoach();
  else if (game && playVisible()) pause();
}

function syncSpin(): void {
  const spin = game?.spin ?? 0;
  document.querySelectorAll<HTMLButtonElement>('#spin-group button').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset['spin']) === spin));
  });
  $('spin-lbl').textContent = STR.spinLabel(spin);
}

// ---- DOM wiring -------------------------------------------------------------------------------
function bindUi(): void {
  document.querySelectorAll<HTMLButtonElement>('.mode').forEach((b) => b.addEventListener('click', () => startMode(b.dataset['mode'] as Mode)));
  $('play-last').addEventListener('click', () => startMode(settings.lastMode));
  $('tricks-back').addEventListener('click', toMenu);
  $('sound').addEventListener('click', () => applySettings({ sound: !settings.sound }));
  $('settings-btn').addEventListener('click', openSettings);
  $('settings-btn-play').addEventListener('click', openSettings);
  $('help-btn').addEventListener('click', openHelp);
  $('pause-btn').addEventListener('click', pause);
  document.querySelectorAll<HTMLButtonElement>('[data-setting="level"] button').forEach((b) => b.addEventListener('click', () => {
    applySettings({ level: b.dataset['value'] === 'pro' ? 'pro' : 'easy' });
  }));
  document.querySelectorAll<HTMLButtonElement>('#spin-group button').forEach((b) => b.addEventListener('click', () => {
    if (game) game.spin = Number(b.dataset['spin']);
    syncSpin();
  }));
  $('shoot').addEventListener('click', () => input.shootNow());
  for (const [id, key] of [['aim-left', 'ArrowLeft'], ['aim-right', 'ArrowRight']] as const) {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); input.holdKey(key, true); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, () => input.holdKey(key, false));
  }
  document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('button')) sfx.ui(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  reduceMq.addEventListener?.('change', () => applySettings({}, false));
  window.addEventListener('resize', () => applySettings({}, false));
}

function startMode(mode: Mode): void {
  if (mode === 'trick') { renderTrickGrid(progress, (i) => start({ mode: 'trick', level: settings.level, trick: i })); show('tricks'); }
  else start({ mode, level: settings.level });
}

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (game && playVisible()) tickGame(game, dt, now);
  requestAnimationFrame(frame);
}

function tickGame(g: Game, dt: number, now: number): void {
  if (!g.paused) {
    input.update(dt);
    g.update(dt);
    fx.update(dt);
  }
  const clock = g.ctl.clock?.() ?? null;
  const speech = timerSpeech(lastTimer, clock);
  if (speech) announceTimer(speech);
  lastTimer = clock;
  const view = cv.view;
  if (cv.ctx && view) {
    const coachT = coachVisible() ? (fx.reduced ? 0.6 : ((now / 1000) % 2) / 2) : null;
    drawFrame(cv.ctx, g, {
      view, dpr: cv.dpr, cssW: cv.cssW, cssH: cv.cssH, fx, assist: settings.colorAssist, textScale,
      ui: { dragging: input.isDragging, grabFlash: input.grabFlash, coachT }, grab: input.grab,
    });
  }
  renderHud(g.ctl.hud());
  setPower(g.power);
  setShootDisabled(!g.humanTurn || g.phase === 'rolling' || g.paused);
}

bindUi();
applySettings();
show('menu');
requestAnimationFrame(frame);

if (new URLSearchParams(location.search).get('debug') === '1') {
  void import('./debugHooks').then((m) => m.install({ start, fx, sfx, pause, resume, getGame: () => game, getView: () => cv.view, getSettings: () => settings }));
}
