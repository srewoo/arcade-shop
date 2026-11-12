// Per-render updates for the status line and the chrome (buttons, options, labels).
import { isOver, type GameState } from '../game';
import type { Controller } from '../controller';
import type { Settings } from '../settings';
import { gameOverText, moveCounter, statusText } from '../status';
import { S } from '../strings';
import { el, qs } from './dom';
import { renderChips, renderLevelLabels, renderOptionsText } from './chips';

export interface ViewContext {
  readonly settings: Settings;
  readonly ctrl: Controller;
  readonly onboarding: boolean;
  readonly startMessage: boolean;
  readonly newRoundArmed: boolean;
  readonly resetArmed: boolean;
  readonly pendingChange: boolean;
  readonly started: boolean;
}

let lastStatus = '';

export function renderStatus(s: GameState, v: ViewContext): void {
  let text = statusText(s, v.settings.opponent);
  if (isOver(s)) text = gameOverText(s, v.settings.opponent);
  else if (v.newRoundArmed) text = S.newRoundStatus;
  else if (v.startMessage && v.ctrl.cpuTurn) text = S.cpuStarts;
  const status = el('status');
  if (text !== lastStatus) {
    lastStatus = text;
    status.textContent = text;
    status.classList.remove('fresh');
    void status.offsetWidth;
    status.classList.add('fresh');
  }
  status.classList.toggle('thinking', v.ctrl.cpuTurn);
  const counter = moveCounter(s);
  const node = el('movecount');
  node.hidden = counter === null;
  node.textContent = counter?.text ?? '';
  node.classList.toggle('warn', counter?.warn ?? false);
}

export function renderChrome(s: GameState, v: ViewContext): void {
  const options = qs('.options', el('options-box'));
  for (const root of [options, el('settings-overlay')]) renderChips(root, v.settings);
  renderLevelLabels(options, v.settings, 'level-desc');
  renderOptionsText(v.settings, el('options-summary'), el('level-desc'));
  const sound = el('sound');
  sound.setAttribute('aria-pressed', String(v.settings.sound));
  sound.setAttribute('aria-label', v.settings.sound ? S.soundOn : S.soundOff);
  el('theme').setAttribute('aria-label', S.themeLabel(v.settings.theme));
  el('theme').title = S.themeLabel(v.settings.theme);
  el('vanish-hint').hidden = v.settings.variant !== 'vanishing';
  el('new-round-label').textContent = v.newRoundArmed ? S.newRoundConfirm : 'New round';
  el('new-round').classList.toggle('armed', v.newRoundArmed);
  el('reset').textContent = v.resetArmed ? S.resetConfirm : S.resetScores;
  el('reset').classList.toggle('armed', v.resetArmed);
  el<HTMLButtonElement>('pause').disabled = isOver(s);
  const volume = el<HTMLInputElement>('volume');
  if (volume.value !== String(v.settings.volume)) volume.value = String(v.settings.volume);
  el('volume-out').textContent = String(v.settings.volume);
  el('confirm-bar').hidden = !(v.pendingChange && v.started);
  el('onboard').hidden = !v.onboarding;
  el('onboard-text').textContent = v.settings.opponent === 'cpu' ? S.onboarding : S.onboardingTwo;
}

