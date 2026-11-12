// Test hook. Only bundled in dev or when built with VITE_E2E=1, and only active with ?debug=1.
import { renderBurstPeak } from './audio';
import { bestAngle, playSkilled } from './bot';
import { aim, fire } from './shoot';
import { Game, Mode, newGame } from './state';
import { STEP, update } from './update';

interface Host {
  get(): Game;
  set(g: Game): void;
  phase(): string;
}

export function installDebug(host: Host): void {
  if (new URLSearchParams(location.search).get('debug') !== '1') return;
  const api = {
    state: () => {
      const g = host.get();
      return {
        phase: host.phase(), mode: g.mode, status: g.status, score: g.score, combo: g.combo, shots: g.shots, hits: g.hits,
        level: g.level, angle: g.angle, sinceDrop: g.sinceDrop, stars: g.stars, timeLeft: g.timeLeft, reduced: g.reduced,
        bubbles: g.grid.rows.flat().filter(Boolean).length, rows: g.grid.rows.length,
        ball: g.ball ? { x: g.ball.x, y: g.ball.y } : null,
      };
    },
    start: (mode: Mode, puzzleIndex = 0, seed = 1) => host.set(newGame(mode, { puzzleIndex, seed })),
    shoot: (deg: number) => { const g = host.get(); aim(g, (deg * Math.PI) / 180); return fire(g); },
    shootBest: () => { const g = host.get(); aim(g, bestAngle(g)); return fire(g); },
    playSkilled: () => playSkilled(host.get()),
    settle: (steps = 240) => { const g = host.get(); for (let i = 0; i < steps; i++) update(g, STEP, { left: false, right: false }); },
    patch: (p: Partial<Game>) => Object.assign(host.get(), p),
    audioPeak: (percent = 100) => renderBurstPeak(percent),
  };
  (window as unknown as { __pc: typeof api }).__pc = api;
}
