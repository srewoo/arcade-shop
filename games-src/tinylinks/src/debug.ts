// Test hooks, only installed with ?debug=1.
import { bestShot } from './physics/solver';
import { distanceField } from './course/validate';
import type { Game } from './game/game';
import type { MatchSetup } from './game/match';

export function installDebug(game: Game, particles: () => number, startMatch: (s: MatchSetup) => void): void {
  const api = {
    state: (): Record<string, unknown> => ({
      phase: game.phase, paused: game.paused, hole: game.match?.hole.id ?? 0, player: game.playerIdx, strokes: game.strokes,
      ball: game.sim ? { x: game.sim.ball.x, y: game.sim.ball.y, state: game.sim.state } : null,
      scores: game.match?.scores ?? [], aim: game.aim, particles: particles(),
    }),
    start: (setup: MatchSetup): void => startMatch(setup),
    strike: (angle: number, power: number): boolean => { game.aim = { angle, power }; return game.shoot(); },
    /** Advance game time without rendering. */
    advance: (sec: number): void => { for (let t = 0; t < sec; t += 1 / 60) game.frame(1 / 60); },
    /** Let the bot take the current player's next stroke. */
    bot: (): boolean => {
      if (!game.sim || !game.match || !game.canShoot) return false;
      const shot = bestShot(game.sim, distanceField(game.match.hole));
      if (!shot) return false;
      game.aim = shot;
      return game.shoot();
    },
    /** Bot plays until the hole is finished (everyone holed out). */
    playHole: (): void => {
      for (let i = 0; i < 400 && game.phase !== 'holeDone' && game.phase !== 'complete' && game.phase !== 'setup'; i++) {
        if (game.canShoot) api.bot(); else api.advance(0.25);
      }
    },
    nextHole: (): void => game.nextHole(),
  };
  (window as unknown as { __tinylinks: typeof api }).__tinylinks = api;
}
