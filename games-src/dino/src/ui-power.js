// HUD for active power-ups (icon + name + countdown bar / ring), the Time Attack clock and short toast messages.
import { POWERUPS, POWERUP_IDS } from './powerups.js';
import { formatClock } from './modes.js';

const el = (id) => document.getElementById(id);

export class PowerHud {
  constructor() {
    this.list = el('powerups');
    this.clock = el('clock');
    this.toastEl = el('toast');
    this.toastTimer = 0;
    this.clockText = '';
    this.chips = {};
    for (const id of POWERUP_IDS) {
      const p = POWERUPS[id];
      const li = document.createElement('li');
      li.className = 'pu hidden';
      li.dataset.id = id;
      li.style.setProperty('--pu', p.color);
      li.setAttribute('aria-label', p.label);
      const icon = Object.assign(document.createElement('span'), { className: 'pu-icon', textContent: p.short });
      const name = Object.assign(document.createElement('span'), { className: 'pu-name', textContent: p.label });
      const time = Object.assign(document.createElement('span'), { className: 'pu-time' });
      const bar = Object.assign(document.createElement('span'), { className: 'pu-bar' });
      li.append(icon, name, time, bar);
      this.list.appendChild(li);
      // last displayed values live on the chip record, so a frame allocates nothing
      this.chips[id] = { li, time, bar, on: false, secs: -1, text: '', pct: -1, warn: false };
    }
  }

  /** Cheap per-frame refresh: only touches the DOM when a displayed value changes. */
  update(powers) {
    for (const id of POWERUP_IDS) {
      const chip = this.chips[id];
      const on = powers.has(id);
      const warn = on && powers.expiring(id);
      if (!on && !chip.on && chip.pct === 0) continue;
      const secs = on ? Math.ceil(powers.remaining(id)) : -1;
      const text = secs === chip.secs ? chip.text : on ? `${secs}s` : ''; // the label string is rebuilt only when the second changes
      const pct = on ? Math.round(powers.fraction(id) * 100) : 0;
      if (chip.on !== on) chip.li.classList.toggle('hidden', !on);
      if (chip.text !== text) chip.time.textContent = text;
      if (chip.pct !== pct) {
        chip.bar.style.setProperty('--p', `${pct}%`);
        chip.li.style.setProperty('--p', `${pct}%`);
      }
      if (chip.warn !== warn) chip.li.classList.toggle('warn', warn);
      chip.on = on;
      chip.text = text;
      chip.secs = secs;
      chip.pct = pct;
      chip.warn = warn;
    }
  }

  /** @param seconds Infinity hides the clock.  Under 10 s the text gets a "!" prefix (not colour alone) and pulses. */
  setClock(seconds) {
    const show = Number.isFinite(seconds);
    this.clock.classList.toggle('hidden', !show);
    if (!show) return;
    const low = seconds <= 10;
    const text = (low ? '! ' : '') + formatClock(seconds);
    if (this.clockText !== text) {
      this.clockText = text;
      this.clock.textContent = text;
    }
    this.clock.classList.toggle('low', low);
  }

  toast(text, ms = 1800) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }
}
