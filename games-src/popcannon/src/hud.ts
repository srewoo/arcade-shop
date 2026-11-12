// HUD text. Writes to the DOM only when a value changed.
import { TUNING } from './config';
import { byId } from './dom';
import { Scores } from './settings';
import { Game } from './state';
import { S } from './strings';

const last = new Map<string, string>();

function setText(id: string, text: string): void {
  if (last.get(id) === text) return;
  last.set(id, text);
  byId(id).textContent = text;
}

function setFlag(id: string, name: string, on: boolean): void {
  const key = `${id}:${name}`;
  const v = String(on);
  if (last.get(key) === v) return;
  last.set(key, v);
  byId(id).classList.toggle(name, on);
}

function setHidden(id: string, hide: boolean): void {
  const key = `${id}:hidden`;
  const v = String(hide);
  if (last.get(key) === v) return;
  last.set(key, v);
  byId(id).hidden = hide;
}

/** Meter label and value for the fourth HUD cell. */
export function meterFor(g: Game): { label: string; value: string } {
  if (g.status !== 'playing' && g.status !== 'cleared') return { label: labelFor(g), value: '-' };
  if (g.mode === 'rush') return { label: S.meter.time, value: `${Math.ceil(g.timeLeft)} s` };
  if (g.mode === 'puzzle') return { label: labelFor(g), value: `${g.shots}/${g.limit}` };
  return { label: S.meter.drop, value: String(g.diff.dropEvery - g.sinceDrop) };
}

const labelFor = (g: Game): string =>
  g.mode === 'rush' ? S.meter.time : g.mode === 'puzzle' ? S.meter.shots(g.par) : S.meter.drop;

export function bestFor(g: Game, scores: Scores, day: number): number {
  if (g.mode === 'daily') return scores.dailyDay === day ? scores.dailyToday : 0;
  return scores[g.mode];
}

export function levelLabel(g: Game): string {
  if (g.mode === 'rush') return 'Rush';
  if (g.mode === 'puzzle') return `Puzzle ${g.level}`;
  return g.mode === 'daily' ? `Daily ${g.level}` : `Level ${g.level}`;
}

export function updateHud(g: Game, scores: Scores, day: number, fireBusy: boolean): void {
  setText('hud-score', String(g.score));
  setText('hud-best', String(Math.max(bestFor(g, scores, day), g.score)));
  setText('hud-level', levelLabel(g));
  const m = meterFor(g);
  setText('hud-meter-label', m.label);
  setText('hud-meter', m.value);
  setText('hud-combo', g.combo > 1 ? `x${g.combo}` : '-');
  setHidden('hud-combo-cell', g.combo <= 1);
  setFlag('hud-meter-cell', 'urgent', g.mode === 'rush' && g.status === 'playing' && g.timeLeft <= TUNING.rush.urgentSeconds);
  setFlag('btn-fire', 'busy', fireBusy);
}
