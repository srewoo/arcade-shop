import './style/tokens.css';
import './style/base.css';
import './style/overlay.css';
import { configureAudio, emit, installAudioUnlock, type Sfx } from './audio';
import { installDebug } from './debug';
import { Game, type FxEvent } from './game/game';
import type { MatchSetup } from './game/match';
import { Attract } from './render/attract';
import { Renderer, type Scene } from './render/frame';
import { computeView, type View } from './render/view';
import { loadSettings, saveSettings, type SettingKey, type Settings } from './settings';
import { ONBOARD_KEY, loadBest, loadSetup } from './setupStore';
import { readFlag, writeFlag } from './storage';
import { S, KIND_ARIA } from './strings';
import { applyAppearance, isReducedMotion } from './ui/appearance';
import { closeDialog, dialogOpen, installFocusTrap, openDialog, topDialog } from './ui/dialogs';
import { must } from './ui/dom';
import { createHud } from './ui/hud';
import { installInput } from './ui/input';
import { createScreens } from './ui/screens';
import { createSetupScreen } from './ui/setupScreen';
import { bindSettings } from './ui/settingsPanel';

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
let dragging = false;
let lastSound = 0;

function sound(name: Sfx, scale = 1, gap = 0): void {
  const now = performance.now();
  if (gap && now - lastSound < gap) return;
  if (gap) lastSound = now;
  emit(name, 0, scale);
}

function onFx(e: FxEvent): void {
  renderer.fx(e, reduced());
  const who = game.match?.players[game.playerIdx]?.name ?? '';
  switch (e.type) {
    case 'strike': sound('putt', 0.5 + e.speed / 1080); break;
    case 'wall': if (e.speed > 50) sound('wall', Math.min(1, e.speed / 380), 40); break;
    case 'post': sound('post', Math.min(1, e.speed / 300), 40); break;
    case 'mover': sound('mover', 1, 80); break;
    case 'sand': sound('sand'); break;
    case 'splash': sound('splash'); announce(S.splash); break;
    case 'sink': sound('sink'); break;
    case 'callout': onCallout(e, who); break;
    case 'turn': {
      const m = game.match;
      if (m) announce(S.turn(m.players[e.player]?.name ?? '', m.hole.id, m.hole.par));
      break;
    }
    case 'holeDone': case 'complete': sound('done'); break;
    default: break;
  }
}

function onCallout(e: Extract<FxEvent, { type: 'callout' }>, who: string): void {
  renderer.setCalloutSub(who);
  if (e.kind === 'water') return;
  const k = e.kind;
  sound(k === 'ace' ? 'ace' : e.celebrate ? 'birdie' : k === 'par' ? 'par' : 'bogey', 1, 0);
  announce(S.holed(who, game.strokes, KIND_ARIA[k]));
}

const game: Game = new Game({ onFx, onChange: () => onChange() });
const hud = createHud();
let screens!: ReturnType<typeof createScreens>;
let syncSettings!: () => void;
let setup!: ReturnType<typeof createSetupScreen>;
const attract = new Attract((e) => { if (game.phase === 'setup') renderer.fx(e, reduced()); });

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

function onChange(): void {
  screens?.sync();
  if (game.phase === 'setup') renderer.reset();
  if (game.phase === 'aim' && !game.paused && !dialogOpen()) showHint();
  else hideHint(false);
  if (game.phase === 'aim' && !game.paused) renderer.particles.clear();
}

function showHint(): void {
  if (readFlag(ONBOARD_KEY)) return;
  must('hint-text').textContent = coarse.matches ? S.hintTouch : S.hint;
  must('hint').hidden = false;
}
function hideHint(persist: boolean): void {
  must('hint').hidden = true;
  if (persist) writeFlag(ONBOARD_KEY);
}

function startMatch(s: MatchSetup): void {
  game.start(s);
  renderer.reset();
}

function pauseOrBack(): void {
  const top = topDialog();
  if (top?.onEscape) { top.onEscape(); return; }
  if (top) return;
  if (game.phase === 'setup') return;
  if (game.paused) game.resume(); else game.pause();
}

function resize(): void {
  const w = Math.max(1, stage.clientWidth);
  const h = Math.max(1, stage.clientHeight);
  view = computeView(w, h, window.devicePixelRatio || 1);
  cv.width = Math.round(w * view.dpr);
  cv.height = Math.round(h * view.dpr);
}

function gameScene(): Scene | null {
  const m = game.match;
  const sim = game.sim;
  if (!m || !sim) return null;
  const p = m.players[game.playerIdx];
  if (!p) return null;
  const aiming = game.phase === 'aim' && !game.paused && !dialogOpen();
  return {
    hole: m.hole, sim, alpha: game.paused ? 0 : game.alpha, color: p.color, seat: game.playerIdx,
    label: p.name.slice(0, 1).toUpperCase(), sinkT: game.sinkT, aim: aiming ? game.aim : null,
  };
}

function boot(): void {
  cv.setAttribute('aria-label', S.canvasLabel);
  syncSettings = bindSettings(settingsEl, () => settings, setSetting);
  setup = createSetupScreen(loadSetup(), startMatch);
  setup.refresh(loadBest());
  screens = createScreens(game, { openSettings, announce, onBest: () => setup.refresh(loadBest()) });
  installFocusTrap();
  must('open-settings').addEventListener('click', (e) => openSettings(e.currentTarget as HTMLElement));
  must('settings-close').addEventListener('click', closeSettings);
  must('pause').addEventListener('click', () => game.pause());
  must('sound').addEventListener('click', () => { setSetting('sound', !settings.sound); announce(settings.sound ? S.unmuted : S.muted); });
  must('putt').addEventListener('click', () => { game.shoot(); });
  must('hint-ok').addEventListener('click', () => hideHint(true));
  installInput(game, stage, {
    view: () => view,
    toggleMute: () => { setSetting('sound', !settings.sound); announce(settings.sound ? S.unmuted : S.muted); },
    openCard: () => screens.openCard(null),
    pauseOrBack,
    onDrag: (a) => { dragging = a; if (a) hideHint(true); },
  });
  installAudioUnlock();
  mq.addEventListener('change', applyAll);
  const autoPause = (): void => { if (game.phase !== 'setup') game.pause(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  window.addEventListener('blur', autoPause);
  new ResizeObserver(resize).observe(stage);
  applyAll();
  resize();
  onChange();
  requestAnimationFrame(loop);
}

const debug = new URLSearchParams(location.search).get('debug') === '1';
if (debug) installDebug(game, () => renderer.particles.count, startMatch);
let last = performance.now();
let lastSystemMotion = mq.matches;

function loop(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (mq.matches !== lastSystemMotion) { lastSystemMotion = mq.matches; applyAll(); }
  game.frame(dt);
  let scene = gameScene();
  if (!scene || game.phase === 'setup') { attract.update(dt); scene = attract.scene(); }
  hud(game, dragging);
  renderer.draw(scene, view, { reduced: reduced(), assist: settings.colorAssist, time: now / 1000, dt: game.paused ? 0 : dt });
  requestAnimationFrame(loop);
}

boot();
