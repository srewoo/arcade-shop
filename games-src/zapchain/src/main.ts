import './style/tokens.css';
import './style/base.css';
import './style/overlay.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import { autopilotMove, installDebug } from './debug';
import { Game } from './game';
import type { SimEvent } from './model/types';
import { Renderer } from './render/frame';
import { computeView, type Reserve, type View } from './render/view';
import { cueFor } from './sfxMap';
import { loadSettings, saveSettings, type SettingKey, type Settings } from './settings';
import { readFlag, writeFlag } from './storage';
import { pick, S } from './strings';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { closeDialog, installFocusTrap, openDialog } from './ui/dialogs';
import { must } from './ui/dom';
import { createHud } from './ui/hud';
import { installInput } from './ui/input';
import { createScreens } from './ui/screens';
import { bindSettings } from './ui/settingsPanel';

const ONBOARD_KEY = 'zapchain:onboarded';
let settings: Settings = loadSettings();
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');
const cv = must<HTMLCanvasElement>('cv');
const stage = must('stage');
const status = must('status');
const settingsEl = must('settings-overlay');
const announce = (t: string): void => { status.textContent = ''; status.textContent = t; };
const reduced = (): boolean => isReducedMotion(settings.reduceMotion, mq.matches);

let view: View = computeView(stage.clientWidth || 400, stage.clientHeight || 300, devicePixelRatio, { top: 0, left: 0, right: 0, bottom: 0 });
const renderer = new Renderer(cv.getContext('2d') as CanvasRenderingContext2D);
const hud = createHud();
const debug = new URLSearchParams(location.search).get('debug') === '1';

function onSim(e: SimEvent, attract: boolean): void {
  renderer.onEvent(e, attract ? game.attract.sim : (game.sim ?? game.attract.sim));
  if (attract) return;
  const cue = cueFor(e);
  if (cue) emit(cue.name, cue.opts);
  if (e.t === 'zap') announce(S.zapped(e.n, e.points));
  else if (e.t === 'bomb') announce(S.bombed(e.n));
  if (e.t === 'zap' || e.t === 'bomb') { hideHint(true); resize(); }
}

const game: Game = new Game({ seed: () => (Math.random() * 4294967296) >>> 0, onSim, onChange: () => onPhase() });
let prevPhase = game.phase;
let screens!: ReturnType<typeof createScreens>;
let syncSettings!: () => void;

function applyAll(): void {
  applyAppearance(settings, mq.matches);
  configureAudio({ enabled: settings.sound, volume: settings.volume });
  const snd = must('sound');
  snd.setAttribute('aria-pressed', String(settings.sound));
  snd.setAttribute('aria-label', settings.sound ? 'Sound on' : 'Sound muted');
  syncSettings?.();
}

function setSetting(key: SettingKey, value: unknown): void {
  settings = { ...settings, [key]: value } as Settings;
  saveSettings(settings);
  applyAll();
  if (key === 'textSize') requestAnimationFrame(resize);
}

function openSettings(opener: HTMLElement | null): void {
  game.pause();
  syncSettings();
  openDialog(settingsEl, { opener, first: must('settings-close'), onEscape: closeSettings });
}
function closeSettings(): void { closeDialog(settingsEl); }

function onPhase(): void {
  const prev = prevPhase;
  prevPhase = game.phase;
  screens?.sync(prev);
  const ready = must('ready');
  ready.hidden = game.phase !== 'ready';
  if (game.phase === 'ready' && game.sim) {
    ready.textContent = S.ready(game.level, game.sim.params.target);
    announce(ready.textContent);
    if (prev !== 'paused') { renderer.resetFx(); emit('start'); }
    showHint();
  }
  if (game.phase === 'paused') announce(S.paused);
  if (game.phase === 'over' && game.result?.isNew) emit('best', { delay: 0.5 });
  if (game.phase === 'title') renderer.resetFx();
  requestAnimationFrame(resize);
}

function showHint(): void {
  if (readFlag(ONBOARD_KEY)) return;
  must('hint-text').textContent = pick(coarse.matches, S.hint, S.hintTouch);
  must('hint').hidden = false;
}
function hideHint(persist: boolean): void {
  must('hint').hidden = true;
  if (persist) writeFlag(ONBOARD_KEY);
}

/** Room taken by the HUD (a top bar in portrait, a left column in landscape) and the hint box. */
function measureReserve(): Reserve {
  const s = stage.getBoundingClientRect();
  const h = must('hud').getBoundingClientRect();
  const hint = must('hint');
  const hintH = hint.hidden ? 0 : hint.getBoundingClientRect().height + 12;
  const bar = h.width > s.width * 0.6;
  return {
    top: bar ? Math.max(0, h.bottom - s.top) + 2 : 0,
    left: bar ? 0 : Math.max(0, h.right - s.left) + 4,
    right: 0,
    bottom: hintH,
  };
}

function resize(): void {
  const w = Math.max(1, stage.clientWidth);
  const h = Math.max(1, stage.clientHeight);
  view = computeView(w, h, window.devicePixelRatio || 1, measureReserve());
  const pw = Math.round(w * view.dpr), ph = Math.round(h * view.dpr);
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
}

function boot(): void {
  cv.setAttribute('aria-label', S.canvasLabel);
  syncSettings = bindSettings(settingsEl, () => settings, setSetting);
  screens = createScreens(game, { openSettings, announce, reduced });
  installFocusTrap();
  must('open-settings').addEventListener('click', (e) => openSettings(e.currentTarget as HTMLElement));
  must('settings-close').addEventListener('click', closeSettings);
  must('pause').addEventListener('click', () => game.pause());
  must('sound').addEventListener('click', () => setSetting('sound', !settings.sound));
  must('hint-ok').addEventListener('click', () => { hideHint(true); resize(); });
  installInput(game, cv, {
    toggleMute: () => { setSetting('sound', !settings.sound); announce(settings.sound ? S.unmuted : S.muted); },
    resumeFromPause: () => game.resume(),
    closeTop: () => { if (document.getElementById('settings-overlay')?.hidden === false) closeSettings(); else game.resume(); },
    getView: () => view,
  });
  installAudioUnlock();
  mq.addEventListener('change', applyAll);
  new ResizeObserver(resize).observe(stage);
  applyAll();
  resize();
  onPhase();
  requestAnimationFrame(loop);
}

const flags = debug ? installDebug(game, () => renderer.particles.count) : null;
let last = performance.now();
let lastSystemMotion = mq.matches; // polled too: some browsers skip MediaQueryList change events
let autoTimer = 0;

function loop(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (mq.matches !== lastSystemMotion) { lastSystemMotion = mq.matches; applyAll(); }
  if (flags?.autopilot) { autoTimer += dt; if (autoTimer > 0.25) { autoTimer = 0; autopilotMove(game); } }
  game.frame(dt);
  hud.update(game, dt, reduced());
  renderer.draw(game, view, { reduced: reduced(), assist: settings.colorAssist, time: now / 1000, dt, paused: game.phase === 'paused' });
  requestAnimationFrame(loop);
}

boot();
