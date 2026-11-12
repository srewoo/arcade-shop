import './style/tokens.css';
import './style/base.css';
import './style/play.css';
import './style/panels.css';
import { configureAudio, emit, installAudioUnlock } from './audio';
import type { Ctx } from './ctx';
import { installKeys } from './input';
import { LEVELS } from './levels';
import { Nav } from './nav';
import { PlayController } from './play';
import { loadProgress } from './progress';
import { loadSettings, saveSettings, type SettingKey } from './settings';
import { S } from './strings';
import { moveCount } from './game';
import { CONFIG } from './config';
import { solve } from './solver';
import { createStopwatch } from './timer';
import { applyAppearance, applyFxVars } from './ui/appearance';
import { closeDialog, openDialog, showHelp } from './ui/dialogs';
import { el } from './ui/dom';
import { installTrap, isOverlayOpen, onOverlayChange, setBackground } from './ui/overlay';
import { buildTitleArt } from './ui/scene';
import { refreshTitle } from './ui/screens';
import { bindSettings, reflectSettings } from './ui/settingsPanel';

function fillStrings(): void {
  document.querySelectorAll<HTMLElement>('[data-s]').forEach((n) => {
    const v = S[(n.dataset.s ?? '') as keyof typeof S];
    if (typeof v === 'string') n.textContent = v;
  });
  document.querySelectorAll<HTMLElement>('[data-s-aria]').forEach((n) => {
    const v = S[(n.dataset.sAria ?? '') as keyof typeof S];
    if (typeof v === 'string') n.setAttribute('aria-label', v);
  });
}

function boot(): void {
  fillStrings();
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ctx: Ctx = {
    settings: loadSettings(),
    progress: loadProgress(LEVELS.length),
    game: null,
    picked: null,
    screen: 'title',
    quick: null,
    reducedSystem: media.matches,
    clock: createStopwatch(),
  };
  let play: PlayController | null = null;
  const getPlay = (): PlayController => (play ??= new PlayController(ctx, { onWin: (i) => nav.showWin(i), onMove: () => !el('onboard').hidden && nav.dismissOnboard() }));
  const nav = new Nav(ctx, getPlay);

  const applyAll = (): void => {
    applyAppearance(ctx.settings, ctx.reducedSystem);
    configureAudio({ enabled: ctx.settings.sound, volume: ctx.settings.volume });
    reflectSettings(ctx.settings);
  };
  const change = (key: SettingKey, value: unknown): void => {
    ctx.settings = { ...ctx.settings, [key]: value };
    saveSettings(ctx.settings);
    applyAll();
  };
  const toggleSound = (): void => {
    change('sound', !ctx.settings.sound);
    emit('click');
  };
  media.addEventListener('change', (e) => {
    ctx.reducedSystem = e.matches;
    applyAll();
  });
  applyFxVars();
  applyAll();
  buildTitleArt(document.getElementById('title-art') as unknown as SVGSVGElement);
  refreshTitle(ctx);
  installAudioUnlock();
  installTrap();
  setBackground([el('app')]);
  bindSettings(change);
  wireButtons(ctx, nav, getPlay, toggleSound);
  installKeys({ ctx, nav, play: getPlay, toggleSound });
  startTimer(ctx, getPlay);
  document.addEventListener('visibilitychange', () => document.hidden && nav.autoPause());
  window.addEventListener('blur', () => nav.autoPause());
  if (new URLSearchParams(location.search).get('debug') === '1') installDebug(ctx, getPlay);
}

function wireButtons(ctx: Ctx, nav: Nav, getPlay: () => PlayController, toggleSound: () => void): void {
  const on = (id: string, fn: () => void): void => el(id).addEventListener('click', fn);
  on('go-campaign', () => nav.toLevels());
  on('go-help', showHelp);
  on('go-quick', () => openDialog('quick-overlay', () => undefined, 'quick-cancel'));
  on('quick-cancel', () => closeDialog('quick-overlay'));
  document.querySelectorAll<HTMLElement>('[data-tier]').forEach((b) =>
    b.addEventListener('click', () => {
      closeDialog('quick-overlay');
      nav.startQuick(b.dataset.tier ?? 'easy');
    }),
  );
  on('help-close', () => closeDialog('help-overlay'));
  on('back', () => nav.back());
  on('sound', toggleSound);
  on('open-settings', () => openDialog('settings-overlay', () => undefined, 'settings-close'));
  on('settings-close', () => closeDialog('settings-overlay'));
  on('pause', () => nav.openPause());
  on('pause-resume', () => nav.resume());
  on('pause-restart', () => nav.askRestart());
  on('pause-settings', () => openDialog('settings-overlay', () => undefined, 'settings-close'));
  on('pause-quit', () => nav.askLeave('title'));
  on('act-fill', () => getPlay().fill());
  on('act-empty', () => getPlay().empty());
  on('act-undo', () => getPlay().undo());
  on('act-hint', () => getPlay().hint());
  on('act-restart', () => nav.askRestart());
  on('onboard-close', () => nav.dismissOnboard());
  on('win-next', () => nav.winNext());
  on('win-replay', () => {
    closeDialog('win-overlay');
    getPlay().restart();
  });
  on('win-levels', () => {
    closeDialog('win-overlay');
    nav.toLevels();
  });
  void ctx;
}

/** The clock only runs while a level is live and no dialog is open. */
function startTimer(ctx: Ctx, getPlay: () => PlayController): void {
  const tick = (): void => {
    const g = ctx.game;
    const live = ctx.screen === 'play' && g !== null && !g.solved && moveCount(g) > 0 && !isOverlayOpen();
    if (live) ctx.clock.start();
    else ctx.clock.stop();
    if (ctx.screen === 'play' && g) getPlay().reflect();
  };
  onOverlayChange(tick);
  window.setInterval(tick, CONFIG.timer.tickMs);
}

function installDebug(ctx: Ctx, getPlay: () => PlayController): void {
  const hooks = {
    state: () => ctx.game,
    solution: () => (ctx.game ? solve(ctx.game.level.jugs, ctx.game.amounts, ctx.game.level.goal) : null),
    levels: () => LEVELS.map((l) => ({ id: l.id, name: l.name, par: l.par })),
    reflect: () => getPlay().reflect(),
  };
  (window as unknown as { __measureup: typeof hooks }).__measureup = hooks;
}

boot();
