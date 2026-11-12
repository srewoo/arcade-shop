// HUD text updates (only touches the DOM when a value changes).
import { alignmentFor } from '../alignment';
import { CONFIG } from '../config';
import type { Level } from '../levels/types';
import { formatTime } from '../scoring';
import type { SimState } from '../sim';
import { S } from '../strings';
import { el } from './dom';

export class Hud {
  private readonly time = el('hud-time');
  private readonly par = el('hud-par');
  private readonly damage = el('hud-damage');
  private readonly damageBox = el('hud-damage-box');
  private readonly gear = el('hud-gear');
  private readonly align = el('hud-align');
  private readonly alignBox = el('hud-align-box');
  private readonly wait = el('wait');
  private last = new Map<HTMLElement, string>();

  private set(node: HTMLElement, text: string): void {
    if (this.last.get(node) === text) return;
    this.last.set(node, text);
    node.textContent = text;
  }

  setLevel(level: Level): void {
    el('hud-num').textContent = `${level.id}`;
    el('hud-name').textContent = level.name;
    this.last.clear();
    this.set(this.par, formatTime(level.parTime));
  }

  update(sim: SimState, level: Level, throttle: number): void {
    const left = level.timeLimit - sim.time;
    this.set(this.time, formatTime(left));
    this.time.parentElement?.classList.toggle('low', left < 10 && sim.status === 'playing');
    this.set(this.damage, `${sim.damage}/${CONFIG.damage.wreckAt}`);
    const g = Math.abs(sim.car.v) < 0.1 && throttle === 0 ? 'N' : sim.car.v < -0.05 || (throttle < 0 && sim.car.v < 0.3) ? 'R' : 'D';
    this.set(this.gear, `${S.gear[g]} ${Math.round(Math.abs(sim.car.v) * 3.6)}`);
    const al = alignmentFor(sim.car, level);
    this.set(this.align, sim.inBay ? `\u2713 ${S.inBay}` : `${Math.round(al.quality * 100)}%`);
    this.alignBox.classList.toggle('ok', sim.inBay);
    this.set(this.wait, sim.status === 'ready' ? S.timerWaits : '');
  }

  bump(): void {
    this.damageBox.classList.remove('hud-bump');
    void this.damageBox.offsetWidth;
    this.damageBox.classList.add('hud-bump');
  }
}
