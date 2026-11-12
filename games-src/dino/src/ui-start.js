// START button state on the title: LOADING (with a real progress bar) -> START, and a queued press ("STARTING").
// A press while loading is remembered (game.startQueued) and main.js fires it when the engine is ready.
import { S } from './strings.js';
import { game } from './state.js';
import { startPhase, startAction } from './startFlow.js';

const el = (id) => document.getElementById(id);
let refreshCta = () => {};

/** chrome registers the CTA refresher so the call-to-action text follows the phase. */
export function bindCta(fn) {
  refreshCta = fn;
}

export const currentPhase = () => startPhase({ ready: game.physicsReady, queued: game.startQueued });

/** Paint the button for the current phase. */
export function paintStart() {
  const b = el('btn-start');
  const phase = currentPhase();
  b.classList.toggle('is-loading', phase !== 'ready');
  b.setAttribute('aria-disabled', String(phase !== 'ready'));
  b.querySelector('.start-label').textContent = phase === 'ready' ? S.title.start : phase === 'queued' ? S.title.starting : S.title.loading;
  document.getElementById('title').classList.toggle('is-loading', phase !== 'ready');
  refreshCta();
}

export function setStartReady(ready) {
  game.physicsReady = ready || game.physicsReady;
  if (ready) setStartProgress(1);
  paintStart();
}

/** 0..1 loading progress (drives the bar under the label). */
export function setStartProgress(f) {
  el('btn-start').style.setProperty('--p', `${Math.round(Math.min(1, Math.max(0, f)) * 100)}%`);
}

/** Space / Enter / tap / START click on the title. Returns true when the run should start right now. */
export function pressStart() {
  const action = startAction({ ready: game.physicsReady, queued: game.startQueued });
  if (action === 'queue') {
    game.startQueued = true;
    paintStart();
  }
  return action === 'start';
}
