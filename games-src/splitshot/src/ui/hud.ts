import type { Game } from '../game';
import { must } from './dom';

export function createHud(): (g: Game) => void {
  const els = {
    score: must('hud-score'), lives: must('hud-lives'), stage: must('hud-stage'), time: must('hud-time'),
    best: must('hud-best'), bar: must('hud-bar'), chip: must('hud-time-chip'),
  };
  const hud = must('hud');
  const actions = must('top-actions');
  const last = new Map<HTMLElement, string>();
  const put = (el: HTMLElement, v: string): void => {
    if (last.get(el) !== v) { last.set(el, v); el.textContent = v; }
  };
  return (g) => {
    const title = g.phase === 'title';
    hud.hidden = title;
    actions.hidden = title;
    if (title) return;
    const sim = g.sim;
    put(els.score, String(sim.score));
    put(els.lives, String(g.run.lives));
    put(els.stage, String(g.run.stage + 1));
    put(els.time, String(Math.ceil(sim.time)));
    put(els.best, String(Math.max(g.best.score, sim.score)));
    els.bar.style.transform = `scaleX(${(sim.time / sim.stage.time).toFixed(3)})`;
    els.chip.classList.toggle('low', sim.time <= 10 && sim.started);
  };
}
