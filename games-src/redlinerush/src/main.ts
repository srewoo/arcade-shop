// Boot, phases (title / play / pause / over), pause rules and the fixed-step frame loop.
import './style/index.css';
import { playCue, setEngine, setSoundEnabled, setVolume, unlockAudio } from './audio';
import { advanceClock } from './clock';
import { CONFIG } from './config';
import { exposeDebug } from './debug';
import { ambientFx, consumeEvents } from './fxEvents';
import { updateHud } from './hud';
import { createInput } from './input';
import { dailySeed, dayKey } from './rng';
import { loadRecords, type Records } from './records';
import { draw } from './render';
import { createFx, updateFx } from './renderFx';
import { bestFor, renderResult, renderTitle } from './screens';
import { finishRun } from './session';
import { createSim, step } from './sim';
import { view } from './viewport';
import { type Mode, type Sim } from './simTypes';
import { loadSettings, saveSettings, type SettingKey, type Settings } from './settings';
import { STR } from './strings';
import { applyAppearance } from './ui/appearance';
import { observeFit } from './ui/canvasFit';
import { $, applyStrings } from './ui/dom';
import { closeOverlay, closeTop, installTrap, openOverlay, setBackground, topOverlay } from './ui/overlay';
import { bindSettingsPanel, syncSettingsPanel } from './ui/settingsPanel';
import { readFlag, writeFlag } from './storage';

type AppPhase = 'title' | 'play' | 'pause' | 'over';
const ONBOARD_KEY = 'redline-onboarded';

applyStrings(STR);
const app = $('app');
const canvas = $<HTMLCanvasElement>('road');
const g = canvas.getContext('2d') as CanvasRenderingContext2D;
const stage = $('stage');
const els = {
  title: $('title-overlay'), pause: $('pause-overlay'), result: $('result-overlay'), settings: $('settings-overlay'),
  confirm: $('pause-confirm'), sr: $('sr-status'), onboard: $('onboard'),
};
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
app.dataset.touch = coarse ? 'on' : 'off';

let settings: Settings = loadSettings();
let records: Records = loadRecords();
let phase: AppPhase = 'title';
let sim: Sim = createSim(settings.mode, 1);
let acc = 0;
let last = performance.now();
let confirming: 'restart' | 'quit' | null = null;
const fx = createFx();
const input = createInput($('touch'));
const today = (): string => dayKey(new Date());

function setPhase(p: AppPhase): void {
  phase = p;
  app.dataset.phase = p;
  input.setEnabled(p === 'play');
  if (p !== 'play') {
    input.clear();
    setEngine(0, false, false);
  }
}

function applySettings(): void {
  applyAppearance(settings, reducedQuery.matches);
  fx.reduce = document.documentElement.dataset.motion === 'reduce';
  setSoundEnabled(settings.sound);
  setVolume(settings.volume);
  $('sound').setAttribute('aria-pressed', String(settings.sound));
  syncSettingsPanel(els.settings, settings);
}

function change<K extends SettingKey>(key: K, value: Settings[K]): void {
  settings = { ...settings, [key]: value };
  saveSettings(settings);
  applySettings();
  playCue({ type: 'click' });
}

function showOnboarding(): void {
  if (readFlag(ONBOARD_KEY)) return;
  writeFlag(ONBOARD_KEY);
  $('onboard-text').textContent = coarse ? STR.onboardingTouch : STR.onboarding;
  els.onboard.classList.remove('fade');
  els.onboard.hidden = false;
}

function fadeOnboarding(runT: number): void {
  els.onboard.classList.toggle('fade', runT > 6.5);
  if (runT > 7.5) els.onboard.hidden = true;
}

function startRun(mode: Mode): void {
  unlockAudio();
  settings = { ...settings, mode };
  saveSettings(settings);
  app.dataset.mode = mode;
  const seed = mode === 'daily' ? dailySeed(today()) : (Math.random() * 4294967296) >>> 0;
  sim = createSim(mode, seed);
  fx.particles.length = 0;
  fx.floaters.length = 0;
  acc = 0;
  confirming = null;
  for (const o of [els.title, els.pause, els.result]) if (!o.hidden) closeOverlay(o);
  setPhase('play');
  showOnboarding();
  (document.activeElement as HTMLElement | null)?.blur();
}

function toTitle(): void {
  for (const o of [els.pause, els.result]) if (!o.hidden) closeOverlay(o);
  els.confirm.hidden = true;
  confirming = null;
  setPhase('title');
  renderTitle(records, today(), startRun);
  openOverlay(els.title, null, () => undefined);
}

function pauseGame(): void {
  if (phase !== 'play') return;
  setPhase('pause');
  els.confirm.hidden = true;
  confirming = null;
  playCue({ type: 'pause' });
  openOverlay(els.pause, $('pause'), resumeGame, $('pause-resume'));
}

function resumeGame(): void {
  if (phase !== 'pause') return;
  if (!els.pause.hidden) closeOverlay(els.pause);
  acc = 0;
  last = performance.now();
  setPhase('play');
  (document.activeElement as HTMLElement | null)?.blur();
}

function openSettings(opener: HTMLElement): void {
  if (phase === 'play') pauseGame();
  syncSettingsPanel(els.settings, settings);
  openOverlay(els.settings, opener, () => undefined);
}

function askConfirm(kind: 'restart' | 'quit'): void {
  confirming = kind;
  $('pause-confirm-text').textContent = kind === 'restart' ? STR.confirmRestart : STR.confirmQuit;
  els.confirm.hidden = false;
  $('pause-confirm-no').focus();
}

function endScreen(): void {
  const { records: next, newBest } = finishRun(sim, records, today());
  records = next;
  setPhase('over');
  renderResult(sim, newBest, bestFor(sim.mode, records, today()), fx.reduce);
  openOverlay(els.result, null, () => undefined, $('result-again'));
  $('result-overlay').scrollTop = 0;
  (els.result.firstElementChild as HTMLElement | null)?.scrollTo(0, 0);
}

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = (now - last) / 1000;
  last = now;
  if (phase === 'play' || phase === 'over') {
    const clock = advanceClock(acc, dt);
    acc = clock.acc;
    for (let i = 0; i < clock.steps; i++) {
      step(sim, input.get());
      const lines = consumeEvents(sim, fx);
      if (lines.length) els.sr.textContent = lines.join(' ');
    }
    updateFx(fx, Math.min(dt, CONFIG.maxFrame));
    if (phase === 'play') ambientFx(sim, fx);
    setEngine(sim.speed, sim.boost > 0, phase === 'play' && sim.phase === 'run');
    if (!els.onboard.hidden) fadeOnboarding(sim.runT);
    if (phase === 'play' && sim.phase === 'over' && sim.overT >= CONFIG.overDelay) endScreen();
  }
  g.setTransform(canvas.width / view.width, 0, 0, canvas.height / view.height, 0, 0);
  const alpha = phase === 'play' || phase === 'over' ? acc / CONFIG.step : 1;
  draw(g, sim, fx, { assist: settings.colorAssist, reduce: fx.reduce, time: now / 1000, alpha, countdown: phase !== 'title', title: phase === 'title' });
  updateHud(sim);
}

function onKey(e: KeyboardEvent): void {
  const top = topOverlay();
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (e.repeat) return;
    if (!top && phase === 'play') pauseGame();
    else if (top === els.pause) resumeGame();
    else if (top === els.settings && e.key === 'Escape') closeTop();
    if (top) e.preventDefault();
  } else if (e.key === 'm' || e.key === 'M') change('sound', !settings.sound);
  else if (top === els.title && e.key >= '1' && e.key <= '3') startRun((['endless', 'trial', 'daily'] as const)[Number(e.key) - 1] ?? 'endless');
}

function bind(): void {
  setBackground([app]);
  installTrap();
  document.addEventListener('keydown', onKey);
  $('pause').addEventListener('click', pauseGame);
  $('sound').addEventListener('click', () => change('sound', !settings.sound));
  $('open-settings').addEventListener('click', () => openSettings($('open-settings')));
  $('title-settings').addEventListener('click', () => openSettings($('title-settings')));
  $('pause-settings').addEventListener('click', () => openSettings($('pause-settings')));
  $('settings-close').addEventListener('click', () => closeOverlay(els.settings));
  $('pause-resume').addEventListener('click', resumeGame);
  $('pause-restart').addEventListener('click', () => askConfirm('restart'));
  $('pause-quit').addEventListener('click', () => askConfirm('quit'));
  $('pause-confirm-no').addEventListener('click', () => { els.confirm.hidden = true; confirming = null; $('pause-resume').focus(); });
  $('pause-confirm-yes').addEventListener('click', () => (confirming === 'quit' ? toTitle() : startRun(sim.mode)));
  $('result-again').addEventListener('click', () => startRun(sim.mode));
  $('result-title-btn').addEventListener('click', toTitle);
  $('onboard-close').addEventListener('click', () => (els.onboard.hidden = true));
  bindSettingsPanel(els.settings, change);
  const autoPause = (): void => pauseGame();
  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', () => document.hidden && autoPause());
  reducedQuery.addEventListener('change', applySettings);
}

bind();
applySettings();
observeFit(canvas, stage);
exposeDebug({
  sim: () => sim,
  phase: () => phase,
  settings: () => settings,
  records: () => records,
  patch: (f) => {
    Object.assign(sim, f);
    if (f.z !== undefined) sim.pz = f.z;
  },
});
toTitle();
requestAnimationFrame(frame);
