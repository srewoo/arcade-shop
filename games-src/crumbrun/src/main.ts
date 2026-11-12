// Wiring: DOM, input, fixed-timestep loop with interpolation, sound, settings and dialogs.
import './style.css';
import './dialogs.css';
import { Sfx } from './audio';
import { debugEnabled, installDebug } from './debug';
import { Game } from './flow';
import type { Phase, RunResult } from './flow';
import { fxForEvent } from './fx';
import { padIntent, readPad } from './gamepad';
import type { PadSnapshot } from './gamepad';
import { attachInput } from './input';
import { boardSize, layoutMode } from './layout';
import { resolveReducedMotion, textScale } from './prefs';
import { Renderer } from './render';
import { sfxForEvent } from './sfxMap';
import { STR } from './strings';
import {
  SettingsSchema, loadScores, loadSettings, loadStats, recordScore, recordStats, saveSettings,
} from './storage';
import type { Settings } from './storage';
import { FIXED_DT } from './types';
import { Ui } from './ui/controller';
import { domAnnouncer } from './ui/announcer';
import { Coach, shouldCoach } from './ui/coach';
import { HudView } from './ui/hudView';
import type { GameEvent } from './world';

function need<T extends Element>(sel: string): T {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element ${sel}`);
  return el;
}

export function createApp(): { game: Game; ui: Ui } {
  const canvas = need<HTMLCanvasElement>('#game');
  const stage = need<HTMLElement>('#stage');
  const muteBtn = need<HTMLButtonElement>('#btn-mute');
  const smallHint = need<HTMLElement>('#hint-small');
  const params = new URLSearchParams(window.location.search);
  const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const say = domAnnouncer(need<HTMLElement>('#live'));
  const sfx = new Sfx();
  let settings: Settings = loadSettings();
  if (params.get('dpad') === '1') document.body.classList.add('force-dpad');

  const game: Game = new Game({
    reducedMotion: resolveReducedMotion(settings.reduceMotion, systemReduced.matches),
    onEvent, onPhase, onPause: (p, auto) => {
      ui.onPause(p, auto);
      sfx.ui();
    },
    onRunEnd,
  });
  const size = boardSize(game.world.maze);
  const renderer = new Renderer(canvas, size);
  const hudView = new HudView();
  const titleActions = need<HTMLElement>('#title-actions');
  const coach = new Coach(need<HTMLElement>('#coach'), () => {
    if (!settings.seen) changeSettings({ seen: true });
  });
  document.documentElement.style.setProperty('--board-ratio', String(size.w / size.h));
  document.documentElement.style.setProperty('--board-ar', `${size.w} / ${size.h}`);

  function applySettings(): void {
    game.muted = settings.muted;
    game.reducedMotion = resolveReducedMotion(settings.reduceMotion, systemReduced.matches);
    sfx.setVolume(settings.volume / 100);
    sfx.setMuted(settings.muted);
    renderer.particles.calm = game.reducedMotion;
    renderer.setOptions({ textScale: textScale(settings.textSize), assist: settings.colorAssist, highContrast: settings.highContrast });
    const b = document.body.classList;
    b.toggle('show-dpad', settings.showDpad);
    b.toggle('lefty', settings.leftHanded);
    b.toggle('has-dpad', settings.showDpad || coarse.matches || params.get('dpad') === '1');
    document.documentElement.style.setProperty('--ui-scale', String(textScale(settings.textSize)));
    muteBtn.setAttribute('aria-pressed', String(settings.muted));
    muteBtn.setAttribute('aria-label', settings.muted ? 'Unmute sound' : 'Mute sound');
    scheduleFit();
  }

  function changeSettings(patch: Partial<Settings>): void {
    settings = SettingsSchema.parse({ ...settings, ...patch });
    saveSettings(settings);
    applySettings();
  }

  const ui = new Ui({
    game, root: need<HTMLElement>('#modal-root'), say, getSettings: () => settings, changeSettings,
    getScores: () => loadScores(), getStats: () => loadStats(), sound: sfx,
  });

  function announceEvent(e: GameEvent): void {
    const a = STR.announce;
    if (e.type === 'phase') say.say(game.world.clock.phase === 'rest' ? a.rest : a.chase);
    else if (e.type === 'pistol') say.say(a.drench);
    else if (e.type === 'extralife') say.say(a.extra);
    else if (e.type === 'cheeseSpawn') say.say(a.cheese);
    else if (e.type === 'pounce') say.say(a.pounce);
  }

  function onEvent(e: GameEvent, demo: boolean): void {
    fxForEvent(renderer.particles, game.world, e);
    if (demo) return;
    sfxForEvent(sfx, e.type);
    announceEvent(e);
  }

  function onPhase(p: Phase): void {
    const a = STR.announce;
    if (p === 'ready' && game.phaseT === 0 && game.level === 1 && game.world.time === 0) sfx.jingleStart();
    if (p !== 'title') renderer.particles.clear();
    titleActions.hidden = p !== 'title';
    if (shouldCoach(settings.seen, p, game.level)) coach.show(STR.coach.first);
    else if (p !== 'ready' && p !== 'play') coach.hide();
    if (p === 'ready') say.say(a.started(game.level), true);
    else if (p === 'dying') say.say(a.life(game.world.score.lives), true);
    else if (p === 'clearing') say.say(a.cleared(game.level, game.world.score.score), true);
    else if (p === 'gameover') {
      sfx.gameOver();
      say.say(a.over(game.world.score.score, game.lastRun?.newHigh ?? false), true);
    }
    ui.onPhase(p);
  }

  function onRunEnd(r: RunResult): void {
    recordScore({ score: r.score, level: r.level, date: new Date().toISOString() });
    recordStats(r.level, r.bestChain);
  }

  function toggleMute(): void {
    changeSettings({ muted: !settings.muted });
    sfx.ui();
  }

  let fitQueued = false;
  function fit(): void {
    document.body.classList.toggle('wide', layoutMode(window.innerWidth, window.innerHeight, size) === 'side');
    const r = stage.getBoundingClientRect();
    renderer.resize(r.width, r.height, window.devicePixelRatio || 1);
    const small = renderer.currentFit.tooSmall;
    smallHint.hidden = !small;
    if (small) smallHint.textContent = STR.rotate;
  }
  function scheduleFit(): void {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(() => {
      fitQueued = false;
      fit();
    });
  }
  new ResizeObserver(scheduleFit).observe(stage);
  window.addEventListener('resize', scheduleFit);
  systemReduced.addEventListener('change', applySettings);

  need<HTMLButtonElement>('#btn-start').addEventListener('click', () => game.action());
  need<HTMLButtonElement>('#btn-how').addEventListener('click', () => ui.showHowTo('title'));
  if (debugEnabled()) installDebug(game);
  applySettings();
  fit();

  attachInput(stage, {
    dir: (d) => {
      coach.hide();
      game.press(d);
    },
    action: () => game.action(),
    pause: () => ui.pauseKey(),
    mute: toggleMute,
    settings: () => ui.openSettings(),
    modalOpen: () => ui.modalOpen,
    gesture: () => sfx.unlock(),
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.autoPause();
      game.persistHigh();
    }
  });
  document.addEventListener('pointerdown', () => sfx.unlock(), { passive: true }); // any tap unlocks audio
  window.addEventListener('blur', () => game.autoPause());
  window.addEventListener('pagehide', () => game.persistHigh());

  let padPrev: PadSnapshot | null = null;
  function pollPad(): void {
    const cur = readPad();
    if (!cur) {
      padPrev = null;
      return;
    }
    const i = padIntent(padPrev, cur);
    padPrev = cur;
    if (i.pause) ui.pauseKey();
    if (ui.modalOpen) return;
    if (i.dir) game.press(i.dir);
    if (i.action) game.action();
  }

  let last = performance.now();
  let acc = 0;
  function frame(now: number): void {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    pollPad();
    while (acc >= FIXED_DT) {
      game.update(FIXED_DT);
      if (!game.blockedNow) renderer.particles.update(FIXED_DT);
      acc -= FIXED_DT;
    }
    const w = game.world;
    if (game.phase === 'play' && !game.blockedNow) sfx.bass(w.remaining / w.maze.edibleCount);
    renderer.draw(game, now, game.interpolating ? acc / FIXED_DT : 1);
    hudView.update({
      world: w, level: game.demoOrLevel(), lives: w.score.lives, score: w.score.score, hi: game.hi,
      muted: game.muted, demo: game.demo, time: now / 1000, calm: game.reducedMotion,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { game, ui };
}

createApp();
