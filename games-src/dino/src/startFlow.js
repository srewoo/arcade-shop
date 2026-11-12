// Title start flow (pure): START is never a dead control. While the physics engine is still loading a press is
// remembered ("queued") and the run starts the moment loading finishes.

/** What a Space / Enter / tap / START click does on the title: start now, remember it for later, or nothing. */
export function startAction({ ready, queued }) {
  if (ready) return 'start';
  return queued ? 'ignore' : 'queue';
}

/** Which title phase the call-to-action describes. */
export function startPhase({ ready, queued }) {
  if (ready) return 'ready';
  return queued ? 'queued' : 'loading';
}

/** Loading steps reported by main.js (engine module, idle wait, ragdoll warm-up) -> 0..1 for the progress bar. */
export const LOAD_STEPS = Object.freeze({ boot: 0.08, engine: 0.45, idle: 0.65, warm: 0.9, ready: 1 });

/** True when a queued start may fire: still on the title and no dialog open (settings etc.). */
export function shouldFireQueued({ queued, state, menuOpen }) {
  return queued && state === 'title' && !menuOpen;
}
