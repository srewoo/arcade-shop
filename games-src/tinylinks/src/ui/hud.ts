import type { Game } from '../game/game';
import { relLabel } from '../game/scoring';
import { S } from '../strings';
import { must } from './dom';
import { paintMark } from './mark';

/** Returns an updater that only touches the DOM when a value changed. */
export function createHud(): (game: Game, dragging: boolean) => void {
  const els = {
    hud: must('hud'), dock: must('dock'), card: must('open-card'), pause: must('pause'), name: must('hud-name'), mark: must('hud-mark'),
    hole: must('hud-hole'), par: must('hud-par'), strokes: must('hud-strokes'), total: must('hud-total'),
    label: must('power-label'), meter: must('power-meter'), fill: must('power-fill'), putt: must('putt'),
  };
  const cache = new Map<string, string>();
  const set = (k: string, el: HTMLElement, v: string): void => {
    if (cache.get(k) === v) return;
    cache.set(k, v);
    el.textContent = v;
  };
  return (game, dragging) => {
    const m = game.match;
    const playing = m !== null && game.phase !== 'setup';
    for (const el of [els.hud, els.card, els.pause]) el.hidden = !playing;
    els.dock.hidden = !playing || game.phase === 'complete' || game.phase === 'holeDone';
    if (!m || !playing) return;
    const p = m.players[game.playerIdx];
    if (p && cache.get('who') !== `${game.playerIdx}${p.color}`) {
      cache.set('who', `${game.playerIdx}${p.color}`);
      paintMark(els.mark, p.color, game.playerIdx);
    }
    set('name', els.name, p?.name ?? '');
    set('hole', els.hole, m.holes.length < 18 ? `${m.hole.id} · ${m.holeIdx + 1}/${m.holes.length}` : `${m.hole.id}/18`);
    set('par', els.par, String(m.hole.par));
    set('strokes', els.strokes, `${game.strokes}`);
    const t = m.total(game.playerIdx);
    set('total', els.total, t.played ? `${t.strokes} (${relLabel(t.strokes - t.par)})` : '–');
    const pct = Math.round(game.aim.power * 100);
    set('label', els.label, S.power(pct));
    els.fill.style.width = `${pct}%`;
    els.meter.setAttribute('aria-valuenow', String(pct));
    (els.putt as HTMLButtonElement).disabled = !game.canShoot;
    els.hud.classList.toggle('busy', dragging);
  };
}
