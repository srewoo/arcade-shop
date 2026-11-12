// DOM status panel (score, level, hi, lives, water meter, grooming note). Beside the board on wide
// screens, above it on narrow ones. Writes to the DOM only when a value changes.
import { hudModel } from '../hud';
import type { HudModel, HudState } from '../hud';
import { STR } from '../strings';

function need<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

export class HudView {
  private readonly root = need('hud');
  private readonly score = need('hud-score');
  private readonly hi = need('hud-hi');
  private readonly level = need('hud-level');
  private readonly lives = need('hud-lives');
  private readonly meter = need('hud-meter');
  private readonly fill = need('hud-meter-fill');
  private readonly state = need('hud-state');
  private last: Partial<HudModel> = {};

  update(s: HudState): void {
    const m = hudModel(s);
    const l = this.last;
    if (m.score !== l.score) this.score.textContent = m.score;
    if (m.hi !== l.hi) this.hi.textContent = m.hi;
    if (m.level !== l.level) this.level.textContent = String(m.level);
    if (m.lives !== l.lives) this.setLives(m.lives);
    if (m.demo !== l.demo) this.root.toggleAttribute('data-demo', m.demo);
    if (m.grooming !== l.grooming) {
      this.root.toggleAttribute('data-resting', m.grooming);
      this.state.textContent = m.grooming ? STR.hud.grooming : '';
    }
    if ((m.drench > 0) !== ((l.drench ?? 0) > 0)) this.meter.hidden = m.drench <= 0;
    if (m.drench !== l.drench) this.fill.style.transform = `scaleX(${m.drench.toFixed(3)})`;
    if (m.drenchWarn !== l.drenchWarn) this.fill.classList.toggle('warn', m.drenchWarn);
    this.last = m;
  }

  private setLives(n: number): void {
    this.lives.replaceChildren(...Array.from({ length: n }, () => {
      const i = document.createElement('span');
      i.className = 'life';
      return i;
    }));
    this.lives.setAttribute('aria-label', STR.hud.lives(n));
  }
}
