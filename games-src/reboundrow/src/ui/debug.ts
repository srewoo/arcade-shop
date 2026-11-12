// Test hooks, only installed with ?debug=1.
import { applyPower } from '../sim/powerups';
import type { PowerKind } from '../levels/format';
import { botInput } from '../sim/bot';
import { stepWorld } from '../sim/step';
import { CONFIG } from '../config';
import { app } from './state';
import { drainEvents } from './events';
import type { EventHooks } from './events';
import { startRun } from './flow';

export function installDebug(hooks: EventHooks): void {
  const hook = {
    state: () => {
      const w = app.run?.world;
      return {
        screen: app.screen,
        paused: app.paused,
        phase: w?.phase ?? null,
        score: w?.score ?? 0,
        lives: w?.lives ?? 0,
        level: w?.level ?? 0,
        remaining: w?.remaining ?? 0,
        balls: w?.balls.length ?? 0,
        capsules: w?.capsules.length ?? 0,
        paddleW: w?.paddle.w ?? 0,
        effects: w ? { ...w.effects } : null,
        ball: w?.balls[0] ? { x: w.balls[0].x, y: w.balls[0].y } : null,
      };
    },
    autoplay: (on: boolean) => void (app.autoplay = on),
    start: (mode: 'campaign' | 'endless', level: number) => startRun(mode, level),
    power: (kind: PowerKind) => {
      if (app.run) applyPower(app.run.world, kind);
    },
    /** Run the bot headlessly for n seconds of game time (no rendering). */
    fast: (seconds: number) => {
      const w = app.run?.world;
      if (!w) return;
      for (let i = 0; i < seconds / CONFIG.sim.step && (w.phase === 'ready' || w.phase === 'playing'); i++) {
        stepWorld(w, CONFIG.sim.step, botInput(w));
        drainEvents(w, hooks);
      }
    },
    /** Push every live ball off the bottom so the next step costs a life. */
    dropBalls: () => {
      app.run?.world.balls.forEach((b) => {
        b.stuck = false;
        b.y = (app.run?.world.field.h ?? CONFIG.field.h) + 60;
        b.vy = 100;
      });
    },
  };
  (window as unknown as { __rr: typeof hook }).__rr = hook;
}
