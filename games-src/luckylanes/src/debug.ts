// Test hook, installed only with ?debug=1. Lets a script drive a whole game.
import { chooseShot } from './cpu';
import type { AudioEngine } from './audio';
import type { Game } from './game';
import { laneCacheHits } from './draw';
import { matchScore } from './match';
import { scoreGame } from './scoring';
import { createRng } from './rng';
import type { Shot } from './worldTypes';

export interface DebugExtras {
  readonly audio: AudioEngine;
  readonly settings: () => unknown;
}

export function installDebug(game: Game, start: () => void, extras?: DebugExtras): void {
  const api = {
    game,
    start,
    audio: () => extras?.audio.debugState(),
    settings: () => extras?.settings(),
    laneCacheHits,
    state: () => ({
      stage: game.stage,
      phase: game.input.phase,
      over: game.match.over,
      mode: game.match.mode,
      current: game.match.current,
      rolls: game.match.rolls,
      scores: game.match.players.map((_, i) => matchScore(game.match, i)),
      frames: game.match.players.map((_, i) => scoreGame(game.match.rolls[i] ?? []).map((f) => f.total)),
      mask: game.match.mask,
    }),
    /** Advance simulated time without waiting for real frames. */
    advance: (seconds: number) => { for (let t = 0; t < seconds; t += 1 / 60) game.update(1 / 60); },
    throwShot: (shot: Shot) => game.throwShot(shot),
    /** Bowl `n` human balls with the pro CPU logic, then stop. */
    playBalls: (n: number, seed = 1) => {
      const rng = createRng(seed);
      for (let thrown = 0, t = 0; thrown < n && t < 4000 && !game.match.over; t += 1 / 60) {
        if (game.humanTurn) {
          game.throwShot(chooseShot(game.match.mask, 'pro', rng));
          thrown++;
        }
        game.update(1 / 60);
      }
      for (let t = 0; t < 8 && !game.humanTurn && !game.match.over; t += 1 / 60) game.update(1 / 60);
      return api.state();
    },
    /** Play until it is over, bowling for any human turn with the pro CPU logic. */
    autoPlay: (seed = 1, maxSeconds = 4000) => {
      const rng = createRng(seed);
      for (let t = 0; t < maxSeconds && !game.match.over; t += 1 / 60) {
        if (game.humanTurn) game.throwShot(chooseShot(game.match.mask, 'pro', rng));
        game.update(1 / 60);
      }
      return api.state();
    },
  };
  (window as unknown as { __ll: typeof api }).__ll = api;
}
