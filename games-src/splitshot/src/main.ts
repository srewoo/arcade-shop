import './style/tokens.css';
import './style/base.css';
import './style/overlay.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import { cuesFor } from './audioEvents';
import { autopilotInput, installDebug } from './debug';
import { Game, type Phase } from './game';
import { ONBOARD_KEY } from './scores';
import { loadSettings, saveSettings, type SettingKey, type Settings } from './settings';
import { readFlag, writeFlag } from './storage';
import { Renderer } from './render/frame';
import { computeView, type View } from './render/view';
import { CONFIG } from './config';
import type { SimEvent } from './sim/types';
import { S, pick } from './strings';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { closeDialog, installFocusTrap, openDialog } from './ui/dialogs';
import { must } from './ui/dom';
import { createHud } from './ui/hud';
import { installInput } from './ui/input';
import { createScreens } from './ui/screens';
import { bindSettings } from './ui/settingsPanel';

let settings: Settings = loadSettings();
const params = new URLSearchParams(location.search);
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');
const cv = must<HTMLCanvasElement>('cv');
const stage = must('stage');
const status = must('status');
const settingsEl = must('settings-overlay');
const announce = (t: string): void => { status.textContent = ''; status.textContent = t; };
const reduced = (): boolean => isReducedMotion(settings.reduceMotion, mq.matches);

let view: View = computeView(stage.clientWidth || 400, stage.clientHeight || 300, devicePixelRatio);
const game: Game = new Game({ onChange: () => onPhase() });
const hud = createHud();
let prevPhase: Phase = game.phase;
let screens!: ReturnType<typeof createScreens>;
let syncSettings!: () => void;
let touchOn = params.get('touch') === '1' || coarse.matches;

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

function openSettings(opener: HTMLElement | null): void {
  game.pause();
  syncSettings();
  openDialog(settingsEl, { opener, first: must('settings-close'), onEscape: closeSettings });
}
function closeSettings(): void { closeDialog(settingsEl); }

function setBanner(title: string, sub: string): void {
  const el = must('banner');
  el.hidden = title === '';
  must('banner-title').textContent = title;
  must('banner-sub').textContent = sub;
}

function showHint(): void {
  if (readFlag(ONBOARD_KEY)) return;
  must('hint-text').textContent = pick(touchOn, S.hint, S.hintTouch);
  must('hint').hidden = false;
}
function hideHint(persist: boolean): void {
  must('hint').hidden = true;
  if (persist) writeFlag(ONBOARD_KEY);
}

function bannerFor(p: Phase): void {
  const sim = game.sim;
  if (p === 'ready') {
    setBanner(S.stageLine(game.run.stage + 1, sim.stage.label), game.gotExtraLife ? `${S.extraLife} ${pick(touchOn, S.ready, S.readyTouch)}` : pick(touchOn, S.ready, S.readyTouch));
    emit('ready');
    showHint();
  } else if (p === 'clear') setBanner(S.cleared(Math.round(sim.time) * CONFIG.score.timeBonusPerSec), '');
  else if (p === 'lost') setBanner(sim.lostReason === 'timeout' ? S.lostTime : S.lostHit, '');
  else if (p === 'playing') { setBanner('', ''); hideHint(true); }
  else if (p !== 'paused') setBanner('', '');
}

function onPhase(): void {
  const prev = prevPhase;
  prevPhase = game.phase;
  screens?.sync(prev);
  if (game.phase !== 'paused') bannerFor(game.phase);
  else announce(S.paused);
  if (game.phase === 'ready') announce(S.stageLine(game.run.stage + 1, game.sim.stage.label));
  if (game.phase === 'clear') announce(must('banner-title').textContent ?? '');
  if (game.phase === 'over') emit(game.result?.isNew ? 'best' : 'over');
}

/** Reserve room for the HUD (top) and the touch pad (bottom, portrait only) so the playfield never hides under them. */
function layout(): void {
  const w = Math.max(1, stage.clientWidth);
  const h = Math.max(1, stage.clientHeight);
  const portrait = h > w * 1.05;
  const touchEl = must('touch');
  touchEl.hidden = !touchOn;
  document.documentElement.dataset.touch = touchOn ? 'on' : 'off';
  const hudEl = must('hud');
  const top = hudEl.hidden ? 0 : Math.max(0, hudEl.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 2);
  const bottom = touchOn && portrait ? touchEl.offsetHeight + 8 : 0;
  view = computeView(w, h, window.devicePixelRatio || 1, top || CONFIG.view.hudTop, bottom || (touchOn && portrait ? CONFIG.view.touchBottom : 0));
  cv.width = Math.round(w * view.dpr);
  cv.height = Math.round(h * view.dpr);
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
  must('hint-ok').addEventListener('click', () => hideHint(true));
  installInput(game, stage, {
    toggleMute: () => { setSetting('sound', !settings.sound); announce(settings.sound ? S.unmuted : S.muted); },
    resumeFromPause: () => game.resume(),
    closeTop: () => { if (document.getElementById('settings-overlay')?.hidden === false) closeSettings(); else game.resume(); },
  });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && !touchOn) { touchOn = true; layout(); }
  }, { capture: true });
  installAudioUnlock();
  mq.addEventListener('change', applyAll);
  new ResizeObserver(layout).observe(stage);
  applyAll();
  layout();
  onPhase();
  requestAnimationFrame(loop);
}

const debug = params.get('debug') === '1';
const renderer = new Renderer(cv.getContext('2d') as CanvasRenderingContext2D);
const flags = debug ? installDebug(game, () => renderer.fx.particles.count) : null;
let last = performance.now();
let lastSystemMotion = mq.matches;
let lastHudHidden = true;

function playSounds(events: readonly SimEvent[]): void {
  if (game.phase === 'title') return;
  for (const e of events) {
    for (const cue of cuesFor(e)) emit(cue);
    if (e.type === 'collect') announce(S.collected(e.kind));
  }
}

function loop(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (flags?.autopilot) {
    const inp = autopilotInput(game);
    if (inp) { game.input.left = inp.left; game.input.right = inp.right; game.input.fire = inp.fire; }
  }
  if (mq.matches !== lastSystemMotion) { lastSystemMotion = mq.matches; applyAll(); }
  const events = game.frame(dt);
  playSounds(events);
  hud(game);
  const hudHidden = must('hud').hidden;
  if (hudHidden !== lastHudHidden) { lastHudHidden = hudHidden; layout(); }
  renderer.draw(game, view, { reduced: reduced(), assist: settings.colorAssist, time: now / 1000, dt }, events);
  requestAnimationFrame(loop);
}

boot();
