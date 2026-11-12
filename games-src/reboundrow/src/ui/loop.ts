// Fixed-timestep frame loop with interpolated rendering.
import { CONFIG } from '../config';
import { botInput } from '../sim/bot';
import { stepWorld } from '../sim/step';
import { drainEvents, type EventHooks } from './events';
import { setPrompt, updateChips, updateHud } from './hud';
import { anyOverlay } from './overlays';
import { renderFrame } from './render';
import { syncLayout } from './stageLayout';
import { drawTitleArt } from './titleArt';
import { app, fx } from './state';

export interface LoopDeps { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement; hooks: EventHooks; art: CanvasRenderingContext2D | null }

export const isRunning = (): boolean =>
  app.screen === 'game' && !app.paused && !anyOverlay() && app.run !== null &&
  (app.run.world.phase === 'ready' || app.run.world.phase === 'playing');

/** Advance the simulation by up to maxSteps fixed steps worth of `dt`. Returns steps taken. */
export function advanceSim(dt: number, hooks: EventHooks): number {
  const run = app.run;
  const input = app.input;
  if (!run || !input) return 0;
  app.acc += Math.min(dt, CONFIG.sim.maxFrame);
  let n = 0;
  while (app.acc >= CONFIG.sim.step && n < CONFIG.sim.maxStepsPerFrame) {
    const w = run.world;
    const held = input.snapshot();
    const live = app.autoplay ? botInput(w) : { ...held, launch: input.hasLaunch() && n === 0 };
    stepWorld(w, CONFIG.sim.step, live);
    drainEvents(w, hooks);
    app.acc -= CONFIG.sim.step;
    n++;
    if (w.phase === 'clear' || w.phase === 'over') break;
  }
  if (n === CONFIG.sim.maxStepsPerFrame) app.acc = 0;
  if (n > 0) input.clearLaunch();
  return n;
}

export function startLoop(deps: LoopDeps): void {
  let last = performance.now();
  const frame = (now: number): void => {
    const dt = (now - last) / 1000;
    last = now;
    fx.reduced = app.reduced;
    if (isRunning()) advanceSim(dt, deps.hooks);
    else app.acc = 0;
    fx.update(Math.min(dt, CONFIG.sim.maxFrame));
    const run = app.run;
    if (app.screen === 'game' && run) {
      syncLayout(deps.canvas);
      const alpha = isRunning() ? app.acc / CONFIG.sim.step : 1;
      renderFrame(deps.ctx, deps.canvas.width, deps.canvas.height, run.world, alpha, fx, { assist: app.settings.colorAssist, reduced: app.reduced });
      updateHud(run.world, run.mode);
      updateChips(run.world);
      setPrompt(isRunning() && run.world.phase === 'ready');
    }
    else if (app.screen === 'title' && deps.art) drawTitleArt(deps.art, now / 1000, app.reduced);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
