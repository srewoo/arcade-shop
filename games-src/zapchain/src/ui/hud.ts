// DOM HUD: score (eased count-up), level, clock, discs to go. Only touches the DOM on change.
import type { Game } from '../game';
import { formatTime } from '../strings';
import { CONFIG } from '../config';
import { must } from './dom';

export interface Hud { update: (game: Game, dtSec: number, reduced: boolean) => void }

export function createHud(): Hud {
  const el = {
    root: must('hud'), score: must('hud-score'), level: must('hud-level'), time: must('hud-time'),
    timeBar: must('hud-time-bar'), timeCard: must('hud-time-card'), togo: must('hud-togo'),
    togoBar: must('hud-togo-bar'), best: must('hud-best'),
  };
  const last: Record<string, string> = {};
  let shown = 0;
  const set = (key: string, node: HTMLElement, text: string): void => {
    if (last[key] === text) return;
    last[key] = text;
    node.textContent = text;
  };
  return {
    update(game, dt, reduced): void {
      el.root.style.visibility = game.phase === 'title' ? 'hidden' : 'visible';
      const sim = game.sim;
      const target = game.score;
      shown = reduced || Math.abs(target - shown) < 1 ? target : shown + (target - shown) * Math.min(1, dt * 9);
      set('score', el.score, Math.round(shown).toLocaleString('en-US'));
      set('best', el.best, Math.max(game.scores.best, target).toLocaleString('en-US'));
      if (!sim) return;
      set('level', el.level, String(game.level));
      set('time', el.time, formatTime(sim.remaining));
      set('togo', el.togo, String(sim.toGo));
      const low = sim.remaining <= CONFIG.level.warnSeconds && sim.status === 'playing';
      el.timeCard.classList.toggle('low', low);
      el.timeBar.style.transform = `scaleX(${(sim.remaining / sim.params.seconds).toFixed(3)})`;
      el.togoBar.style.transform = `scaleX(${(1 - sim.toGo / sim.params.target).toFixed(3)})`;
    },
  };
}
