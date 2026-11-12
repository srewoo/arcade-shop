import './style/tokens.css';
import './style/base.css';
import './style/overlay.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import { Game } from './game';
import { loadSettings, saveSettings, type SettingKey, type Settings } from './settings';
import { readFlag, writeFlag } from './storage';
import { Renderer } from './render/frame';
import { computeView, readPalette, type Palette, type View } from './render/view';
import { S, MODE_LABEL, pick } from './strings';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { autopilotHold, installDebug } from './debug';
import { closeDialog, installFocusTrap, openDialog } from './ui/dialogs';
import { must } from './ui/dom';
import { createHud } from './ui/hud';
import { installInput } from './ui/input';
import { createScreens } from './ui/screens';
import { bindSettings } from './ui/settingsPanel';

const ONBOARD_KEY = 'updraft-onboarded';
let settings: Settings = loadSettings();
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');
const cv = must<HTMLCanvasElement>('cv');
const stage = must('stage');
const status = must('status');
const settingsEl = must('settings-overlay');
const announce = (t: string): void => { status.textContent = ''; status.textContent = t; };

let pal: Palette = readPalette();
let view: View = computeView(stage.clientWidth || 400, stage.clientHeight || 300, devicePixelRatio);
const reduced = (): boolean => isReducedMotion(settings.reduceMotion, mq.matches);

const game: Game = new Game(settings.mode, {
  now: () => new Date(),
  rand: Math.random,
  emit,
  onChange: () => onPhase(),
});
const hud = createHud();
let prevPhase = game.phase;
let screens!: ReturnType<typeof createScreens>;
let syncSettings!: () => void;

function applyAll(): void {
  applyAppearance(settings, mq.matches);
  configureAudio({ enabled: settings.sound, volume: settings.volume });
  pal = readPalette();
  const snd = must('sound');
  snd.setAttribute('aria-pressed', String(settings.sound));
  snd.setAttribute('aria-label', settings.sound ? 'Sound on' : 'Sound muted');
  syncSettings?.();
}

function setSetting(key: SettingKey, value: unknown): void {
  settings = { ...settings, [key]: value } as Settings;
  saveSettings(settings);
  applyAll();
  if (key === 'mode') { game.mode = settings.mode; screens.refreshTitle(); }
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
  ready.textContent = `${MODE_LABEL[game.mode]} · ${pick(coarse.matches, S.ready, S.readyTouch)}`;
  if (game.phase === 'ready') showHint();
  if (game.phase === 'playing') hideHint(true);
  if (game.phase === 'paused') announce(S.paused);
  if (game.phase === 'ready' && game.run) {
    announce(game.run.ghostSim ? S.ghostOn : game.mode === 'endless' ? S.ready : S.ghostOff);
  }
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
}

function boot(): void {
  cv.setAttribute('aria-label', S.canvasLabel);
  syncSettings = bindSettings(settingsEl, () => settings, setSetting);
  screens = createScreens(game, {
    openSettings, announce, reduced,
    setMode: (m) => setSetting('mode', m),
  });
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
const renderer = new Renderer(cv.getContext('2d') as CanvasRenderingContext2D);
const flags = debug ? installDebug(game, () => renderer.particles.count) : null;
let last = performance.now();
let lastSystemMotion = mq.matches; // polled too: some browsers skip MediaQueryList change events

function loop(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (flags?.autopilot) {
    const hold = autopilotHold(game);
    if (hold !== null) game.hold = hold;
  }
  if (mq.matches !== lastSystemMotion) { lastSystemMotion = mq.matches; applyAll(); }
  game.frame(dt);
  hud(game);
  renderer.draw(game, view, pal, { reduced: reduced(), assist: settings.colorAssist, time: now / 1000, dt });
  requestAnimationFrame(loop);
}

boot();
