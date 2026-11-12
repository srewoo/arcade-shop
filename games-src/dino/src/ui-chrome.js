// Static chrome that needs strings.js text: START button, corner buttons' accessible names, the controls line and the
// title call-to-action (which says what Space / Enter will do depending on where focus is).
import { S, ctaText } from './strings.js';
import { params } from './state.js';
import { bindCta, currentPhase, paintStart } from './ui-start.js';

export { setStartReady, setStartProgress } from './ui-start.js';

const el = (id) => document.getElementById(id);

function refreshCta() {
  const a = document.activeElement;
  const onChip = a instanceof HTMLElement && Boolean(a.closest('#modes, #weather-chips'));
  el('cta-text').textContent = ctaText(onChip, params.coarsePointer, currentPhase());
}

export function initChrome() {
  bindCta(refreshCta);
  paintStart();
  el('btn-settings').setAttribute('aria-label', S.title.settingsAria);
  el('btn-settings').title = `${S.title.settingsAria} (S)`;
  el('btn-pause').setAttribute('aria-label', S.title.pauseAria);
  el('btn-pause').title = `${S.title.pauseAria} (P)`;
  el('btn-help').setAttribute('aria-label', S.title.helpAria);
  el('btn-help').title = S.title.helpTitle;
  const keys = params.coarsePointer;
  el('hints').querySelector('.hint-main').textContent = keys ? S.hints.touch : S.hints.keys;
  el('hints').querySelector('.hint-more').textContent = keys ? S.hints.touchMore : S.hints.more;
  el('hints').querySelector('.hint-title').textContent = keys ? S.hints.touchTitle : S.hints.keysTitle;
  refreshCta();
  for (const id of ['modes', 'weather-chips']) {
    el(id).addEventListener('focusin', refreshCta);
    el(id).addEventListener('focusout', () => setTimeout(refreshCta, 0));
  }
}
