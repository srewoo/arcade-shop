// Result sheet content.
import type { Level } from '../levels/types';
import type { LevelRecord } from '../progress';
import { formatTime, pointsFor, starNote, starsFor, tierFor } from '../scoring';
import type { Tier } from '../scoring';
import type { SimState } from '../sim';
import { S } from '../strings';
import { el } from './dom';

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

export interface ResultView {
  readonly stars: number;
  readonly score: number;
  readonly title: string;
  readonly tier: Tier;
}

export function summarise(sim: SimState, level: Level): ResultView {
  const parked = sim.status === 'parked';
  const outcome = { parked, damage: sim.damage, time: sim.time };
  const stars = starsFor(outcome, level);
  const tier = tierFor(parked, stars);
  const title = parked ? S.tier[tier] : sim.status === 'timeout' ? S.timeout : S.wrecked;
  return { stars, score: pointsFor(outcome, level), title, tier };
}

export function showResult(sim: SimState, level: Level, view: ResultView, best: LevelRecord | undefined, hasNext: boolean): void {
  el('result-title').textContent = view.title;
  const parked = sim.status === 'parked';
  el('result-note').textContent = starNote(parked, sim.damage === 0, sim.time <= level.parTime);
  (el('result-overlay').querySelector('.sheet') as HTMLElement).dataset.tier = view.tier;
  const starBox = el('result-stars');
  starBox.innerHTML = [0, 1, 2].map((i) => STAR.replace('<svg', `<svg class="${i < view.stars ? 'on' : ''}"`)).join('');
  starBox.setAttribute('aria-label', S.resultLine(view.stars));
  const rows: [string, string][] = [
    [S.time, formatTime(sim.time)],
    [S.par, formatTime(level.parTime)],
    [S.damage, `${sim.damage}`],
  ];
  if (sim.status === 'parked') {
    rows.push([S.clean, sim.damage === 0 ? 'Yes' : 'No'], [S.fast, sim.time <= level.parTime ? 'Yes' : 'No'], [S.score, String(view.score)]);
  }
  if (best) rows.push([S.best, `${formatTime(best.bestTime)} · ${best.stars}/3`]);
  el('result-list').innerHTML = rows.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('');
  el('result-next').hidden = !(sim.status === 'parked' && hasNext);
}
