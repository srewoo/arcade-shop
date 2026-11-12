// The frame loop: fixed-timestep simulation with interpolated rendering.
import { A } from './appState';
import { advanceClock } from './clock';
import { handleEvents, reduced, tickBanner } from './events';
import { fxUpdate } from './fx';
import { render, type RenderView } from './render';
import { onRunStopped, dismissHint } from './session';
import { bestFor } from './scores';
import { stepGame } from './step';
import type { InputDevice } from './input';
import type { Input } from './types';
import { updateHud } from './ui/hud';
import { byId } from './ui/dom';
import type { View } from './view';

export function startLoop(view: View, input: InputDevice): void {
  let acc = 0;
  let lastTs = performance.now();

  const readInput = (): Input => {
    const i = input.read();
    return A.settings.autoFire ? { ...i, fire: true } : i;
  };

  const tickHint = (dt: number): void => {
    if (input.moved) A.hintTimer = Math.min(A.hintTimer, 1.5);
    byId('hint').dataset.fade = String(A.hintTimer < 0.8);
    if ((A.hintTimer -= dt) <= 0) dismissHint();
  };

  const simulate = (dt: number): void => {
    const g = A.game;
    if (!g) return;
    const r = advanceClock(acc, dt);
    acc = r.acc;
    A.alpha = r.alpha;
    for (let i = 0; i < r.steps && g.phase === 'playing'; i++) {
      if (A.god) g.player.invuln = Math.max(g.player.invuln, 1);
      stepGame(g, readInput());
      handleEvents(g);
    }
    tickBanner(dt);
    if (A.hintTimer > 0) tickHint(dt);
    updateHud(g, bestFor(A.scores, g.mode, g.difficulty).score);
    if (g.phase !== 'playing') onRunStopped(dt);
  };

  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - lastTs) / 1000);
    lastTs = now;
    if (document.body.dataset.screen !== A.screen) document.body.dataset.screen = A.screen;
    if (A.screen === 'play') simulate(dt);
    else acc = 0;
    if (A.screen === 'play' || A.screen === 'title') A.clock += dt;
    fxUpdate(A.fx, A.screen === 'play' ? dt : 0);
    const banner = A.banner ? { text: A.banner.text, opacity: Math.min(1, A.banner.t / 0.5) } : null;
    const rv: RenderView = { state: A.game, alpha: A.screen === 'play' ? A.alpha : 1, clock: A.clock, assist: A.settings.colorAssist, reduce: reduced(), fx: A.fx, banner };
    render(view.ctx, rv, view.geom());
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
