// Title/menu overlay: mode picker, CPU level, best scores and lifetime stats.
import { Dialog } from './dialog';
import { byId } from './dom';
import { MODES, type HighScoreKey, type HighScores, type Mode, type Settings } from './settings';
import type { Stats } from './stats';
import { S } from './strings';

const MODE_INFO: Record<Mode, { name: string; blurb: string }> = {
  solo: { name: 'Solo', blurb: 'Ten frames, just you and the lane.' },
  hotseat: { name: 'Hot seat', blurb: '2-4 players share one device and take turns.' },
  cpu: { name: 'CPU rival', blurb: 'Race a computer bowler: Casual relaxes, Pro rarely misses.' },
  spare: { name: 'Spare challenge', blurb: 'Ten preset pin leaves, one ball each. Clear them all.' },
};

const SCORE_LABEL: Record<HighScoreKey, string> = {
  solo: 'Solo', hotseat: 'Hot seat', cpuCasual: 'CPU Casual', cpuEasy: 'CPU Easy', cpuPro: 'CPU Pro', spare: 'Spare challenge',
};

export function keyForSettings(s: Settings): HighScoreKey {
  if (s.mode !== 'cpu') return s.mode;
  return s.cpuLevel === 'pro' ? 'cpuPro' : s.cpuLevel === 'easy' ? 'cpuEasy' : 'cpuCasual';
}

export interface MenuHandlers {
  onStart(s: Settings): void;
  onSettings(): void;
  onChange(s: Settings): void;
}

export const statsLine = (s: Stats): string =>
  s.games === 0 ? S.statsEmpty : `Games ${s.games} · ${S.best} ${s.best} · Strikes ${s.strikes} · Spares ${s.spares} · Gutters ${s.gutters}`;

export class Menu {
  private readonly dialog = new Dialog(byId('menu'), { onEscape: () => undefined });
  private stats: Stats = { games: 0, best: 0, strikes: 0, spares: 0, gutters: 0 };

  constructor(private settings: Settings, private scores: HighScores, private readonly h: MenuHandlers) {
    const modes = byId('mode-group');
    for (const mode of MODES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mode';
      b.dataset.mode = mode;
      b.setAttribute('role', 'radio');
      const name = document.createElement('b');
      name.textContent = MODE_INFO[mode].name;
      const blurb = document.createElement('span');
      blurb.textContent = MODE_INFO[mode].blurb;
      b.append(name, blurb);
      b.addEventListener('click', () => this.update({ mode }));
      modes.append(b);
    }
    byId<HTMLSelectElement>('players').addEventListener('change', (e) => this.update({ players: Number((e.target as HTMLSelectElement).value) }));
    byId<HTMLSelectElement>('cpu-level').addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      this.update({ cpuLevel: v === 'pro' ? 'pro' : v === 'easy' ? 'easy' : 'casual' });
    });
    byId('start').addEventListener('click', () => h.onStart(this.settings));
    byId('menu-settings').addEventListener('click', () => h.onSettings());
    this.render();
  }

  private update(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    this.h.onChange(this.settings);
    this.render();
  }

  setScores(scores: HighScores): void {
    this.scores = scores;
    this.render();
  }

  setStats(stats: Stats): void {
    this.stats = stats;
    this.render();
  }

  get isOpen(): boolean {
    return this.dialog.isOpen;
  }

  open(settings: Settings): void {
    this.settings = settings;
    this.render();
    this.dialog.open(byId('start'));
  }

  close(restoreFocus = false): void {
    this.dialog.close(restoreFocus);
  }

  private render(): void {
    const s = this.settings;
    for (const b of byId('menu').querySelectorAll<HTMLElement>('.mode')) b.setAttribute('aria-checked', String(b.dataset.mode === s.mode));
    byId('players-field').hidden = s.mode !== 'hotseat';
    byId('cpu-field').hidden = s.mode !== 'cpu';
    byId<HTMLSelectElement>('players').value = String(s.players);
    byId<HTMLSelectElement>('cpu-level').value = s.cpuLevel;
    const key = keyForSettings(s);
    byId('scores-title').textContent = `Best scores: ${SCORE_LABEL[key]}`;
    byId('stats-title').textContent = S.stats;
    byId('stats-line').textContent = statsLine(this.stats);
    const list = byId('scores-list');
    list.replaceChildren();
    const entries = this.scores[key];
    if (entries.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No scores yet. Go bowl!';
      list.append(li);
    }
    for (const e of entries) {
      const li = document.createElement('li');
      li.textContent = `${e.score}  ·  ${new Date(e.at).toLocaleDateString()}`;
      list.append(li);
    }
  }
}
