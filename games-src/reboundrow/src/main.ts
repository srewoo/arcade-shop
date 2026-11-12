import './style/tokens.css';
import './style/base.css';
import './style/game.css';
import './style/overlays.css';
import { installAudioUnlock, emitSfx, unlockAudio } from './audio';
import { LEVELS } from './levels';
import { loadProgress } from './progress';
import { loadSettings } from './settings';
import { S } from './strings';
import { applyAll } from './ui/apply';
import { installDebug } from './ui/debug';
import { $ } from './ui/dom';
import type { EventHooks } from './ui/events';
import * as flow from './ui/flow';
import { createInput } from './ui/input';
import { startLoop } from './ui/loop';
import { renderLevelGrid } from './ui/menu';
import { anyOverlay, closeOverlay, handleOverlayKey, openOverlay, topOverlay } from './ui/overlays';
import { app } from './ui/state';
import { bindSettingsUi } from './ui/settingsUi';
import { placement, setBox } from './ui/stageLayout';

const hooks: EventHooks = {
  onClear: flow.onClear,
  onOver: flow.onOver,
  onLaunch: flow.markHintSeen,
};

function fillStaticText(): void {
  $('tagline').textContent = S.tagline;
  $('how-list').replaceChildren(...S.howBody.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  const canvas = $<HTMLCanvasElement>('canvas');
  canvas.setAttribute('aria-label', S.canvasLabel);
}

function bindMenu(): void {
  const click = (id: string, fn: () => void): void =>
    $(id).addEventListener('click', () => {
      unlockAudio();
      emitSfx('click');
      fn();
    });
  click('btn-play', () => flow.startRun('campaign', app.progress.unlocked));
  click('btn-endless', () => {
    app.seed = (Math.random() * 0xffffffff) >>> 0;
    flow.startRun('endless', 1);
  });
  click('btn-levels', () => {
    renderLevelGrid((n) => {
      closeOverlay($('levels-overlay'));
      flow.startRun('campaign', Math.min(n, LEVELS.length));
    });
    openOverlay($('levels-overlay'));
  });
  click('btn-how', () => openOverlay($('how-overlay')));
  click('btn-settings', flow.openSettings);
  click('btn-settings-game', flow.openSettings);
  click('btn-pause', flow.pauseGame);
  click('levels-close', () => closeOverlay($('levels-overlay')));
  click('how-close', () => closeOverlay($('how-overlay')));
  click('settings-close', flow.closeSettings);
  click('pause-resume', flow.resumeGame);
  click('pause-settings', flow.openSettings);
  click('pause-restart', () => flow.askConfirm('restart'));
  click('pause-quit', () => flow.askConfirm('quit'));
  click('pause-confirm-yes', flow.acceptConfirm);
  click('pause-confirm-no', flow.cancelConfirm);
  click('result-next', flow.nextLevel);
  click('result-retry', flow.retryRun);
  click('result-menu', () => {
    closeOverlay($('result-overlay'));
    flow.showTitle();
  });
}

function bindGlobal(): void {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !anyOverlay() && app.screen === 'game') {
      e.preventDefault();
      flow.pauseGame();
      return;
    }
    handleOverlayKey(e);
  });
  const autoPause = (): void => {
    if (app.run?.world.phase === 'playing') flow.pauseGame();
  };
  document.addEventListener('visibilitychange', () => document.hidden && autoPause());
  window.addEventListener('blur', autoPause);
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  app.systemReduced = mq.matches;
  mq.addEventListener('change', (e) => {
    app.systemReduced = e.matches;
    applyAll();
  });
}

function boot(): void {
  app.settings = loadSettings();
  app.progress = loadProgress();
  app.seed = (Date.now() & 0x7fffffff) >>> 0;
  const params = new URLSearchParams(location.search);
  const seedParam = Number(params.get('seed'));
  if (params.has('seed') && Number.isFinite(seedParam)) app.seed = seedParam >>> 0;
  fillStaticText();
  const canvas = $<HTMLCanvasElement>('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  installAudioUnlock();
  bindGlobal();
  applyAll();
  bindSettingsUi(() => app.settings, flow.applySettings);
  app.input = createInput(
    canvas,
    {
      onPause: flow.togglePause,
      onMute: () => flow.applySettings({ ...app.settings, sound: !app.settings.sound }),
    },
    () => app.screen === 'game' && (!anyOverlay() || topOverlay() === $('pause-overlay')),
    placement,
  );
  bindMenu();
  new ResizeObserver((entries) => {
    const r = entries[0]?.contentRect;
    if (r && r.width > 0) setBox(r.width, r.height);
  }).observe($('stage'));
  flow.showTitle();
  startLoop({ ctx, canvas, hooks, art: $<HTMLCanvasElement>('title-art').getContext('2d') });
  if (params.get('debug') === '1') installDebug(hooks);
}

boot();
