// One-time hint on the first run. It never takes pointer events and never moves the layout; it
// disappears on the first launch (or after a few seconds).
import { readFlag, writeFlag } from '../storage';
import { S } from '../strings';
import { $ } from './dom';

const KEY = 'rr-seen-hint';
const AUTO_HIDE_MS = 12000;
let timer = 0;

export function maybeShowHint(): void {
  if (readFlag(KEY)) return;
  $('onboard-text').textContent = `${S.hint} ${S.hintKeys}`;
  $('onboard').hidden = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(markHintSeen, AUTO_HIDE_MS);
}

export function markHintSeen(): void {
  window.clearTimeout(timer);
  if ($('onboard').hidden) return;
  $('onboard').hidden = true;
  writeFlag(KEY);
}
