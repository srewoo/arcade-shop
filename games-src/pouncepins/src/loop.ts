// Fixed-timestep loop: the sim runs at CONFIG.sim.step, rendering interpolates by alpha.
import type { App } from './appState';
import { isReduced } from './appState';
import { CONFIG } from './config';
import { checkOver, isRunning } from './flow';
import { stepMatch } from './matchStep';
import { pinsDown } from './physics';
import { drainEvents } from './events';
import { updateFx } from './render/fx';
import { renderFrame, resizeView } from './render/render';
import { renderBoard } from './ui/board';
import { updateControls } from './ui/controls';

let acc = 0;
let last = 0;

/** Advance the sim by `seconds` in fixed steps (also used by the debug fast-forward). */
export function advance(a: App, seconds: number): void {
  const m = a.match;
  if (!m) return;
  const { step } = CONFIG.sim;
  acc += seconds;
  while (acc >= step) {
    stepMatch(m, step);
    a.time += step;
    updateFx(a.fx, step);
    acc -= step;
    drainEvents(a);
    checkOver(a);
  }
}

function frame(a: App, now: number): void {
  const dt = Math.min(CONFIG.sim.maxFrame, Math.max(0, (now - last) / 1000));
  last = now;
  if (isRunning(a)) advance(a, dt);
  else if (a.screen === 'over' && a.els.overOv.hidden) updateFx(a.fx, dt); // payoff plays before the results card
  const m = a.match;
  if (m && a.screen !== 'title') {
    resizeView(a.view);
    const alpha = isRunning(a) ? acc / CONFIG.sim.step : 1;
    renderFrame(a.view, { match: m, alpha, time: a.time, assist: a.settings.colorAssist, reduce: isReduced(a), fx: a.fx });
    renderBoard(a.els.board, m, pinsDown(m.world));
    updateControls(a.els, m, alpha, a.settings.colorAssist);
  }
  requestAnimationFrame((t) => frame(a, t));
}

export function startLoop(a: App): void {
  last = performance.now();
  requestAnimationFrame((t) => frame(a, t));
}
