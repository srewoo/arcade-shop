// Builds the UI, wires dialogs and global listeners, and starts the app.
import { configureAudio, installAudioUnlock } from './audio';
import { STORAGE_KEYS } from './config';
import { exposeDebug } from './debug';
import { ALL_LEVELS } from './levels';
import { dailyKey, dailyLevel } from './puzzle/generate';
import { loadProgress, saveProgress } from './progress';
import { loadSettings, saveSettings } from './settings';
import { removeKey, writeFlag } from './storage';
import { S } from './strings';
import { applyAppearance, applyFxVars } from './ui/appearance';
import { confirmAction } from './ui/dialogs';
import { byId } from './ui/dom';
import { createHud } from './ui/hud';
import { createHelp, createPause, createResult, createRoute, createSettings } from './ui/panels';
import { createScene } from './ui/scene';
import { createShell } from './ui/shell';
import { onKey, pause } from './app/input';
import { onboardKey, refresh, type App } from './app/app';
import { choose, go, quit, showLevels, showMenu } from './app/nav';
import { cross, giveHint, pick, resetCurrent, restart, showRoute, undo } from './app/play';

function applySettings(app: App, reduced: boolean): void {
  saveSettings(app.settings);
  applyAppearance(app.settings, reduced);
  configureAudio({ enabled: app.settings.sound, volume: app.settings.volume });
  const label = app.settings.sound ? S.sound.on : S.sound.off;
  const btn = app.shell.sound;
  btn.setAttribute('aria-pressed', String(app.settings.sound));
  btn.setAttribute('aria-label', label);
  btn.title = `${label} (M)`;
}

function buildDialogs(app: App, apply: () => void): void {
  const settings = createSettings({
    change: (k, v) => { app.settings = { ...app.settings, [k]: v }; apply(); app.dlg.settings.sync(); },
    reset: () => void confirmAction(S.confirm.reset, S.settings.reset).then((ok) => {
      if (!ok) return;
      app.progress = {};
      saveProgress(app.progress);
      removeKey(STORAGE_KEYS.progress);
      app.dlg.settings.modal.close();
      showMenu(app);
    }),
    closed: () => undefined,
  }, () => app.settings);
  app.dlg = {
    pause: createPause({
      resume: () => app.dlg.pause.close(),
      restart: () => void restart(app).then((done) => done && app.dlg.pause.close()),
      settings: app.openSettings,
      quit: () => void quit(app).then((done) => done && app.dlg.pause.close()),
    }),
    help: createHelp(),
    route: createRoute(),
    result: createResult({
      next: () => { app.dlg.result.modal.close(); go(app, (app.ctx?.index ?? 0) + 1); },
      retry: () => { app.dlg.result.modal.close(); resetCurrent(app); },
      route: () => showRoute(app),
      levels: () => { app.dlg.result.modal.close(); showLevels(app); },
      undo: () => { app.dlg.result.modal.close(); undo(app); },
    }),
    settings,
  };
}

function createApp(): App {
  const shell = createShell(byId('app'));
  const app: App = {
    shell, settings: loadSettings(), progress: loadProgress(), ctx: null, session: null, hint: [], resultTimer: 0,
    openSettings: () => { app.dlg.settings.sync(); app.dlg.settings.modal.open(); },
    scene: createScene((i) => pick(app, i)),
    hud: createHud({
      cross: () => cross(app), undo: () => undo(app), hint: () => giveHint(app),
      restart: () => void restart(app), menu: () => void quit(app),
      dismissOnboard: () => { writeFlag(onboardKey(app)); app.hud.showOnboard(null); },
    }),
    dlg: undefined as never,
  };
  shell.play.append(app.scene.root, app.hud.root);
  return app;
}

export function startApp(): void {
  const app = createApp();
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply = (): void => applySettings(app, reducedQuery.matches);
  const toggleMute = (): void => { app.settings = { ...app.settings, sound: !app.settings.sound }; apply(); };
  buildDialogs(app, apply);
  app.shell.sound.addEventListener('click', toggleMute);
  app.shell.settings.addEventListener('click', app.openSettings);
  app.shell.pause.addEventListener('click', () => pause(app));
  document.addEventListener('keydown', (e) => onKey(app, e, { toggleMute }));
  window.addEventListener('blur', () => pause(app));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(app); });
  reducedQuery.addEventListener('change', apply);
  installAudioUnlock();
  applyFxVars();
  apply();
  showMenu(app);
  exposeDebug({
    session: () => app.session, settings: () => app.settings, progress: () => app.progress, levels: () => ALL_LEVELS,
    daily: () => ({ key: dailyKey(new Date()), level: dailyLevel(new Date()) }),
    go: (pack, i) => { choose(app, pack); if (pack !== 'daily') go(app, i); },
    refresh: () => refresh(app, true),
  });
}
