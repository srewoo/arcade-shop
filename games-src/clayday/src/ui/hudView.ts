// Writes the HUD chips. Only touches the DOM when a value actually changed.
import { CONFIG } from '../config';
import { comboMult } from '../scoring';
import type { Round } from '../sim';
import { S, windLabel } from '../strings';
import { byId } from './dom';

export const windKmh = (wind: number): number => Math.round(Math.abs(wind) * CONFIG.wind.kmhPerUnit);
export const windDir = (wind: number): 'left' | 'right' | 'none' => (windKmh(wind) === 0 ? 'none' : wind < 0 ? 'left' : 'right');

export class HudView {
  private readonly last = new Map<string, string>();
  private readonly el = {
    round: byId('hud-round'), score: byId('hud-score'), time: byId('hud-time'), wind: byId('hud-wind'),
    combo: byId('hud-combo'), shells: byId('shells'), tally: byId('tally'), reload: byId<HTMLButtonElement>('reload'),
    reloadLabel: byId('reload-label'), bar: byId('reload-bar'), chipTime: byId('chip-time'), chipCombo: byId('chip-combo'),
  };

  private text(key: string, node: HTMLElement, value: string): void {
    if (this.last.get(key) === value) return;
    this.last.set(key, value);
    node.textContent = value;
  }

  private cls(key: string, node: HTMLElement, name: string, on: boolean): void {
    const k = `${key}:${name}`;
    if (this.last.get(k) === String(on)) return;
    this.last.set(k, String(on));
    node.classList.toggle(name, on);
  }

  reset(round: Round): void {
    this.last.clear();
    this.el.tally.replaceChildren(...round.marks.map(() => document.createElement('i')));
  }

  update(round: Round, label: number, carried: number): void {
    const e = this.el;
    this.text('round', e.round, String(label));
    this.text('score', e.score, String(carried + round.score));
    this.text('time', e.time, round.timed ? `${Math.ceil(round.timeLeft)}s` : '--');
    this.cls('time', e.chipTime, 'low', round.timed && round.timeLeft <= 10 && round.phase === 'live');
    const kmh = windKmh(round.wind);
    this.text('wind', e.wind, windLabel(kmh, windDir(round.wind)));
    const mult = comboMult(round.streak);
    this.text('combo', e.combo, round.streak > 1 ? `x${mult.toFixed(2)} (${round.streak})` : 'x1');
    this.cls('combo', e.chipCombo, 'hot', round.streak >= 3);
    this.shells(round);
    this.tally(round);
  }

  private shells(round: Round): void {
    const e = this.el;
    const n = round.gun.shells;
    const key = `${n}/${round.gun.cap}`;
    if (this.last.get('shells') !== key) {
      this.last.set('shells', key);
      e.shells.replaceChildren(...Array.from({ length: round.gun.cap }, (_, i) => {
        const shell = document.createElement('i');
        if (i >= n) shell.className = 'empty';
        return shell;
      }));
      e.shells.setAttribute('aria-label', `${n} ${S.shells.toLowerCase()} ${S.left}`);
    }
    const reloading = round.gun.reloading;
    this.text('reloadLabel', e.reloadLabel, reloading ? S.reloading : S.reload);
    const canReload = round.phase === 'live' && !reloading && n < round.gun.cap;
    if (e.reload.disabled === canReload) e.reload.disabled = !canReload;
    e.bar.style.width = reloading ? `${Math.round(round.gun.reloadProgress * 100)}%` : '0';
  }

  private tally(round: Round): void {
    const kids = this.el.tally.children;
    round.marks.forEach((m, i) => {
      const k = `t${i}`;
      if (this.last.get(k) === m) return;
      this.last.set(k, m);
      const node = kids[i];
      if (node) node.className = m === 'pending' ? '' : m;
    });
    const hits = round.marks.filter((m) => m === 'hit').length;
    const miss = round.marks.filter((m) => m === 'miss').length;
    const label = `${hits} hit, ${miss} missed, ${round.marks.length - hits - miss} to come`;
    if (this.last.get('tallyLabel') !== label) {
      this.last.set('tallyLabel', label);
      this.el.tally.setAttribute('aria-label', label);
    }
  }
}
