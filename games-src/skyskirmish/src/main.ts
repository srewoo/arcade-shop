import './style/tokens.css';
import './style/base.css';
import './style/panels.css';
import { A } from './appState';
import { applyAppearance } from './appearance';
import { installAudioUnlock, emit } from './audio';
import { installDebug } from './debug';
import { announce } from './events';
import { createInput } from './input';
import { startLoop } from './loop';
import { applySettings, bindInput, dismissHint, pauseGame, resumeGame, toTitle } from './session';
import { S } from './strings';
import { byId } from './ui/dom';
import { goBack, overlayOpen, trapTab } from './ui/overlay';
import { createView } from './view';

function init(): void {
  const canvas = byId<HTMLCanvasElement>('game');
  const view = createView(canvas, byId('field'), byId('stage'));
  canvas.setAttribute('aria-label', S.canvasLabel);
  byId('hint-text').textContent = S.hint;
  byId('hint-close').setAttribute('aria-label', S.hintDismiss);
  const input = createInput(canvas, () => A.game?.player ?? { x: 180, y: 540 }, () => A.screen === 'play', () => view.geom().layout);
  bindInput(input);
  installAudioUnlock();
  applySettings();
  installDebug();
  wire(input);
  toTitle();
  startLoop(view, input);
}

function wire(input: ReturnType<typeof createInput>): void {
  byId('pause-btn').addEventListener('click', pauseGame);
  byId('bomb-btn').addEventListener('click', () => input.queueBomb());
  byId('hint-close').addEventListener('click', dismissHint);
  window.addEventListener('keydown', (e) => {
    trapTab(e);
    if (e.key === 'Escape') {
      if (overlayOpen()) {
        if (goBack()) e.preventDefault();
      } else if (A.screen === 'play') pauseGame();
    } else if ((e.code === 'KeyP') && !e.repeat) {
      if (A.screen === 'play') pauseGame();
      else if (A.screen === 'pause') resumeGame();
    } else if (e.code === 'KeyM' && !e.repeat) {
      A.settings = { ...A.settings, sound: !A.settings.sound };
      applySettings();
      announce(A.settings.sound ? S.set.sound + ' ' + S.set.on : S.set.sound + ' ' + S.set.off);
      emit('click');
    }
  });
  window.addEventListener('blur', pauseGame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => applyAppearance(A.settings));
}

init();
