import type { Game } from '../game';
import { metres, scoreOf } from '../sim';
import { must } from './dom';

export function createHud(): (g: Game) => void {
  const els = {
    score: must('hud-score'), dist: must('hud-dist'), coins: must('hud-coins'), best: must('hud-best'),
  };
  const hud = must('hud');
  const actions = document.querySelector<HTMLElement>('.top-actions');
  const last = new Map<HTMLElement, string>();
  const put = (el: HTMLElement, v: string): void => {
    if (last.get(el) !== v) { last.set(el, v); el.textContent = v; }
  };
  return (g) => {
    hud.hidden = g.phase === 'title';
    if (actions) actions.hidden = g.phase === 'title';
    const sim = g.run?.sim;
    put(els.score, String(sim ? scoreOf(sim) : 0));
    put(els.dist, String(sim ? metres(sim) : 0));
    put(els.coins, String(sim?.coinCount ?? 0));
    put(els.best, String(Math.max(g.bestScore, sim ? scoreOf(sim) : 0)));
  };
}
