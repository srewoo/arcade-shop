import type { Game } from '../game';
import { MODE_LABEL, S } from '../strings';
import { must } from './dom';

/** Wind readout: text arrow + strength in "bars" so it is not colour-only. */
export function windText(ax: number): { arrow: string; label: string } {
  const bars = Math.min(5, Math.round(Math.abs(ax) / 80));
  if (bars === 0) return { arrow: '·', label: S.calm };
  return { arrow: ax < 0 ? '◀' : '▶', label: S.windDir(ax) };
}

export function createHud(): (g: Game) => void {
  const els = {
    score: must('hud-score'), mode: must('hud-mode'), best: must('hud-best'),
    wind: must('hud-wind'), arrow: must('hud-wind-arrow'), chip: must('chip-wind'),
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
    els.chip.hidden = g.mode !== 'windy';
    put(els.score, String(g.sim.score));
    put(els.mode, MODE_LABEL[g.mode]);
    put(els.best, String(Math.max(g.bestScore, g.sim.score)));
    const w = windText(g.sim.windNow);
    put(els.arrow, w.arrow);
    put(els.wind, w.label);
  };
}
