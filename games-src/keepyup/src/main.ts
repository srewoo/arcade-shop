import './style/tokens.css';
import './style/base.css';
import './style/overlay.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import type { Sfx } from './audioCues';
import { autopilotTap, installDebug } from './debug';
import { Game } from './game';
import { Renderer } from './render/frame';
import { computeView, toWorld, type View } from './render/view';
import { loadSettings, saveSettings, type SettingKey, type Settings } from './settings';
import { readFlag, writeFlag } from './storage';
import type { SimEvent } from './sim';
import { S, pick } from './strings';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { closeDialog, installFocusTrap, openDialog } from './ui/dialogs';
import { must } from './ui/dom';
import { createHud } from './ui/hud';
import { installInput } from './ui/input';
import { createScreens } from './ui/screens';
import { bindSettings } from './ui/settingsPanel';

const ONBOARD_KEY = 'keepyup:onboarded';
let settings: Settings = loadSettings();
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');
const cv = must<HTMLCanvasElement>('cv');
const stage = must('stage');
const status = must('status');
const settingsEl = must('settings-overlay');
const announce = (t: string): void => { status.textContent = ''; status.textContent = t; };
const reduced = (): boolean => isReducedMotion(settings.reduceMotion, mq.matches);

let view: View = computeView(stage.clientWidth || 400, stage.clientHeight || 300, devicePixelRatio);
const renderer = new Renderer(cv.getContext('2d') as CanvasRenderingContext2D);

function sfxFor(e: SimEvent): Sfx | null {
  switch (e.t) {
    case 'hit': return e.sweet ? 'sweet' : 'hit';
    case 'wall': return 'wall';
    case 'whiff': return 'whiff';
    case 'tier': return 'tier';
    case 'gust': return 'gust';
    default: return null;
  }
}

const game: Game = new Game(settings.mode, {
  rand: Math.random,
  emit,
  onChange: () => onPhase(),
  onEvent: (e) => {
    renderer.onEvent(e);
    const sfx = sfxFor(e);
    if (sfx) emit(sfx);
    if (e.t === 'tier') announce(S.tierSay(e.tier.label, game.sim.score));
    if (e.t === 'gust') announce(S.gust);
  },
});
const hud = createHud();
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
}

function setMode(m: string): void {
  if (!game.setMode(m as Settings['mode'])) return;
  setSetting('mode', game.mode);
  screens.refreshTitle();
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
  if (game.phase === 'ready') renderer.reset();
  screens?.sync(prev);
  const ready = must('ready');
  ready.hidden = game.phase !== 'ready';
  ready.textContent = pick(coarse.matches, S.ready, S.readyTouch);
  if (game.phase === 'ready') showHint();
  if (game.phase === 'playing') hideHint(true);
  if (game.phase === 'paused') announce(S.paused);
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

function resize(): void {
  const w = Math.max(1, stage.clientWidth);
  const h = Math.max(1, stage.clientHeight);
  view = computeView(w, h, window.devicePixelRatio || 1);
  cv.width = Math.round(w * view.dpr);
  cv.height = Math.round(h * view.dpr);
  game.setWidth(view.worldW);
}

function boot(): void {
  cv.setAttribute('aria-label', S.canvasLabel);
  syncSettings = bindSettings(settingsEl, () => settings, setSetting);
  screens = createScreens(game, { openSettings, announce, reduced, setMode });
  installFocusTrap();
  must('open-settings').addEventListener('click', (e) => openSettings(e.currentTarget as HTMLElement));
  must('settings-close').addEventListener('click', closeSettings);
  must('pause').addEventListener('click', () => game.pause());
  must('sound').addEventListener('click', () => setSetting('sound', !settings.sound));
  must('hint-ok').addEventListener('click', () => hideHint(true));
  installInput(game, stage, {
    toggleMute: () => { setSetting('sound', !settings.sound); announce(settings.sound ? S.unmuted : S.muted); },
    resumeFromPause: () => game.resume(),
    closeTop: () => { if (document.getElementById('settings-overlay')?.hidden === false) closeSettings(); else game.resume(); },
    toWorld: (cx, cy) => { const r = cv.getBoundingClientRect(); return toWorld(view, cx - r.left, cy - r.top); },
  });
  installAudioUnlock();
  mq.addEventListener('change', applyAll);
  new ResizeObserver(resize).observe(stage);
  applyAll();
  resize();
  onPhase();
  requestAnimationFrame(loop);
}

const debug = new URLSearchParams(location.search).get('debug') === '1';
const flags = debug ? installDebug(game, () => renderer.fx.count) : null;
let last = performance.now();
let lastSystemMotion = mq.matches; // polled too: some browsers skip MediaQueryList change events

function loop(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (flags?.autopilot && game.phase === 'playing') {
    const tap = autopilotTap(game);
    if (tap) game.strike(tap.x, tap.y);
  }
  if (mq.matches !== lastSystemMotion) { lastSystemMotion = mq.matches; applyAll(); }
  game.frame(dt);
  hud(game);
  renderer.draw(game, view, { reduced: reduced(), assist: settings.colorAssist, time: now / 1000, dt });
  requestAnimationFrame(loop);
}

boot();
