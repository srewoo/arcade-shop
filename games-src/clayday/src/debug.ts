// Debug hooks: only installed with ?debug=1.
import { clayVelocity } from './clay';
import type { Game } from './game';
import { worldToClient } from './world';

export const isDebug = (search: string = location.search): boolean => new URLSearchParams(search).get('debug') === '1';

export const seedFromQuery = (search: string = location.search): number | null => {
  const raw = new URLSearchParams(search).get('seed');
  const n = raw === null ? NaN : Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 0xffffffff ? n : null;
};

export function installDebug(game: Game): void {
  const clays = (): object[] =>
    (game.round?.clays ?? []).filter((c) => c.state === 'flying').map((c) => {
      const v = clayVelocity(c.spec, game.world, c.wind, c.age);
      const p = worldToClient(game.renderer.fit, c.x, c.y);
      const r = game.canvas.getBoundingClientRect();
      return { id: c.id, kind: c.spec.kind, x: c.x, y: c.y, vx: v.x, vy: v.y, r: c.radius, cx: r.left + p.x, cy: r.top + p.y, age: c.age };
    });
  const toClient = (x: number, y: number): { x: number; y: number } => {
    const p = worldToClient(game.renderer.fit, x, y);
    const r = game.canvas.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  };
  (window as unknown as Record<string, unknown>).__clay = {
    state: () => ({
      state: game.state, phase: game.round?.phase ?? null, hits: game.round?.hits ?? 0, score: game.round?.score ?? 0,
      shells: game.round?.gun.shells ?? 0, timeLeft: game.round?.timeLeft ?? 0, launched: game.round?.launched ?? 0,
      round: game.session.round, world: game.world, scale: game.renderer.fit.scale, wind: game.round?.wind ?? 0,
      shotsFired: game.round?.shotsFired ?? 0, result: game.round?.result ?? null, marks: game.round?.marks.join(',') ?? '',
    }),
    clays, toClient, lead: (ahead: number) => game.round && clays().map((c) => {
      const k = c as { id: number; x: number; y: number; vx: number; vy: number };
      return { id: k.id, ...toClient(k.x + k.vx * ahead, k.y + k.vy * ahead) };
    }),
    /** Jump to a campaign round (debug only). */
    setRound: (n: number) => {
      game.session = { ...game.session, round: n };
      game.screens.closeTitle();
      game.beginRound();
    },
    /** Fast-forward the simulation by `seconds` without rendering. */
    skip: (seconds: number) => {
      const r = game.round;
      for (let t = 0; r && t < seconds; t += 1 / 60) r.step(1 / 60);
    },
  };
}
